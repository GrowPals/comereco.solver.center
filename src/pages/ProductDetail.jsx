import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  Package,
  Plus,
  Minus,
  ShoppingCart,
  AlertCircle,
  Calendar,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Check
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductRestockRuleSection } from '@/components/inventory/ProductRestockRuleSection';
import RelatedProducts from '@/components/RelatedProducts';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/formatters';
import logger from '@/utils/logger';
import { PAGINATION } from '@/constants/config';

// Función para obtener producto por ID
const fetchProductById = async (productId, companyId) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('company_id', companyId)
    .single();

  if (error) throw error;
  return data;
};

// Función para obtener productos relacionados
const fetchRelatedProducts = async (categoryId, currentProductId, companyId, limit = PAGINATION.RELATED_PRODUCTS_LIMIT) => {
  // Primero intentar por categoría
  let query = supabase
    .from('products')
    .select('*')
    .eq('company_id', companyId)
    .neq('id', currentProductId)
    .eq('is_active', true);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query.limit(limit);

  if (error) throw error;

  // Si no hay suficientes productos por categoría, obtener algunos recientes
  if (!data || data.length < 4) {
    const { data: moreProducts } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .neq('id', currentProductId)
      .eq('is_active', true)
      .limit(limit)
      .order('created_at', { ascending: false });

    return moreProducts || [];
  }

  return data || [];
};

// Función para obtener historial de pedidos
const fetchProductHistory = async (productId, userId) => {
  try {
    // Primero intentar con RPC si existe
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_product_order_history', {
        p_product_id: productId,
        p_user_id: userId
      });

    if (!rpcError && rpcData) {
      return rpcData;
    }

    // Fallback: consulta directa
    const { data, error } = await supabase
      .from('requisition_items')
      .select(`
        quantity,
        requisitions!inner(
          created_at,
          status,
          created_by
        )
      `)
      .eq('product_id', productId)
      .eq('requisitions.created_by', userId)
      .in('requisitions.status', ['approved', 'delivered', 'completed'])
      .order('requisitions.created_at', { ascending: false })
      .limit(PAGINATION.PRODUCT_HISTORY_LIMIT);

    if (error || !data || data.length === 0) return null;

    // Calcular estadísticas
    const totalQuantity = data.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const avgQuantity = totalQuantity / data.length;
    const lastOrder = data[0]?.requisitions?.created_at;

    return {
      last_ordered: lastOrder,
      total_ordered: totalQuantity,
      average_quantity: avgQuantity,
      order_count: data.length
    };
  } catch (error) {
    logger.error('Error fetching product history:', error);
    return null;
  }
};

// Componente de imagen del producto
function ProductImage({ src, alt, className }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  if (imageError || !src) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-gradient-to-br from-muted/60 to-muted/20 dark:from-card/70 dark:to-card/50",
        className
      )}>
        <Package className="h-24 w-24 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative">
      {imageLoading && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center bg-muted animate-pulse",
          className
        )}>
          <Package className="h-20 w-20 animate-pulse text-muted-foreground/60" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onError={handleImageError}
        onLoad={handleImageLoad}
        className={cn("object-contain", className, imageLoading && "opacity-0")}
        loading="lazy"
      />
    </div>
  );
}

