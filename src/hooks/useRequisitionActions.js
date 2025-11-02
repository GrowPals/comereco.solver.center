
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/useToast';
import { submitRequisition, updateRequisitionStatus } from '@/services/requisitionService';

export const useRequisitionActions = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries(['requisitions']);
            queryClient.invalidateQueries(['requisition']);
            queryClient.invalidateQueries(['pendingApprovals']);
        },
        onError: (error) => {
            toast({
                variant: 'destructive',
                title: 'Error en la operación',
                description: error.message,
            });
        },
    };

    const submitMutation = useMutation({
        mutationFn: submitRequisition,
        ...mutationOptions,
        onSuccess: () => {
            toast({ title: 'Éxito', description: 'La requisición ha sido enviada.' });
            mutationOptions.onSuccess();
        },
    });

    const approveMutation = useMutation({
        mutationFn: (requisitionId) => updateRequisitionStatus(requisitionId, 'approved'),
        ...mutationOptions,
        onSuccess: () => {
            toast({ title: 'Éxito', description: 'La requisición ha sido aprobada.' });
            mutationOptions.onSuccess();
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ requisitionId, reason }) => updateRequisitionStatus(requisitionId, 'rejected', reason),
        ...mutationOptions,
        onSuccess: () => {
            toast({ title: 'Éxito', description: 'La requisición ha sido rechazada.' });
            mutationOptions.onSuccess();
        },
    });

    return {
        submit: submitMutation.mutate,
        isSubmitting: submitMutation.isLoading,
        approve: approveMutation.mutate,
        isApproving: approveMutation.isLoading,
        reject: rejectMutation.mutate,
        isRejecting: rejectMutation.isLoading,
    };
};
