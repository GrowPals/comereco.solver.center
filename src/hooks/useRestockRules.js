import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getRestockRule,
    listRestockRules,
    upsertRestockRule,
    toggleRestockRuleStatus,
    deleteRestockRule
} from '@/services/restockRulesService';

const buildRuleKey = (productId, projectId) => ['restock-rule', { productId, projectId: projectId ?? null }];
const buildRulesListKey = (filters) => ['restock-rules', filters];

export const useRestockRule = ({ productId, projectId } = {}) => {
    return useQuery({
        queryKey: buildRuleKey(productId, projectId),
        queryFn: () => getRestockRule({ productId, projectId }),
        enabled: Boolean(productId),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 15
    });
};

export const useRestockRulesList = (filters = {}) => {
    const sanitizedFilters = useMemo(() => ({
        page: filters.page ?? 1,
        pageSize: filters.pageSize ?? 10,
        status: filters.status ?? 'all',
        projectId: filters.projectId ?? undefined,
        category: filters.category ?? 'all',
        searchTerm: filters.searchTerm ?? ''
    }), [filters]);

    return useQuery({
        queryKey: buildRulesListKey(sanitizedFilters),
        queryFn: () => listRestockRules(sanitizedFilters),
        keepPreviousData: true,
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 15
    });
};

export const useRestockRuleMutations = ({ productId, projectId } = {}) => {
    const queryClient = useQueryClient();

    const invalidateAll = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: buildRuleKey(productId, projectId) }),
            queryClient.invalidateQueries({ queryKey: ['restock-rules'] })
        ]);
    };

    const saveMutation = useMutation({
        mutationFn: upsertRestockRule,
        onSuccess: async (data) => {
            await invalidateAll();
            return data;
        }
    });

    const toggleMutation = useMutation({
        mutationFn: toggleRestockRuleStatus,
        onSuccess: async () => {
            await invalidateAll();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteRestockRule,
        onSuccess: async () => {
            await invalidateAll();
        }
    });

    return {
        saveRule: saveMutation.mutateAsync,
        toggleRuleStatus: toggleMutation.mutateAsync,
        deleteRule: deleteMutation.mutateAsync,
        isSaving: saveMutation.isPending,
        isToggling: toggleMutation.isPending,
        isDeleting: deleteMutation.isPending
    };
};

