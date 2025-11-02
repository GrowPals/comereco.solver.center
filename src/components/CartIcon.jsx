import React from 'react';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';

export function CartIcon() {
  const { getItemCount, toggleCart } = useCart();
  const itemCount = getItemCount();

  return (
    <Button onClick={toggleCart} variant="ghost" size="icon" className="relative">
      <ShoppingCart className="h-6 w-6" />
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.span 
            initial={{ scale: 0, y: 10, x: 10 }}
            animate={{ scale: 1, y: 0, x: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
          >
            {itemCount}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}