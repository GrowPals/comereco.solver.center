
import React, { useState, useEffect, useCallback, memo } from 'react';
import { Heart, Plus, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
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

  const handleCardClick = useCallback(() => {
    // Navegación a detalles del producto (a implementar)
    // navigate(`/products/${product.id}`);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  }, [handleCardClick]);

  const productName = product.name || product.nombre || 'Producto sin nombre';
  const productPrice = (product.price || product.precio || 0).toFixed(2);
  const productCategory = product.category || product.categoria || 'Sin categoría';

  return (
    <article
      className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-blue-300 hover:shadow-xl md:hover:-translate-y-2 transition-all duration-300 cursor-pointer h-full flex flex-col md:flex-col"
      role="article"
      aria-label={`Producto ${productName}, precio ${productPrice} pesos, categoría ${productCategory}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={handleCardClick}
    >
      {/* Accent line on hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

      {/* Layout Mobile: Horizontal compacto */}
      <div className="md:hidden flex flex-row gap-3 p-3">
        {/* Imagen del producto - 16:9 en mobile */}
        <div className="relative w-32 h-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg overflow-hidden flex-shrink-0">
          <OptimizedImage
            src={product.image_url || product.image}
            alt={`Imagen de ${productName}`}
            fallback="/placeholder.png"
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Category badge - versión mobile */}
          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-white/90 backdrop-blur-sm">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
              {productCategory}
            </p>
          </div>
        </div>

        {/* Info del producto - Mobile */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-sm line-clamp-2 leading-tight">
              {productName}
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-900">
                ${productPrice}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mt-2">
            {/* Botón de favorito - Mobile */}
            <button
              onClick={handleToggleFavorite}
              className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-all duration-200 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label={isFavorite ? `Quitar ${productName} de favoritos` : `Añadir ${productName} a favoritos`}
              aria-pressed={isFavorite}
            >
              <Heart
                className={cn(
                  'w-4 h-4 transition-all duration-200',
                  isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400'
                )}
                aria-hidden="true"
              />
            </button>

            {/* Botón agregar al carrito - Mobile */}
            <button
              onClick={handleAddToCart}
              disabled={isAdding || isAdded}
              className={cn(
                'flex-1 h-8 px-4 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold transition-all duration-200 active:scale-95',
                isAdded
                  ? 'bg-gradient-accent text-white'
                  : 'bg-gradient-primary text-white',
                (isAdding || isAdded) && 'cursor-default'
              )}
              aria-label={isAdded ? `${productName} ya está en el carrito` : `Añadir ${productName} al carrito`}
              aria-disabled={isAdding || isAdded}
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : isAdded ? (
                <>
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>Agregado</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Agregar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Layout Desktop: Vertical (diseño original) */}
      <div className="hidden md:flex md:flex-col h-full">
        {/* Imagen del producto */}
        <div className="relative aspect-square bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
          <OptimizedImage
            src={product.image_url || product.image}
            alt={`Imagen de ${productName}`}
            fallback="/placeholder.png"
            loading="lazy"
            className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-500 ease-out"
          />

          {/* Botón de favorito */}
          <button
            onClick={handleToggleFavorite}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            aria-label={isFavorite ? `Quitar ${productName} de favoritos` : `Añadir ${productName} a favoritos`}
            aria-pressed={isFavorite}
          >
            <Heart
              className={cn(
                'w-5 h-5 transition-all duration-200',
                isFavorite ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-400 hover:text-red-500 hover:scale-110'
              )}
              aria-hidden="true"
            />
          </button>

          {/* Category badge */}
          <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              {productCategory}
            </p>
          </div>
        </div>

        {/* Info del producto */}
        <div className="p-5 space-y-3 flex-1 flex flex-col">
          <h3 className="font-bold text-slate-900 text-base line-clamp-2 min-h-[3rem] leading-tight">
            {productName}
          </h3>

          <div className="flex items-center justify-between pt-3 mt-auto border-t border-slate-100">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-medium mb-0.5">Precio</span>
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                ${productPrice}
              </span>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={isAdding || isAdded}
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 shadow-md',
                isAdded
                  ? 'bg-gradient-accent hover:shadow-glow-accent text-white focus-visible:ring-accent-500'
                  : 'bg-gradient-primary hover:shadow-glow-primary text-white focus-visible:ring-primary-500',
                (isAdding || isAdded) && 'cursor-default'
              )}
              aria-label={isAdded ? `${productName} ya está en el carrito` : `Añadir ${productName} al carrito`}
              aria-disabled={isAdding || isAdded}
            >
              {isAdding ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              ) : isAdded ? (
                <Check className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Plus className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
