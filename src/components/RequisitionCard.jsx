
import React, { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Calendar, Hash, User, DollarSign, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import useViewport from '@/hooks/useViewport';

const statusAccents = {
  draft: 'bg-slate-300 dark:bg-slate-600',
  submitted: 'bg-amber-300 dark:bg-amber-500',
  approved: 'bg-gradient-to-r from-emerald-300 to-teal-300 dark:from-emerald-500 dark:to-teal-500',
  rejected: 'bg-red-300 dark:bg-red-500',
  ordered: 'bg-gradient-to-r from-blue-300 to-indigo-300 dark:from-blue-500 dark:to-indigo-500',
  cancelled: 'bg-rose-300 dark:bg-rose-500',
  default: 'bg-slate-300 dark:bg-slate-600',
};

const RequisitionCard = memo(({ requisition }) => {
  const navigate = useNavigate();
  const { isMobile } = useViewport();
  const [showDetails, setShowDetails] = useState(false);

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

  // Layout Mobile optimizado
  if (isMobile) {
    return (
      <motion.div
        layout
        className="w-full"
      >
        <Card
          interactive
          className="w-full group relative overflow-hidden cursor-pointer"
          onClick={handleCardClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-label={`Requisición ${requisition.internal_folio || requisition.id}`}
        >
          {/* Accent Bar */}
          <div className={cn('absolute top-0 left-0 right-0 h-1.5 transition-transform duration-300', statusAccent)} />

          <CardContent className="p-4">
            {/* Información Principal - Siempre visible */}
            <div className="space-y-4">
              {/* Folio y Estado */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Hash className="w-5 h-5 text-primary-400 dark:text-primary-300 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Folio</p>
                    <p className="text-lg font-bold text-foreground truncate">{requisition.internal_folio || 'N/A'}</p>
                  </div>
                </div>
                <Badge status={requisition.business_status} className="shrink-0" />
              </div>

              {/* Monto - Destacado */}
              <div className="flex items-center gap-3 bg-gradient-to-r from-primary-50/80 to-transparent dark:from-primary-950/30 px-3 py-2.5 rounded-xl">
                <DollarSign className="w-5 h-5 text-emerald-400 dark:text-emerald-300 shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Monto Total</p>
                  <p className="text-xl font-bold tracking-tight text-foreground">{formattedAmount}</p>
                </div>
              </div>

              {/* Información Secundaria - Compacta */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <User className="w-4 h-4 text-violet-400 dark:text-violet-300 shrink-0" />
                  <span className="truncate font-medium">{requisition.creator?.full_name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Calendar className="w-4 h-4 text-sky-400 dark:text-sky-300" />
                  <span className="font-medium">{formattedDate}</span>
                </div>
              </div>

              {/* Botón de acción */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick();
                }}
                className="w-full rounded-xl"
                aria-label={`Ver detalles de requisición ${requisition.internal_folio}`}
              >
                Ver Detalle <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Layout Desktop - Original
  return (
    <motion.div
      layout
      whileHover={{ y: -6, transition: { duration: 0.3, ease: 'easeOut' } }}
      className="w-full"
    >
      <Card
        interactive
        className="w-full group relative overflow-hidden cursor-pointer"
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Requisición ${requisition.internal_folio || requisition.id}`}
      >
        {/* Accent Bar */}
        <div className={cn('absolute top-0 left-0 right-0 h-1.5 transition-transform duration-300', statusAccent)} />

        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Folio Section */}
            <div className="flex items-center gap-4 md:min-w-[200px]">
              <Hash className="w-8 h-8 text-primary-400 dark:text-primary-300" />
              <div>
                <p className="mb-1 caption text-muted-foreground">Folio</p>
                <p className="price-medium">{requisition.internal_folio || 'N/A'}</p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Solicitante */}
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-violet-400 dark:text-violet-300" />
                <div className="min-w-0">
                  <p className="mb-0.5 text-muted-xs text-muted-foreground">Solicitante</p>
                  <p className="truncate text-secondary-sm font-semibold">{requisition.creator?.full_name || 'No disponible'}</p>
                </div>
              </div>

              {/* Fecha */}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-sky-400 dark:text-sky-300" />
                <div className="min-w-0">
                  <p className="mb-0.5 text-muted-xs text-muted-foreground">Fecha</p>
                  <p className="text-secondary-sm font-semibold">{formattedDate}</p>
                </div>
              </div>

              {/* Monto */}
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-emerald-400 dark:text-emerald-300" />
                <div className="min-w-0">
                  <p className="mb-0.5 text-muted-xs text-muted-foreground">Monto Total</p>
                  <p className="price-medium">{formattedAmount}</p>
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
                className="rounded-xl group-hover:translate-x-1"
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
