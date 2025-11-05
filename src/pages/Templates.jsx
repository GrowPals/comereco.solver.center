
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
import PageContainer from '@/components/layout/PageContainer';

const TemplateCard = ({ template, onEdit, onDelete, onUse }) => {
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card/95 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-border dark:bg-card/85">
      {/* Accent bar on hover */}
      <div className="absolute inset-x-0 top-0 h-1 scale-x-0 bg-gradient-primary transition-transform duration-300 group-hover:scale-x-100" />

      <div>
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 shadow-sm dark:from-primary-500/15 dark:to-primary-600/10">
              <LayoutTemplate className="h-6 w-6 text-primary-500" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-bold text-foreground">{template.name}</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 rounded-xl p-0 transition-colors hover:bg-muted/70 dark:hover:bg-muted/40">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-border bg-card dark:border-border dark:bg-card">
              <DropdownMenuItem onClick={() => onUse(template.id)}>
                <Zap className="mr-2 h-4 w-4" /> Usar Plantilla
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(template)}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(template)} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="min-h-[3rem] text-base leading-relaxed text-muted-foreground">
          {template.description || 'Sin descripción'}
        </p>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4 text-sm text-muted-foreground dark:border-border">
        <span className="font-medium text-foreground">{template.items?.length || 0} productos</span>
        <span>Usada {template.usage_count || 0} veces</span>
        {template.last_used_at && (
          <span className="text-xs">
            Últ: {format(parseISO(template.last_used_at), 'dd MMM', { locale: es })}
          </span>
        )}
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
      <DialogContent className="sm:max-w-4xl border border-border bg-card shadow-2xl p-0 dark:border-border dark:bg-card">
        <div className="flex max-h-[calc(100dvh-3.5rem)] flex-col">
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

          <DialogFooter className="sticky bottom-0 flex flex-col gap-2 border-t border-border bg-background/90 px-6 py-4 backdrop-blur dark:border-border dark:bg-card/80">
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
      <PageContainer className="pb-24 sm:pb-16">
        <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8">
          <header className="flex flex-col gap-6 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between sm:pb-8 dark:border-border">
            <div className="flex w-full items-start gap-3 sm:items-center sm:gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 shadow-md sm:h-14 sm:w-14 dark:from-primary-500/15 dark:to-primary-600/10">
                <LayoutTemplate className="h-6 w-6 text-primary-500 sm:h-7 sm:w-7" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h1 className="mb-1 text-xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                  Plantillas de <span className="bg-gradient-primary bg-clip-text text-transparent">Requisición</span>
                </h1>
                <p className="text-sm text-muted-foreground sm:text-lg">Reutiliza tus pedidos frecuentes con un solo clic.</p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <Button
                onClick={() => setFormModal({ isOpen: true, template: null })}
                size="lg"
                variant="outline"
                className="w-full shadow-button hover:shadow-button-hover sm:w-auto sm:whitespace-nowrap"
              >
                <PlusCircle className="mr-2 h-5 w-5" /> Nueva Plantilla
              </Button>
              <Button
                onClick={() => navigate('/catalog')}
                size="lg"
                className="w-full shadow-button hover:shadow-button-hover sm:w-auto sm:whitespace-nowrap"
              >
                <FilePlus className="mr-2 h-5 w-5" /> Desde Carrito
              </Button>
            </div>
          </header>

          {templates && templates.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {templates.map((template) => (
                <TemplateCard key={template.id} template={template} onEdit={(t) => setFormModal({ isOpen: true, template: t })} onDelete={(t) => setDeleteModal({ isOpen: true, template: t })} onUse={(id) => useTemplateMutation.mutate(id)} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-8 shadow-lg dark:border-border dark:bg-card sm:p-12 lg:p-16">
              <EmptyState
                icon={Bot}
                title="Aún no tienes plantillas"
                description="Crea tu primera plantilla guardando un carrito de compras para agilizar tus pedidos futuros."
                actionButton={<Button onClick={() => navigate('/catalog')} size="lg" className="shadow-button hover:shadow-button-hover">Ir al Catálogo</Button>}
              />
            </div>
          )}
        </div>
      </PageContainer>

      {formModal.isOpen && <TemplateFormModal isOpen={formModal.isOpen} onClose={() => setFormModal({ isOpen: false, template: null })} template={formModal.template} onSave={handleSave} />}
      
      <Dialog open={deleteModal.isOpen} onOpenChange={() => setDeleteModal({ isOpen: false, template: null })}>
        <DialogContent className="sm:max-w-md border border-border bg-card shadow-2xl dark:border-border dark:bg-card">
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
