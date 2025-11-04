import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, Loader2, Minus, Plus, Trash2 } from 'lucide-react';

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
  const [currentQuantity, setCurrentQuantity] = useState(0);

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
    navigate(`/producto/${product.id}`, {
      state: { from: location.pathname },
    });
  }, [navigate, product.id, location.pathname]);

  const handleToggleFavorite = useCallback(
    (event) => {
      event.stopPropagation();
      toggleFavorite(product.id, productName);
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
        'group relative flex w-[88vw] max-w-[22rem] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:w-full sm:max-w-none'
      )}
      role="article"
      aria-label={`Producto ${productName}, precio ${productPrice} pesos`}
    >
      <div className="relative w-full overflow-hidden">
        <button
          type="button"
          onClick={handleNavigate}
          className="block w-full overflow-hidden"
        >
          <OptimizedImage
            src={product.image_url || product.image}
            alt={`Imagen de ${productName}`}
            fallback="/placeholder.svg"
            loading="lazy"
            className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </button>

        <div className="absolute left-4 top-3 flex flex-wrap gap-2">
          {product.category && (
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm backdrop-blur">
              {product.category}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleToggleFavorite}
          className="absolute right-4 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-lg transition-colors duration-200 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label={
            isFavorite
              ? `Quitar ${productName} de favoritos`
              : `Añadir ${productName} a favoritos`
          }
          aria-pressed={isFavorite}
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              isFavorite && 'scale-110 fill-red-500 text-red-500'
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
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 transition-colors group-hover:text-blue-600">
            {productName}
          </h3>
        </button>
        <p className="text-sm font-medium text-slate-500">
          <span className={cn(isInStock ? 'text-emerald-600' : 'text-slate-400 uppercase')}>
            {availabilityLabel}
          </span>
          {Number.isFinite(stock) && (
            <span className="text-slate-400">{` · ${stock} pzas`}</span>
          )}
        </p>

        <div className="flex flex-1 flex-col justify-between gap-4">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Precio
              </span>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                ${productPrice}
              </p>
            </div>
            {unitLabel && (
              <span className="text-sm font-semibold text-slate-400">{unitLabel}</span>
            )}
          </div>

          {currentQuantity === 0 ? (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding || !isInStock}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-base font-semibold text-white transition-transform active:scale-[0.98]',
                isInStock ? 'hover:bg-blue-700' : 'cursor-not-allowed bg-slate-200 text-slate-500'
              )}
            >
              {isAdding ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  <Plus className="h-5 w-5" aria-hidden="true" />
                  Agregar
                </>
              )}
            </button>
          ) : (
            <div className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2">
              <button
                type="button"
                onClick={handleDecrease}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-transparent bg-white text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95"
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
                className="min-w-[3.25rem] rounded-xl bg-white px-3 py-2 text-center text-base font-semibold text-slate-900"
                aria-label={`Cantidad seleccionada: ${currentQuantity}`}
              >
                {currentQuantity}
              </span>
              <button
                type="button"
                onClick={handleIncrease}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 active:scale-95"
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
