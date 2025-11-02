
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Send, X } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { useCart } from '@/hooks/useCart';
import { useRequisition } from '@/context/RequisitionContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast.js';
import MultiStepProgressBar from '@/components/MultiStepProgressBar';
import ItemsStep from '@/components/requisition-steps/ItemsStep';
import ReviewStep from '@/components/requisition-steps/ReviewStep';
import ConfirmationStep from '@/components/requisition-steps/ConfirmationStep';
import GeneralDataStep from '@/components/requisition-steps/GeneralDataStep';

const steps = ['Datos', 'Artículos', 'Revisar', 'Enviar'];

const NewRequisitionPage = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [lastRequisitionId, setLastRequisitionId] = useState(null);
    const { items } = useCart();
    const { createRequisition, loading: requisitionLoading } = useRequisition();
    const { toast } = useToast();
    const navigate = useNavigate();

    const methods = useForm({
        defaultValues: {
            title: '',
            description: '',
            category: '',
            priority: 'Normal',
            requiredDate: null,
            costCenter: '',
        },
    });
    
    const { trigger, handleSubmit } = methods;

    const nextStep = async () => {
        let isValid = true;
        if (currentStep === 1) {
            isValid = await trigger(['title', 'category', 'requiredDate']);
        }
        if (currentStep === 2 && items.length === 0) {
            isValid = false;
            toast({
                variant: 'destructive',
                title: 'Carrito vacío',
                description: 'Debes agregar al menos un artículo para continuar.',
            });
        }
        
        if (isValid && currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };
    
    const goToStep = (step) => {
        if (step < currentStep) {
            setCurrentStep(step);
        }
    };

    const onSubmit = async (data) => {
        const result = await createRequisition(data);
        if (result && result.id) {
            setLastRequisitionId(result.id);
            setCurrentStep(currentStep + 1); // Go to confirmation step
        }
    };

    return (
        <div className="bg-card h-screen overflow-y-auto">
            <Helmet><title>Nueva Requisición - ComerECO</title></Helmet>
            <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto relative">
                <Button variant="ghost" size="icon" className="absolute top-4 right-4 z-20" onClick={() => navigate('/dashboard')}>
                    <X className="w-6 h-6" />
                </Button>

                {currentStep <= steps.length && (
                    <div className="space-y-2 pt-8 sm:pt-0">
                        <h1 className="text-3xl font-bold text-foreground">Crear Nueva Requisición</h1>
                        <p className="text-muted-foreground">Sigue los pasos para completar tu solicitud.</p>
                    </div>
                )}
                
                {currentStep < 5 && <div className="px-0 sm:px-4"><MultiStepProgressBar steps={steps} currentStep={currentStep} onStepClick={goToStep} /></div>}
                
                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-24">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {currentStep === 1 && <GeneralDataStep />}
                                {currentStep === 2 && <ItemsStep />}
                                {currentStep === 3 && <ReviewStep onEdit={goToStep} />}
                                {currentStep === 4 && (
                                     <div className="text-center p-8 bg-background rounded-lg shadow-md border">
                                        <Send className="mx-auto h-16 w-16 text-secondary mb-4"/>
                                        <h2 className="text-2xl font-bold">Todo listo para enviar</h2>
                                        <p className="text-muted-foreground mt-2">Revisa por última vez. Una vez enviada, no podrás editar la requisición.</p>
                                    </div>
                                )}
                                {currentStep === 5 && lastRequisitionId && <ConfirmationStep requisitionId={lastRequisitionId}/>}
                            </motion.div>
                        </AnimatePresence>
                         
                         {currentStep < 4 && (
                             <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t py-4 px-4 sm:px-8 z-10">
                                <div className="max-w-5xl mx-auto flex justify-between items-center">
                                    <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1 || requisitionLoading}>
                                        <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
                                    </Button>
                                    <Button type="button" variant="secondary" onClick={nextStep}>
                                        Siguiente <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                         )}

                        {currentStep === 4 && (
                            <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t py-4 px-4 sm:px-8 z-10">
                                <div className="max-w-5xl mx-auto flex justify-between items-center">
                                     <Button type="button" variant="outline" onClick={prevStep} disabled={requisitionLoading}>
                                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Revisar
                                    </Button>
                                    <Button type="submit" variant="secondary" disabled={items.length === 0 || requisitionLoading}>
                                        {requisitionLoading ? 'Enviando...' : 'Confirmar y Enviar'}
                                        <Send className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>
                </FormProvider>
            </div>
        </div>
    );
};

export default NewRequisitionPage;
