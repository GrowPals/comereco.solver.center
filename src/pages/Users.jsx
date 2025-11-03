
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, MoreHorizontal, User as UserIcon, Shield, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { fetchUsersInCompany, inviteUser, updateUserProfile } from '@/services/userService';
import { useToast } from '@/components/ui/useToast';
import PageLoader from '@/components/PageLoader';


// Mapeo de roles según app_role_v2 enum (admin | supervisor | user)
const roleMapping = {
    user: { label: 'Usuario', icon: UserIcon },
    supervisor: { label: 'Supervisor', icon: Briefcase },
    admin: { label: 'Admin', icon: Shield },
};

const UserForm = ({ user, onSave, onCancel, isLoading }) => {
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        mode: 'onBlur',
        defaultValues: {
            email: user?.email || '',
            role: user?.role_v2 || 'user',
            full_name: user?.full_name || ''
        }
    });

    const role = watch('role');

    const onSubmit = (data) => {
        onSave({ id: user?.id, email: data.email, role: data.role, full_name: data.full_name });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!user && (
                 <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                        id="email" 
                        type="email" 
                        {...register('email', { 
                            required: 'El email es requerido',
                            pattern: {
                                value: /^\S+@\S+$/i,
                                message: 'Formato de email inválido'
                            }
                        })} 
                    />
                    {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
                </div>
            )}
             {user && (
                 <div>
                    <Label htmlFor="fullName">Nombre Completo</Label>
                    <Input 
                        id="fullName" 
                        {...register('full_name', { 
                            required: 'El nombre completo es requerido',
                            minLength: {
                                value: 2,
                                message: 'El nombre debe tener al menos 2 caracteres'
                            }
                        })} 
                    />
                    {errors.full_name && <p className="text-destructive text-sm mt-1">{errors.full_name.message}</p>}
                </div>
            )}
            <div>
                <Label htmlFor="role">Rol</Label>
                 <Select value={role} onValueChange={(value) => setValue('role', value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(roleMapping).map(([key, { label }]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" isLoading={isLoading}>{user ? 'Guardar Cambios' : 'Invitar Usuario'}</Button>
            </div>
        </form>
    );
};


const Users = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: users, isLoading, isError } = useQuery({
        queryKey: ['users'],
        queryFn: fetchUsersInCompany,
    });

    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            setIsFormOpen(false);
            setEditingUser(null);
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        },
    };

    const inviteMutation = useMutation({
        mutationFn: ({ email, role }) => inviteUser(email, role),
        ...mutationOptions,
        onSuccess: (...args) => {
            toast({ title: 'Éxito', description: 'Invitación enviada correctamente.' });
            mutationOptions.onSuccess(...args);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, role, full_name }) => updateUserProfile(id, { role_v2: role, full_name }),
         ...mutationOptions,
        onSuccess: (...args) => {
            toast({ title: 'Éxito', description: 'Usuario actualizado correctamente.' });
            mutationOptions.onSuccess(...args);
        }
    });

    const handleOpenForm = (user = null) => {
        setEditingUser(user);
        setIsFormOpen(true);
    };

    const handleSaveUser = (userData) => {
        if (userData.id) { // Es una actualización
            updateMutation.mutate(userData);
        } else { // Es una invitación
            inviteMutation.mutate(userData);
        }
    };

    const handleDisableUser = (user) => {
        // NOTA: Esta funcionalidad requiere configuración adicional en Supabase
        // Se necesita agregar un campo `is_active` o `disabled` en la tabla profiles
        // y crear una Edge Function para desactivar usuarios en auth
        toast({
            variant: 'destructive',
            title: 'Funcionalidad en desarrollo',
            description: 'La desactivación de usuarios requiere configuración adicional en Supabase. Contacta al administrador del sistema.',
        });

        // TODO: Implementar cuando se agregue el campo is_active en profiles
        // const confirmDisable = window.confirm(`¿Estás seguro de desactivar a ${user.full_name || user.email}?`);
        // if (confirmDisable) {
        //     updateMutation.mutate({ id: user.id, is_active: false });
        // }
    };

    if (isLoading) return <div className="p-8"><PageLoader /></div>;
    if (isError) return <div className="p-8 text-destructive">Error al cargar usuarios.</div>;

    return (
        <>
            <Helmet>
                <title>Gestión de Usuarios - ComerECO</title>
            </Helmet>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-md">
                                <UserIcon className="h-7 w-7 text-blue-600" aria-hidden="true" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-1">
                                    Gestión de <span className="bg-gradient-primary bg-clip-text text-transparent">Usuarios</span>
                                </h1>
                                <p className="text-base text-slate-600">
                                    {users?.length || 0} {users?.length === 1 ? 'usuario' : 'usuarios'} en tu organización
                                </p>
                            </div>
                        </div>
                        <Button
                            size="lg"
                            onClick={() => handleOpenForm()}
                            className="shadow-lg hover:shadow-xl whitespace-nowrap"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            Invitar Usuario
                        </Button>
                    </header>

                    {/* Users Table */}
                    <div className="bg-white border-2 border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                        <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Última Actualización</TableHead>
                                <TableHead><span className="sr-only">Acciones</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users?.map((user) => (
                                <TableRow key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center space-x-3">
                                            <Avatar className="h-11 w-11 border-2 border-slate-200">
                                                <AvatarImage src={user.avatar_url} />
                                                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-bold">
                                                    {user.full_name?.charAt(0) || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold text-slate-900">{user.full_name}</p>
                                                <p className="text-sm text-slate-600">{user.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-semibold shadow-sm">
                                            {roleMapping[user.role_v2]?.icon && (
                                                React.createElement(roleMapping[user.role_v2].icon, { className: "w-4 h-4 mr-2" })
                                            )}
                                            {roleMapping[user.role_v2]?.label || user.role_v2}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-700">
                                        {new Date(user.updated_at).toLocaleDateString('es-MX', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="h-9 w-9 p-0 hover:bg-slate-100 rounded-xl"
                                                    aria-label={`Acciones para ${user.full_name || user.email}`}
                                                >
                                                    <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl">
                                                <DropdownMenuItem onClick={() => handleOpenForm(user)}>
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => handleDisableUser(user)}
                                                >
                                                    Desactivar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </div>
                </div>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">
                            {editingUser ? 'Editar Usuario' : 'Invitar Nuevo Usuario'}
                        </DialogTitle>
                        <DialogDescription className="text-base">
                            {editingUser ? 'Actualiza el rol o nombre del usuario.' : 'Envía una invitación por email para que se una a tu compañía.'}
                        </DialogDescription>
                    </DialogHeader>
                    <UserForm 
                        user={editingUser} 
                        onSave={handleSaveUser} 
                        onCancel={() => setIsFormOpen(false)}
                        isLoading={inviteMutation.isPending || updateMutation.isPending}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Users;
