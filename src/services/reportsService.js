
import { supabase } from '@/lib/customSupabaseClient';
import { getCachedSession, getCachedCompanyId } from '@/lib/supabaseHelpers';
import { formatErrorMessage } from '@/utils/errorHandler';
import logger from '@/utils/logger';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Servicio para obtener datos de reportes y analytics
 */

// Obtener estadísticas de requisiciones por estado
export const getRequisitionsByStatus = async () => {
    const { session } = await getCachedSession();
    if (!session) throw new Error('No autenticado');

    const { companyId } = await getCachedCompanyId();
    if (!companyId) throw new Error('Empresa no encontrada');

    const { data, error } = await supabase
        .from('requisitions')
        .select('business_status')
        .eq('company_id', companyId);

    if (error) {
        logger.error('Error fetching requisitions by status:', error);
        throw new Error(formatErrorMessage(error));
    }

    // Agrupar por estado
    const statusCount = {
        draft: 0,
        submitted: 0,
        approved: 0,
        rejected: 0,
    };

    data.forEach((req) => {
        const status = req.business_status || 'draft';
        if (statusCount.hasOwnProperty(status)) {
            statusCount[status]++;
        }
    });

    return [
        { name: 'Borradores', value: statusCount.draft, color: '#64748b' },
        { name: 'Pendientes', value: statusCount.submitted, color: '#f59e0b' },
        { name: 'Aprobadas', value: statusCount.approved, color: '#10b981' },
        { name: 'Rechazadas', value: statusCount.rejected, color: '#ef4444' },
    ];
};

// Obtener montos totales por mes (últimos 6 meses)
export const getMonthlyRequisitionsAmount = async () => {
    const { session } = await getCachedSession();
    if (!session) throw new Error('No autenticado');

    const { companyId } = await getCachedCompanyId();
    if (!companyId) throw new Error('Empresa no encontrada');

    const monthsData = [];

    for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const startDate = startOfMonth(date);
        const endDate = endOfMonth(date);

        const { data, error } = await supabase
            .from('requisitions')
            .select('total_amount, business_status')
            .eq('company_id', companyId)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

        if (error) {
            logger.error('Error fetching monthly data:', error);
            continue;
        }

        const monthName = format(date, 'MMM', { locale: es });
        const totalApproved = data
            .filter(r => r.business_status === 'approved')
            .reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);

        const totalPending = data
            .filter(r => r.business_status === 'submitted')
            .reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);

        monthsData.push({
            mes: monthName,
            aprobadas: Math.round(totalApproved),
            pendientes: Math.round(totalPending),
        });
    }

    return monthsData;
};

// Obtener productos más solicitados
export const getTopProducts = async (limit = 10) => {
    const { session } = await getCachedSession();
    if (!session) throw new Error('No autenticado');

    const { companyId } = await getCachedCompanyId();
    if (!companyId) throw new Error('Empresa no encontrada');

    // Obtener todas las requisiciones aprobadas de la empresa
    const { data: requisitions, error: reqError } = await supabase
        .from('requisitions')
        .select('id')
        .eq('company_id', companyId)
        .eq('business_status', 'approved');

    if (reqError) {
        logger.error('Error fetching requisitions:', reqError);
        throw new Error(formatErrorMessage(reqError));
    }

    if (!requisitions || requisitions.length === 0) {
        return [];
    }

    const requisitionIds = requisitions.map(r => r.id);

    // Obtener los items de esas requisiciones con información del producto
    const { data: items, error: itemsError } = await supabase
        .from('requisition_items')
        .select('product_id, quantity, products(name)')
        .in('requisition_id', requisitionIds);

    if (itemsError) {
        logger.error('Error fetching requisition items:', itemsError);
        throw new Error(formatErrorMessage(itemsError));
    }

    // Agrupar por producto y sumar cantidades
    const productMap = {};

    items.forEach(item => {
        const productId = item.product_id;
        const productName = item.products?.name || 'Producto desconocido';
        const quantity = Number(item.quantity) || 0;

        if (!productMap[productId]) {
            productMap[productId] = {
                name: productName,
                total: 0,
            };
        }
        productMap[productId].total += quantity;
    });

    // Convertir a array y ordenar por cantidad
    const topProducts = Object.values(productMap)
        .sort((a, b) => b.total - a.total)
        .slice(0, limit)
        .map(p => ({
            producto: p.name,
            cantidad: p.total,
        }));

    return topProducts;
};

// Obtener estadísticas generales
export const getGeneralStats = async () => {
    const { session } = await getCachedSession();
    if (!session) throw new Error('No autenticado');

    const { companyId } = await getCachedCompanyId();
    if (!companyId) throw new Error('Empresa no encontrada');

    // Total de requisiciones
    const { count: totalRequisitions } = await supabase
        .from('requisitions')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

    // Total aprobadas
    const { data: approved } = await supabase
        .from('requisitions')
        .select('total_amount')
        .eq('company_id', companyId)
        .eq('business_status', 'approved');

    const totalApproved = approved?.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0) || 0;

    // Total pendientes
    const { count: pendingCount } = await supabase
        .from('requisitions')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('business_status', 'submitted');

    // Total usuarios
    const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('is_active', true);

    return {
        totalRequisitions: totalRequisitions || 0,
        totalApproved: Math.round(totalApproved),
        pendingApprovals: pendingCount || 0,
        activeUsers: totalUsers || 0,
    };
};

// Obtener requisiciones por usuario (top 5)
export const getRequisitionsByUser = async () => {
    const { session } = await getCachedSession();
    if (!session) throw new Error('No autenticado');

    const { companyId } = await getCachedCompanyId();
    if (!companyId) throw new Error('Empresa no encontrada');

    const { data: requisitions, error } = await supabase
        .from('requisitions')
        .select('created_by, profiles(full_name)')
        .eq('company_id', companyId);

    if (error) {
        logger.error('Error fetching requisitions by user:', error);
        throw new Error(formatErrorMessage(error));
    }

    // Agrupar por usuario
    const userMap = {};

    requisitions.forEach(req => {
        const userId = req.created_by;
        const userName = req.profiles?.full_name || 'Usuario desconocido';

        if (!userMap[userId]) {
            userMap[userId] = {
                nombre: userName,
                total: 0,
            };
        }
        userMap[userId].total++;
    });

    // Ordenar y tomar top 5
    const topUsers = Object.values(userMap)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    return topUsers;
};
