
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { Plus, MoreHorizontal, User as UserIcon, Shield, Briefcase, Trash2, Code, Zap, X, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
import CompanyContextIndicator from '@/components/layout/CompanyContextIndicator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { fetchUsersInCompany, inviteUser, updateUserProfile, toggleUserStatus, deleteUser, isApprovalBypassSupported, isProfileEmailSupported } from '@/services/userService';
import { useToast } from '@/components/ui/useToast';
import PageLoader from '@/components/PageLoader';
import { getAvatarGradient, getInitials } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useCompanyScope } from '@/context/CompanyScopeContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { SectionIcon } from '@/components/ui/icon-wrapper';


// Mapeo de roles según app_role_v2 enum (admin | supervisor | user | dev)
const roleMapping = {
    user: {
        label: 'Usuario',
        icon: UserIcon,
        colors: 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300',
        description: 'Puede crear requisiciones y ver catálogo de productos'
    },
    supervisor: {
        label: 'Supervisor',
        icon: Briefcase,
        colors: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
        description: 'Puede aprobar requisiciones y gestionar proyectos de su equipo'
    },
    admin: {
        label: 'Admin',
        icon: Shield,
        colors: 'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
        description: 'Acceso completo: gestión de usuarios, productos y toda la plataforma'
    },
    dev: {
        label: 'Developer',
        icon: Code,
        colors: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
        description: 'Acceso de desarrollador con permisos especiales de plataforma'
    },
};
const UserForm = ({ user, onSave, onCancel, isLoading, approvalBypassSupported, roleOptions }) => {
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
    const selectableRoles = React.useMemo(() => {
        if (role && !roleOptions.some(([value]) => value === role) && roleMapping[role]) {
            return [...roleOptions, [role, roleMapping[role]]];
        }
        return roleOptions;
    }, [roleOptions, role]);
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
                        autoComplete="email"
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
                    <FloatingLabelInput
                        id="fullName"
                        label="Nombre Completo"
                        autoComplete="name"
                        error={errors.full_name?.message}
                        {...register('full_name', {
                            required: 'El nombre completo es requerido',
                            minLength: {
                                value: 2,
                                message: 'El nombre debe tener al menos 2 caracteres'
                            }
                        })}
                    />
                </div>
            )}
            <div>
                <Label htmlFor="role">Rol</Label>
                 <Select value={role} onValueChange={(value) => setValue('role', value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                        {selectableRoles.map(([key, { label }]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {showApprovalToggle && (
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/85 px-4 py-3 dark:border-border dark:bg-card/85">
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
              <Alert variant="warning">
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
    const [isToggleStatusDialogOpen, setToggleStatusDialogOpen] = useState(false);
    const [userToToggle, setUserToToggle] = useState(null);
    const [migrationAlertDismissed, setMigrationAlertDismissed] = useState(() => {
        const dismissed = localStorage.getItem('migration_alert_dismissed');
        return dismissed === 'true';
    });
    const [migrationAlertCollapsed, setMigrationAlertCollapsed] = useState(true);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { isDev } = useUserPermissions();
    const { activeCompanyId, isGlobalView } = useCompanyScope();
    const scopeKey = isGlobalView ? 'all' : activeCompanyId ?? 'unassigned';
    const canFetchUsers = isGlobalView || Boolean(activeCompanyId);

    const { data: users, isLoading, isError, error } = useQuery({
        queryKey: ['users', scopeKey],
        queryFn: fetchUsersInCompany,
        enabled: canFetchUsers,
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
            queryClient.invalidateQueries({ queryKey: ['users'] });
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
        setUserToToggle(user);
        setToggleStatusDialogOpen(true);
    };

    const confirmToggleStatus = () => {
        if (userToToggle) {
            const currentStatus = userToToggle.is_active !== false;
            toggleStatusMutation.mutate({
                userId: userToToggle.id,
                isActive: !currentStatus
            });
            setToggleStatusDialogOpen(false);
            setUserToToggle(null);
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
                <Alert variant="error">
                    <AlertTitle>Error al cargar usuarios</AlertTitle>
                    <AlertDescription>
                        {error?.message || 'Intenta recargar la página en unos segundos.'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const roleOptions = Object.entries(roleMapping).filter(([key]) => (key === 'dev' ? isDev : true));

    const getToggleStatusMessage = () => {
        if (!userToToggle) return { title: '', description: '', confirmText: '', variant: 'default' };
        const currentStatus = userToToggle.is_active !== false;
        const action = currentStatus ? 'desactivar' : 'activar';
        return {
            title: currentStatus ? '¿Desactivar usuario?' : '¿Activar usuario?',
            description: `¿Estás seguro de ${action} a ${resolveUserLabel(userToToggle)}? ${
                currentStatus
                    ? 'El usuario no podrá acceder al sistema hasta que sea reactivado.'
                    : 'El usuario recuperará acceso completo al sistema.'
            }`,
            confirmText: currentStatus ? 'Desactivar usuario' : 'Activar usuario',
            variant: currentStatus ? 'warning' : 'default'
        };
    };

    const toggleStatusDialogProps = getToggleStatusMessage();

    return (
        <TooltipProvider>
            <Helmet>
                <title>Gestión de Usuarios - ComerECO</title>
            </Helmet>

            {/* Dialog para cambiar estado */}
            <ConfirmDialog
                open={isToggleStatusDialogOpen}
                onOpenChange={setToggleStatusDialogOpen}
                title={toggleStatusDialogProps.title}
                description={toggleStatusDialogProps.description}
                confirmText={toggleStatusDialogProps.confirmText}
                cancelText="Cancelar"
                variant={toggleStatusDialogProps.variant}
                onConfirm={confirmToggleStatus}
            />

            {/* Dialog para eliminar */}
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
                    <header className="flex flex-col gap-4 border-b border-border pb-5 sm:pb-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <SectionIcon icon={UserIcon} className="sm:h-7 sm:w-7" />
                                <div className="space-y-1">
                                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                                        Gestión de <span className="bg-gradient-primary bg-clip-text text-transparent">Usuarios</span>
                                    </h1>
                                    <p className="text-sm text-muted-foreground sm:text-base">
                                        {users?.length || 0} {users?.length === 1 ? 'usuario' : 'usuarios'} en tu organización
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <CompanyContextIndicator compact className="hidden sm:flex" />
                                <Button
                                    size="lg"
                                    onClick={() => handleOpenForm()}
                                    className="w-full rounded-xl shadow-button hover:shadow-button-hover sm:w-auto"
                                >
                                    <Plus className="mr-2 h-5 w-5" />
                                    Invitar Usuario
                                </Button>
                            </div>
                        </div>
                    </header>

                    {setupWarnings.length > 0 && !migrationAlertDismissed && (
                        <div className="relative overflow-hidden rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-800/50 dark:bg-blue-950/30">
                            <div className="flex items-start gap-3 p-4">
                                <div className="flex-shrink-0 mt-0.5">
                                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                            Configuración pendiente
                                        </h3>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50"
                                                onClick={() => setMigrationAlertCollapsed(!migrationAlertCollapsed)}
                                                aria-label={migrationAlertCollapsed ? "Expandir detalles" : "Colapsar detalles"}
                                            >
                                                {migrationAlertCollapsed ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronUp className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50"
                                                onClick={() => {
                                                    setMigrationAlertDismissed(true);
                                                    localStorage.setItem('migration_alert_dismissed', 'true');
                                                }}
                                                aria-label="Cerrar notificación"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                                        Algunas funciones avanzadas requieren actualizar la base de datos.
                                    </p>
                                    {!migrationAlertCollapsed && (
                                        <div className="mt-3 space-y-2">
                                            <ul className="space-y-1.5 text-sm text-blue-700 dark:text-blue-300">
                                                {setupWarnings.map((warning, index) => (
                                                    <li key={index} className="flex items-start gap-2">
                                                        <span className="text-blue-400 dark:text-blue-500 mt-1">•</span>
                                                        <span className="flex-1">{warning}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="pt-2">
                                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                                    <strong>Nota:</strong> Estas configuraciones son opcionales y no afectan las funcionalidades principales.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Users mobile list */}
                    <div className="space-y-4 md:hidden">
                        {users?.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No hay usuarios disponibles</p>
                            </div>
                        ) : (
                            users?.map((user) => {
                            const gradient = getAvatarGradient(user.full_name);
                            const initials = getInitials(user.full_name);

                            return (
                            <div key={user.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm dark:border-border dark:bg-card">
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-11 w-11 border border-border dark:border-border">
                                        <AvatarImage src={user.avatar_url} />
                                        <AvatarFallback
                                            className="text-white font-bold text-sm"
                                            style={{
                                                background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.via} 50%, ${gradient.to} 100%)`,
                                                boxShadow: `0 4px 12px ${gradient.shadow}`
                                            }}
                                        >
                                            {initials}
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
                                                        className="h-11 w-11 rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted/85 dark:border-border dark:hover:bg-muted/70"
                                                        aria-label={`Acciones para ${resolveUserLabel(user)}`}
                                                    >
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl surface-card p-2">
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
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Badge className={`font-semibold cursor-help rounded-full ${roleMapping[user.role_v2]?.colors || ''}`}>
                                                {roleMapping[user.role_v2]?.icon && (
                                                    React.createElement(roleMapping[user.role_v2].icon, { className: 'mr-1 h-4 w-4' })
                                                )}
                                                {roleMapping[user.role_v2]?.label || user.role_v2}
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{roleMapping[user.role_v2]?.description || 'Rol de usuario'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    {user.can_submit_without_approval && (
                                        <Badge className="font-semibold rounded-full bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400" title="Puede enviar requisiciones sin aprobación previa">
                                            <Zap className="mr-1 h-3 w-3" />
                                            Envío Directo
                                        </Badge>
                                    )}
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
                            );
                        })
                        )}
                    </div>

                    {/* Users Table */}
                    <div className="hidden overflow-hidden rounded-2xl border-2 border-border bg-card shadow-soft-md dark:border-border dark:bg-card md:block">
                        {users?.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No hay usuarios disponibles</p>
                            </div>
                        ) : (
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
                            {users?.map((user) => {
                                const gradient = getAvatarGradient(user.full_name);
                                const initials = getInitials(user.full_name);

                                return (
                                <TableRow key={user.id} className="transition-colors hover:bg-muted/85 dark:hover:bg-muted/70">
                                    <TableCell>
                                        <div className="flex items-center space-x-3">
                                            <Avatar className="h-11 w-11 border-2 border-border dark:border-border">
                                                <AvatarImage src={user.avatar_url} />
                                                <AvatarFallback
                                                    className="text-white font-bold text-sm"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.via} 50%, ${gradient.to} 100%)`,
                                                        boxShadow: `0 4px 12px ${gradient.shadow}`
                                                    }}
                                                >
                                                    {initials}
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
                                        <div className="flex flex-col gap-2">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Badge variant="outline" className={`font-semibold shadow-sm cursor-help ${roleMapping[user.role_v2]?.colors || ''}`}>
                                                        {roleMapping[user.role_v2]?.icon && (
                                                            React.createElement(roleMapping[user.role_v2].icon, { className: "w-4 h-4 mr-2" })
                                                        )}
                                                        {roleMapping[user.role_v2]?.label || user.role_v2}
                                                    </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{roleMapping[user.role_v2]?.description || 'Rol de usuario'}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            {user.can_submit_without_approval && (
                                                <Badge className="font-semibold rounded-full bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400 w-fit" title="Puede enviar requisiciones sin aprobación previa">
                                                    <Zap className="mr-1 h-3 w-3" />
                                                    Envío Directo
                                                </Badge>
                                            )}
                                        </div>
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
                                                    className="h-9 w-9 rounded-xl p-0 transition-colors hover:bg-muted/85 dark:hover:bg-muted/70"
                                                    aria-label={`Acciones para ${resolveUserLabel(user)}`}
                                                >
                                                    <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl surface-card p-2">
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
                                );
                            })}
                        </TableBody>
                    </Table>
                        )}
                    </div>
                </div>
            </PageContainer>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-lg border border-border bg-card shadow-soft-xl dark:border-border dark:bg-card">
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
                        roleOptions={roleOptions}
                    />
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
};

export default Users;
