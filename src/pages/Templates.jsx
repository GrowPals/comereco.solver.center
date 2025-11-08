
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
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
import { cn } from '@/lib/utils';
import { SectionIcon } from '@/components/ui/icon-wrapper';
import { Icon as Glyph } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

const TemplateCard = ({ template, onEdit, onDelete, onUse }) => {
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const isFrequentlyUsed = template.usage_count >= 3;
  const description = template?.description?.trim();
  const redundantCopy = ['template para pedidos recurrentes', 'template para pedidos recurrentes.'];
  const showDescription = description && !redundantCopy.includes(description.toLowerCase());

  const productCount = template.items?.length || 0;
  const usageCount = template.usage_count || 0;

  const openActionsMenu = (event) => {
    event?.preventDefault();
    setIsActionsMenuOpen(true);
  };

  return (
    <article
      tabIndex={0}
      role="button"
      onClick={openActionsMenu}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openActionsMenu();
        }
      }}
      className={cn(
        'group flex h-full cursor-pointer flex-col rounded-2xl border border-border/60 bg-card/80 p-4 transition-all hover:border-primary/30 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:outline-none',
        isFrequentlyUsed && 'border-primary-200 bg-primary-50/40 dark:border-primary-400/30 dark:bg-primary-500/5'
      )}
    >
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-1 items-start gap-2">
            <Glyph icon={LayoutTemplate} tone="primary" size="sm" className="mt-0.5 text-primary-500" />
            <div className="min-w-0 space-y-1">
              <h3 className="text-base font-semibold leading-tight text-foreground break-words line-clamp-2">
                {template.name}
              </h3>
              {showDescription && (
                <p className="text-sm text-muted-foreground/90 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            {isFrequentlyUsed && (
              <Badge variant="info" className="gap-1.5 px-2.5 py-1 text-[0.65rem] uppercase tracking-wide">
                <Zap className="h-3 w-3" />
                Frecuente
              </Badge>
            )}
            <DropdownMenu open={isActionsMenuOpen} onOpenChange={setIsActionsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl p-2">
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
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-dashed border-border/70 pt-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">
          {productCount} {productCount === 1 ? 'producto' : 'productos'}
        </span>
        <span>Usada {usageCount} {usageCount === 1 ? 'vez' : 'veces'}</span>
        {template.last_used_at && (
          <span>Últ: {format(parseISO(template.last_used_at), 'dd MMM', { locale: es })}</span>
        )}
      </div>
    </article>
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
      <DialogContent className="sm:max-w-4xl surface-panel p-0">
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

          <DialogFooter className="surface-sticky sticky bottom-0 flex flex-col gap-2 rounded-b-2xl px-6 py-4">
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
            <div className="flex w-full items-start gap-3 sm:items-center sm:gap-4 min-w-0">
              <SectionIcon icon={LayoutTemplate} size="lg" className="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <h1 className="page-title mb-1 break-words">
                  Plantillas de <span className="page-title-accent">Requisición</span>
                </h1>
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {templates.map((template) => (
                <TemplateCard key={template.id} template={template} onEdit={(t) => setFormModal({ isOpen: true, template: t })} onDelete={(t) => setDeleteModal({ isOpen: true, template: t })} onUse={(id) => useTemplateMutation.mutate(id)} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-8 shadow-soft-md dark:border-border dark:bg-card sm:p-12 lg:p-16">
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
        <DialogContent className="sm:max-w-md border border-border bg-card shadow-soft-xl dark:border-border dark:bg-card">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">¿Eliminar plantilla &quot;{deleteModal.template?.name}&quot;?</DialogTitle>
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
