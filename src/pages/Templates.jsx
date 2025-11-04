
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
import TemplateItemsEditor from '@/components/TemplateItemsEditor';

const TemplateCard = ({ template, onEdit, onDelete, onUse }) => {
    return (
        <div className="group relative bg-white border-2 border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            {/* Accent bar on hover */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

            <div>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-sm flex-shrink-0">
                            <LayoutTemplate className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" aria-hidden="true" />
                        </div>
                        <h3 className="font-bold text-base sm:text-lg lg:text-xl text-slate-900 line-clamp-1">{template.name}</h3>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-slate-100 rounded-xl flex-shrink-0"><MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => onUse(template.id)}><Zap className="mr-2 h-4 w-4" /> Usar Plantilla</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(template)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(template)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <p className="text-sm sm:text-base text-slate-600 line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem] leading-relaxed">{template.description || 'Sin descripción'}</p>
            </div>
            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2 text-xs sm:text-sm">
                <span className="font-medium text-slate-700">{template.items?.length || 0} productos</span>
                <span className="text-slate-600">Usada {template.usage_count || 0} veces</span>
                {template.last_used_at && <span className="text-slate-500 text-xs">Últ: {format(parseISO(template.last_used_at), 'dd MMM', { locale: es })}</span>}
            </div>
        </div>
    );
};

const TemplateFormModal = ({ template, isOpen, onClose, onSave }) => {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [items, setItems] = useState(template?.items || []);

  const handleSubmit = () => {
    if (!name.trim()) {
      return; // El botón ya está deshabilitado, pero por si acaso
    }
    onSave({ id: template?.id, name, description, items });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden border border-slate-200 bg-white shadow-2xl p-0">
        <div className="flex max-h-[90vh] flex-col">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-2xl font-bold">
              {template ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}
            </DialogTitle>
            <DialogDescription className="text-base">
              {template
                ? 'Actualiza la información y productos de tu plantilla.'
                : 'Crea una plantilla con los productos que uses frecuentemente.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Información básica */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre de la Plantilla *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Suministros de oficina mensuales"
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe para qué sirve esta plantilla..."
                  className="rounded-xl"
                  rows={3}
                />
              </div>
            </div>

            {/* Editor de items */}
            <div className="mt-6 border-t pt-6">
              <TemplateItemsEditor
                items={items}
                onChange={setItems}
              />
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 flex flex-col gap-2 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={onClose} className="rounded-xl">
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!name.trim()}
                className="rounded-xl shadow-button hover:shadow-button-hover"
              >
                {template ? 'Actualizar Plantilla' : 'Crear Plantilla'}
              </Button>
            </div>
          </DialogFooter>
        </div>
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
    if (!templateData.name || !templateData.name.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'El nombre de la plantilla es requerido.' });
      return;
    }
    if (templateData.id) {
      updateMutation.mutate(templateData);
    } else {
      createMutation.mutate({ ...templateData, items: templateData.items || [] });
    }
  };
  
  if (isLoading) return <PageLoader message="Cargando plantillas..." />;
  if (isError) return <EmptyState icon={LayoutTemplate} title="Error al Cargar" description="No se pudieron cargar las plantillas." />;

  return (
    <>
      <Helmet><title>Plantillas - ComerECO</title></Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="flex flex-col gap-4 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-md">
                <LayoutTemplate className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 mb-1">
                  Plantillas de <span className="bg-gradient-primary bg-clip-text text-transparent">Requisición</span>
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-slate-600">Reutiliza tus pedidos frecuentes con un solo clic.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button
                onClick={() => setFormModal({ isOpen: true, template: null })}
                size="lg"
                variant="outline"
                className="flex-1 sm:flex-none shadow-button hover:shadow-button-hover text-sm sm:text-base"
              >
                <PlusCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Nueva Plantilla
              </Button>
              <Button
                onClick={() => navigate('/catalog')}
                size="lg"
                className="flex-1 sm:flex-none shadow-button hover:shadow-button-hover text-sm sm:text-base"
              >
                <FilePlus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Desde Carrito
              </Button>
            </div>
          </header>

          {templates && templates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <TemplateCard key={template.id} template={template} onEdit={(t) => setFormModal({ isOpen: true, template: t })} onDelete={(t) => setDeleteModal({ isOpen: true, template: t })} onUse={(id) => useTemplateMutation.mutate(id)} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-16 border-2 border-slate-200">
              <EmptyState
                icon={Bot}
                title="Aún no tienes plantillas"
                description="Crea tu primera plantilla guardando un carrito de compras para agilizar tus pedidos futuros."
                actionButton={<Button onClick={() => navigate('/catalog')} size="lg" className="shadow-button hover:shadow-button-hover">Ir al Catálogo</Button>}
              />
            </div>
          )}
        </div>
      </div>

      {formModal.isOpen && <TemplateFormModal isOpen={formModal.isOpen} onClose={() => setFormModal({ isOpen: false, template: null })} template={formModal.template} onSave={handleSave} />}
      
      <Dialog open={deleteModal.isOpen} onOpenChange={() => setDeleteModal({ isOpen: false, template: null })}>
        <DialogContent className="sm:max-w-md border border-slate-200 bg-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">¿Eliminar plantilla "{deleteModal.template?.name}"?</DialogTitle>
            <DialogDescription className="text-base">Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteModal({ isOpen: false, template: null })} className="rounded-xl">Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteModal.template.id)} disabled={deleteMutation.isPending} className="rounded-xl">Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TemplatesPage;
