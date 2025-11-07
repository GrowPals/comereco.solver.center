import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { User, Mail, Phone, Edit, Save, X, Shield, Upload, Loader2, Trash2 } from 'lucide-react';
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
        'flex items-center gap-4 transition-colors',
        isEditableState
          ? 'rounded-2xl border border-border/60 bg-muted/70 px-4 py-4 shadow-sm dark:border-border/70 dark:bg-[#0f1a2d]/85'
          : 'py-4'
      )}
    >
      <div className="icon-badge flex h-10 w-10 items-center justify-center">
        <Icon className="h-5 w-5 text-primary-600 dark:text-primary-100" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <p className="mb-1 text-sm font-medium text-muted-foreground">{label}</p>
        {isEditableState ? (
          <Input
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            className="mt-1 h-10 rounded-xl border border-border/60 bg-background/95 text-foreground shadow-inner transition-colors focus-visible:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-border/60 dark:bg-[#121c30] dark:text-foreground"
          />
        ) : (
          <p className="font-bold text-foreground">{value || placeholder || 'No especificado'}</p>
        )}
      </div>
    </div>
  );
};

const MobileProfileInfoRow = ({ icon: Icon, label, value, placeholder, editable = false, name, onChange, isEditing }) => {
  const isEditableState = isEditing && editable;

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border/50 bg-card/80 p-4 shadow-sm dark:border-border/60 dark:bg-[#122039]/80">
      <div className="icon-badge flex h-11 w-11 shrink-0 items-center justify-center">
        <Icon className="h-5 w-5 text-primary-600 dark:text-primary-100" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">{label}</p>
        {isEditableState ? (
          <Input
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            className="mt-2 h-10 rounded-xl border border-border/60 bg-background/90 text-foreground shadow-inner focus-visible:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        ) : (
          <p className="mt-1 text-base font-semibold text-foreground">{value || placeholder || 'No especificado'}</p>
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
      // Según la documentación técnica, el campo correcto es created_by (no requester_id)
      // Mantenemos la consulta separada para evitar embeds ambiguos
      const { data: requisitions, error: reqsError } = await supabase
        .from('requisitions')
        .select('id, internal_folio, created_at, business_status, total_amount, created_by, approved_by, company_id')
        .or(`created_by.eq.${user.id},approved_by.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (reqsError) throw reqsError;

      // Enriquecer con datos del creador cuando sea necesario
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
      // Preparar estructura de actualización para enviar solo campos válidos
      const updateData = {
        full_name: profileData.full_name.trim()
      };

      if (profileData.phone && profileData.phone.trim()) {
        updateData.phone = profileData.phone.trim();
      }

      await updateUserProfile(user.id, updateData);

      toast.success('Éxito', 'Tu perfil ha sido actualizado correctamente.');
      setIsEditing(false);

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
  const roleLabelMap = {
    dev: 'Developer',
    admin: 'Administrador',
    supervisor: 'Supervisor',
    user: 'Usuario'
  };
  const roleLabel = roleLabelMap[role_v2] || 'Usuario';
  const companyName = company?.name || 'Compañía no asignada';

  return (
    <>
      <Helmet><title>Mi Perfil - ComerECO</title></Helmet>

      <PageContainer className="pt-6 lg:pt-8">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />

        <div className="mx-auto w-full max-w-3xl space-y-6 lg:hidden">
          <section className="rounded-3xl bg-gradient-to-br from-primary-500 via-primary-500 to-primary-700 p-7 text-white shadow-[0_18px_45px_-18px_rgba(33,58,140,0.55)]">
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="relative">
                <Avatar className="h-28 w-28 border-4 border-white/90 shadow-2xl ring-4 ring-white/20">
                  <AvatarImage src={avatarUrl ?? undefined} alt={profileData.full_name || full_name} />
                  <AvatarFallback className="text-3xl font-semibold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
                    <Loader2 className="h-7 w-7 animate-spin" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">Mi perfil</p>
                <h1 className="mt-2 text-2xl font-bold leading-snug">{profileData.full_name || full_name}</h1>
                <p className="mt-1 text-sm text-white/80">{companyName}</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  <Shield className="h-4 w-4 text-primary-100" aria-hidden="true" />
                  {roleLabel}
                </div>
              </div>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="h-11 rounded-full bg-white/95 px-5 text-primary-700 shadow-md hover:-translate-y-0.5 hover:shadow-lg dark:bg-white/85"
                >
                  {isUploadingAvatar ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4 text-primary-600 dark:text-primary-200" />
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
                    className="h-11 rounded-full border border-white/40 bg-white/5 px-5 text-white transition-colors duration-200 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                  >
                    <Trash2 className="mr-2 h-4 w-4 text-white/80 dark:text-primary-200" />
                    Quitar
                  </Button>
                )}
              </div>
            </div>
          </section>

          <section>
            <div className="grid grid-cols-2 gap-3">
              {(loading ? Array.from({ length: 2 }) : [
                { label: 'Requisiciones creadas', value: stats.created },
                { label: 'Requisiciones aprobadas', value: stats.approved }
              ]).map((item, index) => (
                loading ? (
                  <Skeleton key={index} className="h-24 rounded-3xl" />
                ) : (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-primary-100/60 bg-white/95 p-4 text-center shadow-sm dark:border-primary-500/20 dark:bg-[#111f35]"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70 dark:text-primary-200/80">{item.label}</p>
                    <p className="mt-3 text-3xl font-bold text-foreground dark:text-primary-100">{item.value}</p>
                  </div>
                )
              ))}
            </div>
          </section>

          <section className="surface-panel p-5 shadow-lg">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Información personal</h2>
                <p className="text-sm text-muted-foreground">Actualiza tus datos para mantener informado al equipo.</p>
              </div>
              <div className="flex items-center gap-2">
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
                        'Guardar'
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
            <div className="mt-4 space-y-3">
              <MobileProfileInfoRow
                icon={User}
                label="Nombre completo"
                value={profileData.full_name}
                placeholder="Tu nombre completo"
                editable
                name="full_name"
                onChange={handleInputChange}
                isEditing={isEditing}
              />
              <MobileProfileInfoRow
                icon={Mail}
                label="Correo"
                value={email}
                placeholder="team@comereco.mx"
                isEditing={isEditing}
              />
              <MobileProfileInfoRow
                icon={Shield}
                label="Rol"
                value={roleLabel}
                placeholder="Usuario"
                isEditing={isEditing}
              />
              <MobileProfileInfoRow
                icon={Phone}
                label="Teléfono"
                value={profileData.phone}
                placeholder="+52 123 456 7890"
                editable
                name="phone"
                onChange={handleInputChange}
                isEditing={isEditing}
              />
            </div>
          </section>

          <section className="surface-panel p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Actividad reciente</h2>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Últimas 3</span>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                ))}
              </div>
            ) : recentRequisitions.length > 0 ? (
              <div className="space-y-3">
                {recentRequisitions.map(req => (
                  <RequisitionCard key={req.id} requisition={req} />
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/70 dark:bg-card/60">
                  <User className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Sin movimientos recientes</p>
              </div>
            )}
          </section>
        </div>

        <div className="hidden lg:block">
          <div className="mx-auto w-full max-w-5xl space-y-8">
            <Card className="overflow-hidden surface-card shadow-xl dark:shadow-[0_28px_60px_rgba(4,10,24,0.45)]">
              <div className="h-32 bg-gradient-to-br from-primary-50 via-primary-100 to-primary-50 dark:from-[#1b2640] dark:via-[#151f34] dark:to-[#101827] dark:border-b dark:border-border/70" />
              <CardContent className="p-8 pt-0">
                <div className="flex -mt-16 flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="h-32 w-32 border-4 border-white shadow-lg ring-4 ring-primary/10 dark:border-[#1f2b43] dark:ring-primary/35 dark:shadow-[0_16px_34px_rgba(12,22,41,0.45)]">
                        <AvatarImage src={avatarUrl ?? undefined} alt={profileData.full_name || full_name} />
                        <AvatarFallback className="text-4xl font-bold text-white">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {isUploadingAvatar && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm dark:bg-[#0f172a]/80">
                          <Loader2 className="h-7 w-7 animate-spin text-primary-500 dark:text-primary-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-3">
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-2xl md:text-3xl">
                          {profileData.full_name || full_name}
                        </h2>
                        <p className="mt-1 text-base text-muted-foreground sm:text-lg">
                          {companyName}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          className="rounded-xl border border-primary-200 bg-white/90 text-primary-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-primary-500/40 dark:bg-primary-500/12 dark:text-primary-100 dark:hover:bg-primary-500/20"
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
                            className="rounded-xl text-muted-foreground hover:text-error dark:text-muted-foreground/80 dark:hover:text-error"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Quitar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  {isEditing ? (
                    <div className="flex gap-2 self-start">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
                        className="h-11 w-11 rounded-xl shadow-sm hover:shadow-md"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                      <Button
                        size="icon"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-11 w-11 rounded-xl shadow-lg hover:shadow-xl"
                      >
                        <Save className={`h-5 w-5 ${isSaving ? 'animate-pulse' : ''}`} />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="h-11 w-11 self-start rounded-xl shadow-sm hover:shadow-md"
                    >
                      <Edit className="h-5 w-5" />
                    </Button>
                  )}
                </div>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="rounded-2xl border border-border shadow-lg dark:border-border">
                <CardHeader className="pb-4">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="icon-badge flex h-10 w-10 items-center justify-center">
                      <User className="h-5 w-5 text-primary-600 dark:text-primary-100" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">Estadísticas</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {loading ? (
                    <Skeleton className="h-16 w-full rounded-xl" />
                  ) : (
                    <div className="rounded-xl border border-primary-200 bg-white/90 p-4 shadow-inner transition-colors dark:border-white/12 dark:bg-white/18 dark:backdrop-blur-sm dark:shadow-[inset_0_1px_14px_rgba(15,35,68,0.35)]">
                      <p className="mb-1 text-sm font-medium text-muted-foreground">Requisiciones creadas</p>
                      <p className="text-3xl font-bold text-foreground">{stats.created}</p>
                    </div>
                  )}
                  {loading ? (
                    <Skeleton className="h-16 w-full rounded-xl" />
                  ) : (
                    <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 dark:border-emerald-500/30 dark:from-emerald-500/15 dark:to-emerald-600/15">
                      <p className="mb-1 text-sm font-medium text-muted-foreground">Requisiciones Aprobadas</p>
                      <p className="text-3xl font-bold text-foreground">{stats.approved}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="rounded-2xl border border-border shadow-lg lg:col-span-2 dark:border-border">
                <CardHeader className="pb-4">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="icon-badge flex h-10 w-10 items-center justify-center">
                      <User className="h-5 w-5 text-primary-600 dark:text-primary-100" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">Actividad Reciente</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
                  ) : recentRequisitions.length > 0 ? (
                    recentRequisitions.map(req => <RequisitionCard key={req.id} requisition={req} />)
                  ) : (
                    <div className="py-12 text-center">
                      <div className="icon-badge mx-auto mb-4 flex h-16 w-16 items-center justify-center text-muted-foreground">
                        <User className="h-8 w-8" aria-hidden="true" />
                      </div>
                      <p className="font-medium text-muted-foreground">No tienes actividad reciente</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
};

export default ProfilePage;
