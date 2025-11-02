
import React, { useState, useEffect } from 'react';
import { Heart, Plus, Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';

const ProductCard = ({ product }) => {
  const { addToCart, getItemQuantity } = useCart();
  const { favorites, toggleFavorite } = useFavorites();

  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const isFavorite = Array.isArray(favorites) && favorites.includes(product.id);

  useEffect(() => {
    const quantity = getItemQuantity(product.id);
    setIsAdded(quantity > 0);
  }, [getItemQuantity, product.id]);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (isAdded) return;
    setIsAdding(true);
    setTimeout(() => {
      addToCart(product);
      setIsAdding(false);
      setIsAdded(true);
    }, 500);
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    toggleFavorite(product.id, product.nombre);
  };

  const handleImageError = (e) => {
    e.currentTarget.src = '/placeholder.png';
    e.currentTarget.style.objectFit = 'cover';
  };

  return (
    <motion.div
      className="bg-white rounded-xl overflow-hidden border border-[var(--neutral-10)] shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Imagen del producto */}
      <div className="relative aspect-square bg-[var(--primary-00)] overflow-hidden">
        <img
          src={product.image || '/placeholder.png'}
          alt={product.nombre || 'Imagen del producto'}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          onError={handleImageError}
        />
        {/* Botón de favorito */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white shadow-card hover:shadow-card-hover flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <Heart
            className={cn(
              'w-5 h-5 transition-all duration-300',
              isFavorite ? 'fill-[var(--danger-50)] text-[var(--danger-50)]' : 'text-[var(--neutral-60)]'
            )}
          />
        </button>
      </div>

      {/* Info del producto */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-[var(--neutral-100)] text-sm line-clamp-2 min-h-[2.5rem]">
          {product.nombre}
        </h3>
        <p className="text-xs text-[var(--neutral-60)] uppercase tracking-wide font-medium">
          {product.categoria || 'Sin categoría'}
        </p>
        <div className="flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-[var(--neutral-100)]">
            ${(product.precio || 0).toFixed(2)}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={isAdding || isAdded}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-button hover:shadow-button-hover disabled:opacity-50',
              isAdded
                ? 'bg-[var(--success-50)] hover:bg-[var(--success-hover)] text-white'
                : 'bg-[var(--primary-50)] hover:bg-[var(--primary-60)] text-white hover:scale-110 active:scale-95'
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
    </motion.div>
  );
};

export default ProductCard;
