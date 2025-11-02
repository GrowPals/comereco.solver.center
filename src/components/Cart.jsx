
import React, { useState } from 'react';
import { useCart } from '@/context/CartContext'; // Cambiado a context
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ShoppingCart, Trash2, Plus, Minus, BookmarkPlus, ArrowRight, Package } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast.js'; // La ruta correcta es con guion
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { saveTemplate } from '@/services/templateService';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex items-start gap-4 py-4">
      <div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
        <img
          className="w-full h-full object-contain p-2"
          alt={item.name}
         src={item.image_url || '/placeholder.png'} 
         onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
         />
      </div>

      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div>
          <p className="font-semibold text-sm leading-tight text-foreground line-clamp-2">
            {item.name}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ${(item.price || 0).toFixed(2)} / {item.unit}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="w-8 h-8 rounded-full border-primary/50 text-primary/50 hover:bg-primary/10 transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <Minus size={14} />
          </Button>
          <span className="w-12 text-center font-semibold text-sm text-foreground">
            {item.quantity}
          </span>
          <Button
            size="icon"
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="w-8 h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <Plus size={14} />
          </Button>
        </div>
      </div>

      <div className="text-right flex flex-col items-end gap-2 flex-shrink-0">
        <p className="font-bold text-sm text-foreground">
          ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeFromCart(item.id)}
          className="w-8 h-8 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-300"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
};

const SaveTemplateModal = ({ isOpen, onOpenChange, cart }) => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

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

    try {
        toast({
          title: '🚧 Funcionalidad en desarrollo',
          description: 'La creación de plantillas estará disponible pronto.',
        });
        setName('');
        setDescription('');
        onOpenChange(false);
    } catch (error) {
        toast({
            title: 'Error al guardar',
            description: 'No se pudo guardar la plantilla. Inténtalo de nuevo.',
            variant: 'destructive',
        });
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
            <Button type="button" variant="outline" className="rounded-xl">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} className="rounded-xl">
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Cart = () => {
  const { isCartOpen, toggleCart, items, clearCart, subtotal, totalItems } = useCart();
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

  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const backdropVariants = { visible: { opacity: 1 }, hidden: { opacity: 0 } };
  const cartVariants = { visible: { x: 0 }, hidden: { x: '100%' } };

  return (
    <>
      <SaveTemplateModal isOpen={isTemplateModalOpen} onOpenChange={setTemplateModalOpen} cart={{items, subtotal, tax, total}} />
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={toggleCart}
              className="fixed inset-0 bg-black/60 z-40"
              transition={{ duration: 0.3 }}
            />

            <motion.div
              variants={cartVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed top-0 right-0 h-full w-full max-w-md bg-background shadow-2xl z-50 flex flex-col"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <header className="flex items-center justify-between px-5 py-4 border-b">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">Tu Carrito</h2>
                  {totalItems > 0 && (
                    <Badge variant="default" className="rounded-full">
                      {totalItems}
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={toggleCart} className="rounded-full">
                  <X className="w-6 h-6" />
                </Button>
              </header>

              <div className="flex-1 relative">
                <ScrollArea className="absolute inset-0">
                  <div className="px-5">
                    {items.length > 0 ? (
                      <AnimatePresence>
                        {items.map((item, index) => (
                          <motion.div
                            layout
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                          >
                            <CartItem item={item} />
                            {index < items.length -1 && <Separator className="my-1"/>}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center py-20 gap-4">
                        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                          <Package className="w-12 h-12" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">
                          Tu carrito está vacío
                        </h3>
                        <p className="text-muted-foreground text-sm max-w-xs">
                          Parece que aún no has agregado productos. ¡Explora para empezar!
                        </p>
                        <Button onClick={handleExplore} className="rounded-xl mt-2">
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
                      <span className="font-semibold">${tax.toFixed(2)}</span>
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
                      className="w-full rounded-xl"
                      onClick={() => setTemplateModalOpen(true)}
                    >
                      <BookmarkPlus className="mr-2" size={18} />
                      Guardar como plantilla
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={handleClearCart}
                        className="rounded-xl"
                      >
                        <Trash2 size={16} />
                      </Button>
                      <Button
                        className="flex-1 rounded-xl"
                        onClick={handleCheckout}
                      >
                        Finalizar Compra
                        <ArrowRight className="ml-2" size={18} />
                      </Button>
                    </div>
                  </div>
                </footer>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Cart;
