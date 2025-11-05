
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { User, Building, Mail, Phone, Edit, Save, X, Shield } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToastNotification } from '@/components/ui/toast-notification';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/customSupabaseClient';
import { updateUserProfile } from '@/services/userService';
import logger from '@/utils/logger';
import RequisitionCard from '@/components/RequisitionCard';
import PageContainer from '@/components/layout/PageContainer';

const ProfileInfoRow = ({ icon: Icon, label, value, isEditing, onChange, name, editable = false, placeholder }) => (
  <div className="flex items-center gap-4 py-4">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 shadow-sm dark:from-primary-500/15 dark:to-primary-600/10">
      <Icon className="h-5 w-5 text-primary-500" aria-hidden="true" />
    </div>
    <div className="flex-1">
      <p className="mb-1 text-sm font-medium text-muted-foreground">{label}</p>
      {isEditing && editable ? (
        <Input
          name={name}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          className="mt-1 h-9 rounded-xl"
        />
      ) : (
        <p className="font-bold text-foreground">{value || placeholder || 'No especificado'}</p>
      )}
    </div>
  </div>
);

const ProfilePage = () => {
  const { user, loading: authLoading } = useSupabaseAuth();
  const toast = useToastNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({ full_name: '', phone: '' });
  const [stats, setStats] = useState({ created: 0, approved: 0 });
  const [recentRequisitions, setRecentRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        phone: user.phone || ''
      });
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
  const fallback = full_name ? full_name.charAt(0).toUpperCase() : 'U';

  return (
    <>
      <Helmet><title>Mi Perfil - ComerECO</title></Helmet>

      <PageContainer>
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <Card className="overflow-hidden rounded-2xl border border-border shadow-lg dark:border-border">
          <div className="h-32 bg-gradient-to-br from-primary-50 via-primary-100 to-primary-50 dark:from-primary-500/15 dark:via-primary-600/15 dark:to-primary-500/15" />
          <CardContent className="p-8 pt-0">
            <div className="flex -mt-16 flex-col items-start gap-6 sm:flex-row sm:items-end">
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg dark:border-border">
                <AvatarImage src={user.avatar_url} alt={full_name} />
                <AvatarFallback className="text-4xl font-bold text-white">{fallback}</AvatarFallback>
              </Avatar>
              <div className="flex-1 pb-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-2xl md:text-3xl">{profileData.full_name}</h2>
                <p className="mt-1 text-base text-muted-foreground sm:text-lg">{company?.name || 'Compañía no asignada'}</p>
              </div>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                    className="rounded-xl h-11 w-11 shadow-sm hover:shadow-md"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="rounded-xl h-11 w-11 shadow-lg hover:shadow-xl"
                  >
                    <Save className={`h-5 w-5 ${isSaving ? 'animate-pulse' : ''}`} />
                  </Button>
                </div>
              ) : (
                <Button size="icon" variant="outline" onClick={() => setIsEditing(true)} className="rounded-xl h-11 w-11 shadow-sm hover:shadow-md"><Edit className="h-5 w-5" /></Button>
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
                value={role_v2 === 'admin' ? 'Administrador' : role_v2 === 'supervisor' ? 'Supervisor' : 'Usuario'}
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
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 shadow-sm dark:from-primary-500/15 dark:to-primary-600/10">
                  <User className="h-5 w-5 text-primary-500" aria-hidden="true" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">Estadísticas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {loading ? (
                <Skeleton className="h-16 w-full rounded-xl" />
              ) : (
                <div className="rounded-xl border border-primary-200 bg-gradient-to-br from-primary-50 to-primary-100 p-4 dark:border-primary-500/30 dark:from-primary-500/15 dark:to-primary-600/15">
                  <p className="mb-1 text-sm font-medium text-muted-foreground">Requisiciones Creadas</p>
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
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 shadow-sm dark:from-primary-500/15 dark:to-primary-600/10">
                  <User className="h-5 w-5 text-primary-500" aria-hidden="true" />
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
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-muted/70 dark:from-card dark:to-card/80">
                    <User className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <p className="font-medium text-muted-foreground">No tienes actividad reciente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </PageContainer>
    </>
  );
};

export default ProfilePage;
