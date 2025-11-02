
import React from 'react';
import { Button } from './ui/button';
import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';

const HeroCard = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[var(--neutral-100)] via-[var(--neutral-90)] to-[var(--neutral-80)] rounded-2xl p-8 shadow-card min-h-[200px] flex items-center">
      {/* Content */}
      <div className="relative z-10 w-2/3 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/20 border border-yellow-400/40 rounded-full">
          <Tag className="w-3.5 h-3.5 text-yellow-400" />
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider">
            BLACK FRIDAY
          </p>
        </div>

        <div>
          <h2 className="text-5xl font-black text-yellow-400 leading-none mb-2">
            20% off
          </h2>
          <p className="text-white text-base font-medium">
            en todos los productos
          </p>
        </div>

        <Button
          className="bg-yellow-400 hover:bg-yellow-500 text-[var(--neutral-100)] font-bold rounded-xl px-6 py-3 shadow-[0_4px_12px_rgba(250,204,21,0.4)] hover:shadow-[0_6px_16px_rgba(250,204,21,0.5)]"
          size="sm"
        >
          Obtener Descuento
        </Button>
      </div>

      {/* Animated 3D Element */}
      <motion.div
        className="absolute -right-8 -bottom-6 w-52 h-52 opacity-90"
        initial={{ rotate: -15, scale: 0.9, y: 15 }}
        animate={{ rotate: 10, scale: 1, y: 0 }}
        transition={{
          repeat: Infinity,
          repeatType: "reverse",
          duration: 3,
          ease: "easeInOut"
        }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-[180px] font-black text-yellow-400/30 leading-none">
            %
          </div>
        </div>
      </motion.div>

      {/* Decorative circles */}
      <div className="absolute top-4 right-20 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-8 right-40 w-32 h-32 bg-yellow-400/5 rounded-full blur-3xl"></div>
    </div>
  );
};

export default HeroCard;
