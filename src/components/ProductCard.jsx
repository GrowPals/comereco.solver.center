
import React, { useState, useEffect, useCallback, memo } from 'react';
import { Heart, Plus, Check, Loader2, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useToastNotification } from '@/components/ui/toast-notification';
import OptimizedImage from '@/components/OptimizedImage';

const ProductCard = memo(({ product }) => {
  const { addToCart, getItemQuantity } = useCart();
  const { favorites, toggleFavorite } = useFavorites();
  const toast = useToastNotification();

  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const isFavorite = Array.isArray(favorites) && favorites.includes(product.id);

  useEffect(() => {
    const quantity = getItemQuantity(product.id);
    setIsAdded(quantity > 0);
  }, [getItemQuantity, product.id]);

  const handleAddToCart = useCallback((e) => {
    e.stopPropagation();
    if (isAdded) return;
    setIsAdding(true);
    setTimeout(() => {
      addToCart(product);
      setIsAdding(false);
      setIsAdded(true);
      toast.success('¡Producto añadido!', `${product.name || product.nombre} se agregó al carrito`);
    }, 300);
  }, [isAdded, addToCart, product, toast]);

  const handleToggleFavorite = useCallback((e) => {
    e.stopPropagation();
    toggleFavorite(product.id, product.name || product.nombre);
  }, [toggleFavorite, product.id, product.name]);

  // Navegación a detalles de producto - Disponible en versión futura
  // const handleCardClick = useCallback(() => {
  //   navigate(`/products/${product.id}`);
  // }, [navigate, product.id]);

  const productName = product.name || product.nombre || 'Producto sin nombre';
  const productPrice = (product.price || product.precio || 0).toFixed(2);
  const productCategory = product.category || product.categoria || 'Sin categoría';

  return (
    <article
      className="group relative bg-white rounded-xl md:rounded-2xl overflow-hidden border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all duration-300 h-full flex flex-col"
      role="article"
      aria-label={`Producto ${productName}, precio ${productPrice} pesos, categoría ${productCategory}`}
    >
      {/* Imagen del producto */}
      <div className="relative aspect-square bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
        <OptimizedImage
          src={product.image_url || product.image}
          alt={`Imagen de ${productName}`}
          fallback="/placeholder.png"
          loading="lazy"
          className="w-full h-full object-contain p-2 md:p-4 group-hover:scale-105 transition-transform duration-300"
        />

        {/* Botón de favorito - Esquina superior derecha */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-2 right-2 z-10 w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg hover:bg-white flex items-center justify-center transition-all duration-200 active:scale-90"
          aria-label={isFavorite ? `Quitar ${productName} de favoritos` : `Añadir ${productName} a favoritos`}
          aria-pressed={isFavorite}
        >
          <Heart
            className={cn(
              'w-4 h-4 md:w-4.5 md:h-4.5 transition-all duration-200',
              isFavorite ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-400 hover:text-red-500'
            )}
            aria-hidden="true"
          />
        </button>

        {/* Badge de categoría - Solo en desktop */}
        <div className="hidden md:block absolute bottom-2 left-2 px-2 py-1 rounded-md bg-white/90 backdrop-blur-sm shadow-sm">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
            {productCategory}
          </p>
        </div>
      </div>

      {/* Info del producto */}
      <div className="p-2 md:p-4 space-y-2 md:space-y-3 flex-1 flex flex-col">
        {/* Categoría - Solo mobile */}
        <div className="md:hidden">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
            {productCategory}
          </p>
        </div>

        {/* Nombre del producto */}
        <h3 className="font-semibold md:font-bold text-slate-900 text-xs md:text-sm line-clamp-2 leading-snug min-h-[2rem] md:min-h-[2.5rem]">
          {productName}
        </h3>

        {/* Precio y botón de agregar */}
        <div className="flex items-end justify-between gap-2 mt-auto pt-2 border-t border-slate-100">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 font-medium mb-0.5 hidden md:block">Precio</span>
            <span className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
              ${productPrice}
            </span>
          </div>

          {/* Botón agregar al carrito */}
          <button
            onClick={handleAddToCart}
            disabled={isAdding || isAdded}
            className={cn(
              'flex items-center justify-center rounded-lg md:rounded-xl transition-all duration-200 active:scale-95 shadow-md',
              'w-8 h-8 md:w-10 md:h-10',
              isAdded
                ? 'bg-gradient-accent hover:shadow-lg text-white'
                : 'bg-gradient-primary hover:shadow-lg text-white',
              (isAdding || isAdded) && 'cursor-default'
            )}
            aria-label={isAdded ? `${productName} ya está en el carrito` : `Añadir ${productName} al carrito`}
            aria-disabled={isAdding || isAdded}
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" aria-hidden="true" />
            ) : isAdded ? (
              <Check className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
            ) : (
              <Plus className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
