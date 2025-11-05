
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Package, Search, Loader2, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/customSupabaseClient';
import logger from '@/utils/logger';

/**
 * Componente para editar los items de una plantilla
 * Permite agregar, editar cantidades y eliminar productos
 */
const TemplateItemsEditor = ({ items = [], onChange, readOnly = false }) => {
  const [localItems, setLocalItems] = useState(items);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Sincronizar con prop items cuando cambie
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  // Fetch de productos para seleccionar
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, price, image_url, unit, category')
        .eq('is_active', true)
        .order('name');

      if (error) {
        logger.error('Error fetching products:', error);
        throw error;
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Fetch de detalles de productos ya agregados
  const productIds = localItems.map(item => item.product_id);
  const { data: itemProducts = [] } = useQuery({
    queryKey: ['templateProducts', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];

      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, price, image_url, unit')
        .in('id', productIds);

      if (error) {
        logger.error('Error fetching template products:', error);
        throw error;
      }
      return data || [];
    },
    enabled: productIds.length > 0,
  });

  // Crear map de productos para lookup rápido
  const itemProductsMap = itemProducts.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

  // Filtrar productos disponibles para agregar
  const availableProducts = products.filter(p => {
    const alreadyAdded = localItems.some(item => item.product_id === p.id);
    const matchesSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    return !alreadyAdded && matchesSearch;
  });

  const handleAddItem = () => {
    if (!selectedProductId || quantity <= 0) return;

    const newItem = {
      product_id: selectedProductId,
      quantity: parseInt(quantity, 10),
    };

    const updated = [...localItems, newItem];
    setLocalItems(updated);
    onChange(updated);

    // Reset modal
    setSelectedProductId('');
    setQuantity(1);
    setIsAddModalOpen(false);
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty < 1) return;

    const updated = localItems.map(item =>
      item.product_id === productId ? { ...item, quantity: qty } : item
    );
    setLocalItems(updated);
    onChange(updated);
  };

  const handleStepQuantity = useCallback((productId, delta) => {
    setLocalItems(prevItems => {
      const updated = prevItems.map(item => {
        if (item.product_id !== productId) return item;
        const nextQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: nextQuantity };
      });

      onChange(updated);
      return updated;
    });
  }, [onChange]);

  const handleRemoveItem = (productId) => {
    const updated = localItems.filter(item => item.product_id !== productId);
    setLocalItems(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="text-lg font-semibold text-foreground">
          Productos ({localItems.length})
        </Label>
        {!readOnly && (
          <Button
            onClick={() => setIsAddModalOpen(true)}
            size="sm"
            variant="outline"
            className="shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Producto
          </Button>
        )}
      </div>

      {/* Lista de items */}
      <div className="space-y-2">
        {localItems.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border bg-muted/60 p-8 text-center dark:bg-card/40">
            <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="font-medium text-muted-foreground">No hay productos en esta plantilla</p>
            {!readOnly && (
              <p className="mt-1 text-sm text-muted-foreground/80">
                Haz clic en "Agregar Producto" para comenzar
              </p>
            )}
          </div>
        ) : (
          localItems.map((item) => {
            const product = itemProductsMap[item.product_id];
            if (!product) return null;

            return (
              <div
                key={item.product_id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md dark:border-border dark:hover:border-primary/30 dark:shadow-[0_14px_35px_rgba(8,15,32,0.35)]"
              >
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[auto,minmax(0,1fr),auto,auto,auto] lg:items-center lg:gap-6">
                  {/* Imagen */}
                  <div className="flex items-center justify-center lg:justify-start">
                    <img
                      src={product.image_url || '/placeholder.svg'}
                      alt={product.name}
                      className="h-20 w-20 rounded-xl border border-border object-cover shadow-xs sm:h-16 sm:w-16"
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 space-y-1">
                    <p className="line-clamp-2 text-base font-semibold leading-snug text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {product.sku} • ${product.price?.toFixed(2) || '0.00'}
                    </p>
                  </div>

                  {/* Cantidad */}
                  <div className="flex flex-col gap-3 lg:col-auto lg:flex-row lg:items-center lg:gap-4">
                    <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/70 px-2 py-1.5 dark:border-border dark:bg-card/60">
                      <button
                        type="button"
                        onClick={() => handleStepQuantity(item.product_id, -1)}
                        disabled={readOnly || item.quantity <= 1}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-card text-muted-foreground transition-colors hover:bg-muted/70 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-card dark:hover:bg-muted/40"
                        aria-label={`Disminuir cantidad de ${product.name}`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(item.product_id, e.target.value)}
                        disabled={readOnly}
                        className="h-11 w-16 border-0 bg-transparent text-center text-lg font-semibold focus-visible:ring-0"
                        aria-label={`Cantidad actual de ${product.name}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleStepQuantity(item.product_id, 1)}
                        disabled={readOnly}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-card text-muted-foreground transition-colors hover:bg-muted/70 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-card dark:hover:bg-muted/40"
                        aria-label={`Incrementar cantidad de ${product.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {product.unit || 'pza'}
                    </span>
                  </div>

                  {/* Subtotal */}
                  <div className="flex flex-col gap-1 text-left lg:text-right">
                    <p className="text-sm text-muted-foreground">Subtotal</p>
                    <p className="text-lg font-bold text-foreground">
                      ${((product.price || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* Eliminar */}
                  {!readOnly && (
                    <div className="flex items-start justify-end lg:justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.product_id)}
                        className="h-10 w-10 rounded-xl text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Eliminar ${product.name} de la plantilla`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal para agregar producto */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-2xl border border-border bg-card p-0">
          <div className="flex max-h-[calc(100dvh-4rem)] flex-col">
            <DialogHeader className="px-6 pt-6">
              <DialogTitle className="text-2xl font-bold">Agregar Producto a la Plantilla</DialogTitle>
            </DialogHeader>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
              {/* Buscador */}
              <div>
                <Label htmlFor="search">Buscar Producto</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre o SKU..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Selector de producto */}
            <div>
              <Label htmlFor="product">Producto</Label>
              {isLoadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                </div>
              ) : (
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        {searchQuery ? 'No se encontraron productos' : 'Todos los productos ya están agregados'}
                      </div>
                    ) : (
                      availableProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex items-center gap-3 py-1">
                            <img
                              src={product.image_url || '/placeholder.svg'}
                              alt={product.name}
                              className="h-8 w-8 rounded-lg border border-border object-cover"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {product.sku} • ${product.price?.toFixed(2) || '0.00'} • {product.category}
                              </p>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Cantidad */}
            <div>
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            {/* Preview del producto seleccionado */}
            {selectedProductId && (
              <div className="rounded-xl border border-border bg-muted/60 p-4 dark:bg-card/40">
                <p className="mb-2 text-sm font-semibold text-muted-foreground">Vista previa</p>
                {(() => {
                  const product = products.find(p => p.id === selectedProductId);
                  if (!product) return null;
                  return (
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image_url || '/placeholder.svg'}
                        alt={product.name}
                        className="h-16 w-16 rounded-xl border border-border object-cover shadow-sm"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {quantity} {product.unit || 'pza'} × ${product.price?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Subtotal</p>
                        <p className="text-xl font-bold text-foreground">
                          ${((product.price || 0) * parseInt(quantity || 1)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            </div>

            <DialogFooter className="sticky bottom-0 flex flex-col gap-2 border-t border-border bg-background/90 px-6 py-4 backdrop-blur dark:bg-card/80">
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setSelectedProductId('');
                    setQuantity(1);
                    setSearchQuery('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddItem}
                  disabled={!selectedProductId || quantity <= 0}
                  className="rounded-xl shadow-button hover:shadow-button-hover"
                >
                  Agregar
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateItemsEditor;
