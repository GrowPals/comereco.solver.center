
import { supabase } from '@/lib/customSupabaseClient';
import { getCachedSession, ensureScopedCompanyId } from '@/lib/supabaseHelpers';
import { getUserAccessContext, invalidateAccessContext } from '@/lib/accessControl';
import { scopeToCompany } from '@/lib/companyScope';
import logger from '@/utils/logger';
import { formatErrorMessage } from '@/utils/errorHandler';

const PROFILE_BASE_FIELDS = ['id', 'full_name', 'avatar_url', 'role_v2'];
let canSelectProfileEmail = true;

const buildProfileSelect = () => {
  const fields = [...PROFILE_BASE_FIELDS];
  if (canSelectProfileEmail) {
    fields.push('email');
  }
  return fields.join(', ');
};

const executeProfileSelect = async (configure, { single = false } = {}) => {
  const run = async () => {
    let query = supabase.from('profiles').select(buildProfileSelect());
    query = configure(query);
    if (single) {
      return await query.single();
    }
    return await query;
  };

  let result = await run();
  if (result?.error?.code === '42703' && canSelectProfileEmail) {
    canSelectProfileEmail = false;
    result = await run();
  }
  return result;
};

/**
 * CORREGIDO: Valida sesión antes de hacer queries
 * Obtiene todos los proyectos. La RLS se encarga de filtrar según el rol.
 * FIX: Evitar embeds ambiguos según REFERENCIA_TECNICA_BD_SUPABASE.md
 * @returns {Promise<Array>} Lista de proyectos.
 */
export const getAllProjects = async () => {
  const access = await getUserAccessContext();

  let query = supabase
    .from('projects')
    .select('id, company_id, name, description, status, supervisor_id, created_by, created_at, updated_at');

  query = scopeToCompany(query, access);

  if (!access.allProjects) {
    const projectIds = access.accessibleProjectIds || [];
    if (!projectIds.length) {
      return [];
    }
    query = query.in('id', projectIds);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching projects:', error);
    throw new Error(formatErrorMessage(error));
  }

  const supervisorIds = [...new Set(data.map(p => p.supervisor_id).filter(Boolean))];
  let supervisors = {};
  if (supervisorIds.length > 0) {
    const { data: supervisorData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', supervisorIds);
    
    supervisorData?.forEach(s => { supervisors[s.id] = s; });
  }

  // Combinar proyectos con supervisores
  return data.map(project => ({
    ...project,
    supervisor: project.supervisor_id ? supervisors[project.supervisor_id] : null
  }));
};

/**
 * CORREGIDO: Valida sesión antes de hacer queries
 * Obtiene los proyectos donde el usuario actual es miembro.
 * FIX: Evitar embeds ambiguos según REFERENCIA_TECNICA_BD_SUPABASE.md
 * @returns {Promise<Array>} Lista de proyectos.
 */
export const getMyProjects = async () => {
  const access = await getUserAccessContext();

  if (access.allProjects) {
    return getAllProjects();
  }

  const projectIds = access.accessibleProjectIds || [];
  if (!projectIds.length) {
    return [];
  }

  const projectsQuery = supabase
    .from('projects')
    .select('id, company_id, name, description, status, supervisor_id, created_by, created_at, updated_at')
    .in('id', projectIds);

  const { data: projects, error } = await scopeToCompany(projectsQuery, access);

  if (error) {
    logger.error('Error fetching accessible projects:', error);
    throw new Error(formatErrorMessage(error));
  }

  return projects || [];
};

/**
 * CORREGIDO: Valida sesión y maneja errores correctamente
 * Crea un nuevo proyecto.
 * @param {object} projectData - Datos del proyecto.
 * @returns {Promise<object>} El proyecto creado.
 */
export const createProject = async (projectData) => {
  // Validar datos requeridos
  if (!projectData.name || !projectData.name.trim()) {
    throw new Error("El nombre del proyecto es requerido.");
  }
  if (projectData.name.trim().length < 2) {
    throw new Error("El nombre del proyecto debe tener al menos 2 caracteres.");
  }

  const access = await getUserAccessContext();
  if (!access.isAdmin && !access.isSupervisor) {
    throw new Error('No tienes permisos para crear proyectos.');
  }

  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error('Usuario no autenticado.');
  }

  const { companyId, error: companyError } = await ensureScopedCompanyId();
  if (companyError || !companyId) {
    throw new Error(companyError?.message || 'Selecciona una empresa para crear proyectos.');
  }
  
  // Limpiar y normalizar datos
  const cleanedData = {
    ...projectData,
    name: projectData.name.trim(),
    description: projectData.description?.trim() || '',
    status: (projectData.status || 'active').toLowerCase(),
    company_id: companyId,
    created_by: session.user.id
  };

  const allowedStatuses = ['active', 'archived'];
  if (!allowedStatuses.includes(cleanedData.status)) {
    cleanedData.status = 'active';
  }

  if (!access.isAdmin) {
    if (!access.userId) {
      throw new Error('No se pudo determinar el supervisor actual.');
    }
    cleanedData.supervisor_id = String(access.userId);
  } else if (projectData.supervisor_id) {
    cleanedData.supervisor_id = String(projectData.supervisor_id);
  } else {
    cleanedData.supervisor_id = null;
  }

  const { data, error } = await supabase
    .from('projects')
    .insert([cleanedData])
    .select()
    .single();
    
  if (error) {
    logger.error('Error creating project:', error);
    // Manejar errores específicos
    if (error.code === '23505') { // Unique violation
      throw new Error("Ya existe un proyecto con este nombre.");
    }
    throw new Error(formatErrorMessage(error));
  }
  
  if (!data) {
    throw new Error("No se pudo crear el proyecto.");
  }

  invalidateAccessContext();
  return data;
};

