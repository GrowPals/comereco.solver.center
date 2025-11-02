
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
import logger from '@/utils/logger';
import RequisitionCard from '@/components/RequisitionCard';

const ProfileInfoRow = ({ icon: Icon, label, value, isEditing, onChange, name }) => (
  <div className="flex items-center gap-4 py-4">
    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-sm">
      <Icon className="h-5 w-5 text-blue-600" aria-hidden="true" />
    </div>
    <div className="flex-1">
      <p className="text-sm text-slate-600 font-medium mb-1">{label}</p>
      {isEditing && name === 'full_name' ? (
        <Input name={name} value={value} onChange={onChange} className="mt-1 h-9 rounded-xl" />
      ) : (
        <p className="font-bold text-slate-900">{value}</p>
      )}
    </div>
  </div>
);

const ProfilePage = () => {
  const { user, loading: authLoading, updateUser } = useSupabaseAuth();
  const toast = useToastNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({ full_name: '' });
  const [stats, setStats] = useState({ created: 0, approved: 0 });
  const [recentRequisitions, setRecentRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setProfileData({ full_name: user.full_name || '' });
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
    try {
      await updateUser({ full_name: profileData.full_name });
      toast.success('Éxito', 'Tu perfil ha sido actualizado.');
      setIsEditing(false);
    } catch (error) {
      toast.error('Error', 'No se pudo actualizar tu perfil.');
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

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8 space-y-8">
        <Card className="overflow-hidden border-2 border-slate-200 shadow-lg rounded-2xl">
          <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 h-32 relative">
            <div className="absolute inset-0 bg-gradient-primary opacity-10" />
          </div>
          <CardContent className="p-8 pt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-16 gap-6">
              <Avatar className="h-32 w-32 border-4 border-white shadow-xl rounded-2xl">
                <AvatarImage src={user.avatar_url} alt={full_name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 text-4xl font-bold">{fallback}</AvatarFallback>
              </Avatar>
              <div className="flex-1 pb-2">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{profileData.full_name}</h2>
                <p className="text-base text-slate-600 mt-1">{company?.name || 'Compañía no asignada'}</p>
              </div>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button size="icon" variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl h-11 w-11 shadow-sm hover:shadow-md"><X className="h-5 w-5" /></Button>
                  <Button size="icon" onClick={handleSave} className="rounded-xl h-11 w-11 shadow-lg hover:shadow-xl"><Save className="h-5 w-5" /></Button>
                </div>
              ) : (
                <Button size="icon" variant="outline" onClick={() => setIsEditing(true)} className="rounded-xl h-11 w-11 shadow-sm hover:shadow-md"><Edit className="h-5 w-5" /></Button>
              )}
            </div>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileInfoRow icon={User} label="Nombre Completo" value={profileData.full_name} isEditing={isEditing} onChange={handleInputChange} name="full_name" />
              <ProfileInfoRow icon={Mail} label="Email" value={email} />
              <ProfileInfoRow icon={Shield} label="Rol" value={role_v2 || 'N/A'} />
              <ProfileInfoRow icon={Phone} label="Teléfono" value="No disponible" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-2 border-slate-200 shadow-lg rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-sm">
                  <User className="h-5 w-5 text-blue-600" aria-hidden="true" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">Estadísticas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {loading ? (
                <Skeleton className="h-16 w-full rounded-xl" />
              ) : (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200">
                  <p className="text-sm text-slate-600 font-medium mb-1">Requisiciones Creadas</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.created}</p>
                </div>
              )}
              {loading ? (
                <Skeleton className="h-16 w-full rounded-xl" />
              ) : (
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border-2 border-emerald-200">
                  <p className="text-sm text-slate-600 font-medium mb-1">Requisiciones Aprobadas</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.approved}</p>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2 border-2 border-slate-200 shadow-lg rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-sm">
                  <User className="h-5 w-5 text-blue-600" aria-hidden="true" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">Actividad Reciente</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
              ) : recentRequisitions.length > 0 ? (
                recentRequisitions.map(req => <RequisitionCard key={req.id} requisition={req} />)
              ) : (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4">
                    <User className="h-8 w-8 text-slate-400" aria-hidden="true" />
                  </div>
                  <p className="text-slate-600 font-medium">No tienes actividad reciente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
