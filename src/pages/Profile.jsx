
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Edit, Eye, EyeOff, Check, X, Loader2, LogOut, FileText, CheckCircle, Clock, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast.js';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from '@/components/ui/dialog';

const stats = {
  created: 24,
  approved: 18,
  pending: 8,
  rejected: 5,
  drafts: 3,
  totalSpent: 45230.50,
};

const recentActivity = [
    { id: 'REQ-001', action: 'creada', date: '28 Oct, 10:30 AM' },
    { id: 'REQ-005', action: 'aprobada', date: '27 Oct, 3:15 PM' },
    { id: 'REQ-008', action: 'rechazada', date: '26 Oct, 11:20 AM' },
];

const InfoField = ({ label, value }) => (
    <div className="py-4 border-b border-neutral-100 last:border-b-0">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-base text-foreground mt-1">{value || 'No disponible'}</p>
    </div>
);

const ProfilePage = () => {
    const { user, updateUser, logout } = useSupabaseAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    
    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        defaultValues: {
            full_name: user?.full_name,
            avatar_url: user?.avatar_url,
        }
    });

    const onProfileSubmit = async (data) => {
        try {
            await updateUser(data);
            toast({ title: "Perfil Actualizado", description: "Tu información ha sido guardada." });
            setIsEditing(false);
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: error.message });
        }
    };
    
    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const userName = user?.full_name || 'Usuario';
    const userRole = user?.role || ' ';
    const userInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const chartData = [
        { name: 'Aprobadas', value: stats.approved, color: 'bg-green-500' },
        { name: 'Pendientes', value: stats.pending, color: 'bg-yellow-500' },
        { name: 'Rechazadas', value: stats.rejected, color: 'bg-red-500' },
        { name: 'Borradores', value: stats.drafts, color: 'bg-slate-400' },
    ];
    const totalChartItems = chartData.reduce((acc, item) => acc + item.value, 0);

    return (
        <>
        <Helmet><title>Mi Perfil - ComerECO</title></Helmet>
        <div className="bg-muted min-h-full">
            <header className="relative bg-background md:rounded-b-2xl mb-6 md:mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
                    <Avatar className="w-24 h-24 md:w-32 md:h-32 mx-auto border-4 border-white shadow-lg">
                        <AvatarImage src={user?.avatar_url} alt={`Avatar de ${userName}`} />
                        <AvatarFallback className="text-4xl">{userInitials}</AvatarFallback>
                    </Avatar>
                    <h1 className="mt-4 text-2xl md:text-3xl font-bold text-foreground">{userName}</h1>
                    <Badge variant="secondary" className="mt-2 capitalize">{userRole.replace('_', ' ')}</Badge>
                    <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex bg-background p-1 mb-6">
                        <TabsTrigger value="info">Información</TabsTrigger>
                        <TabsTrigger value="stats">Estadísticas</TabsTrigger>
                    </TabsList>
                    
                    <AnimatePresence mode="wait">
                        <TabsContent value="info" asChild>
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                               <div className="lg:col-span-2 space-y-6">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <CardTitle>Datos Personales</CardTitle>
                                            <Button variant="link" className="text-primary" onClick={() => { setIsEditing(!isEditing); if(isEditing) reset({ full_name: user.full_name, avatar_url: user.avatar_url }); }}>
                                                {isEditing ? <><X className="w-4 h-4 mr-1"/>Cancelar</> : <><Edit className="w-4 h-4 mr-1"/>Editar</>}
                                            </Button>
                                        </CardHeader>
                                        <CardContent>
                                            {!isEditing ? (
                                                <div>
                                                    <InfoField label="Nombre Completo" value={user?.full_name} />
                                                    <InfoField label="Email" value={user?.email} />
                                                    <InfoField label="URL de Avatar" value={user?.avatar_url} />
                                                </div>
                                            ) : (
                                                <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
                                                    <div><label>Nombre Completo</label><Input {...register('full_name')} /></div>
                                                    <div><label>URL de Avatar</label><Input {...register('avatar_url')} /></div>
                                                    <Button type="submit"><Check className="w-4 h-4 mr-2"/>Guardar Cambios</Button>
                                                </form>
                                            )}
                                        </CardContent>
                                    </Card>
                               </div>
                               <div className="space-y-6">
                                    <Card>
                                        <CardHeader><CardTitle>Sesión</CardTitle></CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">Último acceso: {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</p>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" className="w-full mt-4 text-destructive border-destructive hover:bg-destructive/10">Cerrar Sesión</Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader><DialogTitle>¿Cerrar sesión?</DialogTitle></DialogHeader>
                                                    <DialogDescription>Serás redirigido a la página de inicio de sesión.</DialogDescription>
                                                    <DialogFooter>
                                                        <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                                                        <Button variant="destructive" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2"/>Cerrar Sesión</Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </CardContent>
                                    </Card>
                               </div>
                            </motion.div>
                        </TabsContent>
                        <TabsContent value="stats" asChild>
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card className="text-center p-6"><ShoppingBag className="mx-auto h-8 w-8 text-primary mb-2" /><p className="text-4xl font-bold">{stats.created}</p><p className="text-sm text-muted-foreground">Requisiciones Creadas</p></Card>
                                    <Card className="text-center p-6"><CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" /><p className="text-4xl font-bold">{stats.approved}</p><p className="text-sm text-muted-foreground">Aprobadas</p></Card>
                                    <Card className="text-center p-6"><FileText className="mx-auto h-8 w-8 text-yellow-500 mb-2" /><p className="text-4xl font-bold">${stats.totalSpent.toLocaleString('en-US')}</p><p className="text-sm text-muted-foreground">Total Solicitado</p></Card>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader><CardTitle>Actividad Reciente</CardTitle></CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {recentActivity.map(item => (
                                                    <div key={item.id} className="flex items-center">
                                                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mr-4"><Clock className="w-4 h-4 text-muted-foreground"/></div>
                                                        <div><p className="font-medium">{item.id} <span className="lowercase">{item.action}</span></p><p className="text-xs text-muted-foreground">{item.date}</p></div>
                                                    </div>
                                                ))}
                                            </div>
                                            <Button variant="link" asChild className="mt-4 text-primary p-0"><Link to="/history">Ver todo el historial &rarr;</Link></Button>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader><CardTitle>Requisiciones por Estado</CardTitle></CardHeader>
                                        <CardContent>
                                            <div className="w-full bg-muted rounded-full h-8 flex overflow-hidden mb-4">
                                                {chartData.map(item => (
                                                    <div key={item.name} className={`${item.color} h-full`} style={{ width: `${(item.value / totalChartItems) * 100}%` }} title={`${item.name}: ${item.value}`}></div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                                {chartData.map(item => (
                                                    <div key={item.name} className="flex items-center">
                                                        <span className={`w-3 h-3 rounded-full ${item.color} mr-2`}></span>
                                                        <span>{item.name}</span>
                                                        <span className="ml-auto font-bold">{item.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </motion.div>
                        </TabsContent>
                    </AnimatePresence>
                </Tabs>
            </main>
        </div>
        </>
    );
};

export default ProfilePage;