/**
 * CORREGIDO: Valida sesión antes de hacer queries
 * Actualiza un proyecto existente.
 * RLS verifica permisos según rol (admin puede editar todos, supervisor solo los suyos).
 * @param {object} projectData - Datos a actualizar, debe incluir el id.
 * @returns {Promise<object>} El proyecto actualizado.
 */
export const updateProject = async (projectData) => {
  // Validar datos de entrada
  if (!projectData || !projectData.id) {
    throw new Error("Datos del proyecto inválidos.");
  }

  const { id, ...updateData } = projectData;
  
  // Validar nombre si se está actualizando
  if (projectData.name !== undefined) {
    if (!projectData.name || !projectData.name.trim()) {
      throw new Error("El nombre del proyecto no puede estar vacío.");
    }
    if (projectData.name.trim().length < 2) {
      throw new Error("El nombre del proyecto debe tener al menos 2 caracteres.");
    }
  }

  const access = await getUserAccessContext();
  if (!access.isAdmin) {
    if (!access.supervisedProjectIds.includes(id)) {
      throw new Error('No tienes permisos para editar este proyecto.');
    }
  }

  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error('Sesión no válida. Por favor, inicia sesión nuevamente.');
  }

  // Limpiar y normalizar datos
  const cleanedData = { ...updateData };
  if (cleanedData.name) cleanedData.name = cleanedData.name.trim();
  if (cleanedData.description !== undefined) {
    cleanedData.description = cleanedData.description?.trim() || '';
  }
  if (cleanedData.supervisor_id !== undefined) {
    cleanedData.supervisor_id = cleanedData.supervisor_id ? String(cleanedData.supervisor_id) : null;
  }

  if (cleanedData.status !== undefined && typeof cleanedData.status === 'string') {
    const allowedStatuses = ['active', 'archived'];
    cleanedData.status = allowedStatuses.includes(cleanedData.status.toLowerCase())
      ? cleanedData.status.toLowerCase()
      : 'active';
  }
  
  const { data, error } = await supabase
    .from('projects')
    .update(cleanedData)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    logger.error('Error updating project:', error);
    // Manejar errores específicos
    if (error.code === '23505') { // Unique violation
      throw new Error("Ya existe un proyecto con este nombre.");
    }
    if (error.code === 'PGRST116') { // Not found
      throw new Error("Proyecto no encontrado.");
    }
    throw new Error(formatErrorMessage(error));
  }
  
  if (!data) {
    throw new Error("No se pudo actualizar el proyecto.");
  }
  invalidateAccessContext();
  return data;
};

/**
 * CORREGIDO: Valida sesión antes de hacer queries
 * Elimina un proyecto.
 * RLS verifica permisos según rol (admin puede eliminar todos, supervisor solo los suyos).
 * @param {string} projectId - ID del proyecto a eliminar.
 */
export const deleteProject = async (projectId) => {
  const access = await getUserAccessContext();
  if (!access.isAdmin) {
    if (!access.supervisedProjectIds.includes(projectId)) {
      throw new Error('No tienes permisos para eliminar este proyecto.');
    }
  }

  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error('Sesión no válida. Por favor, inicia sesión nuevamente.');
  }

  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) {
    logger.error('Error deleting project:', error);
    throw new Error(formatErrorMessage(error));
  }

  invalidateAccessContext();
};

/**
 * CORREGIDO: Valida sesión antes de hacer queries
 * Obtiene los miembros de un proyecto.
 * FIX: Evitar embeds ambiguos según REFERENCIA_TECNICA_BD_SUPABASE.md
 * RLS filtra automáticamente según permisos (solo usuarios que pueden ver el proyecto).
 * @param {string} projectId - ID del proyecto.
 * @returns {Promise<Array>} Lista de miembros.
 */
