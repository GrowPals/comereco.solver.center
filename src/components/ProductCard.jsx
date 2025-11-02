
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
      className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-primary-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group h-full flex flex-col"
      role="article"
      aria-label={`Producto ${productName}, precio ${productPrice} pesos, categoría ${productCategory}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={handleCardClick}
    >
      {/* Imagen del producto */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <OptimizedImage
          src={product.image_url || product.image}
          alt={`Imagen de ${productName}`}
          fallback="/placeholder.png"
          loading="lazy"
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300 ease-out"
        />

        {/* Botón de favorito */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white shadow-sm hover:shadow-md flex items-center justify-center transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          aria-label={isFavorite ? `Quitar ${productName} de favoritos` : `Añadir ${productName} a favoritos`}
          aria-pressed={isFavorite}
        >
          <Heart
            className={cn(
              'w-5 h-5 transition-all duration-150',
              isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-gray-600'
            )}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Info del producto */}
      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 min-h-[2.5rem]">
          {productName}
        </h3>
        <p className="text-xs text-gray-500 uppercase tracking-wide">
          {productCategory}
        </p>
        <div className="flex items-center justify-between pt-2 mt-auto">
          <span className="text-lg font-bold text-gray-900">
            ${productPrice}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={isAdding || isAdded}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
              isAdded
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-primary-500 hover:bg-primary-600 text-white shadow-sm hover:shadow-md',
              (isAdding || isAdded) && 'cursor-default active:scale-100'
            )}
            aria-label={isAdded ? `${productName} ya está en el carrito` : `Añadir ${productName} al carrito`}
            aria-disabled={isAdding || isAdded}
          >
            {isAdding ? (
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            ) : isAdded ? (
              <Check className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Plus className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
