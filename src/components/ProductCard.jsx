import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, Loader2, Minus, Plus, Trash2, Check, ShoppingCart } from 'lucide-react';

import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/hooks/useFavorites';
import OptimizedImage from '@/components/OptimizedImage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

  // Cleanup del heart animation
  useEffect(() => {
    if (heartAnimation) {
      const timer = setTimeout(() => setHeartAnimation(false), 500);
      return () => clearTimeout(timer);
    }
  }, [heartAnimation]);

  // Cleanup del success feedback
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

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
      setHeartAnimation(true);
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
        .then(() => {
          setShowSuccess(true);
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
    <Card
      interactive
      className={cn(
        'group relative flex w-full flex-col overflow-hidden',
        !isInStock && 'opacity-70 grayscale'
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

        {/* Category Badge */}
        <div className="absolute left-4 top-3 flex flex-wrap gap-2">
          {product.category && (
            <Badge variant="secondary" className="bg-white/95 dark:bg-card/95">
              {product.category}
            </Badge>
          )}
        </div>

        {/* Cart Counter Badge */}
        {currentQuantity > 0 && (
          <div
            className="absolute left-4 bottom-3 flex items-center gap-1.5 rounded-xl bg-primary-500 px-3 py-1.5 animate-in fade-in zoom-in duration-200"
            aria-label={`${currentQuantity} ${currentQuantity === 1 ? 'item' : 'items'} en carrito`}
          >
            <ShoppingCart className="h-3.5 w-3.5 text-white" aria-hidden="true" />
            <span className="text-xs font-bold text-white tabular-nums">
              {currentQuantity}
            </span>
          </div>
        )}

        {/* Favorite Button - Sin círculo, icono plano */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          className={cn(
            "absolute right-4 top-3 flex items-center justify-center p-2 rounded-xl transition-all duration-base ease-smooth-out hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-95",
            isFavorite
              ? "bg-red-50/95 dark:bg-red-950/50"
              : "bg-white/95 hover:bg-red-50/95 dark:bg-card/95 dark:hover:bg-red-950/30"
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
              'h-5 w-5 transition-all duration-base ease-smooth-out',
              heartAnimation && 'animate-heart-bounce',
              isFavorite ? 'fill-red-400 text-red-400 dark:fill-red-300 dark:text-red-300' : 'text-rose-300 dark:text-rose-400'
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
          <h3 className="line-clamp-2 heading-5 transition-colors group-hover:text-primary">
            {productName}
          </h3>
        </button>

        {/* Stock Badge */}
        <div className="flex items-center gap-2">
          <Badge
            variant={isInStock ? 'success' : 'destructive'}
            className="font-semibold"
          >
            {availabilityLabel}
          </Badge>
          {Number.isFinite(stock) && (
            <span className="text-sm text-muted-foreground">{stock} pzas</span>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between gap-4">
          {/* Price Section */}
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-4">
            <span className="caption text-muted-foreground">
              Precio
            </span>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <p className="price-large bg-gradient-to-br from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                ${productPrice}
              </p>
              {unitLabel && (
                <span className="text-muted-foreground">/ {unitLabel}</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {currentQuantity === 0 ? (
            <Button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding || !isInStock}
              variant={showSuccess ? "success" : "primary"}
              className="w-full rounded-xl"
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
            </Button>
          ) : (
            <div className="flex w-full items-center justify-between gap-3 rounded-xl bg-muted/40 dark:bg-muted/20 p-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleDecrease}
                className={cn(
                  "h-11 w-11 rounded-xl",
                  currentQuantity === 1
                    ? "text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    : "text-muted-foreground hover:text-foreground"
                )}
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
              </Button>
              <span
                className="flex h-11 min-w-[3.25rem] items-center justify-center rounded-xl bg-background px-3 text-center text-base font-semibold text-foreground"
                aria-label={`Cantidad seleccionada: ${currentQuantity}`}
              >
                {currentQuantity}
              </span>
              <Button
                type="button"
                variant="primary"
                size="icon"
                onClick={handleIncrease}
                className="h-11 w-11 rounded-xl"
                aria-label={`Aumentar cantidad de ${productName}`}
              >
                <Plus className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
