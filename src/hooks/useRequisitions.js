
import { useState, useEffect, useCallback } from 'react';
import { getRequisitions as getRequisitionsService, updateRequisitionBusinessStatus } from '@/services/requisitionService';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext'; 
import logger from '@/utils/logger';

export function useRequisitions() {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  
  const { user } = useSupabaseAuth(); 

  const fetchRequisitions = useCallback(async (currentPage) => {
    if (!user) {
        setLoading(false);
        return;
    };

    setLoading(true);
    setError(null);
    try {
      const { data, count } = await getRequisitionsService({
        page: currentPage,
        limit: pagination.limit,
      });
      
      setRequisitions(data);
      const totalPages = Math.ceil(count / pagination.limit);
      setPagination(prev => ({ ...prev, page: currentPage, total: count, totalPages }));

    } catch (e) {
      setError('Error al cargar las requisiciones.');
      logger.error('Fallo en fetchRequisitions:', e);
    } finally {
      setLoading(false);
    }
  }, [user, pagination.limit]);

  useEffect(() => {
    if (user) {
      fetchRequisitions(1);
    }
  }, [user, fetchRequisitions]);

  const goToPage = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= pagination.totalPages) {
      fetchRequisitions(pageNumber);
    }
  };

  const refetch = () => {
      fetchRequisitions(pagination.page);
  }

  const updateStatus = async (requisitionId, newStatus) => {
    try {
        const updatedRequisition = await updateRequisitionBusinessStatus(requisitionId, newStatus);
        setRequisitions(prevRequisitions => 
            prevRequisitions.map(req => 
                req.id === requisitionId ? { ...req, business_status: updatedRequisition.business_status, integration_status: updatedRequisition.integration_status } : req
            )
        );
        return updatedRequisition;
    } catch (error) {
        logger.error(`Error updating status for requisition ${requisitionId}:`, error);
        throw error;
    }
  };

  return {
    requisitions,
    loading,
    error,
    pagination,
    goToPage,
    refetch,
    updateStatus,
  };
}
