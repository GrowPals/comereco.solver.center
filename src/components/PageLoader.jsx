import React from 'react';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';

const PageLoader = () => {
  return (
    <div className="flex items-center justify-center h-full w-full bg-background">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 1.5,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      >
        <Building2 className="h-16 w-16 text-primary" />
      </motion.div>
    </div>
  );
};

export default PageLoader;