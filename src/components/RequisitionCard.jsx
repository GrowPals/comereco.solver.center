
import React, { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Calendar, Hash, User, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';

const statusAccents = {
  draft: 'bg-muted/90 dark:bg-muted/85',
  submitted: 'bg-amber-500',
  approved: 'bg-gradient-accent',
  rejected: 'bg-red-500',
  ordered: 'bg-gradient-primary',
  cancelled: 'bg-[rgba(239,83,80,0.6)]',
  default: 'bg-muted/90 dark:bg-muted/85',
};

const RequisitionCard = memo(({ requisition }) => {
  const navigate = useNavigate();
  
  // Memoizar accent de estado para la barra superior
  const statusAccent = useMemo(() =>
    statusAccents[requisition?.business_status] || statusAccents.default,
    [requisition?.business_status]
  );

  // Memoizar fecha formateada
  const formattedDate = useMemo(() => {
    if (!requisition?.created_at) return 'N/A';
    try {
      return format(parseISO(requisition.created_at), "dd MMM yyyy", { locale: es });
    } catch {
      return 'N/A';
    }
  }, [requisition?.created_at]);

  // Memoizar monto formateado
  const formattedAmount = useMemo(() =>
    formatCurrency(requisition?.total_amount),
    [requisition?.total_amount]
  );

  const handleCardClick = useCallback(() => {
    if (requisition?.id) {
      navigate(`/requisitions/${requisition.id}`);
    }
  }, [navigate, requisition?.id]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  }, [handleCardClick]);

  if (!requisition) return null;

  return (
    <motion.div
      layout
      whileHover={{ y: -6, transition: { duration: 0.3, ease: 'easeOut' } }}
      className="w-full"
    >
      <Card
        interactive
        className="w-full group relative overflow-hidden cursor-pointer border-2 shadow-soft-md transition-all duration-300 hover:shadow-soft-lg"
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Requisición ${requisition.internal_folio || requisition.id}`}
      >
        {/* Accent Bar */}
        <div className={cn('absolute top-0 left-0 right-0 h-1 transition-transform duration-300', statusAccent)} />

        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Folio Section */}
            <div className="flex items-center gap-4 md:min-w-[200px]">
              <div className="icon-badge flex h-14 w-14 items-center justify-center">
                <Hash className="h-7 w-7 text-primary-600 dark:text-primary-100" aria-hidden="true" />
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Folio</p>
                <p className="text-xl font-bold text-foreground">{requisition.internal_folio || 'N/A'}</p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Solicitante */}
              <div className="flex items-center gap-3">
                <div className="icon-badge flex h-10 w-10 items-center justify-center text-muted-foreground">
                  <User className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="mb-0.5 text-xs font-medium text-muted-foreground">Solicitante</p>
                  <p className="truncate text-sm font-semibold text-foreground">{requisition.creator?.full_name || 'No disponible'}</p>
                </div>
              </div>

              {/* Fecha */}
              <div className="flex items-center gap-3">
                <div className="icon-badge flex h-10 w-10 items-center justify-center text-muted-foreground">
                  <Calendar className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="mb-0.5 text-xs font-medium text-muted-foreground">Fecha</p>
                  <p className="text-sm font-semibold text-foreground">{formattedDate}</p>
                </div>
              </div>

              {/* Monto */}
              <div className="flex items-center gap-3">
              <div className="icon-badge flex h-10 w-10 items-center justify-center text-success dark:text-success-light">
                  <DollarSign className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="mb-0.5 text-xs font-medium text-muted-foreground">Monto Total</p>
                  <p className="text-lg font-bold tracking-tight text-foreground">{formattedAmount}</p>
                </div>
              </div>
            </div>

            {/* Status Badge & Action */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:ml-auto">
              <Badge status={requisition.business_status} />
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick();
                }}
                className="rounded-xl text-primary-600 transition-transform duration-200 hover:bg-primary/10 hover:text-primary-700 group-hover:translate-x-1 dark:hover:bg-primary/20"
                aria-label={`Ver detalles de requisición ${requisition.internal_folio}`}
              >
                Ver Detalle <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

RequisitionCard.displayName = 'RequisitionCard';

export default RequisitionCard;
