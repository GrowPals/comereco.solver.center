
import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
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
import { IconWrapper } from '@/components/ui/icon-wrapper';

const MOBILE_BREAKPOINT = 1024;

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
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });
  const [showDetails, setShowDetails] = useState(false);

  // Memoizar accent de estado para la barra superior
  const statusAccent = useMemo(() =>
    statusAccents[requisition?.business_status] || statusAccents.default,
    [requisition?.business_status]
  );

  // Detectar cambios de viewport
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
          className="w-full group relative overflow-hidden cursor-pointer border-2 shadow-soft-md transition-all duration-300 active:shadow-soft-lg"
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
                  <IconWrapper icon={Hash} variant="subtle" size="md" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Folio</p>
                    <p className="text-lg font-bold text-foreground truncate">{requisition.internal_folio || 'N/A'}</p>
                  </div>
                </div>
                <Badge status={requisition.business_status} className="shrink-0" />
              </div>

              {/* Monto - Destacado */}
              <div className="flex items-center gap-3 bg-gradient-to-r from-primary-50/50 to-transparent dark:from-primary-950/20 px-3 py-2.5 rounded-xl">
                <IconWrapper icon={DollarSign} variant="subtle" size="md" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Monto Total</p>
                  <p className="text-xl font-bold tracking-tight text-foreground">{formattedAmount}</p>
                </div>
              </div>

              {/* Información Secundaria - Compacta */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate font-medium">{requisition.creator?.full_name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
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
                className="w-full rounded-xl text-primary-600 transition-transform duration-200 hover:bg-primary/10 hover:text-primary-700 dark:hover:bg-primary/20"
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
              <IconWrapper icon={Hash} variant="subtle" size="lg" />
              <div>
                <p className="mb-1 caption">Folio</p>
                <p className="price-medium">{requisition.internal_folio || 'N/A'}</p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Solicitante */}
              <div className="flex items-center gap-3">
                <IconWrapper icon={User} variant="neutral" size="sm" />
                <div className="min-w-0">
                  <p className="mb-0.5 text-muted-xs">Solicitante</p>
                  <p className="truncate text-secondary-sm font-semibold">{requisition.creator?.full_name || 'No disponible'}</p>
                </div>
              </div>

              {/* Fecha */}
              <div className="flex items-center gap-3">
                <IconWrapper icon={Calendar} variant="neutral" size="sm" />
                <div className="min-w-0">
                  <p className="mb-0.5 text-muted-xs">Fecha</p>
                  <p className="text-secondary-sm font-semibold">{formattedDate}</p>
                </div>
              </div>

              {/* Monto */}
              <div className="flex items-center gap-3">
                <IconWrapper icon={DollarSign} variant="neutral" size="sm" />
                <div className="min-w-0">
                  <p className="mb-0.5 text-muted-xs">Monto Total</p>
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
