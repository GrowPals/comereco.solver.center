
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useRequisition } from '@/context/RequisitionContext';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast.js';

const InfoRow = ({ label, value }) => (
    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
        <span className="font-semibold text-muted-foreground">{label}:</span>
        <span className="font-bold text-right">{value}</span>
    </div>
);

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items: cartItems, subtotal, vat, total, clearCart } = useCart();
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const { createRequisition, loading: requisitionLoading } = useRequisition();
  
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (cartItems.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Serás redirigido al catálogo.",
      });
      navigate('/catalog');
    }
  }, [cartItems.length, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await createRequisition({ comments });
    if (result) {
        // La navegación y limpieza del carrito se maneja dentro del contexto
        // si la creación es exitosa.
        navigate(`/requisitions/${result.id}?from=checkout`);
    }
  };

  if (cartItems.length === 0) return null;

  return (
    <>
        <Helmet>
            <title>Confirmar Requisición - ComerECO</title>
        </Helmet>
        <div className="bg-muted min-h-screen p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al catálogo
                </Button>
                <Card className="overflow-hidden">
                    <div className="bg-primary text-primary-foreground p-6 text-center">
                        <h1 className="text-3xl font-bold">Confirmar Requisición</h1>
                        <p className="opacity-80 mt-1">Revisa los detalles y envía tu solicitud.</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="p-6 space-y-8">
                            <section>
                                <h2 className="text-xl font-semibold mb-4 border-b pb-2">📋 Información General</h2>
                                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                                    <InfoRow label="Compañía" value={user?.company?.name || 'N/A'} />
                                    <InfoRow label="Solicitado por" value={user?.full_name || 'N/A'} />
                                </div>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold mb-4 border-b pb-2">📝 Comentarios</h2>
                                <div className="space-y-4 mt-4">
                                    <div>
                                        <label htmlFor="comments" className="font-semibold mb-2 block">Comentarios <span className="text-muted-foreground font-normal">(opcional)</span></label>
                                        <Textarea id="comments" value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Instrucciones especiales de entrega, notas para el aprobador, etc." rows={3} />
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold mb-4 border-b pb-2">📦 Resumen del Pedido ({cartItems.length} productos)</h2>
                                <div className="bg-muted/50 rounded-lg p-4 mt-4 space-y-2">
                                    {cartItems.map(i => (
                                        <div key={i.id} className="flex justify-between items-center py-2 border-b last:border-none">
                                            <div>
                                                <p className="font-semibold">{i.name}</p>
                                                <p className="text-sm text-muted-foreground">{i.quantity} {i.unit} x ${i.price.toFixed(2)}</p>
                                            </div>
                                            <p className="font-bold">${(i.price * i.quantity).toFixed(2)}</p>
                                        </div>
                                    ))}
                                    <Separator className="my-4" />
                                    <div className="space-y-2 pt-2 text-sm">
                                        <div className="flex justify-between"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
                                        <div className="flex justify-between"><span>IVA (16%):</span><span>${vat.toFixed(2)}</span></div>
                                    </div>
                                    <Separator className="my-4" />
                                    <div className="flex justify-between text-xl font-bold pt-2">
                                        <span>Total:</span>
                                        <span>${total.toFixed(2)} MXN</span>
                                    </div>
                                </div>
                            </section>
                        </CardContent>

                        <CardFooter className="bg-muted/30 p-6 flex justify-end">
                            <Button type="submit" disabled={requisitionLoading} size="lg" className="w-full sm:w-auto">
                                {requisitionLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando...
                                    </>
                                ) : <><Send className="mr-2 h-4 w-4" /> Enviar Requisición</>}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    </>
  );
}
