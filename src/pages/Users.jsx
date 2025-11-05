
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { Plus, MoreHorizontal, User as UserIcon, Shield, Briefcase, Trash2 } from 'lucide-react';
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
import PageContainer from '@/components/layout/PageContainer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { fetchUsersInCompany, inviteUser, updateUserProfile, toggleUserStatus, deleteUser, isApprovalBypassSupported, isProfileEmailSupported } from '@/services/userService';
import { useToast } from '@/components/ui/useToast';
import PageLoader from '@/components/PageLoader';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


// Mapeo de roles según app_role_v2 enum (admin | supervisor | user)
const roleMapping = {
    user: { label: 'Usuario', icon: UserIcon },
    supervisor: { label: 'Supervisor', icon: Briefcase },
    admin: { label: 'Admin', icon: Shield },
};

const UserForm = ({ user, onSave, onCancel, isLoading, approvalBypassSupported }) => {
    const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm({
        mode: 'onBlur',
        defaultValues: {
            email: user?.email || '',
            role: user?.role_v2 || 'user',
            full_name: user?.full_name || '',
            can_submit_without_approval: user?.can_submit_without_approval ?? false,
        }
    });

    const role = watch('role');
    const showApprovalToggle = Boolean(user && approvalBypassSupported);

    const onSubmit = (data) => {
        onSave({
            id: user?.id,
            email: data.email,
            role: data.role,
            full_name: data.full_name,
            can_submit_without_approval: data.can_submit_without_approval,
        });
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
            {showApprovalToggle && (
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/60 px-4 py-3 dark:border-border dark:bg-card/60">
                <div className="pr-4">
                  <Label className="text-sm font-medium text-foreground">Envío directo de requisiciones</Label>
                  <p className="text-xs text-muted-foreground">Permite que este usuario envíe requisiciones sin aprobación previa del supervisor.</p>
                </div>
                <Controller
                  name="can_submit_without_approval"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked)}
                      disabled={isLoading}
                      aria-label="Permitir envío sin aprobación"
                    />
                  )}
                />
              </div>
            )}
            {user && !approvalBypassSupported && (
              <Alert className="border-amber-200 bg-amber-50 dark:border-amber-400/60 dark:bg-amber-500/15">
                <AlertTitle>Actualiza la base de datos</AlertTitle>
                <AlertDescription>
                  Para permitir envíos sin aprobación ejecuta las migraciones más recientes y recarga la página.
                </AlertDescription>
              </Alert>
            )}
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
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: users, isLoading, isError, error } = useQuery({
        queryKey: ['users'],
        queryFn: fetchUsersInCompany,
    });

    const [approvalBypassSupported, setApprovalBypassSupported] = useState(isApprovalBypassSupported());
    const [profileEmailSupported, setProfileEmailSupported] = useState(isProfileEmailSupported());

    useEffect(() => {
        setApprovalBypassSupported(isApprovalBypassSupported());
        setProfileEmailSupported(isProfileEmailSupported());
    }, [users, isError]);

    const setupWarnings = [];
    if (!approvalBypassSupported) {
        setupWarnings.push('El permiso para enviar requisiciones sin aprobación aún no está disponible. Ejecuta la migración `20250205_add_profile_bypass_flag.sql` y recarga.');
    }
    if (!profileEmailSupported) {
        setupWarnings.push('Los correos electrónicos no están disponibles desde la tabla `profiles`. Sincroniza el correo desde `auth.users` (por ejemplo, añadiendo una columna `email`) y vuelve a recargar.');
    }

    const resolveUserEmail = (user) => {
        if (!user) return '';
        if (user.email) return user.email;
        return profileEmailSupported ? 'Correo no registrado' : 'Correo no disponible';
    };

    const resolveUserLabel = (user) => {
        if (!user) return 'este usuario';
        return user.full_name || resolveUserEmail(user) || 'este usuario';
    };

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
        mutationFn: ({ id, role, full_name, can_submit_without_approval }) =>
            updateUserProfile(id, {
              role_v2: role,
              full_name,
              can_submit_without_approval,
            }),
         ...mutationOptions,
        onSuccess: (...args) => {
            toast({ title: 'Éxito', description: 'Usuario actualizado correctamente.' });
            mutationOptions.onSuccess(...args);
        }
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ userId, isActive }) => toggleUserStatus(userId, isActive),
        ...mutationOptions,
        onSuccess: (data, ...args) => {
            toast({
                title: 'Éxito',
                description: data.message || 'Estado del usuario actualizado correctamente.'
            });
            mutationOptions.onSuccess(data, ...args);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (userId) => deleteUser(userId),
        ...mutationOptions,
        onSuccess: () => {
            toast({
                title: 'Éxito',
                description: 'Usuario eliminado correctamente.'
            });
            mutationOptions.onSuccess();
        }
    });

    const handleOpenForm = (user = null) => {
        setEditingUser(user);
        setIsFormOpen(true);
    };

    const handleSaveUser = (userData) => {
        const { id, email, role, full_name, can_submit_without_approval } = userData;
        if (id) {
            updateMutation.mutate({ id, role, full_name, can_submit_without_approval });
        } else {
            inviteMutation.mutate({ email, role });
        }
    };

    const handleToggleUserStatus = (user) => {
        // El usuario está activo por defecto, si is_active no está definido
        const currentStatus = user.is_active !== false;
        const action = currentStatus ? 'desactivar' : 'activar';
        const actionCap = currentStatus ? 'Desactivar' : 'Activar';

        const confirmMessage = `¿Estás seguro de ${action} a ${resolveUserLabel(user)}?`;

        if (window.confirm(confirmMessage)) {
            toggleStatusMutation.mutate({
                userId: user.id,
                isActive: !currentStatus
            });
        }
    };

    const handleDeleteUser = (user) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (userToDelete) {
            deleteMutation.mutate(userToDelete.id);
            setDeleteDialogOpen(false);
            setUserToDelete(null);
        }
    };

    if (isLoading) return <div className="p-8"><PageLoader /></div>;
    if (isError) {
        return (
            <div className="p-8">
                <Alert className="border-destructive/40 bg-red-50 text-destructive">
                    <AlertTitle>Error al cargar usuarios</AlertTitle>
                    <AlertDescription>
                        {error?.message || 'Intenta recargar la página en unos segundos.'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>Gestión de Usuarios - ComerECO</title>
            </Helmet>
            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="¿Eliminar usuario?"
                description={`¿Estás seguro de eliminar a ${resolveUserLabel(userToDelete)}? Esta acción no se puede deshacer y el usuario perderá acceso al sistema.`}
                confirmText="Eliminar usuario"
                cancelText="Cancelar"
                variant="destructive"
                onConfirm={confirmDelete}
            />
            <PageContainer>
                <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8">
                    {/* Header */}
                    <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 shadow-sm sm:h-14 sm:w-14 dark:from-primary-500/15 dark:to-primary-600/10">
                                <UserIcon className="h-6 w-6 text-primary-600 sm:h-7 sm:w-7" aria-hidden="true" />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                                    Gestión de <span className="bg-gradient-primary bg-clip-text text-transparent">Usuarios</span>
                                </h1>
                                <p className="text-sm text-muted-foreground sm:text-base">
                                    {users?.length || 0} {users?.length === 1 ? 'usuario' : 'usuarios'} en tu organización
                                </p>
                            </div>
                        </div>
                        <Button
                            size="lg"
                            onClick={() => handleOpenForm()}
                            className="w-full rounded-xl shadow-button hover:shadow-button-hover sm:w-auto"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            Invitar Usuario
                        </Button>
                    </header>

                    {setupWarnings.length > 0 && (
                        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-400/60 dark:bg-amber-500/15">
                            <AlertTitle>Migraciones pendientes</AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc space-y-1 pl-5">
                                    {setupWarnings.map((warning, index) => (
                                        <li key={index} className="text-sm text-muted-foreground">{warning}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Users mobile list */}
                    <div className="space-y-4 md:hidden">
                        {users?.map((user) => (
                            <div key={user.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm dark:border-border dark:bg-card">
                                <div className="flex items-start gap-3">
                                        <Avatar className="h-11 w-11 border border-border dark:border-border">
                                            <AvatarImage src={user.avatar_url} />
                                        <AvatarFallback className="text-white font-semibold">
                                            {user.full_name?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-semibold text-foreground line-clamp-1">{user.full_name}</p>
                                                <p className="text-sm text-muted-foreground line-clamp-1">{resolveUserEmail(user)}</p>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted/70 dark:border-border dark:hover:bg-muted/40"
                                                        aria-label={`Acciones para ${resolveUserLabel(user)}`}
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl border-border bg-card dark:border-border dark:bg-card">
                                                    <DropdownMenuItem onClick={() => handleOpenForm(user)}>
                                                        Editar usuario
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className={user.is_active !== false ? 'text-red-600' : 'text-green-600'}
                                                        onClick={() => handleToggleUserStatus(user)}
                                                    >
                                                        {user.is_active !== false ? 'Desactivar' : 'Activar'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => handleDeleteUser(user)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                    <Badge variant="outline" className="font-semibold">
                                        {roleMapping[user.role_v2]?.icon && (
                                            React.createElement(roleMapping[user.role_v2].icon, { className: 'mr-1 h-4 w-4' })
                                        )}
                                        {roleMapping[user.role_v2]?.label || user.role_v2}
                                    </Badge>
                                    <Badge variant={user.is_active !== false ? 'success' : 'destructive'}>
                                        {user.is_active !== false ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                    <span className="ml-auto text-xs text-muted-foreground">
                                        {new Date(user.updated_at).toLocaleDateString('es-MX', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Users Table */}
                    <div className="hidden overflow-hidden rounded-2xl border-2 border-border bg-card shadow-lg dark:border-border dark:bg-card md:block">
                        <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Última Actualización</TableHead>
                                <TableHead><span className="sr-only">Acciones</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users?.map((user) => (
                                <TableRow key={user.id} className="transition-colors hover:bg-muted/70 dark:hover:bg-muted/40/60">
                                    <TableCell>
                                        <div className="flex items-center space-x-3">
                                            <Avatar className="h-11 w-11 border-2 border-border dark:border-border">
                                                <AvatarImage src={user.avatar_url} />
                                                <AvatarFallback className="text-white font-semibold">
                                                    {user.full_name?.charAt(0) || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-foreground">{user.full_name}</p>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{resolveUserEmail(user)}</p>
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
                                    <TableCell>
                                        <Badge variant={user.is_active !== false ? 'success' : 'destructive'} className="shadow-sm">
                                            {user.is_active !== false ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium text-muted-foreground">
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
                                                    className="h-9 w-9 rounded-xl p-0 transition-colors hover:bg-muted/70 dark:hover:bg-muted/40"
                                                    aria-label={`Acciones para ${resolveUserLabel(user)}`}
                                                >
                                                    <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl">
                                                <DropdownMenuItem onClick={() => handleOpenForm(user)}>
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className={user.is_active !== false ? "text-red-600" : "text-green-600"}
                                                    onClick={() => handleToggleUserStatus(user)}
                                                >
                                                    {user.is_active !== false ? 'Desactivar' : 'Activar'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => handleDeleteUser(user)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
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
            </PageContainer>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-lg border border-border bg-card shadow-2xl dark:border-border dark:bg-card">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">
                            {editingUser ? 'Editar Usuario' : 'Invitar Nuevo Usuario'}
                        </DialogTitle>
                        <DialogDescription className="text-base">
                            {editingUser ? `Actualiza el rol o nombre de ${resolveUserLabel(editingUser)}.` : 'Envía una invitación por email para que se una a tu compañía.'}
                        </DialogDescription>
                    </DialogHeader>
                    <UserForm 
                        user={editingUser} 
                        onSave={handleSaveUser} 
                        onCancel={() => setIsFormOpen(false)}
                        isLoading={inviteMutation.isPending || updateMutation.isPending}
                        approvalBypassSupported={approvalBypassSupported}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Users;
