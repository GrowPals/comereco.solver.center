import React, { useMemo, useState, useCallback, memo, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookmarkPlus,
  Minus,
  Package,
  Plus,
  Trash2,
} from 'lucide-react';

import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/PageContainer';
import { useToast } from '@/components/ui/useToast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { createTemplate } from '@/services/templateService';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import OptimizedImage from '@/components/OptimizedImage';
import { cn } from '@/lib/utils';

const CartItemRow = memo(({ item, onDecrease, onIncrease, onRemove }) => {
  const itemPrice = useMemo(() => Number(item.price) || 0, [item.price]);
  const itemQuantity = useMemo(() => Number(item.quantity) || 0, [item.quantity]);
  const subtotal = useMemo(() => itemPrice * itemQuantity, [itemPrice, itemQuantity]);

  return (
    <div className="surface-card grid grid-cols-[auto,1fr,auto] items-start gap-4 rounded-2xl border border-border p-4 shadow-sm transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-500/40 hover:shadow-md hover:shadow-primary-500/10 dark:hover:shadow-primary-500/20">
      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted/85">
        <OptimizedImage
          src={item.image_url}
          alt={`Imagen de ${item.name || 'producto'}`}
          fallback="/placeholder.svg"
          loading="lazy"
          className="h-full w-full object-contain p-2"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="min-w-0">
          <p className="line-clamp-2 text-base font-semibold text-foreground">
            {item.name || 'Producto sin nombre'}
          </p>
          {item.sku && (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
              SKU: {item.sku}
            </p>
          )}
          <p className="mt-1 text-sm text-muted-foreground/80">
            ${itemPrice.toFixed(2)} / {item.unit || 'unidad'}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card/85 px-2 py-1 text-base font-semibold text-foreground">
          <button
            type="button"
            onClick={onDecrease}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-red-600"
            aria-label={`Reducir cantidad de ${item.name || 'producto'}`}
          >
            {itemQuantity <= 1 ? <Trash2 className="h-4 w-4" aria-hidden="true" /> : <Minus className="h-4 w-4" aria-hidden="true" />}
          </button>
          <span className="min-w-[2.25rem] text-center">{itemQuantity}</span>
          <button
            type="button"
            onClick={onIncrease}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white transition-colors hover:bg-primary-700"
            aria-label={`Aumentar cantidad de ${item.name || 'producto'}`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={onRemove}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-red-300/70 bg-red-500/10 text-red-500 transition-colors hover:bg-red-500/20"
          aria-label={`Eliminar ${item.name || 'producto'} del carrito`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">Subtotal</p>
          <p className="text-xl font-bold text-foreground">${subtotal.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
});

CartItemRow.displayName = 'CartItemRow';

const SaveTemplateModal = ({ isOpen, onOpenChange, cartItems }) => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) {
      toast({
        title: 'Inicia sesión',
        description: 'Debes iniciar sesión para guardar plantillas.',
        variant: 'destructive',
      });
      return;
    }
    if (!name.trim()) {
      toast({
        title: 'Nombre requerido',
        description: 'Por favor, asigna un nombre a tu plantilla.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const templateItems = cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        product_name: item.name,
      }));

      await createTemplate({
        name,
        description,
        items: templateItems,
      });

      toast({
        title: 'Plantilla guardada',
        description: `La plantilla "${name}" se creó correctamente.`,
      });
      setName('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error al guardar',
        description: error.message || 'No se pudo guardar la plantilla. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
      setIsSaving(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border border-border bg-card shadow-2xl p-0">
        <div className="flex max-h-[calc(100dvh-4rem)] flex-col">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <BookmarkPlus className="h-5 w-5 text-primary-600" />
              Guardar como Plantilla
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="template-name" className="text-sm font-semibold">
                Nombre de la Plantilla
              </Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Pedido semanal de oficina"
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="template-description" className="text-sm font-semibold">
                Descripción (opcional)
              </Label>
              <Textarea
                id="template-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Una breve descripción de esta plantilla."
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="surface-sticky sticky bottom-0 flex flex-col gap-2 rounded-b-2xl px-6 py-4">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-xl bg-primary-600 text-white shadow-button hover:bg-primary-700 hover:shadow-button-hover"
              >
                {isSaving ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CartPage = () => {
  const {
    items,
    subtotal,
    vat,
    total,
    totalItems,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);
  const [isClearDialogOpen, setClearDialogOpen] = useState(false);

  const handleBack = useCallback(() => {
    const fallback = location.state?.from && location.state.from !== '/cart'
      ? location.state.from
      : '/catalog';
    navigate(fallback, { replace: false });
  }, [location.state?.from, navigate]);

  const handleCheckout = useCallback(() => {
    if (items.length === 0) {
      toast({
        title: 'Tu carrito está vacío',
        description: 'Agrega productos antes de continuar.',
        variant: 'destructive',
      });
      return;
    }
    navigate('/checkout');
  }, [items.length, navigate, toast]);

  const handleIncrease = useCallback((itemId, currentQuantity) => {
    updateQuantity(itemId, currentQuantity + 1);
  }, [updateQuantity]);

  const handleDecrease = useCallback((itemId, currentQuantity) => {
    if (currentQuantity <= 1) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, currentQuantity - 1);
    }
  }, [removeFromCart, updateQuantity]);

  const handleRemove = useCallback((itemId) => {
    removeFromCart(itemId);
  }, [removeFromCart]);

  const handleExplore = useCallback(() => {
    navigate('/catalog');
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>Tu Carrito - ComerECO</title>
      </Helmet>

      <SaveTemplateModal
        isOpen={isTemplateModalOpen}
        onOpenChange={setTemplateModalOpen}
        cartItems={items}
      />

      <ConfirmDialog
        open={isClearDialogOpen}
        onOpenChange={setClearDialogOpen}
        title="¿Vaciar carrito?"
        description="Esta acción eliminará todos los productos de tu carrito. No podrás deshacerla."
        confirmText="Vaciar carrito"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={() => {
          clearCart();
          setClearDialogOpen(false);
        }}
      />

      <PageContainer className="pb-32 sm:pb-28" removeNavPadding>
        <div className="mx-auto w-full max-w-6xl pt-2 sm:pt-4">
          <div className="flex flex-col gap-6">
            <header className="flex items-start justify-between gap-4 border-b border-border pb-5">
              <div className="flex flex-1 items-start gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:bg-muted"
                  aria-label="Regresar"
                >
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                </Button>
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Tu Carrito</h1>
                  <p className="text-sm text-muted-foreground/80 sm:text-base">
                    {totalItems === 0
                      ? 'Aún no tienes productos en el carrito.'
                      : totalItems === 1
                        ? '1 producto listo para tu requisición.'
                        : `${totalItems} productos listos para tu requisición.`}
                  </p>
                </div>
              </div>

              {items.length > 0 && (
                <Button
                  variant="ghost"
                  className="hidden items-center gap-2 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 sm:flex"
                  onClick={() => setClearDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Vaciar carrito
                </Button>
              )}
            </header>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/85 px-8 py-16 text-center shadow-sm sm:px-16">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted text-muted-foreground/70">
                  <Package className="h-12 w-12" aria-hidden="true" />
                </div>
                <h2 className="mt-6 text-2xl font-semibold text-foreground">Tu carrito está vacío</h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground/80 sm:text-base">
                  Explora el catálogo y agrega productos para crear tu próxima requisición.
                </p>
                <Button
                  className="mt-6 rounded-xl bg-primary-600 text-white hover:bg-primary-700"
                  onClick={handleExplore}
                >
                  Ver catálogo
                </Button>
              </div>
            ) : (
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4 w-full max-w-[520px] mx-auto lg:max-w-none">
                  {items.map((item) => (
                    <CartItemRow
                      key={item.id}
                      item={item}
                      onDecrease={() => handleDecrease(item.id, item.quantity)}
                      onIncrease={() => handleIncrease(item.id, item.quantity)}
                      onRemove={() => handleRemove(item.id)}
                    />
                  ))}
                </div>

                <aside className="hidden rounded-2xl border border-border bg-card p-6 shadow-lg lg:block lg:sticky lg:top-32 lg:h-fit">
                  <h2 className="text-lg font-semibold text-foreground">Resumen</h2>
                  <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-foreground">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IVA (16%)</span>
                      <span className="font-semibold text-foreground">${vat.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-base font-bold text-foreground">
                      <span>Total</span>
                      <span>${total.toFixed(2)} <span className="text-xs font-normal text-muted-foreground/80">MXN</span></span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <Button
                      variant="outline"
                      onClick={() => setTemplateModalOpen(true)}
                      className="w-full rounded-xl border-border text-foreground/90 hover:border-primary-200 hover:text-primary-600"
                    >
                      <BookmarkPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                      Guardar como plantilla
                    </Button>
                    <Button
                      onClick={handleCheckout}
                      className="w-full rounded-xl bg-primary-600 text-white shadow-button hover:bg-primary-700 hover:shadow-button-hover"
                    >
                      Pedir
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setClearDialogOpen(true)}
                      className="w-full rounded-xl text-red-600 hover:bg-red-50"
                    >
                      Vaciar carrito
                    </Button>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>
      </PageContainer>

      {items.length > 0 && (
        <div className="surface-sticky fixed inset-x-0 bottom-0 z-40 border-t border-border px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 lg:hidden">
          <div className="mx-auto w-full max-w-3xl space-y-4">
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Productos ({totalItems})</span>
                <span className="font-semibold text-foreground">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>IVA (16%)</span>
                <span className="font-semibold text-foreground">${vat.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-bold text-foreground">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setClearDialogOpen(true)}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-red-300/70 bg-red-500/10 text-red-500 transition-colors hover:bg-red-500/20"
                aria-label="Vaciar carrito"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Vaciar carrito</span>
              </button>
              <Button
                variant="outline"
                onClick={() => setTemplateModalOpen(true)}
                className="w-full rounded-2xl border-border/80 text-foreground hover:border-primary-200 hover:text-primary-600"
              >
                <BookmarkPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                Guardar como plantilla
              </Button>
            </div>

            <Button
              onClick={handleCheckout}
              size="lg"
              className="w-full rounded-2xl bg-primary-600 py-5 text-lg font-semibold text-white shadow-button hover:bg-primary-700 hover:shadow-button-hover"
            >
              Pedir ahora
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default CartPage;
