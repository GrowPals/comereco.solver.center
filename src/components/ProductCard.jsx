
import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { Heart, Plus, Loader2, Minus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/hooks/useFavorites';
import OptimizedImage from '@/components/OptimizedImage';

const ProductCard = memo(({ product }) => {
  const { addToCart, getItemQuantity, updateQuantity, removeFromCart } = useCart();
  const { favorites, toggleFavorite } = useFavorites();

  const [isAdding, setIsAdding] = useState(false);
  const [currentQuantity, setCurrentQuantity] = useState(0);
  const [justInteracted, setJustInteracted] = useState(false);
  const feedbackTimeoutRef = useRef(null);

  const isFavorite = Array.isArray(favorites) && favorites.includes(product.id);

  useEffect(() => {
    const quantity = getItemQuantity(product.id);
    setCurrentQuantity(quantity);
  }, [getItemQuantity, product.id]);

  useEffect(() => () => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
  }, []);

  const triggerFeedback = useCallback(() => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    setJustInteracted(true);
    feedbackTimeoutRef.current = setTimeout(() => {
      setJustInteracted(false);
    }, 650);
  }, []);

  const handleAddToCart = useCallback(
    (event) => {
      event.stopPropagation();
      if (currentQuantity > 0) return;
      setIsAdding(true);
      setTimeout(() => {
        addToCart(product);
        setIsAdding(false);
        triggerFeedback();
      }, 260);
    },
    [currentQuantity, addToCart, product, triggerFeedback]
  );

  const handleIncrease = useCallback(
    (event) => {
      event.stopPropagation();
      updateQuantity(product.id, currentQuantity + 1);
      triggerFeedback();
    },
    [updateQuantity, product.id, currentQuantity, triggerFeedback]
  );

  const handleDecrease = useCallback(
    (event) => {
      event.stopPropagation();
      if (currentQuantity <= 1) {
        removeFromCart(product.id);
      } else {
        updateQuantity(product.id, currentQuantity - 1);
      }
      triggerFeedback();
    },
    [updateQuantity, removeFromCart, product.id, currentQuantity, triggerFeedback]
  );

  const handleToggleFavorite = useCallback(
    (event) => {
      event.stopPropagation();
      toggleFavorite(product.id, product.name || product.nombre);
    },
    [toggleFavorite, product.id, product.name]
  );

  const productName = product.name || product.nombre || 'Producto sin nombre';
  const productPrice = Number(product.price || product.precio || 0).toFixed(2);
  const productCategory = product.category || product.categoria || 'Sin categoría';
  const productAvailability = product.availability || product.disponibilidad;
  const stock = Number.isFinite(product.stock) ? product.stock : product.existencias;
  const isInStock = stock === undefined ? true : stock > 0;

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 md:rounded-3xl md:hover:-translate-y-1 md:hover:shadow-xl md:focus-within:-translate-y-1 md:focus-within:shadow-xl',
        justInteracted && 'border-emerald-300 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]'
      )}
      role="article"
      aria-label={`Producto ${productName}, precio ${productPrice} pesos`}
    >
      <div className="relative overflow-hidden">
        <OptimizedImage
          src={product.image_url || product.image}
          alt={`Imagen de ${productName}`}
          fallback="/placeholder.svg"
          loading="lazy"
          className="aspect-[3/4] w-full object-cover transition-transform duration-500 md:aspect-[4/5] md:group-hover:scale-105"
        />

        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2 md:left-4 md:top-4">
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 shadow-sm backdrop-blur md:text-xs">
            {productCategory}
          </span>
          {productAvailability && (
            <span className="rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm md:text-xs">
              {productAvailability}
            </span>
          )}
        </div>

        <button
          onClick={handleToggleFavorite}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-lg transition-all duration-200 hover:text-red-500 md:right-4 md:top-4 md:h-10 md:w-10"
          aria-label={isFavorite ? `Quitar ${productName} de favoritos` : `Añadir ${productName} a favoritos`}
          aria-pressed={isFavorite}
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-all duration-200 md:h-5 md:w-5',
              isFavorite ? 'scale-110 fill-red-500 text-red-500' : 'md:group-hover:scale-105'
            )}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3.5 md:gap-4 md:p-4">
        <div className="space-y-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 md:text-base">
            {productName}
          </h3>
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide md:text-xs">
            <span className={cn('rounded-full px-2 py-0.5', isInStock ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500')}>
              {isInStock ? 'Disponible' : 'Sin stock'}
            </span>
            {Number.isFinite(stock) && (
              <span className="text-slate-500">{stock} pzas</span>
            )}
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3 md:gap-4">
          <div className="flex items-end justify-between gap-3 md:gap-4">
            <div className="space-y-0.5 md:space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500 md:text-xs">Precio</span>
              <p className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
                ${productPrice}
              </p>
            </div>
            {product.unit && (
              <span className="text-[11px] font-semibold text-slate-500 md:text-xs">{product.unit}</span>
            )}
          </div>

          {currentQuantity === 0 ? (
            <button
              onClick={handleAddToCart}
              disabled={isAdding || !isInStock}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] md:rounded-2xl md:py-3 md:text-base',
                isInStock ? 'hover:bg-emerald-600' : 'cursor-not-allowed bg-slate-200 text-slate-500'
              )}
              aria-disabled={isAdding || !isInStock}
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin md:h-5 md:w-5" aria-hidden="true" />
              ) : (
                <>
                  <Plus className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
                  Agregar
                </>
              )}
            </button>
          ) : (
            <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 md:gap-3 md:rounded-2xl md:p-2">
              <button
                onClick={handleDecrease}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent bg-white text-slate-600 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95 md:h-10 md:w-10 md:rounded-xl"
                aria-label={currentQuantity === 1 ? `Quitar ${productName} del carrito` : `Disminuir cantidad de ${productName}`}
              >
                {currentQuantity === 1 ? <Trash2 className="h-4 w-4" aria-hidden="true" /> : <Minus className="h-4 w-4" aria-hidden="true" />}
              </button>
              <span
                className="min-w-[2.75rem] rounded-lg bg-white px-2.5 py-2 text-center text-sm font-bold text-slate-900 md:min-w-[3.5rem] md:rounded-xl md:px-3 md:text-base"
                aria-label={`Cantidad seleccionada: ${currentQuantity}`}
              >
                {currentQuantity}
              </span>
              <button
                onClick={handleIncrease}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white transition-all duration-200 hover:bg-emerald-600 hover:shadow-md active:scale-95 md:h-10 md:w-10 md:rounded-xl"
                aria-label={`Aumentar cantidad de ${productName}`}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
