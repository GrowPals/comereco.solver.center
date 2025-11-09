
import { useQuery } from '@tanstack/react-query';
import { getProducts, getProductById, getUniqueProductCategories } from '@/services/productService';
import { isValidUUID } from '@/utils/validation';

/**
 * Hook para obtener una lista paginada y filtrada de productos.
 * @param {object} filters - Objeto con los filtros a aplicar.
 * @param {string} filters.searchTerm - Término de búsqueda.
 * @param {string} filters.category - Categoría de producto.
 * @param {number} filters.page - Página actual.
 * @param {number} filters.pageSize - Tamaño de la página.
 */
export const useProducts = (filters) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => getProducts(filters),
    staleTime: 1000 * 60 * 10, // 10 minutos - productos cambian poco
    gcTime: 1000 * 60 * 30, // 30 minutos en cache
    placeholderData: (previousData) => previousData, // Mantiene datos previos mientras carga
    retry: 2,
  });
};

/**
 * Hook para obtener los detalles de un solo producto por su ID.
 * @param {string} productId - El ID del producto.
 */
export const useProductDetails = (productId) => {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: () => getProductById(productId),
    enabled: !!productId && isValidUUID(productId), // Solo ejecuta la query si productId es un UUID válido
    staleTime: 1000 * 60 * 15, // 15 minutos - detalles cambian poco
    gcTime: 1000 * 60 * 30,
  });
};

/**
 * Hook para obtener la lista de categorías de productos únicas.
 */
export const useProductCategories = () => {
    return useQuery({
        queryKey: ['productCategories'],
        queryFn: getUniqueProductCategories,
        staleTime: 1000 * 60 * 60, // Cache por 1 hora - categorías raramente cambian
        gcTime: 1000 * 60 * 60 * 2, // 2 horas en cache
    });
};
