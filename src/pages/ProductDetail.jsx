import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
const fetchRelatedProducts = async (categoryId, currentProductId, companyId, limit = 8) => {
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
      .limit(10);

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
    console.error('Error fetching history:', error);
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
        "flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200",
        className
      )}>
        <Package className="w-24 h-24 text-slate-400" />
      </div>
    );
  }

  return (
    <div className="relative">
      {imageLoading && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center bg-slate-100 animate-pulse",
          className
        )}>
          <Package className="w-20 h-20 text-slate-300 animate-pulse" />
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

// Componente de productos relacionados
function RelatedProducts({ products, currentProductId }) {
  const navigate = useNavigate();
  const { items: cart, addToCart } = useCart();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollContainerRef = useRef(null);

  if (!products || products.length === 0) return null;

  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = scrollPosition < products.length - 1;

  const scrollToPosition = (direction) => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const cardWidth = container.firstChild?.offsetWidth || 0;
    const gap = 16;
    const scrollAmount = cardWidth + gap;

    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      setScrollPosition(Math.max(0, scrollPosition - 1));
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setScrollPosition(Math.min(products.length - 1, scrollPosition + 1));
    }
  };

  // Funciones para drag-to-scroll
  const handleMouseDown = (e) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    scrollContainerRef.current.style.cursor = 'grabbing';
    scrollContainerRef.current.style.userSelect = 'none';
  };

  const handleMouseUp = () => {
    // Usar timeout para evitar clicks inmediatos después del drag
    setTimeout(() => setIsDragging(false), 100);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
      scrollContainerRef.current.style.userSelect = 'auto';
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Multiplicador para hacer el scroll más sensible
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setTimeout(() => setIsDragging(false), 100);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.style.cursor = 'grab';
        scrollContainerRef.current.style.userSelect = 'auto';
      }
    }
  };

  const handleQuickAdd = (e, product) => {
    e.stopPropagation();
    // Evitar agregar al carrito si se está arrastrando
    if (isDragging) return;
    addToCart({
      ...product,
      quantity: 1
    });
  };

  const handleProductClick = (productId) => {
    // Evitar navegación si se está arrastrando
    if (isDragging) return;
    navigate(`/producto/${productId}`);
  };

  return (
    <div className="mt-12 pt-8 border-t">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Productos relacionados</h3>
          <p className="text-sm text-slate-500 mt-1">Otros productos que te pueden interesar</p>
        </div>
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => scrollToPosition('left')}
            disabled={!canScrollLeft}
            className={cn(
              "p-2 rounded-full transition-all",
              canScrollLeft
                ? "bg-white border shadow-sm hover:shadow-md text-slate-700"
                : "bg-slate-100 text-slate-300 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scrollToPosition('right')}
            disabled={!canScrollRight}
            className={cn(
              "p-2 rounded-full transition-all",
              canScrollRight
                ? "bg-white border shadow-sm hover:shadow-md text-slate-700"
                : "bg-slate-100 text-slate-300 cursor-not-allowed"
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className={cn(
          "flex gap-4 overflow-x-auto scrollbar-hide pb-4 select-none",
          isDragging ? "cursor-grabbing snap-none" : "cursor-grab snap-x snap-mandatory"
        )}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {products.map((product) => {
          const productName = product.name || product.nombre;
          const productPrice = product.price || product.precio || 0;
          const productUnit = product.unit || product.unidad || 'Pieza';
          const inCart = cart?.find(item => item.id === product.id);
          const stock = Number.isFinite(product.stock) ? product.stock : product.existencias;
          const isInStock = stock === undefined || stock === null ? true : stock > 0;

          return (
            <motion.div
              key={product.id}
              className="flex-shrink-0 w-[280px] md:w-[250px] snap-start"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className="h-full p-4 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => handleProductClick(product.id)}
              >
                <div className="aspect-[4/3] mb-4 overflow-hidden rounded-lg bg-slate-50">
                  <ProductImage
                    src={product.image_url}
                    alt={productName}
                    className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h4 className="font-semibold text-sm line-clamp-2 mb-2 min-h-[40px]">
                  {productName}
                </h4>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-emerald-600 font-bold text-lg">
                      ${productPrice.toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                    <p className="text-xs text-slate-500">{productUnit}</p>
                  </div>
                  {isInStock && (
                    <Badge variant="secondary" className="text-xs">
                      Disponible
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={inCart ? "secondary" : "default"}
                  className="w-full"
                  onClick={(e) => handleQuickAdd(e, product)}
                  disabled={!isInStock}
                >
                  {inCart ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      En carrito ({inCart.quantity})
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Plus className="w-4 h-4" />
                      Agregar
                    </span>
                  )}
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>
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
      setTimeout(() => setShowAddedFeedback(false), 2000);
    } catch (error) {
      console.error('Error al actualizar carrito:', error);
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
      <div className="min-h-screen bg-slate-50">
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Producto no disponible
          </h2>
          <p className="text-slate-600">
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

  // Lógica de stock - igual que en ProductCard
  const stock = Number.isFinite(product.stock) ? product.stock : product.existencias;
  const isInStock = stock === undefined || stock === null ? true : stock > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 lg:pb-8"
    >
      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Botón de volver - sin barra, parte del fondo */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
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
            <div className="aspect-[16/9] lg:aspect-[4/3] rounded-2xl overflow-hidden bg-white shadow-lg">
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
                "absolute top-4 right-4 p-2.5 rounded-full transition-all shadow-lg backdrop-blur-sm",
                isFavorite
                  ? "bg-white/95 text-red-500 hover:bg-red-50"
                  : "bg-white/95 text-slate-600 hover:bg-slate-100"
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
                <span className="text-sm text-slate-500 font-mono">
                  SKU: {productSku}
                </span>
              )}
            </div>

            {/* Nombre del producto */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
              {productName}
            </h1>

            {/* Precio y disponibilidad */}
            <div className="space-y-3 p-5 bg-slate-50 rounded-xl">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-emerald-600">
                  ${productPrice.toLocaleString('es-MX', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
                <span className="text-lg text-slate-600">/ {productUnit}</span>
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
                  <span className="text-sm text-slate-600">
                    {stock} unidades
                  </span>
                )}
              </div>
            </div>

            {/* Controles de cantidad y carrito */}
            <div className="space-y-4 p-5 bg-white border-2 border-slate-200 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Cantidad
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                      "border-2 hover:scale-110",
                      quantity <= 1
                        ? "border-slate-200 text-slate-300 cursor-not-allowed"
                        : "border-slate-300 text-slate-700 hover:border-emerald-500 hover:bg-emerald-50"
                    )}
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 h-10 text-center font-bold text-lg border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />

                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all
                             border-2 border-slate-300 text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 hover:scale-110"
                  >
                    <Plus className="w-4 h-4" />
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
                <h3 className="text-lg font-semibold text-slate-900">Descripción</h3>
                <p className="text-slate-600 leading-relaxed">
                  {productDescription}
                </p>
              </div>
            )}

            {/* Historial de pedidos */}
            {orderHistory && (
              <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Tu historial con este producto</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4" />
                      Última compra
                    </div>
                    <p className="font-semibold text-slate-900">
                      {new Date(orderHistory.last_ordered).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <TrendingUp className="w-4 h-4" />
                      Cantidad promedio
                    </div>
                    <p className="font-semibold text-slate-900">
                      {Math.round(orderHistory.average_quantity)} {productUnit}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Package className="w-4 h-4" />
                      Total comprado
                    </div>
                    <p className="font-semibold text-slate-900">
                      {orderHistory.total_ordered} {productUnit}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <RefreshCw className="w-4 h-4" />
                      Veces pedido
                    </div>
                    <p className="font-semibold text-slate-900">
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
      </div>

      {/* Botón flotante en móvil - mejorado */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t lg:hidden shadow-2xl">
        <div className="max-w-md mx-auto flex gap-3">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 flex-shrink-0">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className={cn(
                "p-1.5",
                quantity <= 1 ? "text-slate-300" : "text-slate-700"
              )}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-bold text-base px-2 min-w-[2rem] text-center">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(1)}
              className="p-1.5 text-slate-700"
            >
              <Plus className="w-4 h-4" />
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
                  ${(productPrice * quantity).toLocaleString('es-MX', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </span>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}