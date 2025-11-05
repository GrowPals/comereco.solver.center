
import React, { memo, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = memo(({
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  const handlePrevious = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, onPageChange]);

  const pageNumbers = useMemo(() => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className={cn('flex items-center justify-center space-x-2 py-6', className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="h-11 w-11 rounded-xl hover:scale-105 transition-transform duration-200 shadow-sm hover:shadow-md"
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      {pageNumbers.map((page, index) =>
        typeof page === 'number' ? (
          <Button
            key={index}
            variant={currentPage === page ? 'default' : 'outline'}
            size="icon"
            onClick={() => onPageChange(page)}
            className="h-11 w-11 rounded-xl hover:scale-105 transition-transform duration-200 shadow-sm hover:shadow-md font-semibold"
            aria-label={`Ir a página ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </Button>
        ) : (
          <span key={index} className="px-3 font-medium select-none text-muted-foreground dark:text-neutral-400">
            {page}
          </span>
        )
      )}
      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="h-11 w-11 rounded-xl hover:scale-105 transition-transform duration-200 shadow-sm hover:shadow-md"
        aria-label="Página siguiente"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
});

Pagination.displayName = 'Pagination';

export default Pagination;
export { Pagination };
