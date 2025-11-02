
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, MoreHorizontal, Edit, Trash2, Users, FolderKanban, UserPlus } from 'lucide-react';
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
} from '@/services/projectService';
import { fetchUsersInCompany } from '@/services/userService';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import PageLoader from '@/components/PageLoader';
import EmptyState from '@/components/EmptyState';

const ProjectCard = ({ project, onEdit, onDelete, onManageMembers }) => {
  const { canManageProjects } = useUserPermissions();
  return (
    <div className="bg-card border rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg">{project.name}</h3>
          {canManageProjects && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(project)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onManageMembers(project)}><Users className="mr-2 h-4 w-4" /> Miembros</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(project)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 h-10">{project.description}</p>
      </div>
      <div className="mt-4 flex justify-between items-center text-sm">
        <Badge variant={project.active ? 'success' : 'secondary'}>{project.active ? 'Activo' : 'Archivado'}</Badge>
        <div className="text-muted-foreground">Supervisor: {project.supervisor?.full_name || 'N/A'}</div>
      </div>
    </div>
  );
};

const ProjectFormModal = ({ project, isOpen, onClose, onSave, supervisors }) => {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [supervisorId, setSupervisorId] = useState(project?.supervisor_id || '');
  const [active, setActive] = useState(project?.active ?? true);

  const handleSubmit = () => {
    onSave({ id: project?.id, name, description, supervisor_id: supervisorId, active });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div><Label htmlFor="name">Nombre del Proyecto</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label htmlFor="description">Descripción</Label><Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div>
            <Label htmlFor="supervisor">Supervisor</Label>
            <Select value={supervisorId} onValueChange={setSupervisorId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar supervisor..." /></SelectTrigger>
              <SelectContent>
                {supervisors?.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2"><input type="checkbox" id="active" checked={active} onChange={(e) => setActive(e.target.checked)} /><Label htmlFor="active">Activo</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ManageMembersModal = ({ project, isOpen, onClose }) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { data: members, isLoading: isLoadingMembers } = useQuery({
        queryKey: ['projectMembers', project?.id],
        queryFn: () => getProjectMembers(project.id),
        enabled: !!project,
    });
    const { data: companyUsers } = useQuery({ queryKey: ['companyUsers'], queryFn: fetchUsersInCompany });
    const [selectedUser, setSelectedUser] = useState('');

    const addMemberMutation = useMutation({
        mutationFn: ({ projectId, userId }) => addProjectMember(projectId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries(['projectMembers', project.id]);
            toast({ title: 'Miembro agregado' });
            setSelectedUser('');
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

    const availableUsers = companyUsers?.filter(u => !members?.some(m => m.user_id === u.id)) || [];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Gestionar Miembros de "{project?.name}"</DialogTitle></DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="flex gap-2">
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                            <SelectTrigger><SelectValue placeholder="Agregar miembro..." /></SelectTrigger>
                            <SelectContent>
                                {availableUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button onClick={() => addMemberMutation.mutate({ projectId: project.id, userId: selectedUser })} disabled={!selectedUser || addMemberMutation.isPending}><UserPlus className="h-4 w-4"/></Button>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                        {isLoadingMembers ? <p>Cargando miembros...</p> : members?.map(member => (
                            <div key={member.user_id} className="flex items-center justify-between bg-muted p-2 rounded-md">
                                <p>{member.user.full_name}</p>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeMemberMutation.mutate({ projectId: project.id, userId: member.user_id })}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            </div>
                        ))}
                    </div>
                </div>
                <DialogFooter><Button onClick={onClose}>Cerrar</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const ProjectsPage = () => {
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
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <div><h1 className="text-3xl font-bold">Proyectos</h1><p className="text-muted-foreground">Gestiona los proyectos de tu compañía.</p></div>
          {canManageProjects && <Button onClick={() => setFormModal({ isOpen: true, project: null })}><PlusCircle className="mr-2 h-4 w-4" /> Crear Proyecto</Button>}
        </div>

        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onEdit={(p) => setFormModal({ isOpen: true, project: p })} onDelete={(p) => setDeleteModal({ isOpen: true, project: p })} onManageMembers={(p) => setMembersModal({ isOpen: true, project: p })} />
            ))}
          </div>
        ) : (
          <EmptyState icon={FolderKanban} title="No hay proyectos" description={canManageProjects ? "Crea tu primer proyecto para empezar." : "No estás asignado a ningún proyecto."} actionButton={canManageProjects && <Button onClick={() => setFormModal({ isOpen: true, project: null })}>Crear Proyecto</Button>} />
        )}
      </div>

      {formModal.isOpen && <ProjectFormModal isOpen={formModal.isOpen} onClose={() => setFormModal({ isOpen: false, project: null })} project={formModal.project} onSave={handleSave} supervisors={supervisors} />}
      {membersModal.isOpen && <ManageMembersModal isOpen={membersModal.isOpen} onClose={() => setMembersModal({ isOpen: false, project: null })} project={membersModal.project} />}
      
      <Dialog open={deleteModal.isOpen} onOpenChange={() => setDeleteModal({ isOpen: false, project: null })}>
        <DialogContent>
          <DialogHeader><DialogTitle>¿Eliminar "{deleteModal.project?.name}"?</DialogTitle><DialogDescription>Esta acción es irreversible.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteModal({ isOpen: false, project: null })}>Cancelar</Button><Button variant="destructive" onClick={() => deleteMutation.mutate(deleteModal.project.id)} disabled={deleteMutation.isPending}>Eliminar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectsPage;
