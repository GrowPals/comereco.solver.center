import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const EmptyState = ({ icon, title, description, buttonText, onButtonClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center p-8 bg-card rounded-lg shadow-sm border border-dashed"
    >
      <div className="text-muted-foreground">{icon}</div>
      <h2 className="text-xl font-bold mt-4">{title}</h2>
      <p className="text-muted-foreground mt-2 max-w-sm mx-auto">{description}</p>
      {buttonText && onButtonClick && (
        <Button onClick={onButtonClick} variant="secondary" className="mt-6">
          <Plus className="w-4 h-4 mr-2" /> {buttonText}
        </Button>
      )}
    </motion.div>
  );
};

export default EmptyState;