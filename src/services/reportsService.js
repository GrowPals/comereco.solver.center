
import { supabase } from '@/lib/customSupabaseClient';
import { getUserAccessContext } from '@/lib/accessControl';
import { scopeToCompany } from '@/lib/companyScope';
import { formatErrorMessage } from '@/utils/errorHandler';
import logger from '@/utils/logger';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_TEMPLATE = [
    { key: 'draft', label: 'Borradores', color: '#64748b' },
    { key: 'submitted', label: 'Pendientes', color: '#f59e0b' },
    { key: 'approved', label: 'Aprobadas', color: '#10b981' },
    { key: 'rejected', label: 'Rechazadas', color: '#ef4444' },
];

const mapStatusCounts = (counts) =>
    STATUS_TEMPLATE.map(({ key, label, color }) => ({
        name: label,
        value: counts[key] || 0,
        color,
    }));

const buildEmptyStatus = () => mapStatusCounts({});

const applyRequisitionAccessFilter = (builder, access, { requireProjects = true } = {}) => {
    let query = scopeToCompany(builder, access);

    if (access.isAdmin) {
        return { query, empty: false };
    }

    if (access.isSupervisor) {
        const projectIds = access.accessibleProjectIds || [];
        if (requireProjects && projectIds.length === 0) {
            return { query, empty: true };
        }
        if (projectIds.length > 0) {
            query = query.in('project_id', projectIds);
        }
        return { query, empty: false };
    }

    query = query.eq('created_by', access.userId);
    return { query, empty: false };
};

/**
 * Servicio para obtener datos de reportes y analytics
 */

// Obtener estadísticas de requisiciones por estado
export const getRequisitionsByStatus = async () => {
    const access = await getUserAccessContext();

    const { query, empty } = applyRequisitionAccessFilter(
        supabase.from('requisitions').select('business_status, project_id, created_by, company_id'),
        access
    );

    if (empty) {
        return buildEmptyStatus();
    }

    const { data, error } = await query;

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
        if (Object.prototype.hasOwnProperty.call(statusCount, status)) {
            statusCount[status]++;
        }
    });

    return mapStatusCounts(statusCount);
};