export const getProjectMembers = async (projectId) => {
    const access = await getUserAccessContext();

    if (!access.isAdmin) {
        const allowedProjects = access.accessibleProjectIds || [];
        if (!allowedProjects.includes(projectId)) {
            throw new Error('No tienes permisos para ver los miembros de este proyecto.');
        }
    }

    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error('Sesión no válida. Por favor, inicia sesión nuevamente.');
    }

    const { data: memberships, error: membersError } = await supabase
        .from('project_members')
        .select('user_id, role_in_project, added_at, requires_approval')
        .eq('project_id', projectId);
    
    if (membersError) {
        logger.error('Error fetching project members:', membersError);
        throw new Error(formatErrorMessage(membersError));
    }

    if (!memberships || memberships.length === 0) return [];

    const userIds = memberships.map(m => m.user_id);
    const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

    if (usersError) {
        logger.error('Error fetching users for project members:', usersError);
        throw new Error(formatErrorMessage(usersError));
    }

    // Combinar membresías con datos de usuarios
    const usersMap = {};
    users?.forEach(u => { usersMap[u.id] = u; });

    return memberships.map(m => ({
        ...m,
        user: usersMap[m.user_id] || null
    }));
};

/**
 * CORREGIDO: Valida sesión antes de hacer queries
 * Agrega un miembro a un proyecto.
 * RLS verifica permisos según rol (admin y supervisor del proyecto pueden agregar miembros).
 * @param {string} projectId - ID del proyecto.
 * @param {string} userId - ID del usuario a agregar.
 * @param {string} roleInProject - Rol en el proyecto (default: 'member').
 * @param {boolean} requiresApproval - Si el usuario requiere aprobación para enviar requisiciones (default: true).
 */
export const addProjectMember = async (projectId, userId, roleInProject = 'member', requiresApproval = true) => {
    const access = await getUserAccessContext();
    if (!access.isAdmin) {
        if (!access.supervisedProjectIds.includes(projectId)) {
            throw new Error('No tienes permisos para agregar miembros a este proyecto.');
        }
    }

    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error('Sesión no válida. Por favor, inicia sesión nuevamente.');
    }

    const { error } = await supabase
        .from('project_members')
        .insert({
            project_id: projectId,
            user_id: userId,
            role_in_project: roleInProject,
            requires_approval: requiresApproval
        });
    if (error) {
        logger.error('Error adding project member:', error);
        throw new Error(formatErrorMessage(error));
    }

    invalidateAccessContext();
};

/**
 * CORREGIDO: Valida sesión antes de hacer queries
 * Elimina un miembro de un proyecto.
 * RLS verifica permisos según rol (admin y supervisor del proyecto pueden eliminar miembros).
 * @param {string} projectId - ID del proyecto.
 * @param {string} userId - ID del usuario a eliminar.
 */
export const removeProjectMember = async (projectId, userId) => {
    const access = await getUserAccessContext();
    if (!access.isAdmin) {
        if (!access.supervisedProjectIds.includes(projectId)) {
            throw new Error('No tienes permisos para eliminar miembros de este proyecto.');
        }
    }

    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error('Sesión no válida. Por favor, inicia sesión nuevamente.');
    }

    const { error } = await supabase
        .from('project_members')
        .delete()
        .match({ project_id: projectId, user_id: userId });
    if (error) {
        logger.error('Error removing project member:', error);
        throw new Error(formatErrorMessage(error));
    }

    invalidateAccessContext();
};

/**
 * NUEVO: Actualiza el rol de un miembro en un proyecto.
 * RLS verifica permisos según rol (admin y supervisor del proyecto pueden actualizar roles).
 * @param {string} projectId - ID del proyecto.
 * @param {string} userId - ID del usuario a actualizar.
 * @param {string} roleInProject - Nuevo rol en el proyecto ('member', 'lead', etc.).
 */
export const updateProjectMemberRole = async (projectId, userId, roleInProject) => {
    const access = await getUserAccessContext();
    if (!access.isAdmin) {
        if (!access.supervisedProjectIds.includes(projectId)) {
            throw new Error('No tienes permisos para actualizar miembros de este proyecto.');
        }
    }

    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error('Sesión no válida. Por favor, inicia sesión nuevamente.');
    }

    const { error } = await supabase
        .from('project_members')
        .update({ role_in_project: roleInProject })
        .match({ project_id: projectId, user_id: userId });

    if (error) {
        logger.error('Error updating project member role:', error);
        throw new Error(formatErrorMessage(error));
    }

    invalidateAccessContext();
};

/**
 * NUEVO: Actualiza si un miembro requiere aprobación para enviar requisiciones.
 * RLS verifica permisos según rol (admin y supervisor del proyecto pueden actualizar).
 * @param {string} projectId - ID del proyecto.
 * @param {string} userId - ID del usuario a actualizar.
 * @param {boolean} requiresApproval - Si el usuario requiere aprobación.
 */
