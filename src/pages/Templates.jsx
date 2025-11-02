
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, MoreHorizontal, Edit, Trash2, LayoutTemplate, FilePlus, Bot, Zap } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  useTemplateForRequisition,
} from '@/services/templateService';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import PageLoader from '@/components/PageLoader';
import EmptyState from '@/components/EmptyState';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const TemplateCard = ({ template, onEdit, onDelete, onUse }) => {
    return (
        <div className="bg-card border rounded-lg p-4 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-foreground">{template.name}</h3>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onUse(template.id)}><Zap className="mr-2 h-4 w-4" /> Usar Plantilla</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(template)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(template)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <p className="text-sm text-muted-foreground mt-1 h-10 line-clamp-2">{template.description || 'Sin descripción'}</p>
            </div>
            <div className="mt-4 flex justify-between items-center text-xs text-muted-foreground">
                <span>{template.items?.length || 0} productos</span>
                <span>Usada {template.usage_count || 0} veces</span>
                {template.last_used_at && <span>Últ. vez: {format(parseISO(template.last_used_at), 'dd MMM yyyy', { locale: es })}</span>}
            </div>
        </div>
    );
};

const TemplateFormModal = ({ template, isOpen, onClose, onSave }) => {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');

  const handleSubmit = () => {
    onSave({ id: template?.id, name, description, items: template?.items || [] });
  };
  
  // No se permite editar los items aquí para mantener la simplicidad. Se edita creando una nueva.

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{template ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}</DialogTitle>
          {!template && <DialogDescription>Crea una plantilla desde cero. Añade productos desde la página de la plantilla.</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div><Label htmlFor="name">Nombre de la Plantilla</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label htmlFor="description">Descripción</Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const TemplatesPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formModal, setFormModal] = useState({ isOpen: false, template: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, template: null });

  const { data: templates, isLoading, isError } = useQuery({ queryKey: ['templates'], queryFn: getTemplates });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      setFormModal({ isOpen: false, template: null });
      setDeleteModal({ isOpen: false, template: null });
    },
    onError: (error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
  };

  const createMutation = useMutation({ mutationFn: createTemplate, ...mutationOptions, onSuccess: () => { toast({ title: 'Plantilla creada' }); mutationOptions.onSuccess(); } });
  const updateMutation = useMutation({ mutationFn: updateTemplate, ...mutationOptions, onSuccess: () => { toast({ title: 'Plantilla actualizada' }); mutationOptions.onSuccess(); } });
  const deleteMutation = useMutation({ mutationFn: deleteTemplate, ...mutationOptions, onSuccess: () => { toast({ title: 'Plantilla eliminada' }); mutationOptions.onSuccess(); } });

  const useTemplateMutation = useMutation({
    mutationFn: useTemplateForRequisition,
    onSuccess: (newRequisitionId) => {
      toast({ title: 'Requisición creada', description: 'Se ha creado un borrador desde la plantilla.', variant: 'success' });
      navigate(`/requisitions/${newRequisitionId}`);
    },
    onError: (error) => toast({ variant: 'destructive', title: 'Error al usar plantilla', description: error.message }),
  });

  const handleSave = (templateData) => {
    if (templateData.id) updateMutation.mutate(templateData);
    else createMutation.mutate({ ...templateData, items: templateData.items || [] });
  };
  
  if (isLoading) return <PageLoader message="Cargando plantillas..." />;
  if (isError) return <EmptyState icon={LayoutTemplate} title="Error al Cargar" description="No se pudieron cargar las plantillas." />;

  return (
    <>
      <Helmet><title>Plantillas - ComerECO</title></Helmet>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <div><h1 className="text-3xl font-bold">Plantillas de Requisición</h1><p className="text-muted-foreground">Reutiliza tus pedidos frecuentes con un solo clic.</p></div>
          <Button onClick={() => navigate('/catalog')}><FilePlus className="mr-2 h-4 w-4" /> Crear desde Carrito</Button>
        </div>

        {templates && templates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} onEdit={(t) => setFormModal({ isOpen: true, template: t })} onDelete={(t) => setDeleteModal({ isOpen: true, template: t })} onUse={(id) => useTemplateMutation.mutate(id)} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Bot} title="Aún no tienes plantillas" description="Crea tu primera plantilla guardando un carrito de compras para agilizar tus pedidos futuros." actionButton={<Button onClick={() => navigate('/catalog')}>Ir al Catálogo</Button>} />
        )}
      </div>

      {formModal.isOpen && <TemplateFormModal isOpen={formModal.isOpen} onClose={() => setFormModal({ isOpen: false, template: null })} template={formModal.template} onSave={handleSave} />}
      
      <Dialog open={deleteModal.isOpen} onOpenChange={() => setDeleteModal({ isOpen: false, template: null })}>
        <DialogContent>
          <DialogHeader><DialogTitle>¿Eliminar plantilla "{deleteModal.template?.name}"?</DialogTitle><DialogDescription>Esta acción no se puede deshacer.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteModal({ isOpen: false, template: null })}>Cancelar</Button><Button variant="destructive" onClick={() => deleteMutation.mutate(deleteModal.template.id)} disabled={deleteMutation.isPending}>Eliminar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TemplatesPage;
