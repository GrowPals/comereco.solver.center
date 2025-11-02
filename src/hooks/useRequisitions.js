
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
    queryFn: () => fetchRequisitions(filters.page, filters.pageSize, filters.sortBy, filters.ascending),
    placeholderData: (previousData) => previousData,
    keepPreviousData: true,
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
  });
};
