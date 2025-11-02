
import { useState, useEffect, useCallback } from 'react';
import { getProducts, getCategories } from '@/services/productService';
import logger from '@/utils/logger';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    searchTerm: '',
    category: 'all',
    sortBy: 'name',
    sortAsc: true,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
  });

  // Cargar categorías una sola vez al montar el hook
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await getCategories();
        setCategories(['all', ...cats]);
      } catch (err) {
        logger.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Función para buscar productos, se activa cuando cambian los filtros o la página
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, count } = await getProducts({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });
      setProducts(data);
      setPagination(prev => ({ ...prev, total: count }));
    } catch (e) {
      setError('No se pudieron cargar los productos. Intenta de nuevo más tarde.');
      logger.error('Failed to fetch products:', e);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  // Efecto que llama a `fetchProducts` cuando es necesario
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Función para actualizar un filtro y resetear a la primera página
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Función para cambiar de página
  const setPage = (pageNumber) => {
    setPagination(prev => ({ ...prev, page: pageNumber }));
  };
  
  return {
    products,
    categories,
    loading,
    error,
    pagination,
    filters,
    updateFilter,
    setPage,
    refetch: fetchProducts,
  };
}
