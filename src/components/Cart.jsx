
import React, { useState, useMemo, memo, useCallback } from 'react';
import { useCart } from '@/hooks/useCart';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, ShoppingCart, Trash2, Plus, Minus, BookmarkPlus, ArrowRight, Package, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/useToast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createTemplate } from '@/services/templateService';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import OptimizedImage from '@/components/OptimizedImage';

const CartItem = memo(({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const handleIncrease = useCallback(() => {
    const newQuantity = (item.quantity || 0) + 1;
    updateQuantity(item.id, newQuantity);
  }, [item.id, item.quantity, updateQuantity]);

  const handleDecrease = useCallback(() => {
    const newQuantity = Math.max(0, (item.quantity || 0) - 1);
    if (newQuantity === 0) {
      removeFromCart(item.id);
    } else {
      updateQuantity(item.id, newQuantity);
    }
  }, [item.id, item.quantity, updateQuantity, removeFromCart]);

  const handleRemove = useCallback(() => {
    removeFromCart(item.id);
  }, [item.id, removeFromCart]);

  // Memoizar cálculos
  const itemPrice = useMemo(() => Number(item.price) || 0, [item.price]);
  const itemQuantity = useMemo(() => Number(item.quantity) || 0, [item.quantity]);
  const subtotal = useMemo(() => itemPrice * itemQuantity, [itemPrice, itemQuantity]);

  if (!item) return null;

  return (
    <div className="flex items-start gap-4 py-4" role="listitem">
      <div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
        <OptimizedImage
          src={item.image_url}
          alt={`Imagen de ${item.name || 'producto'}`}
          fallback="/placeholder.png"
          loading="lazy"
          className="w-full h-full object-contain p-2"
        />
      </div>

      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div>
          <p className="font-semibold text-sm leading-tight text-foreground line-clamp-2">
            {item.name || 'Producto sin nombre'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ${itemPrice.toFixed(2)} / {item.unit || 'unidad'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleDecrease}
            className="w-8 h-8 rounded-full border-primary/50 text-primary/50 hover:bg-primary/10 transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label={`Reducir cantidad de ${item.name || 'producto'}`}
            disabled={itemQuantity <= 1}
          >
            <Minus size={14} aria-hidden="true" />
          </Button>
          <span className="w-12 text-center font-semibold text-sm text-foreground" aria-label={`Cantidad: ${itemQuantity}`}>
            {itemQuantity}
          </span>
          <Button
            size="icon"
            onClick={handleIncrease}
            className="w-8 h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label={`Aumentar cantidad de ${item.name || 'producto'}`}
          >
            <Plus size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="text-right flex flex-col items-end gap-2 flex-shrink-0">
        <p className="font-bold text-sm text-foreground">
          ${subtotal.toFixed(2)}
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemove}
          className="w-8 h-8 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2"
          aria-label={`Eliminar ${item.name || 'producto'} del carrito`}
        >
          <Trash2 size={16} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
});

CartItem.displayName = 'CartItem';

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
            product_name: item.name
        }));

        await createTemplate({
            name,
            description,
            items: templateItems
        });

        toast({
            title: '✅ Plantilla Guardada',
            description: `La plantilla "${name}" ha sido creada con éxito.`,
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookmarkPlus className="w-5 h-5 text-primary" />
            Guardar como Plantilla
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="rounded-xl" disabled={isSaving}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} className="rounded-xl" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Cart = () => {
  const { isCartOpen, toggleCart, items, clearCart, subtotal, totalItems, vat, total } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);

  const handleClearCart = () => {
    clearCart();
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos antes de proceder.",
        variant: "destructive"
      });
      return;
    }
    toggleCart();
    navigate('/checkout');
  };
  
  const handleExplore = () => {
    toggleCart();
    navigate('/catalog');
  };

  return (
    <>
      <SaveTemplateModal isOpen={isTemplateModalOpen} onOpenChange={setTemplateModalOpen} cartItems={items} />
      {isCartOpen && (
        <>
          <div
            onClick={toggleCart}
            className="fixed inset-0 bg-black/60 z-40 transition-opacity"
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-background shadow-2xl z-50 flex flex-col transition-transform"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
          >
            <header className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-primary" aria-hidden="true" />
                <h2 id="cart-title" className="text-xl font-bold text-foreground">Tu Carrito</h2>
                {totalItems > 0 && (
                  <Badge variant="default" className="rounded-full" aria-label={`${totalItems} productos en el carrito`}>
                    {totalItems}
                  </Badge>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleCart} 
                className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="Cerrar carrito"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </Button>
            </header>

            <div className="flex-1 relative">
              <ScrollArea className="absolute inset-0">
                <div className="px-5" role="list" aria-label="Productos en el carrito">
                  {items.length > 0 ? (
                    items.map((item, index) => (
                      <div key={item.id}>
                        <CartItem item={item} />
                        {index < items.length - 1 && <Separator className="my-1"/>}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20 gap-4" role="status" aria-live="polite">
                      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Package className="w-12 h-12" aria-hidden="true" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Tu carrito está vacío
                      </h3>
                      <p className="text-muted-foreground text-sm max-w-xs">
                        Parece que aún no has agregado productos. ¡Explora para empezar!
                      </p>
                      <Button onClick={handleExplore} className="rounded-xl mt-2" aria-label="Ir al catálogo de productos">
                        Explorar Catálogo
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {items.length > 0 && (
              <footer className="px-5 py-6 border-t bg-background space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-foreground">
                    <span>Subtotal</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-foreground">
                    <span>IVA (16%)</span>
                    <span className="font-semibold">${vat.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base text-foreground">
                    <span>Total</span>
                    <span className="text-lg">${total.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">MXN</span></span>
                  </div>
                </div>

                <div className="space-y-2">
                   <Button
                    variant="outline"
                    className="w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={() => setTemplateModalOpen(true)}
                    aria-label="Guardar carrito como plantilla"
                  >
                    <BookmarkPlus className="mr-2" size={18} aria-hidden="true" />
                    Guardar como plantilla
                  </Button>
                  <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleClearCart}
                    className="rounded-xl focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2"
                    aria-label="Vaciar carrito"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </Button>
                  <Button
                    className="flex-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={handleCheckout}
                    aria-label="Finalizar compra e ir a checkout"
                  >
                    Finalizar Compra
                    <ArrowRight className="ml-2" size={18} aria-hidden="true" />
                  </Button>
                  </div>
                </div>
              </footer>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default Cart;
