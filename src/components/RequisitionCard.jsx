
import React from 'react';
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
  draft: 'border-slate-300 bg-slate-50 text-slate-600',
  submitted: 'border-blue-300 bg-blue-50 text-blue-700',
  approved: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  rejected: 'border-red-300 bg-red-50 text-red-700',
  ordered: 'border-indigo-300 bg-indigo-50 text-indigo-700',
  cancelled: 'border-gray-300 bg-gray-50 text-gray-600',
  default: 'border-gray-300 bg-gray-50 text-gray-600'
};

const RequisitionCard = ({ requisition }) => {
  const navigate = useNavigate();
  // Usamos el nuevo business_status para la UI
  const statusInfo = statusStyles[requisition.business_status] || statusStyles.default;

  return (
    <motion.div
      layout
      whileHover={{ y: -4, boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.1)', transition: { duration: 0.2 } }}
      className="w-full"
    >
      <Card
        className={cn(
          'w-full cursor-pointer hover:border-primary/50 border-l-4 rounded-xl transition-all duration-300 overflow-hidden',
          statusInfo.replace('bg-', 'border-') 
        )}
        onClick={() => navigate(`/requisitions/${requisition.id}`)}
      >
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Folio y Fecha */}
            <div className="md:col-span-3">
              <p className="font-bold text-lg text-foreground flex items-center gap-2">
                <Hash className="w-5 h-5 text-muted-foreground" />
                {requisition.internal_folio}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                {requisition.created_at ? format(parseISO(requisition.created_at), "dd MMM yyyy", { locale: es }) : 'N/A'}
              </p>
            </div>
            
            {/* Solicitante */}
            <div className="md:col-span-3 flex items-center gap-2">
                <User className="w-5 h-5 text-muted-foreground shrink-0"/>
                <div>
                    <p className="text-sm text-muted-foreground">Solicita</p>
                    <p className="font-semibold truncate">{requisition.requester?.full_name || 'No disponible'}</p>
                </div>
            </div>

            {/* Estado */}
            <div className="md:col-span-2 flex items-center justify-start md:justify-center">
                 <Badge variant="outline" className={cn('text-xs capitalize', statusInfo)}>
                    {requisition.business_status.replace(/_/g, ' ')}
                </Badge>
            </div>

            {/* Total */}
            <div className="md:col-span-2 flex items-center gap-2 md:justify-end">
                <DollarSign className="w-6 h-6 text-green-500 shrink-0"/>
                <div>
                     <p className="text-sm text-muted-foreground">Monto Total</p>
                    <p className="text-lg font-bold text-foreground">
                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(requisition.total_amount)}
                    </p>
                </div>
            </div>
            
            {/* Botón */}
            <div className="md:col-span-2 flex justify-end">
                 <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary h-auto p-2 rounded-xl"
                >
                  Ver Detalle <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
            </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RequisitionCard;