// Componente principal
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const { items: cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const { favorites, toggleFavorite } = useFavorites();

  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);

  // Validar ID antes de continuar
  if (!id) {
    return <Navigate to="/catalog" replace />;
  }

  // Cleanup del feedback después de 2 segundos
  useEffect(() => {
    if (showAddedFeedback) {
      const timer = setTimeout(() => setShowAddedFeedback(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showAddedFeedback]);

  // Query para obtener el producto
  const {
    data: product,
    isLoading,
    error
  } = useQuery({
    queryKey: ['product', id, user?.company_id],
    queryFn: () => fetchProductById(id, user?.company_id),
    enabled: !!user?.company_id && !!id,
    staleTime: 5 * 60 * 1000,
  });

  // Query para productos relacionados
  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', product?.category_id, id, user?.company_id],
    queryFn: () => fetchRelatedProducts(product?.category_id, id, user?.company_id),
    enabled: !!product && !!user?.company_id,
    staleTime: 10 * 60 * 1000,
  });

  // Query para historial
  const { data: orderHistory } = useQuery({
    queryKey: ['product-history', id, user?.id],
    queryFn: () => fetchProductHistory(id, user?.id),
    enabled: !!user?.id && !!id,
    staleTime: 5 * 60 * 1000,
  });

  // Obtener cantidad actual en el carrito
  const cartItem = useMemo(() => {
    return (cart || []).find(item => item.id === id);
  }, [cart, id]);

  // Actualizar cantidad inicial basada en el carrito
  useEffect(() => {
    if (cartItem) {
      setQuantity(cartItem.quantity);
    } else {
      setQuantity(1);
    }
  }, [cartItem]);

  // Verificar si es favorito
  const isFavorite = favorites && Array.isArray(favorites) && favorites.includes(id);

  // Manejar cambio de cantidad
  const handleQuantityChange = (delta) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };

  // Manejar agregar/actualizar carrito
  const handleCartAction = async () => {
    if (!product) return;

    setIsAddingToCart(true);

    try {
      if (cartItem) {
        if (quantity === 0) {
          await removeFromCart(id);
        } else {
          await updateQuantity(id, quantity);
        }
      } else {
        await addToCart({
          ...product,
          quantity
        });
      }

      setShowAddedFeedback(true);
    } catch (error) {
      logger.error('Error updating cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Manejar favoritos
  const handleToggleFavorite = () => {
    if (product) {
      toggleFavorite(product.id, product.name || product.nombre);
    }
  };

  // Estados de carga y error
  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/70">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <div className="mb-6">
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="aspect-[16/9] rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-muted/70 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Producto no disponible
          </h2>
          <p className="text-muted-foreground">
            {error?.message || 'Este producto no está disponible actualmente o no existe.'}
          </p>
          <Button
            onClick={() => navigate('/catalog')}
            size="lg"
            className="mt-4"
          >
            Volver al catálogo
          </Button>
        </div>
      </div>
    );
  }

  // Procesar datos del producto
  const productName = product.name || product.nombre || 'Producto sin nombre';
  const productPrice = product.price || product.precio || 0;
  const productUnit = product.unit || product.unidad || 'Pieza';
  const productSku = product.sku || product.product_key || '';
  const productDescription = product.description || product.descripcion || '';
  const productCategory = product.category_name || product.categoria || '';

  // Lógica de stock - igual que en ProductCard (corregida para validar correctamente)
  const stock = Number.isFinite(product.stock) ? product.stock :
                Number.isFinite(product.existencias) ? product.existencias : null;
  const isInStock = stock !== null && stock !== undefined && stock > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-background via-background/97 to-background pb-20 lg:pb-8 dark:from-[#1b2d4d] dark:via-[#152441] dark:to-[#1b2d4d]"
    >
      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Botón de volver - sin barra, parte del fondo */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Volver</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Imagen del Producto con botón de favoritos */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <div className="aspect-[16/9] lg:aspect-[4/3] rounded-2xl overflow-hidden bg-card shadow-soft-md">
              <ProductImage
                src={product.image_url}
                alt={productName}
                className="w-full h-full"
              />
            </div>

            {/* Botón de favoritos en la esquina superior derecha de la imagen */}
            <button
              onClick={handleToggleFavorite}
              className={cn(
                "absolute top-4 right-4 rounded-full border border-border/70 bg-[var(--surface-overlay)] p-2.5 text-muted-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
                isFavorite
                  ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15"
                  : "hover:text-primary-600 hover:bg-muted"
              )}
              aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
            >
              <Heart
                className={cn(
                  "w-5 h-5 transition-all",
                  isFavorite && "fill-current"
                )}
              />
            </button>
          </motion.div>

          {/* Información del Producto */}
          <div className="space-y-6">
            {/* Categoría y SKU */}
            <div className="flex items-center gap-3 flex-wrap">
              {productCategory && (
                <Badge variant="outline" className="px-3 py-1">
                  {productCategory}
                </Badge>
              )}
              {productSku && (
                <span className="text-sm text-muted-foreground/80 font-mono">
                  SKU: {productSku}
                </span>
              )}
            </div>

            {/* Nombre del producto */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
              {productName}
            </h1>

            {/* Precio y disponibilidad */}
            <div className="space-y-3 p-5 bg-muted/70 rounded-xl">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-emerald-600">
                  ${formatPrice(productPrice)}
                </span>
                <span className="text-lg text-muted-foreground">/ {productUnit}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
                  isInStock
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                )}>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isInStock ? "bg-green-500 animate-pulse" : "bg-red-500"
                  )} />
                  {isInStock ? "Disponible" : "Sin stock"}
                </div>
                {stock !== undefined && stock !== null && (
                  <span className="text-sm text-muted-foreground">
                    {stock} unidades
                  </span>
                )}
              </div>
            </div>
            {/* Controles de cantidad y carrito */}
            <div className="space-y-4 p-5 bg-card border-2 border-border rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">
                  Cantidad
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className={cn(
                      "w-11 h-11 rounded-full flex items-center justify-center transition-all touch-manipulation",
                      "border-2 hover:scale-110 active:scale-95",
                      quantity <= 1
                        ? "border-border text-muted-foreground/50 cursor-not-allowed"
                        : "border-border/80 text-foreground/90 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                    )}
                    aria-label="Disminuir cantidad"
                  >
                    <Minus className="w-5 h-5" />
                  </button>

                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 h-11 text-center font-bold text-lg border-2 border-border rounded-lg focus:border-emerald-500 focus:outline-none touch-manipulation"
                    aria-label="Cantidad"
                  />

                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="w-11 h-11 rounded-full flex items-center justify-center transition-all touch-manipulation
                             border-2 border-border/80 text-foreground/90 hover:border-emerald-500 hover:bg-emerald-50 hover:scale-110 active:scale-95 dark:hover:bg-emerald-500/10"
                    aria-label="Aumentar cantidad"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={showAddedFeedback ? 'feedback' : 'normal'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Button
                    onClick={handleCartAction}
                    disabled={!isInStock || isAddingToCart}
                    size="lg"
                    className={cn(
                      "w-full h-14 text-base font-semibold transition-all",
                      showAddedFeedback && "bg-green-600 hover:bg-green-700"
                    )}
                  >
                    {isAddingToCart ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Procesando...
                      </span>
                    ) : showAddedFeedback ? (
                      <span className="flex items-center gap-2">
                        <Check className="w-5 h-5" />
                        {cartItem ? 'Cantidad actualizada' : 'Agregado al carrito'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        {cartItem ? `Actualizar cantidad` : 'Agregar al carrito'}
                      </span>
                    )}
                  </Button>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Descripción */}
            {productDescription && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Descripción</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {productDescription}
                </p>
              </div>
            )}

            {/* Historial de pedidos */}
            {orderHistory && (
              <Card className="p-5 bg-gradient-to-br from-primary-50 to-indigo-50 border-primary-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-foreground">Tu historial con este producto</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Última compra
                    </div>
                    <p className="font-semibold text-foreground">
                      {new Date(orderHistory.last_ordered).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                      Cantidad promedio
                    </div>
                    <p className="font-semibold text-foreground">
                      {Math.round(orderHistory.average_quantity)} {productUnit}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="w-4 h-4" />
                      Total comprado
                    </div>
                    <p className="font-semibold text-foreground">
                      {orderHistory.total_ordered} {productUnit}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="w-4 h-4" />
                      Veces pedido
                    </div>
                    <p className="font-semibold text-foreground">
                      {orderHistory.order_count} {orderHistory.order_count === 1 ? 'vez' : 'veces'}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Productos Relacionados */}
        {relatedProducts && relatedProducts.length > 0 && (
          <RelatedProducts
            products={relatedProducts}
            currentProductId={id}
          />
        )}

        <ProductRestockRuleSection product={product} stock={stock} />
      </div>

      {/* Botón flotante en móvil - mejorado */}
      <div className="surface-sticky fixed bottom-0 left-0 right-0 p-3 lg:hidden">
        <div className="max-w-md mx-auto flex gap-3">
          <div className="flex items-center gap-1 bg-muted rounded-xl px-2 py-1 flex-shrink-0">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className={cn(
                "p-2 touch-manipulation rounded-lg transition-colors active:scale-95",
                quantity <= 1 ? "text-muted-foreground/50" : "text-foreground/90 hover:bg-background/60"
              )}
              aria-label="Disminuir cantidad"
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="font-bold text-base px-3 min-w-[2.5rem] text-center">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(1)}
              className="p-2 touch-manipulation rounded-lg transition-colors text-foreground/90 hover:bg-background/60 active:scale-95"
              aria-label="Aumentar cantidad"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <Button
            onClick={handleCartAction}
            disabled={!isInStock || isAddingToCart}
            size="lg"
            className={cn(
              "flex-1 h-12",
              showAddedFeedback && "bg-green-600"
            )}
          >
            {showAddedFeedback ? (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                {cartItem ? 'Actualizado' : 'Agregado'}
              </span>
            ) : (
              <span className="flex items-center gap-2 text-sm">
                <ShoppingCart className="w-4 h-4" />
                {cartItem ? 'Actualizar' : 'Agregar'}
                <span className="font-bold">
                  ${formatPrice(productPrice * quantity)}
                </span>
              </span>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
