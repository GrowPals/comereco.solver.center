
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { User, Mail, Phone, Edit, Shield, Upload, Loader2, Trash2 } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToastNotification } from '@/components/ui/toast-notification';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/customSupabaseClient';
import { updateUserProfile } from '@/services/userService';
import { uploadProfileAvatar } from '@/services/imageService';
import logger from '@/utils/logger';
import RequisitionCard from '@/components/RequisitionCard';
import PageContainer from '@/components/layout/PageContainer';

const ProfileInfoRow = ({ icon: Icon, label, value, isEditing, onChange, name, editable = false, placeholder }) => {
  const isEditableState = isEditing && editable;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-transparent bg-card/40 px-4 py-4 transition-colors sm:flex-row sm:items-center sm:gap-4',
        isEditableState
          ? 'border-border/60 bg-muted/60 shadow-sm dark:border-border/70 dark:bg-[#0f1a2d]/80'
          : 'hover:border-border/60 hover:bg-card/60 dark:hover:border-border/60'
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 shadow-sm dark:border dark:border-primary-400/40 dark:bg-primary-500/20 dark:backdrop-blur">
        <Icon className="h-5 w-5 text-primary-500 dark:text-primary-500" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">{label}</p>
        {isEditableState ? (
          <Input
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            className="mt-1 h-10 rounded-xl border border-border/60 bg-background/95 text-foreground shadow-inner transition-colors focus-visible:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-border/60 dark:bg-[#121c30] dark:text-foreground"
          />
        ) : (
          <p className="text-base font-semibold text-foreground">{value || placeholder || 'No especificado'}</p>
        )}
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { user, loading: authLoading, refreshUserProfile } = useSupabaseAuth();
  const toast = useToastNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({ full_name: '', phone: '' });
  const [stats, setStats] = useState({ created: 0, approved: 0 });
  const [recentRequisitions, setRecentRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const fileInputRef = useRef(null);

  const initials = useMemo(() => {
    const source = profileData.full_name || user?.full_name || '';
    if (!source.trim()) return 'U';
    const nameParts = source.trim().split(/\s+/);
    const first = nameParts[0]?.[0] || '';
    const second = nameParts.length > 1 ? nameParts[nameParts.length - 1]?.[0] || '' : '';
    const value = `${first}${second}`.toUpperCase();
    return value || 'U';
  }, [profileData.full_name, user?.full_name]);

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        phone: user.phone || ''
      });
      setAvatarUrl(user.avatar_url || null);
    }
  }, [user]);

  const loadProfileData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // CORREGIDO: Según documentación técnica oficial, el campo es created_by (no requester_id)
      // Consulta separada para evitar embeds ambiguos según mejores prácticas
      const { data: requisitions, error: reqsError } = await supabase
        .from('requisitions')
        .select('id, internal_folio, created_at, business_status, total_amount, created_by, approved_by, company_id')
        .or(`created_by.eq.${user.id},approved_by.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (reqsError) throw reqsError;

      // Enriquecer con datos del creador si es necesario
      const enrichedRequisitions = await Promise.all(
        (requisitions || []).map(async (req) => {
          if (req.created_by) {
            const { data: creatorData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', req.created_by)
              .single();
            return { ...req, creator: creatorData };
          }
          return req;
        })
      );

      const createdCount = enrichedRequisitions.filter(r => r.created_by === user.id).length;
      const approvedCount = enrichedRequisitions.filter(r => r.approved_by === user.id).length;
      
      setStats({ created: createdCount, approved: approvedCount });
      setRecentRequisitions(enrichedRequisitions.filter(r => r.created_by === user.id).slice(0, 3));

    } catch (error) {
      logger.error('Failed to load profile data:', error);
      toast.error('Error', 'No se pudieron cargar los datos del perfil.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) {
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const newAvatarUrl = await uploadProfileAvatar(file, user.id);
      await updateUserProfile(user.id, { avatar_url: newAvatarUrl });
      setAvatarUrl(newAvatarUrl);
      if (typeof refreshUserProfile === 'function') {
        await refreshUserProfile();
      }
      toast.success('Éxito', 'Tu foto de perfil se actualizó correctamente.');
    } catch (error) {
      logger.error('Error uploading avatar:', error);
      toast.error('Error', error.message || 'No se pudo actualizar tu foto de perfil.');
    } finally {
      setIsUploadingAvatar(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.id || !avatarUrl) return;
    setIsUploadingAvatar(true);
    try {
      await updateUserProfile(user.id, { avatar_url: null });
      setAvatarUrl(null);
      if (typeof refreshUserProfile === 'function') {
        await refreshUserProfile();
      }
      toast.success('Éxito', 'Se eliminó tu foto de perfil.');
    } catch (error) {
      logger.error('Error removing avatar:', error);
      toast.error('Error', error.message || 'No se pudo eliminar tu foto de perfil.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      // Preparar datos para actualización
      const updateData = {
        full_name: profileData.full_name.trim()
      };

      // Solo incluir phone si hay un valor
      if (profileData.phone && profileData.phone.trim()) {
        updateData.phone = profileData.phone.trim();
      }

      // Llamar al servicio con el ID del usuario
      await updateUserProfile(user.id, updateData);

      toast.success('Éxito', 'Tu perfil ha sido actualizado correctamente.');
      setIsEditing(false);

      // Recargar datos del perfil para reflejar cambios
      await loadProfileData();
    } catch (error) {
      logger.error('Error updating profile:', error);
      toast.error('Error', error.message || 'No se pudo actualizar tu perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="p-8">
        <Skeleton className="h-32 w-32 rounded-full mx-auto mb-4" />
        <Skeleton className="h-8 w-1/2 mx-auto mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  const { full_name, email, company, role_v2 } = user;
  const roleLabel = role_v2 === 'admin' ? 'Administrador' : role_v2 === 'supervisor' ? 'Supervisor' : 'Usuario';

  return (
    <>
      <Helmet><title>Mi Perfil - ComerECO</title></Helmet>

      <PageContainer className="pt-6 lg:pt-8">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-6 sm:max-w-3xl lg:max-w-5xl">
          <Card className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/95 shadow-2xl dark:border-border/80 dark:bg-[linear-gradient(160deg,rgba(16,24,41,0.95)_0%,rgba(12,20,34,0.98)_50%,rgba(9,14,26,1)_100%)]">
            <div
              className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-200/50 via-transparent to-primary-300/30 dark:from-primary-500/20 dark:via-transparent dark:to-primary-400/5"
              aria-hidden="true"
            />
            <CardContent className="relative px-6 py-7 sm:px-8 sm:py-8">
              <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
                <div className="relative">
                  <Avatar className="h-28 w-28 border-4 border-white/80 shadow-xl ring-4 ring-primary/10 dark:border-primary-500/40 dark:ring-primary/25">
                    <AvatarImage src={avatarUrl ?? undefined} alt={profileData.full_name || full_name} />
                    <AvatarFallback className="text-3xl font-semibold text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/85 backdrop-blur-sm dark:bg-[#0f172a]/90">
                      <Loader2 className="h-7 w-7 animate-spin text-primary-500 dark:text-primary-300" />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div className="flex w-full flex-col items-center gap-4 sm:items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-700/80 dark:text-primary-200/70">Mi perfil</p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      {profileData.full_name || full_name}
                    </h2>
                    <p className="mt-1 text-base text-muted-foreground">
                      {company?.name || 'Compañía no asignada'}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary-500/10 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-500/15 dark:text-primary-100">
                      <Shield className="h-4 w-4" aria-hidden="true" />
                      {roleLabel}
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="h-11 rounded-full bg-white/80 px-5 text-primary-700 shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md dark:bg-primary-500/15 dark:text-primary-50"
                    >
                      {isUploadingAvatar ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Cambiar foto
                        </>
                      )}
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        disabled={isUploadingAvatar}
                        className="h-11 rounded-full px-5 text-muted-foreground hover:text-error dark:text-muted-foreground/80 dark:hover:text-error"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Quitar
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
                {loading ? (
                  Array.from({ length: 2 }).map((_, index) => (
                    <Skeleton key={index} className="h-24 w-full rounded-2xl sm:col-span-2" />
                  ))
                ) : (
                  <>
                    <div className="flex flex-col justify-center rounded-2xl border border-white/70 bg-white/80 p-4 text-center shadow-sm backdrop-blur dark:border-primary-500/30 dark:bg-primary-500/15 sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Requisiciones creadas</p>
                      <p className="mt-2 text-2xl font-bold text-foreground">{stats.created}</p>
                    </div>
                    <div className="flex flex-col justify-center rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-4 text-center shadow-sm backdrop-blur dark:border-emerald-500/40 dark:bg-emerald-500/15 sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700/80 dark:text-emerald-200/70">Requisiciones aprobadas</p>
                      <p className="mt-2 text-2xl font-bold text-foreground">{stats.approved}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border/70 bg-card/95 shadow-xl dark:border-border/80 dark:bg-[#111a2c]">
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-foreground">Información personal</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Gestiona tus datos básicos y de contacto para el equipo de ComerECO.
                  </p>
                </div>
                <div className="flex flex-row gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
                        className="h-10 rounded-full px-4"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-10 rounded-full px-4"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando
                          </>
                        ) : (
                          'Guardar cambios'
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="h-10 rounded-full px-4"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:gap-4">
              <ProfileInfoRow
                icon={User}
                label="Nombre Completo"
                value={profileData.full_name}
                isEditing={isEditing}
                onChange={handleInputChange}
                name="full_name"
                editable={true}
                placeholder="Tu nombre completo"
              />
              <ProfileInfoRow
                icon={Mail}
                label="Email"
                value={email}
                editable={false}
              />
              <ProfileInfoRow
                icon={Shield}
                label="Rol"
                value={roleLabel}
                editable={false}
              />
              <ProfileInfoRow
                icon={Phone}
                label="Teléfono"
                value={profileData.phone}
                isEditing={isEditing}
                onChange={handleInputChange}
                name="phone"
                editable={true}
                placeholder="+52 123 456 7890"
              />
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border/70 bg-card/95 shadow-xl dark:border-border/80 dark:bg-[#101a2b]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 shadow-sm dark:from-primary-500/15 dark:to-primary-600/10">
                  <User className="h-5 w-5 text-primary-500" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-foreground">Actividad reciente</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Tus últimas requisiciones creadas o aprobadas.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
              ) : recentRequisitions.length > 0 ? (
                recentRequisitions.map(req => <RequisitionCard key={req.id} requisition={req} />)
              ) : (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-muted/70 dark:from-card dark:to-card/80">
                    <User className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <p className="font-medium text-muted-foreground">No tienes actividad reciente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  );
};

export default ProfilePage;
