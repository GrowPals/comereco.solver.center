
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/routes.config';

const FAB = () => {
  return (
    <Button
      asChild
      size="icon"
      className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom)+0.75rem)] z-40 mx-auto h-14 w-14 rounded-full shadow-soft-md lg:hidden"
      aria-label="Ir al catálogo para crear una requisición"
    >
      <Link to={ROUTES.CATALOG}>
        <Plus className="h-6 w-6" />
      </Link>
    </Button>
  );
};

export default FAB;
