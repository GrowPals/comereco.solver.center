import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, Loader2, Minus, Plus, Trash2, Check, ShoppingCart } from 'lucide-react';

import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/hooks/useFavorites';
import OptimizedImage from '@/components/OptimizedImage';
import { cn } from '@/lib/utils';

const ProductCard = memo(({ product }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { addToCart, getItemQuantity, updateQuantity, removeFromCart } = useCart();
  const { favorites, toggleFavorite } = useFavorites();

  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentQuantity, setCurrentQuantity] = useState(0);
  const [heartAnimation, setHeartAnimation] = useState(false);

  const isFavorite = Array.isArray(favorites) && favorites.includes(product.id);

  useEffect(() => {
    const quantity = getItemQuantity(product.id);
    setCurrentQuantity(quantity);
  }, [getItemQuantity, product.id]);

  const productName = product.name || product.nombre || 'Producto sin nombre';
  const unitLabel = product.unit || product.unidad || '';
  const productPrice = Number(product.price || product.precio || 0).toFixed(2);
  const stock = Number.isFinite(product.stock) ? product.stock : product.existencias;
  const isInStock = stock === undefined ? true : stock > 0;
  const availabilityLabel = isInStock ? 'DISPONIBLE' : 'SIN STOCK';

  const handleNavigate = useCallback(() => {
    navigate(`/products/${product.id}`, {
      state: { from: location.pathname },
    });
  }, [navigate, product.id, location.pathname]);

  const handleToggleFavorite = useCallback(
    (event) => {
      event.stopPropagation();
      setHeartAnimation(true);
      toggleFavorite(product.id, productName);
      setTimeout(() => setHeartAnimation(false), 500);
    },
    [toggleFavorite, product.id, productName]
  );

  const handleAddToCart = useCallback(
    (event) => {
      event.stopPropagation();
      if (currentQuantity > 0 || !isInStock) return;
      setIsAdding(true);
      Promise.resolve()
        .then(() => addToCart(product))
        .then(() => {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);
        })
        .finally(() => setIsAdding(false));
    },
    [addToCart, currentQuantity, isInStock, product]
  );

  const handleIncrease = useCallback(
    (event) => {
      event.stopPropagation();
      updateQuantity(product.id, currentQuantity + 1);
    },
    [updateQuantity, product.id, currentQuantity]
  );

  const handleDecrease = useCallback(
    (event) => {
      event.stopPropagation();
      if (currentQuantity <= 1) {
        removeFromCart(product.id);
      } else {
        updateQuantity(product.id, currentQuantity - 1);
      }
    },
    [removeFromCart, updateQuantity, product.id, currentQuantity]
  );

  return (
    <article
      className={cn(
        'group relative flex w-full flex-col overflow-hidden rounded-3xl surface-card transition-all duration-base ease-smooth-out hover:shadow-elevated hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:hover:shadow-elevated',
        !isInStock && 'opacity-70 grayscale-[0.3]'
      )}
      role="article"
      aria-label={`Producto ${productName}, precio ${productPrice} pesos${!isInStock ? ', sin stock' : ''}`}
    >
      <div className="relative w-full overflow-hidden">
        <button
          type="button"
          onClick={handleNavigate}
          className="block w-full overflow-hidden"
          disabled={!isInStock}
        >
          <OptimizedImage
            src={product.image_url || product.image}
            alt={`Imagen de ${productName}`}
            fallback="/placeholder.svg"
            loading="lazy"
            className="aspect-video w-full object-cover transition-transform duration-slow ease-smooth-out group-hover:scale-105 bg-neutral-100 dark:bg-[#0e1f3c]"
          />
        </button>

        <div className="absolute left-4 top-3 flex flex-wrap gap-2">
          {product.category && (
            <span className="rounded-full border border-white/60 bg-white/95 px-3 py-1 caption shadow-sm backdrop-blur-sm text-neutral-900 dark:border-white/20 dark:bg-white/10 dark:text-white">
              {product.category}
            </span>
          )}
        </div>

        {/* Contador de items en carrito */}
        {currentQuantity > 0 && (
          <div
            className="absolute left-4 bottom-3 flex items-center gap-1.5 rounded-full bg-primary-600 px-3 py-1.5 shadow-lg animate-in fade-in zoom-in duration-200"
            aria-label={`${currentQuantity} ${currentQuantity === 1 ? 'item' : 'items'} en carrito`}
          >
            <ShoppingCart className="h-3.5 w-3.5 text-white" aria-hidden="true" />
            <span className="text-xs font-bold text-white tabular-nums">
              {currentQuantity}
            </span>
          </div>
        )}

        {/* Botón de favoritos mejorado */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          className={cn(
            "absolute right-4 top-3 flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition-all duration-base ease-smooth-out hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-95",
            isFavorite
              ? "border-red-500 bg-red-50 text-red-600 hover:scale-105 dark:border-red-400 dark:bg-red-950/50 dark:text-red-400"
              : "border-border bg-white text-muted-foreground hover:border-red-300 hover:bg-red-50 hover:text-red-500 hover:scale-105 dark:border-border dark:bg-card/90 dark:hover:border-red-400/50 dark:hover:bg-red-950/30"
          )}
          aria-label={
            isFavorite
              ? `Quitar ${productName} de favoritos`
              : `Añadir ${productName} a favoritos`
          }
          aria-pressed={isFavorite}
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-all duration-base ease-smooth-out',
              heartAnimation && 'animate-heart-bounce',
              isFavorite && 'fill-current'
            )}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <button
          type="button"
          onClick={handleNavigate}
          className="text-left"
        >
          <h3 className="line-clamp-2 heading-5 transition-colors group-hover:text-primary-600 min-h-[3.5rem] md:min-h-[3.75rem]">
            {productName}
          </h3>
        </button>
        <p className="text-secondary-sm">
          <span className={cn(
            'font-semibold',
            isInStock ? 'text-success' : 'text-error uppercase'
          )}>
            {availabilityLabel}
          </span>
          {Number.isFinite(stock) && (
            <span className="text-muted-foreground">{` · ${stock} pzas`}</span>
          )}
        </p>

        <div className="flex flex-1 flex-col justify-between gap-4">
          <div className="rounded-xl bg-muted/40 p-3 dark:bg-muted/20">
            <span className="caption">
              Precio
            </span>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <p className="price-large text-emerald-600 dark:text-emerald-400">
                ${productPrice}
              </p>
              {unitLabel && (
                <span className="text-muted-foreground">/ {unitLabel}</span>
              )}
            </div>
          </div>

          {currentQuantity === 0 ? (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding || !isInStock}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-base font-semibold text-white transition-all duration-base ease-smooth-out active:scale-[0.98]',
                showSuccess
                  ? 'bg-success hover:bg-success/90'
                  : isInStock
                    ? 'bg-primary-600 hover:bg-primary-700 hover:shadow-button'
                    : 'cursor-not-allowed bg-muted/60 text-muted-foreground'
              )}
            >
              {isAdding ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : showSuccess ? (
                <>
                  <Check className="h-5 w-5 animate-[checkBounce_0.5s_ease-in-out]" aria-hidden="true" />
                  Agregado
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" aria-hidden="true" />
                  Agregar
                </>
              )}
            </button>
          ) : (
            <div className="flex w-full h-[52px] items-center justify-between gap-3 rounded-2xl surface-card p-2">
              <button
                type="button"
                onClick={handleDecrease}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-transparent bg-[var(--surface-contrast)] text-muted-foreground transition-colors hover:border-error/40 hover:bg-error/10 hover:text-error active:scale-95 dark:bg-[rgba(16,32,60,0.85)]"
                aria-label={
                  currentQuantity === 1
                    ? `Quitar ${productName} del carrito`
                    : `Disminuir cantidad de ${productName}`
                }
              >
                {currentQuantity === 1 ? (
                  <Trash2 className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Minus className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
              <span
                className="flex h-11 min-w-[3.25rem] items-center justify-center rounded-xl bg-card px-3 text-center text-base font-semibold text-foreground"
                aria-label={`Cantidad seleccionada: ${currentQuantity}`}
              >
                {currentQuantity}
              </span>
              <button
                type="button"
                onClick={handleIncrease}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white transition-colors hover:bg-primary-700 active:scale-95"
                aria-label={`Aumentar cantidad de ${productName}`}
              >
                <Plus className="h-5 w-5" aria-hidden="true" />
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
