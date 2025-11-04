import { supabase } from '@/lib/customSupabaseClient';
import { getCachedSession } from '@/lib/supabaseHelpers';
import logger from '@/utils/logger';

const ACCESS_CACHE_TTL = 5000; // 5 segundos
let accessCache = null;
let accessCacheTime = 0;

const buildApprovalMap = (rows = []) => {
  const map = new Map();

  rows.forEach((row) => {
    if (!row || !row.project_id || !row.user_id) return;
    if (!map.has(row.project_id)) {
      map.set(row.project_id, new Map());
    }
    map.get(row.project_id).set(row.user_id, row.requires_approval !== false);
  });

  return map;
};

const mapToObject = (map) => {
  const obj = {};
  map.forEach((innerMap, projectId) => {
    obj[projectId] = {};
    innerMap.forEach((value, userId) => {
      obj[projectId][userId] = value;
    });
  });
  return obj;
};

export const getRequiresApprovalFromContext = (accessContext, projectId, userId) => {
  if (!accessContext || !projectId || !userId) {
    return null;
  }

  const approvals = accessContext.approvalsByProject;
  if (!approvals) {
    return null;
  }

  const resolveFromMap = (map) => {
    if (!map || !map.has(projectId)) {
      return null;
    }
    const value = map.get(projectId);
    if (value instanceof Map) {
      return value.has(userId) ? value.get(userId) : null;
    }
    return typeof value === 'boolean' ? value : null;
  };

  if (approvals instanceof Map) {
    return resolveFromMap(approvals);
  }

  const projectApprovals = approvals[projectId];
  if (!projectApprovals) {
    return null;
  }

  if (projectApprovals instanceof Map) {
    return projectApprovals.has(userId) ? projectApprovals.get(userId) : null;
  }

  if (Object.prototype.hasOwnProperty.call(projectApprovals, userId)) {
    return projectApprovals[userId];
  }

  return null;
};

export const getUserAccessContext = async ({ forceRefresh = false } = {}) => {
  const now = Date.now();

  if (!forceRefresh && accessCache && (now - accessCacheTime) < ACCESS_CACHE_TTL) {
    return accessCache;
  }

  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error('Sesión no válida. Por favor, inicia sesión nuevamente.');
  }

  const userId = session.user.id;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id, role_v2')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    logger.error('Error fetching user profile for access context:', profileError);
    throw new Error('No se pudo obtener el perfil del usuario.');
  }

  const role = profile.role_v2;
  const isAdmin = role === 'admin';
  const isSupervisor = role === 'supervisor';
  const isUser = role === 'user';

  const access = {
    userId,
    companyId: profile.company_id,
    role,
    isAdmin,
    isSupervisor,
    isUser,
    allProjects: isAdmin,
    supervisedProjectIds: [],
    memberProjectIds: [],
    accessibleProjectIds: [],
    manageableUserIds: new Set([userId]),
    approvalsByProject: new Map(),
  };

  const { data: ownMemberships, error: membershipsError } = await supabase
    .from('project_members')
    .select('project_id, user_id, requires_approval')
    .eq('user_id', userId);

  if (membershipsError) {
    logger.error('Error fetching user memberships for access context:', membershipsError);
    throw new Error('No se pudieron obtener las membresías del usuario.');
  }

  const membershipProjectIds = ownMemberships?.map((row) => row.project_id) || [];
  access.memberProjectIds = [...new Set(membershipProjectIds)];

  const ownApprovalMap = buildApprovalMap(ownMemberships);

  if (isAdmin) {
    access.accessibleProjectIds = null;
    access.manageableUserIds = null;
    access.approvalsByProject = mapToObject(ownApprovalMap);
  } else if (isSupervisor) {
    const { data: supervisedProjects, error: supervisedError } = await supabase
      .from('projects')
      .select('id')
      .eq('supervisor_id', userId);

    if (supervisedError) {
      logger.error('Error fetching supervised projects:', supervisedError);
      throw new Error('No se pudieron obtener los proyectos supervisados.');
    }

    const supervisedIds = supervisedProjects?.map((p) => p.id) || [];
    access.supervisedProjectIds = supervisedIds;

    const accessibleSet = new Set([...supervisedIds, ...access.memberProjectIds]);

    if (accessibleSet.size === 0) {
      access.accessibleProjectIds = [];
      access.approvalsByProject = ownApprovalMap;
    } else {
      const projectIds = [...accessibleSet];
      access.accessibleProjectIds = projectIds;

      const { data: teamMemberships, error: teamError } = await supabase
        .from('project_members')
        .select('project_id, user_id, requires_approval')
        .in('project_id', projectIds);

      if (teamError) {
        logger.error('Error fetching team memberships:', teamError);
        throw new Error('No se pudieron obtener los miembros del proyecto.');
      }

      const approvals = buildApprovalMap(teamMemberships);
      ownApprovalMap.forEach((userMap, projectId) => {
        if (!approvals.has(projectId)) {
          approvals.set(projectId, userMap);
        }
      });

      access.approvalsByProject = mapToObject(approvals);

      teamMemberships?.forEach((row) => {
        if (row?.user_id) {
          access.manageableUserIds.add(row.user_id);
        }
      });
      access.manageableUserIds.add(userId);
    }
  } else {
    access.accessibleProjectIds = access.memberProjectIds;
    access.approvalsByProject = mapToObject(ownApprovalMap);
  }

  access.manageableUserIds = access.manageableUserIds ? [...access.manageableUserIds] : null;

  accessCache = access;
  accessCacheTime = now;

  return access;
};

export const invalidateAccessContext = () => {
  accessCache = null;
  accessCacheTime = 0;
};

if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange(() => {
    invalidateAccessContext();
  });
}
