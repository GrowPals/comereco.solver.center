
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
    user: { label: 'Usuario', icon: <UserIcon className="w-4 h-4 mr-2" /> },
    supervisor: { label: 'Supervisor', icon: <Briefcase className="w-4 h-4 mr-2" /> },
    admin: { label: 'Admin', icon: <Shield className="w-4 h-4 mr-2" /> },
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
    
    if (isLoading) return <div className="p-8"><PageLoader /></div>;
    if (isError) return <div className="p-8 text-destructive">Error al cargar usuarios.</div>;

    return (
        <>
            <Helmet>
                <title>Gestión de Usuarios - ComerECO</title>
            </Helmet>
            <div className="p-4 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Usuarios</h1>
                    <Button onClick={() => handleOpenForm()}>
                        <Plus className="mr-2 h-4 w-4" /> Invitar Usuario
                    </Button>
                </div>
                <div className="bg-card rounded-lg shadow-sm border">
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
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center space-x-3">
                                            <Avatar>
                                                <AvatarImage src={user.avatar_url} />
                                                <AvatarFallback>{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{user.full_name}</p>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                         <Badge
                                            variant="outline"
                                            className="font-semibold"
                                          >
                                            {roleMapping[user.role_v2]?.icon}
                                            {roleMapping[user.role_v2]?.label || user.role_v2}
                                          </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(user.updated_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenForm(user)}>Editar</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Desactivar</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Editar Usuario' : 'Invitar Nuevo Usuario'}</DialogTitle>
                         <DialogDescription>
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