// Obtener montos totales por mes (últimos 6 meses)
export const getMonthlyRequisitionsAmount = async () => {
    const access = await getUserAccessContext();

    const monthsData = [];

    for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const startDate = startOfMonth(date);
        const endDate = endOfMonth(date);

        const baseQuery = supabase
            .from('requisitions')
            .select('total_amount, business_status, project_id, created_by, company_id')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

        const { query, empty } = applyRequisitionAccessFilter(baseQuery, access);
        if (empty) {
            monthsData.push({
                mes: format(date, 'MMM', { locale: es }),
                aprobadas: 0,
                pendientes: 0,
            });
            continue;
        }

        const { data, error } = await query;

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
    const access = await getUserAccessContext();

    // Obtener todas las requisiciones aprobadas de la empresa
    const baseQuery = supabase
        .from('requisitions')
        .select('id, project_id, created_by, company_id')
        .eq('business_status', 'approved');

    const { query, empty } = applyRequisitionAccessFilter(baseQuery, access);
    if (empty) {
        return [];
    }

    const { data: requisitions, error: reqError } = await query;

    if (reqError) {
        logger.error('Error fetching requisitions:', reqError);
        throw new Error(formatErrorMessage(reqError));
    }

    if (!requisitions || requisitions.length === 0) {
        return [];
    }

    const requisitionIds = requisitions.map(r => r.id);

    // Obtener los items de esas requisiciones (sin join para evitar PGRST201)
    const { data: items, error: itemsError } = await supabase
        .from('requisition_items')
        .select('product_id, quantity')
        .in('requisition_id', requisitionIds);

    if (itemsError) {
        logger.error('Error fetching requisition items:', itemsError);
        // Devolver array vacío en lugar de lanzar error
        return [];
    }

    if (!items || items.length === 0) {
        return [];
    }

    // Obtener IDs únicos de productos
    const uniqueProductIds = [...new Set(items.map(item => item.product_id))];

    // Obtener nombres de productos en consulta separada para evitar error de permisos
    let productNames = {};
    try {
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, name')
            .in('id', uniqueProductIds);

        if (productsError) {
            logger.error('Error fetching product names:', productsError);
        } else if (products) {
            products.forEach(p => {
                productNames[p.id] = p.name;
            });
        }
    } catch (err) {
        logger.error('Exception fetching product names:', err);
    }

    // Agrupar por producto y sumar cantidades
    const productMap = {};

    items.forEach(item => {
        const productId = item.product_id;
        const productName = productNames[productId] || `Producto ${productId.slice(0, 8)}`;
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
    const access = await getUserAccessContext();

    const totalQueryBase = supabase
        .from('requisitions')
        .select('*', { count: 'exact', head: true });
    const { query: totalQuery, empty: totalEmpty } = applyRequisitionAccessFilter(totalQueryBase, access);
    let totalRequisitions = 0;
    if (!totalEmpty) {
        const { count, error } = await totalQuery;
        if (error) {
            logger.error('Error counting requisitions:', error);
        } else {
            totalRequisitions = count || 0;
        }
    }

    const approvedBase = supabase
        .from('requisitions')
        .select('total_amount, project_id, created_by, company_id')
        .eq('business_status', 'approved');
    const { query: approvedQuery, empty: approvedEmpty } = applyRequisitionAccessFilter(approvedBase, access);
    let totalApproved = 0;
    if (!approvedEmpty) {
        const { data: approvedData, error: approvedError } = await approvedQuery;
        if (approvedError) {
            logger.error('Error fetching approved requisitions:', approvedError);
        } else {
            totalApproved = approvedData?.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0) || 0;
        }
    }

    const pendingBase = supabase
        .from('requisitions')
        .select('*', { count: 'exact', head: true })
        .eq('business_status', 'submitted');
    const { query: pendingQuery, empty: pendingEmpty } = applyRequisitionAccessFilter(pendingBase, access);
    let pendingApprovals = 0;
    if (!pendingEmpty) {
        const { count: pendingCount, error: pendingError } = await pendingQuery;
        if (pendingError) {
            logger.error('Error counting pending requisitions:', pendingError);
        } else {
            pendingApprovals = pendingCount || 0;
        }
    }

    let activeUsers = 0;
    if (access.isAdmin) {
        const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', access.companyId)
            .eq('is_active', true);
        if (error) {
            logger.error('Error counting active users:', error);
        } else {
            activeUsers = count || 0;
        }
    } else if (access.isSupervisor) {
        const manageable = access.manageableUserIds || [];
        activeUsers = manageable.length;
    } else {
        activeUsers = 1;
    }

    return {
        totalRequisitions,
        totalApproved: Math.round(totalApproved),
        pendingApprovals,
        activeUsers,
    };
};

// Obtener requisiciones por usuario (top 5)
export const getRequisitionsByUser = async () => {
    const access = await getUserAccessContext();

    const baseQuery = supabase
        .from('requisitions')
        .select('created_by, project_id, company_id');

    const { query, empty } = applyRequisitionAccessFilter(baseQuery, access);
    if (empty) {
        return [];
    }

    const { data: requisitions, error } = await query;

    if (error) {
        logger.error('Error fetching requisitions by user:', error);
        return [];
    }

    if (!requisitions || requisitions.length === 0) {
        return [];
    }

    let filteredRequisitions = requisitions;
    if (access.isSupervisor) {
        const manageable = new Set(access.manageableUserIds || []);
        filteredRequisitions = requisitions.filter(req => manageable.has(req.created_by));
        if (filteredRequisitions.length === 0) {
            return [];
        }
    }

    if (access.isUser) {
        filteredRequisitions = requisitions.filter(req => req.created_by === access.userId);
        if (filteredRequisitions.length === 0) {
            return [];
        }
    }

    const uniqueUserIds = [...new Set(filteredRequisitions.map(req => req.created_by))];

    let userNames = {};
    if (uniqueUserIds.length > 0) {
        try {
            let profilesQuery = supabase
                .from('profiles')
                .select('id, full_name');

            if (access.isAdmin) {
                profilesQuery = profilesQuery
                    .in('id', uniqueUserIds)
                    .eq('company_id', access.companyId);
            } else if (access.isSupervisor) {
                profilesQuery = profilesQuery.in('id', uniqueUserIds);
            } else {
                profilesQuery = profilesQuery.eq('id', access.userId);
            }

            const { data: profiles, error: profilesError } = await profilesQuery;

            if (profilesError) {
                logger.error('Error fetching profile names:', profilesError);
            } else if (profiles) {
                profiles.forEach(p => {
                    userNames[p.id] = p.full_name;
                });
            }
        } catch (err) {
            logger.error('Exception fetching profile names:', err);
        }
    }

    const userMap = {};

    filteredRequisitions.forEach(req => {
        const userId = req.created_by;
        const userName = userNames[userId] || `Usuario ${userId.slice(0, 8)}`;

        if (!userMap[userId]) {
            userMap[userId] = {
                nombre: userName,
                total: 0,
            };
        }
        userMap[userId].total++;
    });

    const topUsers = Object.values(userMap)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    return topUsers;
};
