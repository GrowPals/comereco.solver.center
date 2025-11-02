
import React, { useState, useEffect, useCallback, memo } from 'react';
import { Heart, Plus, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import { useToastNotification } from '@/components/ui/toast-notification';

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

  const handleImageError = useCallback((e) => {
    e.currentTarget.src = '/placeholder.png';
    e.currentTarget.style.objectFit = 'cover';
  }, []);

  return (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-primary-500 hover:shadow-lg transition-all duration-200 cursor-pointer group h-full flex flex-col">
      {/* Imagen del producto */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <img
          src={product.image_url || product.image || '/placeholder.png'}
          alt={product.name || product.nombre || 'Imagen del producto'}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-200"
          onError={handleImageError}
        />

        {/* Botón de favorito */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white shadow-sm hover:shadow-md flex items-center justify-center transition-all duration-150"
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <Heart
            className={cn(
              'w-5 h-5 transition-all duration-150',
              isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-gray-600'
            )}
          />
        </button>
      </div>

      {/* Info del producto */}
      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 min-h-[2.5rem]">
          {product.name || product.nombre}
        </h3>
        <p className="text-xs text-gray-500 uppercase tracking-wide">
          {product.category || product.categoria || 'Sin categoría'}
        </p>
        <div className="flex items-center justify-between pt-2 mt-auto">
          <span className="text-lg font-bold text-gray-900">
            ${(product.price || product.precio || 0).toFixed(2)}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={isAdding || isAdded}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150',
              isAdded
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-primary-500 hover:bg-primary-600 text-white shadow-sm hover:shadow-md',
              (isAdding || isAdded) && 'cursor-default'
            )}
            aria-label={isAdded ? 'Producto añadido' : 'Añadir al carrito'}
          >
            {isAdding ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isAdded ? (
              <Check className="w-5 h-5" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
