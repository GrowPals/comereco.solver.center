
import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
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
import PageLoader from '@/components/PageLoader';
import EmptyState from '@/components/EmptyState';

const ProjectCard = ({ project, onEdit, onDelete, onManageMembers, onView }) => {
  const { canManageProjects } = useUserPermissions();
  return (
    <div className="group relative bg-white border-2 border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* Accent bar on hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-sm">
              <FolderKanban className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-xl text-slate-900">{project.name}</h3>
          </div>
          {canManageProjects && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 rounded-xl">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem onClick={() => onEdit(project)}>
                  <Edit className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onManageMembers(project)}>
                  <Users className="mr-2 h-4 w-4" /> Miembros
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(project)} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <p className="text-base text-slate-600 line-clamp-2 min-h-[3rem] leading-relaxed">{project.description}</p>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col gap-3">
        <div className="flex justify-between items-center">
        <Badge variant={project.active ? 'success' : 'muted'} className="shadow-sm">
          {project.active ? 'Activo' : 'Archivado'}
        </Badge>
        <div className="text-sm text-slate-600">
          <span className="font-medium text-slate-900">{project.supervisor?.full_name || 'Sin asignar'}</span>
        </div>
        </div>
        <Button
          variant="outline"
          className="w-full group-hover:border-blue-300 group-hover:text-blue-600 transition-colors"
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

const ProjectFormModal = ({ project, isOpen, onClose, onSave, supervisors }) => {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [supervisorId, setSupervisorId] = useState(project?.supervisor_id ? String(project.supervisor_id) : EMPTY_SUPERVISOR_VALUE);
  const [active, setActive] = useState(project?.active ?? true);

  useEffect(() => {
    setName(project?.name || '');
    setDescription(project?.description || '');
    setSupervisorId(project?.supervisor_id ? String(project.supervisor_id) : EMPTY_SUPERVISOR_VALUE);
    setActive(project?.active ?? true);
  }, [project, isOpen]);

  const handleSubmit = () => {
    const normalizedSupervisorId = supervisorId === EMPTY_SUPERVISOR_VALUE ? null : Number(supervisorId);
    onSave({
      id: project?.id,
      name,
      description,
      supervisor_id: normalizedSupervisorId,
      active
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg overflow-hidden border border-slate-200 bg-white shadow-2xl p-0">
        <div className="flex max-h-[85vh] flex-col">
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
                      {s.full_name || 'Sin nombre'} ({s.role_v2 === 'admin' ? 'Admin' : 'Supervisor'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <input
                type="checkbox"
                id="active"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <Label htmlFor="active" className="text-sm font-medium text-slate-700">Activo</Label>
            </div>
          </div>
          <DialogFooter className="sticky bottom-0 flex flex-col gap-2 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
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
    const { isSupervisor } = useUserPermissions();
    const [selectedUser, setSelectedUser] = useState(MANAGE_MEMBERS_PLACEHOLDER);

    useEffect(() => {
        if (!isOpen) {
            setSelectedUser(MANAGE_MEMBERS_PLACEHOLDER);
        }
    }, [isOpen, project?.id]);

    const addMemberMutation = useMutation({
        mutationFn: ({ projectId, userId }) => addProjectMember(projectId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries(['projectMembers', project.id]);
            toast({ title: 'Miembro agregado' });
            setSelectedUser(MANAGE_MEMBERS_PLACEHOLDER);
        },
        onError: (error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
    });

    const removeMemberMutation = useMutation({
        mutationFn: ({ projectId, userId }) => removeProjectMember(projectId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries(['projectMembers', project.id]);
            toast({ title: 'Miembro eliminado' });
        },
        onError: (error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
    });

    const toggleApprovalMutation = useMutation({
        mutationFn: ({ projectId, userId, requiresApproval }) =>
            updateProjectMemberApproval(projectId, userId, requiresApproval),
        onSuccess: () => {
            queryClient.invalidateQueries(['projectMembers', project.id]);
            toast({ title: 'Configuración actualizada' });
        },
        onError: (error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
    });

    const availableUsers = useMemo(() => {
        const baseList = (companyUsers || []).filter(
            (u) => u && u.id && !members?.some((m) => m.user_id === u.id),
        );

        if (!isSupervisor) {
            return baseList;
        }

        return baseList.filter((u) => u?.is_manageable);
    }, [companyUsers, members, isSupervisor]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl overflow-hidden border border-slate-200 bg-white shadow-2xl p-0">
                <div className="flex max-h-[85vh] flex-col">
                    <DialogHeader className="px-6 pt-6">
                        <DialogTitle>Gestionar Miembros de "{project?.name}"</DialogTitle>
                        <DialogDescription>Agrega usuarios y configura si requieren aprobación para enviar requisiciones.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 px-6 py-4">
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
                                        <div className="px-3 py-2 text-sm text-slate-500">Sin usuarios disponibles</div>
                                    ) : (
                                        availableUsers.map(u => (
                                            <SelectItem key={u.id} value={String(u.id)}>{u.full_name || u.email}</SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <Button 
                                onClick={() => selectedUser !== MANAGE_MEMBERS_PLACEHOLDER && addMemberMutation.mutate({ projectId: project.id, userId: Number(selectedUser) })} 
                                disabled={selectedUser === MANAGE_MEMBERS_PLACEHOLDER || addMemberMutation.isPending}
                                isLoading={addMemberMutation.isPending}
                                className="rounded-xl shadow-button hover:shadow-button-hover"
                                title={selectedUser === MANAGE_MEMBERS_PLACEHOLDER ? 'Selecciona un usuario para agregar' : 'Agregar miembro'}
                            >
                                <UserPlus className="h-4 w-4"/>
                            </Button>
                        </div>
                        <div className="max-h-96 space-y-2 overflow-y-auto pr-2">
                            {isLoadingMembers ? (
                                <p className="py-4 text-center text-slate-500">Cargando miembros...</p>
                            ) : members && members.length > 0 ? (
                                members.map(member => (
                                    <div key={member.user_id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">{member.user.full_name}</p>
                                            <p className="text-sm text-slate-500">
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
                                <p className="py-8 text-center text-slate-500">No hay miembros en este proyecto</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="sticky bottom-0 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
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
  const { canManageProjects } = useUserPermissions();
  
  const [formModal, setFormModal] = useState({ isOpen: false, project: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, project: null });
  const [membersModal, setMembersModal] = useState({ isOpen: false, project: null });

  const { data: projects, isLoading, isError } = useQuery({ queryKey: ['projects'], queryFn: getAllProjects });
  const { data: users } = useQuery({ queryKey: ['companyUsers'], queryFn: fetchUsersInCompany });
  const supervisors = users?.filter(u => u.role_v2 === 'supervisor' || u.role_v2 === 'admin');

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-md">
                <FolderKanban className="h-7 w-7 text-blue-600" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-1">
                  <span className="bg-gradient-primary bg-clip-text text-transparent">Proyectos</span>
                </h1>
                <p className="text-base text-slate-600">
                  {projects?.length || 0} {projects?.length === 1 ? 'proyecto' : 'proyectos'} en gestión
                </p>
              </div>
            </div>
            {canManageProjects && (
              <Button
                size="lg"
                onClick={() => setFormModal({ isOpen: true, project: null })}
                className="shadow-lg hover:shadow-xl whitespace-nowrap"
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
              description={canManageProjects ? "Crea tu primer proyecto para empezar." : "No estás asignado a ningún proyecto."}
              actionButton={canManageProjects && (
                <Button size="lg" onClick={() => setFormModal({ isOpen: true, project: null })}>
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Crear Proyecto
                </Button>
              )}
            />
          )}
        </div>
      </div>

      {formModal.isOpen && <ProjectFormModal isOpen={formModal.isOpen} onClose={() => setFormModal({ isOpen: false, project: null })} project={formModal.project} onSave={handleSave} supervisors={supervisors} />}
      {membersModal.isOpen && <ManageMembersModal isOpen={membersModal.isOpen} onClose={() => setMembersModal({ isOpen: false, project: null })} project={membersModal.project} />}

      <Dialog open={deleteModal.isOpen} onOpenChange={() => setDeleteModal({ isOpen: false, project: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">¿Eliminar "{deleteModal.project?.name}"?</DialogTitle>
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
