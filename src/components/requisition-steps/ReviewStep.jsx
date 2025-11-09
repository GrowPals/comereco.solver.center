import React, { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useCart } from '@/context/CartContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';
import { formatCurrency } from '@/lib/formatters';

const ReviewStep = ({ onEdit }) => {
  const { getValues } = useFormContext();
  const { items, subtotal, vat, total } = useCart();
  const values = getValues();

  const enrichedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        nombre: item.nombre || item.name || 'Producto sin nombre',
        precio: item.precio ?? item.price ?? 0,
      })),
    [items]
  );

  const summaryItems = [
    { label: 'Título', value: values.title },
    { label: 'Categoría', value: values.category },
    { label: 'Prioridad', value: values.priority },
    {
      label: 'Fecha Requerida',
      value: values.requiredDate
        ? format(new Date(values.requiredDate), 'dd MMM, yyyy', { locale: es })
        : 'N/A',
    },
    { label: 'Descripción', value: values.description || 'Sin descripción' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>📝 Información General</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onEdit(1)}>
              <Edit className="w-4 h-4 mr-1" /> Editar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          {summaryItems.map((item) => (
            <div key={item.label}>
              <p className="text-sm text-neutral-70">{item.label}</p>
              <p className="font-semibold">{item.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>📦 Artículos ({enrichedItems.length})</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onEdit(2)}>
              <Edit className="w-4 h-4 mr-1" /> Editar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {enrichedItems.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center p-2 rounded-lg"
            >
              <div>
                <p className="font-semibold">{item.nombre}</p>
                <p className="text-sm text-neutral-70">
                  {item.quantity} x {formatCurrency(item.precio)}
                </p>
              </div>
              <p className="font-semibold">
                {formatCurrency(item.precio * item.quantity)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>💰 Resumen Financiero</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-neutral-70">Subtotal</p>
            <p>{formatCurrency(subtotal)}</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-neutral-70">IVA (16%)</p>
            <p>{formatCurrency(vat)}</p>
          </div>
          <div className="border-t pt-4 mt-4 flex justify-between items-center font-bold text-lg">
            <p>Total</p>
            <p className="text-secondary">
              {formatCurrency(total)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewStep;
