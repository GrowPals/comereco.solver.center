
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast.js';
import logger from '@/utils/logger';
import { supabase } from '@/lib/customSupabaseClient';

export const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCartItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_cart_items')
        .select(`
          quantity,
          products:product_id ( * )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const cartItems = data.map(item => ({
        ...item.products,
        quantity: item.quantity,
      }));
      setItems(cartItems);
    } catch (error) {
      logger.error('Error al cargar el carrito desde Supabase', error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo cargar tu carrito." });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  const broadcastCartUpdate = useCallback(async () => {
    if (!user) return;
    try {
      await supabase.rpc('broadcast_to_company', {
        event_name: 'cart-updated',
        payload: { updater_id: user.id }
      });
    } catch (e) {
      logger.warn('Could not broadcast cart update', e);
    }
  }, [user]);

  const addToCart = useCallback(async (product, quantity = 1) => {
    if (!user) {
      toast({ variant: "destructive", title: "Inicia sesión", description: "Debes iniciar sesión para añadir productos." });
      return;
    }
    if (product.stock < quantity) {
      toast({ variant: "destructive", title: "Stock insuficiente", description: `No hay suficientes unidades de "${product.name}".`});
      return;
    }

    const existingItem = items.find(item => item.id === product.id);
    const newQuantity = (existingItem ? existingItem.quantity : 0) + quantity;

    if (newQuantity > product.stock) {
      toast({ variant: "destructive", title: "Límite de stock", description: `No puedes agregar más unidades de "${product.name}".`});
      return;
    }

    const optimisticItems = existingItem
      ? items.map(item => item.id === product.id ? { ...item, quantity: newQuantity } : item)
      : [...items, { ...product, quantity }];
    setItems(optimisticItems);

    const { error } = await supabase
      .from('user_cart_items')
      .upsert({ user_id: user.id, product_id: product.id, quantity: newQuantity });
    
    if (error) {
      logger.error('Error al añadir/actualizar item en Supabase', error);
      toast({ variant: "destructive", title: "Error", description: `No se pudo añadir "${product.name}" al carrito.`});
      fetchCartItems();
    } else {
      toast({ title: "¡Producto agregado!", description: `${quantity} x ${product.name} añadido al carrito.` });
      broadcastCartUpdate();
    }
  }, [user, items, toast, fetchCartItems, broadcastCartUpdate]);


  const removeFromCart = useCallback(async (productId) => {
    if (!user) return;
    
    const productName = items.find(item => item.id === productId)?.name || 'El producto';
    
    setItems(prev => prev.filter(item => item.id !== productId));
    
    const { error } = await supabase
        .from('user_cart_items')
        .delete()
        .match({ user_id: user.id, product_id: productId });
        
    if (error) {
        logger.error('Error al eliminar item de Supabase', error);
        toast({ variant: "destructive", title: "Error", description: `No se pudo eliminar "${productName}" del carrito.`});
        fetchCartItems();
    } else {
        toast({ title: "Producto eliminado", description: `${productName} ha sido eliminado del carrito.`, variant: 'info' });
        broadcastCartUpdate();
    }
  }, [user, items, toast, fetchCartItems, broadcastCartUpdate]);


  const updateQuantity = useCallback(async (productId, newQuantity) => {
    if (!user) return;
    
    const itemToUpdate = items.find(item => item.id === productId);
    if (!itemToUpdate) return;
    
    if (newQuantity > itemToUpdate.stock) {
      toast({ variant: "destructive", title: "Stock insuficiente", description: `Solo hay ${itemToUpdate.stock} unidades disponibles.` });
      newQuantity = itemToUpdate.stock;
    }
    
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems(prev => prev.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
    
    const { error } = await supabase
        .from('user_cart_items')
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .match({ user_id: user.id, product_id: productId });

    if (error) {
        logger.error('Error al actualizar cantidad en Supabase', error);
        toast({ variant: "destructive", title: "Error", description: `No se pudo actualizar la cantidad de "${itemToUpdate.name}".` });
        fetchCartItems();
    } else {
      broadcastCartUpdate();
    }
  }, [user, items, toast, fetchCartItems, removeFromCart, broadcastCartUpdate]);

  const clearCart = useCallback(async () => {
    if (!user) return;
    
    setItems([]);
    
    const { error } = await supabase.rpc('clear_user_cart');

    if (error) {
        logger.error('Error al limpiar el carrito en Supabase', error);
        toast({ variant: "destructive", title: "Error", description: "No se pudo vaciar el carrito." });
        fetchCartItems();
    } else {
        toast({ title: "Carrito vaciado", description: "Todos los productos han sido eliminados." });
        broadcastCartUpdate();
    }
  }, [user, toast, fetchCartItems, broadcastCartUpdate]);

  const toggleCart = () => setIsCartOpen(prev => !prev);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isCartOpen,
    setIsCartOpen,
    toggleCart,
    totalItems,
    subtotal,
    loading,
    refetch: fetchCartItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
