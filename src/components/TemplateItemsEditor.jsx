
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Package, Search, Loader2 } from 'lucide-react';
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

  const handleRemoveItem = (productId) => {
    const updated = localItems.filter(item => item.product_id !== productId);
    setLocalItems(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="text-lg font-semibold text-slate-900">
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
          <div className="bg-slate-50 rounded-xl p-8 text-center border-2 border-dashed border-slate-200">
            <Package className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No hay productos en esta plantilla</p>
            {!readOnly && (
              <p className="text-sm text-slate-500 mt-1">
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
                className="flex items-center gap-3 p-3 bg-white rounded-xl border-2 border-slate-200 hover:border-blue-200 transition-colors"
              >
                {/* Imagen */}
                <img
                  src={product.image_url || '/placeholder.png'}
                  alt={product.name}
                  className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{product.name}</p>
                  <p className="text-sm text-slate-600">
                    SKU: {product.sku} • ${product.price?.toFixed(2) || '0.00'}
                  </p>
                </div>

                {/* Cantidad */}
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleUpdateQuantity(item.product_id, e.target.value)}
                    disabled={readOnly}
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-slate-600 whitespace-nowrap">
                    {product.unit || 'pza'}
                  </span>
                </div>

                {/* Subtotal */}
                <div className="text-right">
                  <p className="font-bold text-slate-900">
                    ${((product.price || 0) * item.quantity).toFixed(2)}
                  </p>
                </div>

                {/* Eliminar */}
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(item.product_id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal para agregar producto */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Agregar Producto a la Plantilla</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Buscador */}
            <div>
              <Label htmlFor="search">Buscar Producto</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">
                        {searchQuery ? 'No se encontraron productos' : 'Todos los productos ya están agregados'}
                      </div>
                    ) : (
                      availableProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex items-center gap-3 py-1">
                            <img
                              src={product.image_url || '/placeholder.png'}
                              alt={product.name}
                              className="w-8 h-8 rounded object-cover"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-slate-500">
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
              <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-2">Vista Previa:</p>
                {(() => {
                  const product = products.find(p => p.id === selectedProductId);
                  if (!product) return null;
                  return (
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image_url || '/placeholder.png'}
                        alt={product.name}
                        className="w-16 h-16 rounded-lg object-cover border-2 border-white shadow"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">{product.name}</p>
                        <p className="text-sm text-slate-600">
                          {quantity} {product.unit || 'pza'} × ${product.price?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">Subtotal:</p>
                        <p className="text-xl font-bold text-blue-600">
                          ${((product.price || 0) * parseInt(quantity || 1)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <DialogFooter>
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
            >
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateItemsEditor;
