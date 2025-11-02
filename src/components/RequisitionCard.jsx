
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

const statusStyles = {
  draft: { badge: 'border-slate-300 bg-slate-50 text-slate-700', accent: 'bg-slate-400' },
  submitted: { badge: 'border-amber-300 bg-amber-50 text-amber-700', accent: 'bg-amber-500' },
  approved: { badge: 'border-emerald-300 bg-emerald-50 text-emerald-700', accent: 'bg-gradient-accent' },
  rejected: { badge: 'border-red-300 bg-red-50 text-red-700', accent: 'bg-red-500' },
  ordered: { badge: 'border-blue-300 bg-blue-50 text-blue-700', accent: 'bg-gradient-primary' },
  cancelled: { badge: 'border-slate-300 bg-slate-50 text-slate-600', accent: 'bg-slate-400' },
  default: { badge: 'border-slate-300 bg-slate-50 text-slate-600', accent: 'bg-slate-400' }
};

const RequisitionCard = memo(({ requisition }) => {
  const navigate = useNavigate();
  
  // Memoizar información de estado
  const statusInfo = useMemo(() => 
    statusStyles[requisition?.business_status] || statusStyles.default,
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
  const formattedAmount = useMemo(() => {
    const amount = Number(requisition?.total_amount) || 0;
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }, [requisition?.total_amount]);

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
        className="w-full group relative overflow-hidden cursor-pointer"
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Requisición ${requisition.internal_folio || requisition.id}`}
      >
        {/* Accent Bar */}
        <div className={cn('absolute top-0 left-0 right-0 h-1 transition-transform duration-300', statusInfo.accent)} />

        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Folio Section */}
            <div className="flex items-center gap-4 md:min-w-[200px]">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
                <Hash className="w-7 h-7 text-blue-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Folio</p>
                <p className="font-bold text-xl text-slate-900">{requisition.internal_folio || 'N/A'}</p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Solicitante */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-50">
                  <User className="w-5 h-5 text-slate-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-0.5">Solicitante</p>
                  <p className="font-semibold text-sm text-slate-900 truncate">{requisition.creator?.full_name || 'No disponible'}</p>
                </div>
              </div>

              {/* Fecha */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-50">
                  <Calendar className="w-5 h-5 text-slate-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-0.5">Fecha</p>
                  <p className="font-semibold text-sm text-slate-900">{formattedDate}</p>
                </div>
              </div>

              {/* Monto */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50">
                  <DollarSign className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-0.5">Monto Total</p>
                  <p className="text-lg font-bold text-slate-900 tracking-tight">{formattedAmount}</p>
                </div>
              </div>
            </div>

            {/* Status Badge & Action */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:ml-auto">
              <Badge variant="outline" className={cn('text-xs font-semibold capitalize px-3 py-1.5', statusInfo.badge)}>
                {(requisition.business_status || '').replace(/_/g, ' ')}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl group-hover:translate-x-1 transition-transform duration-200"
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
