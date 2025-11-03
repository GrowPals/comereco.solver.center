
import { supabase } from '@/lib/customSupabaseClient';
import { getCachedSession, getCachedCompanyId } from '@/lib/supabaseHelpers';
import logger from '@/utils/logger';
import { formatErrorMessage } from '@/utils/errorHandler';

/**
 * CORREGIDO: Valida sesión antes de hacer queries
 * Obtiene todos los proyectos. La RLS se encarga de filtrar según el rol.
 * FIX: Evitar embeds ambiguos según REFERENCIA_TECNICA_BD_SUPABASE.md
 * @returns {Promise<Array>} Lista de proyectos.
 */
export const getAllProjects = async () => {
  // Validar sesión antes de hacer queries (usando cache)
  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }

  // RLS filtra automáticamente según el rol del usuario
  const { data, error } = await supabase
    .from('projects')
    .select('id, company_id, name, description, status, supervisor_id, created_by, created_at, updated_at, active');
  
  if (error) {
    logger.error('Error fetching projects:', error);
    throw new Error(formatErrorMessage(error));
  }

  // Obtener supervisores por separado si es necesario
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
  // Validar sesión antes de hacer queries (usando cache)
  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }
  
  const { data: memberships, error } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', session.user.id);

  if (error) {
    logger.error('Error fetching my projects:', error);
    return [];
  }

  if (!memberships || memberships.length === 0) return [];

  const projectIds = memberships.map(m => m.project_id);
  // Optimizado: Solo seleccionar campos necesarios
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, company_id, name, description, status, supervisor_id, created_by, created_at, updated_at, active')
    .in('id', projectIds);

  if (projectsError) {
    logger.error('Error fetching projects:', projectsError);
    return [];
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

  // Optimizado: Usar helpers cacheados
  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Usuario no autenticado.");
  }

  const { companyId, error: companyError } = await getCachedCompanyId();
  if (companyError || !companyId) {
    throw new Error('No se pudo obtener el perfil del usuario.');
  }
  
  // Limpiar y normalizar datos
  const cleanedData = {
    ...projectData,
    name: projectData.name.trim(),
    description: projectData.description?.trim() || '',
    status: projectData.status || 'active',
    company_id: companyId,
    created_by: session.user.id
  };
  
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
  
  // Validar nombre si se está actualizando
  if (projectData.name !== undefined) {
    if (!projectData.name || !projectData.name.trim()) {
      throw new Error("El nombre del proyecto no puede estar vacío.");
    }
    if (projectData.name.trim().length < 2) {
      throw new Error("El nombre del proyecto debe tener al menos 2 caracteres.");
    }
  }

  // Validar sesión antes de hacer queries (usando cache)
  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }

  const { id, ...updateData } = projectData;
  
  // Limpiar y normalizar datos
  const cleanedData = { ...updateData };
  if (cleanedData.name) cleanedData.name = cleanedData.name.trim();
  if (cleanedData.description !== undefined) {
    cleanedData.description = cleanedData.description?.trim() || '';
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
  
  return data;
};

/**
 * CORREGIDO: Valida sesión antes de hacer queries
 * Elimina un proyecto.
 * RLS verifica permisos según rol (admin puede eliminar todos, supervisor solo los suyos).
 * @param {string} projectId - ID del proyecto a eliminar.
 */
export const deleteProject = async (projectId) => {
  // Validar sesión antes de hacer queries (usando cache)
  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }

  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) {
    logger.error('Error deleting project:', error);
    throw new Error(formatErrorMessage(error));
  }
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
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
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
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
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
};

/**
 * CORREGIDO: Valida sesión antes de hacer queries
 * Elimina un miembro de un proyecto.
 * RLS verifica permisos según rol (admin y supervisor del proyecto pueden eliminar miembros).
 * @param {string} projectId - ID del proyecto.
 * @param {string} userId - ID del usuario a eliminar.
 */
export const removeProjectMember = async (projectId, userId) => {
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
    }

    const { error } = await supabase
        .from('project_members')
        .delete()
        .match({ project_id: projectId, user_id: userId });
    if (error) {
        logger.error('Error removing project member:', error);
        throw new Error(formatErrorMessage(error));
    }
};

/**
 * NUEVO: Actualiza el rol de un miembro en un proyecto.
 * RLS verifica permisos según rol (admin y supervisor del proyecto pueden actualizar roles).
 * @param {string} projectId - ID del proyecto.
 * @param {string} userId - ID del usuario a actualizar.
 * @param {string} roleInProject - Nuevo rol en el proyecto ('member', 'lead', etc.).
 */
export const updateProjectMemberRole = async (projectId, userId, roleInProject) => {
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
    }

    const { error } = await supabase
        .from('project_members')
        .update({ role_in_project: roleInProject })
        .match({ project_id: projectId, user_id: userId });

    if (error) {
        logger.error('Error updating project member role:', error);
        throw new Error(formatErrorMessage(error));
    }
};

/**
 * NUEVO: Actualiza si un miembro requiere aprobación para enviar requisiciones.
 * RLS verifica permisos según rol (admin y supervisor del proyecto pueden actualizar).
 * @param {string} projectId - ID del proyecto.
 * @param {string} userId - ID del usuario a actualizar.
 * @param {boolean} requiresApproval - Si el usuario requiere aprobación.
 */
export const updateProjectMemberApproval = async (projectId, userId, requiresApproval) => {
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
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

  // Validar sesión
  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }

  // Obtener proyecto
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, company_id, name, description, status, supervisor_id, created_by, created_at, updated_at, active')
    .eq('id', projectId)
    .single();

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
    const { data: supervisorData } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .eq('id', project.supervisor_id)
      .single();
    supervisor = supervisorData;
  }

  // Obtener miembros del proyecto
  const { data: memberships, error: membersError } = await supabase
    .from('project_members')
    .select('id, user_id, role_in_project, requires_approval, added_at')
    .eq('project_id', projectId);

  if (membersError) {
    logger.error('Error fetching project members:', membersError);
  }

  // Obtener detalles de los miembros
  let members = [];
  if (memberships && memberships.length > 0) {
    const memberIds = memberships.map(m => m.user_id);
    const { data: memberProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, role_v2')
      .in('id', memberIds);

    if (memberProfiles) {
      const profilesMap = new Map(memberProfiles.map(p => [p.id, p]));
      members = memberships.map(m => ({
        ...m,
        profile: profilesMap.get(m.user_id) || null
      }));
    }
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
