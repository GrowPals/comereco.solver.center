import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useForm } from 'react-hook-form';
import { Search, UserPlus, Edit, MoreVertical, Power, PowerOff, Trash2, User, Briefcase, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { todosLosUsuarios, todosLosProyectos, getUserByTelefono, saveUser, toggleUserStatus, getProyectoById, deleteUser } from '@/data/mockdata';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const roleColors = {
    usuario: 'bg-primary-10 text-primary-90',
    supervisor: 'bg-secondary-20 text-secondary-90',
    admin: 'bg-info-90/10 text-info-90',
};

const UserRow = ({ user, onEdit, onToggleStatus, onDelete }) => {
    const project = user?.proyecto_id ? getProyectoById(user.proyecto_id) : null;
    const initials = user?.nombre?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center p-4 border-b last:border-b-0 hover:bg-accent/30 transition-colors">
            <div className="flex items-center gap-4 flex-1 mb-4 sm:mb-0">
                <Avatar>
                    <AvatarFallback className={cn(roleColors[user.rol], 'font-bold')}>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="font-bold text-base">{user.nombre}</p>
                    <p className="text-sm text-muted-foreground">{user.email || 'Sin email'}</p>
                </div>
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full sm:w-auto items-center text-sm">
                <div className="hidden sm:block">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Teléfono</p>
                    <p className="mt-1">{user.telefono.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}</p>
                </div>
                <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground">Rol</p>
                    <Badge variant="outline" className="capitalize mt-1">{user.rol}</Badge>
                </div>
                <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground">Proyecto</p>
                    <p className="mt-1 truncate">{project?.nombre || 'N/A'}</p>
                </div>
                <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground">Estado</p>
                    <Badge variant={user.activo ? 'secondary' : 'muted'} className="mt-1">
                        {user.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                </div>
            </div>
            <div className="sm:ml-4 mt-4 sm:mt-0">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="w-5 h-5"/></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(user)}><Edit className="w-4 h-4 mr-2"/>Editar</DropdownMenuItem>
                        <DropdownMenuItem className={cn(!user.activo ? 'text-secondary' : 'text-danger')} onClick={() => {onToggleStatus(user.id);}}>
                             {!user.activo ? <Power className="w-4 h-4 mr-2" /> : <PowerOff className="w-4 h-4 mr-2" />}
                            {!user.activo ? 'Activar' : 'Desactivar'}
                        </DropdownMenuItem>
                        {user.rol !== 'admin' && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(user)}>
                                    <Trash2 className="w-4 h-4 mr-2"/>Eliminar
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

const UserFormModal = ({ user, isOpen, onClose, onSave }) => {
    const { toast } = useToast();
    const isEditing = !!user?.id;
    const { register, handleSubmit, watch, formState: { errors }, reset, setError, setValue } = useForm({
        defaultValues: isEditing ? user : { rol: 'usuario', activo: true, permisos_especiales: { auto_aprobacion: false, limite_sin_aprobacion: null } }
    });
    
    const selectedRole = watch('rol');
    const autoAprobacion = watch('permisos_especiales.auto_aprobacion');

    useEffect(() => {
        if (isOpen) {
            const defaultValues = isEditing ? {
                ...user,
                permisos_especiales: user.permisos_especiales || { auto_aprobacion: false, limite_sin_aprobacion: null }
            } : { 
                rol: 'usuario', 
                activo: true, 
                password_hash: '',
                email: '',
                telefono: '',
                nombre: '',
                permisos_especiales: { auto_aprobacion: false, limite_sin_aprobacion: null } 
            };
            reset(defaultValues);
        }
    }, [isOpen, user, isEditing, reset]);

    const onSubmit = (data) => {
        if (!isEditing && getUserByTelefono(data.telefono)) {
            setError('telefono', { type: 'manual', message: 'Este teléfono ya está registrado.' });
            return;
        }
        onSave(data);
        toast({ title: `Usuario ${isEditing ? 'actualizado' : 'creado'}`, description: `${data.nombre} ha sido guardado.`, variant: 'success' });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto no-scrollbar">
                <DialogHeader>
                    <DialogTitle>{isEditing ? `Editar Usuario` : 'Nuevo Usuario'}</DialogTitle>
                    {isEditing && <DialogDescription>{user.nombre}</DialogDescription>}
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <Accordion type="multiple" defaultValue={['personal', 'laboral']} className="w-full">
                        <AccordionItem value="personal">
                            <AccordionTrigger><div className="flex items-center gap-2"><User className="w-5 h-5 text-primary"/> Información Personal</div></AccordionTrigger>
                            <AccordionContent className="space-y-4">
                                <div>
                                    <Label htmlFor="nombre">Nombre Completo</Label>
                                    <Input id="nombre" {...register('nombre', { required: 'El nombre es requerido', minLength: 3 })} />
                                    {errors.nombre && <p className="text-sm text-danger mt-1">{errors.nombre.message}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="telefono">Teléfono</Label>
                                    <Input id="telefono" type="tel" {...register('telefono', { required: 'El teléfono es requerido', pattern: { value: /^\d{10}$/, message: 'Debe tener 10 dígitos' } })} readOnly={isEditing} />
                                    {errors.telefono && <p className="text-sm text-danger mt-1">{errors.telefono.message}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="email">Email (Opcional)</Label>
                                    <Input id="email" type="email" {...register('email', { pattern: { value: /^\S+@\S+$/, message: 'Formato de email inválido' } })} />
                                    {errors.email && <p className="text-sm text-danger mt-1">{errors.email.message}</p>}
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="laboral">
                            <AccordionTrigger><div className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary"/> Rol y Permisos</div></AccordionTrigger>
                            <AccordionContent className="space-y-4">
                                <div>
                                    <Label>Rol</Label>
                                    <RadioGroup value={selectedRole} onValueChange={(value) => setValue('rol', value)} className="flex gap-4 mt-2">
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="usuario" id="r1" /><Label htmlFor="r1">Usuario</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="supervisor" id="r2" /><Label htmlFor="r2">Supervisor</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="admin" id="r3" /><Label htmlFor="r3">Admin</Label></div>
                                    </RadioGroup>
                                </div>
                                
                                {selectedRole === 'supervisor' && (
                                     <div>
                                        <Label htmlFor="proyectos_asignados_ids">Proyectos Asignados</Label>
                                        <div className="space-y-2 mt-2">
                                            {todosLosProyectos.map(p => (
                                                <div key={p.id} className="flex items-center space-x-2">
                                                    <Checkbox 
                                                        id={`proj-${p.id}`}
                                                        defaultChecked={user?.proyectos_asignados_ids?.includes(p.id)}
                                                        onCheckedChange={(checked) => {
                                                            const currentProjects = watch('proyectos_asignados_ids') || [];
                                                            const newProjects = checked 
                                                                ? [...currentProjects, p.id] 
                                                                : currentProjects.filter(id => id !== p.id);
                                                            setValue('proyectos_asignados_ids', newProjects);
                                                        }}
                                                    />
                                                    <Label htmlFor={`proj-${p.id}`}>{p.nombre}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedRole === 'usuario' && (
                                    <>
                                        <div>
                                            <Label htmlFor="proyecto_id">Proyecto Asignado</Label>
                                            <Select onValueChange={(value) => setValue('proyecto_id', value)} defaultValue={user?.proyecto_id}>
                                                <SelectTrigger><SelectValue placeholder="Seleccionar proyecto..." /></SelectTrigger>
                                                <SelectContent>
                                                    {todosLosProyectos.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="supervisor_id">Supervisor Asignado</Label>
                                            <Select onValueChange={(value) => setValue('supervisor_id', value)} defaultValue={user?.supervisor_id}>
                                                <SelectTrigger><SelectValue placeholder="Seleccionar supervisor..." /></SelectTrigger>
                                                <SelectContent>
                                                    {todosLosUsuarios.filter(u => u.rol === 'supervisor').map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center space-x-2 pt-2">
                                            <Checkbox id="auto_aprobacion" checked={autoAprobacion} onCheckedChange={(checked) => setValue('permisos_especiales.auto_aprobacion', checked)} />
                                            <Label htmlFor="auto_aprobacion">Auto-aprobar requisiciones</Label>
                                        </div>
                                        {autoAprobacion && (
                                            <div>
                                                <Label htmlFor="limite_sin_aprobacion">Límite de monto ($)</Label>
                                                <Input id="limite_sin_aprobacion" type="number" {...register('permisos_especiales.limite_sin_aprobacion', { valueAsNumber: true })} />
                                                {errors.permisos_especiales?.limite_sin_aprobacion && <p className="text-sm text-danger mt-1">{errors.permisos_especiales.limite_sin_aprobacion.message}</p>}
                                            </div>
                                        )}
                                    </>
                                )}
                            </AccordionContent>
                        </AccordionItem>

                        {!isEditing && (
                            <AccordionItem value="seguridad">
                                <AccordionTrigger><div className="flex items-center gap-2"><KeyRound className="w-5 h-5 text-primary"/> Seguridad</div></AccordionTrigger>
                                <AccordionContent>
                                    <div>
                                        <Label htmlFor="password_hash">PIN inicial</Label>
                                        <Input id="password_hash" type="password" {...register('password_hash', { required: 'PIN requerido', pattern: { value: /^\d{4}$/, message: 'Debe tener 4 dígitos' } })} />
                                        {errors.password_hash && <p className="text-sm text-danger mt-1">{errors.password_hash.message}</p>}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        )}
                    </Accordion>

                    <DialogFooter className="pt-4">
                        <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                        <Button type="submit" variant="secondary">{isEditing ? 'Guardar Cambios' : 'Crear Usuario'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const ToggleStatusModal = ({ user, isOpen, onClose, onConfirm }) => {
    if (!user) return null;
    const isActivating = !user.activo;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isActivating ? 'Activar' : 'Desactivar'} Usuario</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    {isActivating ? (
                        <>El usuario <strong>{user.nombre}</strong> podrá acceder al sistema nuevamente.</>
                    ) : (
                        <>
                            ¿Estás seguro de que quieres desactivar a <strong>{user.nombre}</strong>? El usuario no podrá acceder al sistema.
                        </>
                    )}
                </DialogDescription>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button variant={isActivating ? 'secondary' : 'destructive'} onClick={() => { onConfirm(user.id); onClose(); }}>
                        Confirmar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const DeleteUserModal = ({ user, isOpen, onClose, onConfirm }) => {
    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-destructive">Eliminar Usuario</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    ¿Estás seguro de que quieres eliminar permanentemente a <strong>{user.nombre}</strong>? Esta acción no se puede deshacer.
                </DialogDescription>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button variant="destructive" onClick={() => { onConfirm(user.id); onClose(); }}>
                        Sí, eliminar usuario
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const UsersPage = () => {
    const [users, setUsers] = useState(todosLosUsuarios);
    const [filteredUsers, setFilteredUsers] = useState(todosLosUsuarios);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('Todos');
    const [statusFilter, setStatusFilter] = useState('Todos');

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const { toast } = useToast();

    useEffect(() => {
        let filtered = users.filter(u => {
            const searchMatch = searchTerm === '' || u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || u.telefono.includes(searchTerm) || (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));
            const roleMatch = roleFilter === 'Todos' || u.rol === roleFilter;
            const statusMatch = statusFilter === 'Todos' || (statusFilter === 'Activo' && u.activo) || (statusFilter === 'Inactivo' && !u.activo);
            return searchMatch && roleMatch && statusMatch;
        });
        setFilteredUsers(filtered);
    }, [searchTerm, roleFilter, statusFilter, users]);
    
    const stats = useMemo(() => ({
        active: users.filter(u => u.activo).length,
        inactive: users.filter(u => !u.activo).length,
    }), [users]);

    const handleSaveUser = (userData) => {
        const updatedUsers = saveUser(userData);
        setUsers(updatedUsers);
    };

    const handleToggleStatus = (userId) => {
        const updatedUsers = toggleUserStatus(userId);
        setUsers(updatedUsers);
    };

    const handleDeleteUser = (userId) => {
        const updatedUsers = deleteUser(userId);
        setUsers(updatedUsers);
        toast({
            title: "Usuario Eliminado",
            description: "El usuario ha sido eliminado permanentemente.",
            variant: "success"
        });
    };

    return (
        <>
            <Helmet><title>Gestión de Usuarios - Solver</title></Helmet>
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
                        <p className="text-sm text-muted-foreground">{stats.active} usuarios activos | {stats.inactive} inactivos</p>
                    </div>
                    <Button variant="secondary" onClick={() => { setCurrentUser(null); setIsFormModalOpen(true); }}>
                        <UserPlus className="w-4 h-4 mr-2" /> Nuevo Usuario
                    </Button>
                </div>

                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative md:col-span-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-70" />
                                <Input placeholder="Buscar usuario..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger><SelectValue placeholder="Todos los Roles" /></SelectTrigger><SelectContent><SelectItem value="Todos">Todos los Roles</SelectItem><SelectItem value="usuario">Usuario</SelectItem><SelectItem value="supervisor">Supervisor</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue placeholder="Todos los Estados" /></SelectTrigger><SelectContent><SelectItem value="Todos">Todos los Estados</SelectItem><SelectItem value="Activo">Activo</SelectItem><SelectItem value="Inactivo">Inactivo</SelectItem></SelectContent></Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <div className="divide-y divide-neutral-30">
                        {filteredUsers.length > 0 ? filteredUsers.map(user => (
                            <UserRow 
                                key={user.id} 
                                user={user} 
                                onEdit={(u) => { setCurrentUser(u); setIsFormModalOpen(true); }} 
                                onToggleStatus={(userId) => { setCurrentUser(users.find(u => u.id === userId)); setIsStatusModalOpen(true); }}
                                onDelete={(u) => { setCurrentUser(u); setIsDeleteModalOpen(true); }}
                            />
                        )) : (
                            <p className="p-8 text-center text-muted-foreground">No se encontraron usuarios con los filtros actuales.</p>
                        )}
                    </div>
                </Card>
            </div>

            <UserFormModal user={currentUser} isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} onSave={handleSaveUser} />
            <ToggleStatusModal user={currentUser} isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} onConfirm={handleToggleStatus} />
            <DeleteUserModal user={currentUser} isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteUser} />
        </>
    );
};

export default UsersPage;