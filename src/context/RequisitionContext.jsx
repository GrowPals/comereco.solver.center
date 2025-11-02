
import React, { createContext, useContext, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useCart } from '@/hooks/useCart';
import logger from '@/utils/logger';
import { useToast } from '@/components/ui/use-toast.js';

const RequisitionContext = createContext();

export const useRequisition = () => {
  const context = useContext(RequisitionContext);
  if (!context) {
    throw new Error('useRequisition debe usarse dentro de un RequisitionProvider');
  }
  return context;
};

export const RequisitionProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useSupabaseAuth();
  const { clearCart, items: cartItems } = useCart();
  const { toast } = useToast();

  const createRequisition = async (requisitionData) => {
    if (!user) {
        const msg = "Usuario no autenticado.";
        setError(msg);
        logger.warn("Intento de crear requisición sin usuario autenticado.");
        toast({ title: "Error", description: msg, variant: "destructive" });
        return null;
    }
    
    if (cartItems.length === 0) {
        const msg = "El carrito está vacío. No se puede crear una requisición.";
        setError(msg);
        toast({ title: "Carrito Vacío", description: msg, variant: "destructive" });
        return null;
    }

    setLoading(true);
    setError(null);
    
    const itemsForDb = cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
    }));

    try {
        // 1. La función RPC ahora crea la requisición en estado 'draft'
        const { data: requisitionId, error: rpcError } = await supabase.rpc('create_full_requisition', {
            p_comments: requisitionData.comments,
            p_items: itemsForDb
        });

        if (rpcError) throw rpcError;
        
        // 2. Ahora, cambiamos el estado de negocio a 'submitted' para que entre al flujo de aprobación
        // El trigger 'validate_requisition_status_transition' se encargará de la lógica y permisos.
        const { error: updateError } = await supabase
            .from('requisitions')
            .update({ business_status: 'submitted' })
            .eq('id', requisitionId);

        if (updateError) {
            // Este es un caso delicado, la requisición se creó pero no se pudo enviar.
            logger.error(`Requisición ${requisitionId} creada pero no se pudo enviar.`, updateError);
            throw new Error(`La requisición se creó como borrador, pero no se pudo enviar: ${updateError.message}`);
        }

        logger.info(`Requisición ${requisitionId} creada y enviada exitosamente.`);
        toast({
            title: "¡Requisición Enviada!",
            description: "Tu requisición ha sido enviada para su aprobación.",
        });
        
        clearCart();
        return { id: requisitionId };

    } catch (err) {
        logger.error("Error en createRequisition Context:", err);
        const errorMsg = err.message || "No se pudo crear la requisición. Por favor, inténtelo de nuevo.";
        setError(errorMsg);
        toast({
            title: "Error al crear la requisición",
            description: errorMsg.includes("Stock insuficiente") ? "Stock insuficiente para uno de los productos." : errorMsg,
            variant: "destructive"
        });
        return null;
    } finally {
        setLoading(false);
    }
  };

  const value = {
    loading,
    error,
    createRequisition,
  };

  return (
    <RequisitionContext.Provider value={value}>
      {children}
    </RequisitionContext.Provider>
  );
};
