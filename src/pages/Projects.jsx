
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, MoreHorizontal, Edit, Trash2, Users, FolderKanban, UserPlus, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/useToast';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SectionIcon } from '@/components/ui/icon-wrapper';
import {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  updateProjectMemberApproval,
} from '@/services/projectService';
import { fetchUsersInCompany } from '@/services/userService';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import PageLoader from '@/components/PageLoader';
import EmptyState from '@/components/EmptyState';
import PageContainer from '@/components/layout/PageContainer';

const ProjectCard = ({ project, onEdit, onDelete, onManageMembers, onView }) => {
  const { canManageProjects } = useUserPermissions();
  const isActive = project.status === 'active';
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-border bg-card p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-border dark:bg-card">
      {/* Accent bar on hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

      <div>
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <SectionIcon icon={FolderKanban} />
            <h3 className="text-xl font-bold text-foreground break-words min-w-0 flex-1">{project.name}</h3>
          </div>
          {canManageProjects && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 w-9 rounded-xl p-0 transition-colors hover:bg-muted/70 dark:hover:bg-muted/40"
                  aria-label="Opciones del proyecto"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-border bg-card dark:border-border dark:bg-card">
                <DropdownMenuItem onClick={() => onEdit(project)}>
                  <Edit className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onManageMembers(project)}>
                  <Users className="mr-2 h-4 w-4" /> Miembros
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(project)} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <p className="min-h-[3rem] text-base leading-relaxed text-muted-foreground">{project.description}</p>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-4 dark:border-border">
        <div className="flex items-center justify-between">
          <Badge variant={isActive ? 'success' : 'muted'} className="shadow-sm">
            {isActive ? 'Activo' : 'Archivado'}
          </Badge>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{project.supervisor?.full_name || 'Sin asignar'}</span>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full transition-colors group-hover:border-primary-400 group-hover:text-primary-500"
          onClick={() => onView(project)}
        >
          Ver Detalles
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const EMPTY_SUPERVISOR_VALUE = 'none';

const ProjectFormModal = ({ project, isOpen, onClose, onSave, supervisors, isAdmin, currentUserId }) => {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const initialSupervisor = project?.supervisor_id
    ? String(project.supervisor_id)
    : (isAdmin ? EMPTY_SUPERVISOR_VALUE : (currentUserId ? String(currentUserId) : EMPTY_SUPERVISOR_VALUE));
  const [supervisorId, setSupervisorId] = useState(initialSupervisor);
  const [status, setStatus] = useState(project?.status ?? 'active');

  useEffect(() => {
    setName(project?.name || '');
    setDescription(project?.description || '');
    if (project?.supervisor_id) {
      setSupervisorId(String(project.supervisor_id));
    } else if (isAdmin) {
      setSupervisorId(EMPTY_SUPERVISOR_VALUE);
    } else if (currentUserId) {
      setSupervisorId(String(currentUserId));
    }
    setStatus(project?.status ?? 'active');
  }, [project, isOpen, isAdmin, currentUserId]);

  const handleSubmit = () => {
    const normalizedSupervisorId = isAdmin
      ? (supervisorId === EMPTY_SUPERVISOR_VALUE ? null : supervisorId)
      : (currentUserId || null);
    onSave({
      id: project?.id,
      name,
      description,
      supervisor_id: normalizedSupervisorId,
      status
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 shadow-2xl">
        <div className="flex max-h-[calc(100dvh-4rem)] flex-col">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-2xl font-bold">
              {project ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div>
              <Label htmlFor="name">Nombre del Proyecto</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl" />
            </div>
            {isAdmin ? (
              <div>
                <Label htmlFor="supervisor">Supervisor</Label>
                <Select value={supervisorId} onValueChange={setSupervisorId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Seleccionar supervisor..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value={EMPTY_SUPERVISOR_VALUE}>Sin supervisor</SelectItem>
                    {supervisors?.filter(Boolean)?.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.full_name || 'Sin nombre'} ({s.role_v2 === 'dev' ? 'Developer' : s.role_v2 === 'admin' ? 'Admin' : 'Supervisor'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-muted/60 px-3 py-2">
                <Label className="text-sm font-medium text-muted-foreground">Supervisor asignado</Label>
                <p className="text-sm text-muted-foreground">Serás asignado automáticamente como supervisor de este proyecto.</p>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/60 px-3 py-2">
              <input
                type="checkbox"
                id="active"
                checked={status === 'active'}
                onChange={(e) => setStatus(e.target.checked ? 'active' : 'archived')}
                className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
              />
              <Label htmlFor="active" className="text-sm font-medium text-muted-foreground">Activo</Label>
            </div>
          </div>
          <DialogFooter className="surface-sticky sticky bottom-0 flex flex-col gap-2 rounded-b-2xl px-6 py-4">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
              <Button onClick={handleSubmit} className="rounded-xl shadow-button hover:shadow-button-hover">Guardar</Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MANAGE_MEMBERS_PLACEHOLDER = 'none';

const ManageMembersModal = ({ project, isOpen, onClose }) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { data: members, isLoading: isLoadingMembers } = useQuery({
        queryKey: ['projectMembers', project?.id],
        queryFn: () => getProjectMembers(project.id),
        enabled: !!project,
    });
    const { data: companyUsers } = useQuery({ queryKey: ['companyUsers'], queryFn: fetchUsersInCompany });
    const [selectedUser, setSelectedUser] = useState(MANAGE_MEMBERS_PLACEHOLDER);

    useEffect(() => {
        if (!isOpen) {
            setSelectedUser(MANAGE_MEMBERS_PLACEHOLDER);
        }
    }, [isOpen, project?.id]);

    const addMemberMutation = useMutation({
        mutationFn: ({ projectId, userId }) => addProjectMember(projectId, userId),
        onSuccess: (_data, variables) => {
            // Usar el projectId de las variables de mutación en lugar del prop
            if (!variables.projectId) return;
            queryClient.invalidateQueries(['projectMembers', variables.projectId]);
            toast({ title: 'Miembro agregado' });
            setSelectedUser(MANAGE_MEMBERS_PLACEHOLDER);
        },
        onError: (error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
    });

    const removeMemberMutation = useMutation({
        mutationFn: ({ projectId, userId }) => removeProjectMember(projectId, userId),
        onSuccess: (_data, variables) => {
            // Usar el projectId de las variables de mutación en lugar del prop
            if (!variables.projectId) return;
            queryClient.invalidateQueries(['projectMembers', variables.projectId]);
            toast({ title: 'Miembro eliminado' });
        },
        onError: (error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
    });

    const toggleApprovalMutation = useMutation({
        mutationFn: ({ projectId, userId, requiresApproval }) =>
            updateProjectMemberApproval(projectId, userId, requiresApproval),
        onSuccess: (_data, variables) => {
            // Usar el projectId de las variables de mutación en lugar del prop
            if (!variables.projectId) return;
            queryClient.invalidateQueries(['projectMembers', variables.projectId]);
            toast({ title: 'Configuración actualizada' });
        },
        onError: (error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
    });

    const availableUsers = (companyUsers || [])
        .filter((u) => u && u.id && !members?.some(m => m.user_id === u.id));

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl p-0 shadow-2xl">
                <div className="flex max-h-[calc(100dvh-4rem)] flex-col">
                    <DialogHeader className="px-6 pt-6">
                        <DialogTitle>Gestionar Miembros de &quot;{project?.name}&quot;</DialogTitle>
                        <DialogDescription>Agrega usuarios y configura si requieren aprobación para enviar requisiciones.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Select value={selectedUser} onValueChange={setSelectedUser}>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Agregar miembro..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value={MANAGE_MEMBERS_PLACEHOLDER} disabled>
                                        Seleccionar miembro…
                                    </SelectItem>
                                    {availableUsers.length === 0 ? (
                                        <div className="px-3 py-2 text-sm text-muted-foreground">Sin usuarios disponibles</div>
                                    ) : (
                                        availableUsers.map(u => (
                                            <SelectItem key={u.id} value={String(u.id)}>{u.full_name || u.email}</SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <Button 
                                onClick={() => selectedUser !== MANAGE_MEMBERS_PLACEHOLDER && addMemberMutation.mutate({ projectId: project.id, userId: selectedUser })} 
                                disabled={selectedUser === MANAGE_MEMBERS_PLACEHOLDER || addMemberMutation.isPending}
                                isLoading={addMemberMutation.isPending}
                                className="rounded-xl shadow-button hover:shadow-button-hover"
                                title={selectedUser === MANAGE_MEMBERS_PLACEHOLDER ? 'Selecciona un usuario para agregar' : 'Agregar miembro'}
                            >
                                <UserPlus className="h-4 w-4"/>
                            </Button>
                        </div>
                        <div className="space-y-2 pr-2">
                            {isLoadingMembers ? (
                                <p className="py-4 text-center text-muted-foreground">Cargando miembros...</p>
                            ) : members && members.length > 0 ? (
                                members.map(member => (
                                    <div key={member.user_id} className="flex items-center justify-between rounded-xl border border-border bg-muted/60 p-3">
                                        <div className="flex-1">
                                            <p className="font-medium text-foreground">{member.user.full_name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {member.requires_approval ? 'Requiere aprobación' : 'Aprobación automática'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant={member.requires_approval ? "outline" : "default"}
                                                size="sm"
                                                className="rounded-xl"
                                                onClick={() => toggleApprovalMutation.mutate({
                                                    projectId: project.id,
                                                    userId: member.user_id,
                                                    requiresApproval: !member.requires_approval
                                                })}
                                                disabled={toggleApprovalMutation.isPending}
                                            >
                                                {member.requires_approval ? (
                                                    <><XCircle className="mr-1 h-4 w-4" /> Requiere aprobación</>
                                                ) : (
                                                    <><CheckCircle2 className="mr-1 h-4 w-4" /> Auto-aprobado</>
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10"
                                                onClick={() => removeMemberMutation.mutate({ projectId: project.id, userId: member.user_id })}
                                            >
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="py-8 text-center text-muted-foreground">No hay miembros en este proyecto</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="surface-sticky sticky bottom-0 rounded-b-2xl px-6 py-4">
                        <Button onClick={onClose} className="rounded-xl">Cerrar</Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const ProjectsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { canManageProjects, isAdmin } = useUserPermissions();
  const { user } = useSupabaseAuth();
  const currentUserId = user?.id || null;
  
  const [formModal, setFormModal] = useState({ isOpen: false, project: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, project: null });
  const [membersModal, setMembersModal] = useState({ isOpen: false, project: null });

  const { data: projects, isLoading, isError } = useQuery({ queryKey: ['projects'], queryFn: getAllProjects });
  const { data: users } = useQuery({ queryKey: ['companyUsers'], queryFn: fetchUsersInCompany });
  const supervisors = users?.filter(u => ['supervisor', 'admin', 'dev'].includes(u.role_v2));

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      setFormModal({ isOpen: false, project: null });
      setDeleteModal({ isOpen: false, project: null });
    },
    onError: (error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
  };

  const createMutation = useMutation({ mutationFn: createProject, ...mutationOptions, onSuccess: () => { toast({ title: 'Proyecto creado' }); mutationOptions.onSuccess(); } });
  const updateMutation = useMutation({ mutationFn: updateProject, ...mutationOptions, onSuccess: () => { toast({ title: 'Proyecto actualizado' }); mutationOptions.onSuccess(); } });
  const deleteMutation = useMutation({ mutationFn: deleteProject, ...mutationOptions, onSuccess: () => { toast({ title: 'Proyecto eliminado' }); mutationOptions.onSuccess(); } });

  const handleSave = (projectData) => {
    if (projectData.id) updateMutation.mutate(projectData);
    else createMutation.mutate(projectData);
  };

  if (isLoading) return <PageLoader message="Cargando proyectos..." />;
  if (isError) return <EmptyState icon={FolderKanban} title="Error al Cargar" description="No se pudieron cargar los proyectos." />;

  return (
    <>
      <Helmet><title>Proyectos - ComerECO</title></Helmet>
      <PageContainer>
        <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8">
          {/* Header */}
          <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <SectionIcon icon={FolderKanban} className="sm:h-7 sm:w-7" />
              <div className="space-y-1 min-w-0 flex-1">
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl break-words">
                  <span className="bg-gradient-primary bg-clip-text text-transparent">Proyectos</span>
                </h1>
                <p className="text-sm text-muted-foreground sm:text-base">
                  {projects?.length || 0} {projects?.length === 1 ? 'proyecto' : 'proyectos'} en gestión
                </p>
              </div>
            </div>
            {canManageProjects && (
              <Button
                size="lg"
                onClick={() => setFormModal({ isOpen: true, project: null })}
                className="w-full rounded-xl shadow-lg hover:shadow-xl sm:w-auto"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Crear Proyecto
              </Button>
            )}
          </header>

          {projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={(p) => setFormModal({ isOpen: true, project: p })}
                onDelete={(p) => setDeleteModal({ isOpen: true, project: p })}
                onManageMembers={(p) => setMembersModal({ isOpen: true, project: p })}
                onView={(p) => navigate(`/projects/${p.id}`)}
              />
            ))}
            </div>
          ) : (
            <EmptyState
              icon={FolderKanban}
              title="No hay proyectos"
              description={canManageProjects ? "Los proyectos te ayudan a organizar tus requisiciones por departamento, cliente o categoría. Crea uno desde el botón superior." : "No estás asignado a ningún proyecto."}
            />
          )}
        </div>
      </PageContainer>

      {formModal.isOpen && (
        <ProjectFormModal
          isOpen={formModal.isOpen}
          onClose={() => setFormModal({ isOpen: false, project: null })}
          project={formModal.project}
          onSave={handleSave}
          supervisors={supervisors}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
        />
      )}
      {membersModal.isOpen && <ManageMembersModal isOpen={membersModal.isOpen} onClose={() => setMembersModal({ isOpen: false, project: null })} project={membersModal.project} />}

      <Dialog open={deleteModal.isOpen} onOpenChange={() => setDeleteModal({ isOpen: false, project: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">¿Eliminar &quot;{deleteModal.project?.name}&quot;?</DialogTitle>
            <DialogDescription className="text-base">
              Esta acción es irreversible y eliminará permanentemente el proyecto.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteModal({ isOpen: false, project: null })}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(deleteModal.project.id)}
              disabled={deleteMutation.isPending}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectsPage;