export const updateProjectMemberApproval = async (projectId, userId, requiresApproval) => {
    const access = await getUserAccessContext();
    if (!access.isAdmin) {
        if (!access.supervisedProjectIds.includes(projectId)) {
            throw new Error('No tienes permisos para actualizar esta configuración.');
        }
    }

    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error('Sesión no válida. Por favor, inicia sesión nuevamente.');
    }

    // Validar que requiresApproval sea booleano
    if (typeof requiresApproval !== 'boolean') {
        throw new Error("El parámetro requiresApproval debe ser un booleano.");
    }

    const { error } = await supabase
        .from('project_members')
        .update({ requires_approval: requiresApproval })
        .match({ project_id: projectId, user_id: userId });

    if (error) {
        logger.error('Error updating project member approval:', error);
        throw new Error(formatErrorMessage(error));
    }

    invalidateAccessContext();
};

/**
 * Obtiene el detalle completo de un proyecto incluyendo miembros y requisiciones
 * @param {string} projectId - El ID del proyecto
 * @returns {Promise<Object>} El proyecto con sus relaciones
 */
export const getProjectDetails = async (projectId) => {
  if (!projectId) {
    throw new Error("El ID del proyecto es requerido.");
  }

  const access = await getUserAccessContext();
  if (!access.isAdmin) {
    const allowedProjects = access.accessibleProjectIds || [];
    if (!allowedProjects.includes(projectId)) {
      throw new Error('No tienes permisos para ver este proyecto.');
    }
  }

  // Validar sesión
  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }

  // Obtener proyecto
  const projectQuery = scopeToCompany(
    supabase
      .from('projects')
      .select('id, company_id, name, description, status, supervisor_id, created_by, created_at, updated_at')
      .eq('id', projectId),
    access
  );

  const { data: project, error: projectError } = await projectQuery.single();

  if (projectError) {
    logger.error('Error fetching project:', projectError);
    throw new Error(formatErrorMessage(projectError));
  }

  if (!project) {
    throw new Error("Proyecto no encontrado.");
  }

  // Obtener supervisor
  let supervisor = null;
  if (project.supervisor_id) {
    const { data: supervisorData, error: supervisorError } = await executeProfileSelect(
      (query) => query.eq('id', project.supervisor_id),
      { single: true }
    );
    if (supervisorError) {
      logger.error('Error fetching supervisor profile:', supervisorError);
      throw new Error(formatErrorMessage(supervisorError));
    }
    supervisor = supervisorData ?? null;
  }

  // Obtener miembros del proyecto
  const { data: memberships, error: membersError } = await supabase
    .from('project_members')
    .select('project_id, user_id, role_in_project, requires_approval, added_at')
    .eq('project_id', projectId);

  if (membersError) {
    logger.error('Error fetching project members:', membersError);
  }

  // Obtener detalles de los miembros
  let members = [];
  if (memberships && memberships.length > 0) {
    const memberIds = [...new Set(memberships.map(m => m.user_id).filter(Boolean))];
    let profilesMap = new Map();

    if (memberIds.length > 0) {
      const { data: memberProfiles, error: memberProfilesError } = await executeProfileSelect(
        (query) => query.in('id', memberIds)
      );

      if (memberProfilesError) {
        logger.error('Error fetching member profiles:', memberProfilesError);
        throw new Error(formatErrorMessage(memberProfilesError));
      }

      if (memberProfiles) {
        profilesMap = new Map(memberProfiles.map(p => [p.id, p]));
      }
    }

    members = memberships.map(m => {
      const profile = profilesMap.get(m.user_id) || null;
      return {
        ...m,
        membership_id: `${projectId}:${m.user_id}`,
        user: profile,
        profile,
      };
    });
  }

  // Obtener requisiciones del proyecto
  const { data: requisitions, error: requisitionsError } = await supabase
    .from('requisitions')
    .select('id, internal_folio, created_at, business_status, total_amount, created_by')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (requisitionsError) {
    logger.error('Error fetching project requisitions:', requisitionsError);
  }

  // Obtener creadores de requisiciones
  let requisitionsWithCreators = [];
  if (requisitions && requisitions.length > 0) {
    const creatorIds = [...new Set(requisitions.map(r => r.created_by).filter(Boolean))];
    const { data: creators } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', creatorIds);

    if (creators) {
      const creatorsMap = new Map(creators.map(c => [c.id, c]));
      requisitionsWithCreators = requisitions.map(r => ({
        ...r,
        creator: creatorsMap.get(r.created_by) || null
      }));
    }
  }

  return {
    ...project,
    supervisor,
    members,
    requisitions: requisitionsWithCreators
  };
};
