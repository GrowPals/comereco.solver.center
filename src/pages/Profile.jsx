
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { User, Building, Mail, Phone, Edit, Save, X, Shield } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/useToast';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/customSupabaseClient';
import logger from '@/utils/logger';
import RequisitionCard from '@/components/RequisitionCard';

const ProfileInfoRow = ({ icon: Icon, label, value, isEditing, onChange, name }) => (
  <div className="flex items-center gap-4 py-3">
    <Icon className="h-5 w-5 text-muted-foreground" />
    <div className="flex-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      {isEditing && name === 'full_name' ? (
        <Input name={name} value={value} onChange={onChange} className="mt-1 h-8" />
      ) : (
        <p className="font-semibold">{value}</p>
      )}
    </div>
  </div>
);

const ProfilePage = () => {
  const { user, loading: authLoading, updateUser } = useSupabaseAuth();
  const { toast } = useToast();
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
      const { data: requisitions, error: reqsError } = await supabase
        .from('requisitions')
        .select('id, internal_folio, created_at, business_status, total_amount, created_by, approved_by, requester:profiles!created_by(full_name)')
        .or(`created_by.eq.${user.id},approved_by.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (reqsError) throw reqsError;

      const createdCount = requisitions.filter(r => r.created_by === user.id).length;
      const approvedCount = requisitions.filter(r => r.approved_by === user.id).length;
      
      setStats({ created: createdCount, approved: approvedCount });
      setRecentRequisitions(requisitions.filter(r => r.created_by === user.id).slice(0, 3));

    } catch (error) {
      logger.error('Failed to load profile data:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los datos del perfil.' });
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
      toast({ title: 'Éxito', description: 'Tu perfil ha sido actualizado.' });
      setIsEditing(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar tu perfil.' });
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
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Card className="overflow-hidden">
          <div className="bg-muted/30 h-24" />
          <CardContent className="p-6 pt-0">
            <div className="flex items-end -mt-12 gap-4">
              <Avatar className="h-24 w-24 border-4 border-card">
                <AvatarImage src={user.avatar_url} alt={full_name} />
                <AvatarFallback>{fallback}</AvatarFallback>
              </Avatar>
              <div className="flex-1 pb-2">
                <h2 className="text-2xl font-bold">{profileData.full_name}</h2>
                <p className="text-sm text-muted-foreground">{company?.name || 'Compañía no asignada'}</p>
              </div>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button size="icon" variant="outline" onClick={() => setIsEditing(false)}><X className="h-4 w-4" /></Button>
                  <Button size="icon" onClick={handleSave}><Save className="h-4 w-4" /></Button>
                </div>
              ) : (
                <Button size="icon" variant="outline" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4" /></Button>
              )}
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              <ProfileInfoRow icon={User} label="Nombre Completo" value={profileData.full_name} isEditing={isEditing} onChange={handleInputChange} name="full_name" />
              <ProfileInfoRow icon={Mail} label="Email" value={email} />
              <ProfileInfoRow icon={Shield} label="Rol" value={role_v2 || 'N/A'} />
              <ProfileInfoRow icon={Phone} label="Teléfono" value="No disponible" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle>Estadísticas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {loading ? <Skeleton className="h-10 w-full" /> : <div className="flex justify-between items-center"><p>Requisiciones Creadas</p><p className="font-bold text-lg">{stats.created}</p></div>}
              {loading ? <Skeleton className="h-10 w-full" /> : <div className="flex justify-between items-center"><p>Requisiciones Aprobadas</p><p className="font-bold text-lg">{stats.approved}</p></div>}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Actividad Reciente</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
              ) : recentRequisitions.length > 0 ? (
                recentRequisitions.map(req => <RequisitionCard key={req.id} requisition={req} />)
              ) : (
                <p className="text-muted-foreground text-center py-8">No tienes actividad reciente.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
