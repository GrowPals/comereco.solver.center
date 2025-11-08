import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Plus, Package } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/formatters';

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
        "flex items-center justify-center bg-gradient-to-br from-muted/60 to-muted/20 dark:from-card/70 dark:to-card/50",
        className
      )}>
        <Package className="h-24 w-24 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative">
      {imageLoading && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center bg-muted animate-pulse",
          className
        )}>
          <Package className="h-20 w-20 animate-pulse text-muted-foreground/60" />
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
export default function RelatedProducts({ products, currentProductId }) {
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
    navigate(`/products/${productId}`);
  };

  return (
    <div className="mt-12 pt-8 border-t">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-foreground">Productos relacionados</h3>
          <p className="text-sm text-muted-foreground/80 mt-1">Otros productos que te pueden interesar</p>
        </div>
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => scrollToPosition('left')}
            disabled={!canScrollLeft}
            className={cn(
              "p-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
              canScrollLeft
                ? "bg-card border shadow-sm hover:shadow-md text-foreground/90"
                : "bg-muted text-muted-foreground/50 cursor-not-allowed"
            )}
            aria-label="Desplazar productos relacionados a la izquierda"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <button
            onClick={() => scrollToPosition('right')}
            disabled={!canScrollRight}
            className={cn(
              "p-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
              canScrollRight
                ? "bg-card border shadow-sm hover:shadow-md text-foreground/90"
                : "bg-muted text-muted-foreground/50 cursor-not-allowed"
            )}
            aria-label="Desplazar productos relacionados a la derecha"
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
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
                className="h-full p-4 hover:shadow-soft-md hover:shadow-primary-500/10 dark:hover:shadow-primary-500/20 transition-all cursor-pointer group border-border hover:border-primary-300 dark:hover:border-primary-500/40"
                onClick={() => handleProductClick(product.id)}
              >
                <div className="aspect-[4/3] mb-4 overflow-hidden rounded-lg bg-muted/70">
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
                      ${formatPrice(productPrice)}
                    </p>
                    <p className="text-xs text-muted-foreground/80">{productUnit}</p>
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
