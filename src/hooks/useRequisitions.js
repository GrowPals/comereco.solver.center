
import { useQuery } from '@tanstack/react-query';
import { fetchRequisitions, fetchRequisitionDetails } from '@/services/requisitionService';

/**
 * Hook para obtener una lista paginada y filtrada de requisiciones.
 * @param {object} filters - Objeto con los filtros a aplicar.
 * @param {number} filters.page - Página actual.
 * @param {number} filters.pageSize - Tamaño de la página.
 * @param {string} filters.sortBy - Campo de ordenamiento.
 * @param {boolean} filters.ascending - Dirección de ordenamiento.
 */
export const useRequisitions = (filters = { page: 1, pageSize: 10, sortBy: 'created_at', ascending: false }) => {
  return useQuery({
    queryKey: ['requisitions', filters],
    queryFn: async () => {
      const result = await fetchRequisitions(
        filters.page || 1, 
        filters.pageSize || 10, 
        filters.sortBy || 'created_at', 
        filters.ascending ?? false
      );
      // fetchRequisitions retorna { data: enrichedData, total: count }
      // El hook debe retornar el mismo formato para compatibilidad
      return {
        data: result?.data || [],
        total: result?.total || 0,
        count: result?.total || 0, // Alias para compatibilidad
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutos - requisiciones pueden cambiar frecuentemente
    gcTime: 1000 * 60 * 10, // 10 minutos en cache
    placeholderData: (previousData) => previousData,
    keepPreviousData: true,
    retry: 2,
  });
};

/**
 * Hook para obtener los detalles de una sola requisición por su ID.
 * @param {string} requisitionId - El ID de la requisición.
 */
export const useRequisitionDetails = (requisitionId) => {
  return useQuery({
    queryKey: ['requisition', requisitionId],
    queryFn: () => fetchRequisitionDetails(requisitionId),
    enabled: !!requisitionId, // Solo ejecuta la query si requisitionId no es nulo
    staleTime: 1000 * 60 * 5, // 5 minutos - detalles cambian menos frecuentemente
    gcTime: 1000 * 60 * 15,
  });
};
