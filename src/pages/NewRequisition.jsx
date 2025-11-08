
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate } from 'react-router-dom';
import MultiStepProgressBar from '@/components/MultiStepProgressBar';
import GeneralDataStep from '@/components/requisition-steps/GeneralDataStep';
import ItemsStep from '@/components/requisition-steps/ItemsStep';
import ReviewStep from '@/components/requisition-steps/ReviewStep';
import ConfirmationStep from '@/components/requisition-steps/ConfirmationStep';
import { Button } from '@/components/ui/button';
import { RequisitionProvider, useRequisition } from '@/context/RequisitionContext';
import { createRequisition } from '@/services/requisitionService';
import { createTemplate } from '@/services/templateService';
import { useToast } from '@/components/ui/useToast';
import { useCart } from '@/context/CartContext';
import { useForm, FormProvider } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { ArrowLeft } from 'lucide-react';


const steps = ['Datos Generales', 'Añadir Ítems', 'Revisar y Enviar'];

const NewRequisitionContent = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const { user } = useSupabaseAuth();
    const { items: cartItems, clearCart } = useCart();
    const { toast } = useToast();
    const methods = useForm({
        defaultValues: {
            title: '',
            description: '',
            category: '',
            priority: 'Normal',
            requiredDate: null,
            costCenter: '',
        }
    });

    const isCreatingTemplate = location.state?.fromTemplates || false;

    const createRequisitionMutation = useMutation({
        mutationFn: createRequisition,
        onSuccess: (newRequisitionId) => {
            toast({ title: 'Éxito', description: 'Tu requisición ha sido creada y enviada.' });
            queryClient.invalidateQueries(['requisitions']);
            clearCart();
            methods.reset();
            navigate(`/requisitions/${newRequisitionId}`, { replace: true });
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error al enviar', description: error.message });
        }
    });

    const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));
    
    const onSubmit = (formData) => {
        if (cartItems.length === 0) {
            toast({ variant: 'destructive', title: 'Carrito Vacío', description: 'Debes agregar al menos un producto.' });
            return;
        }

        const payload = {
            comments: formData.description,
            items: cartItems.map(item => ({ product_id: item.id, quantity: item.quantity })),
            // Aquí se podrían agregar más datos del formulario si el backend lo requiere.
        };
        createRequisitionMutation.mutate(payload);
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0: return <GeneralDataStep />;
            case 1: return <ItemsStep />;
            case 2: return <ReviewStep onEdit={(step) => setCurrentStep(step - 1)} />;
            default: return null;
        }
    };

    return (
      <FormProvider {...methods}>
        <div className="flex flex-col h-screen">
            <header className="p-4 border-b flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft /></Button>
                <h1 className="text-xl font-bold">{isCreatingTemplate ? 'Crear Nueva Plantilla' : 'Crear Nueva Requisición'}</h1>
            </header>
            <div className="p-4 sm:p-6 lg:p-8 flex-grow overflow-y-auto">
                <div className="mb-8">
                    <MultiStepProgressBar steps={steps} currentStep={currentStep + 1} />
                </div>
                <div className="max-w-4xl mx-auto">
                    {renderStep()}
                </div>
            </div>
             <footer className="p-4 border-t bg-card flex justify-between items-center sticky bottom-0">
                <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
                    Atrás
                </Button>
                {currentStep < steps.length - 1 ? (
                    <Button onClick={handleNext} disabled={currentStep === 1 && cartItems.length === 0}>Siguiente</Button>
                ) : (
                    <Button onClick={methods.handleSubmit(onSubmit)} isLoading={createRequisitionMutation.isPending}>
                        {isCreatingTemplate ? 'Guardar Plantilla' : 'Confirmar y Enviar'}
                    </Button>
                )}
            </footer>
        </div>
      </FormProvider>
    );
};

const NewRequisitionPage = () => (
    <>
        <Helmet><title>Nueva Requisición - ComerECO</title></Helmet>
        <RequisitionProvider>
            <NewRequisitionContent />
        </RequisitionProvider>
    </>
);

export default NewRequisitionPage;
