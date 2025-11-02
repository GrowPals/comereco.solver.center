
import { supabase } from '@/lib/customSupabaseClient';
import logger from '@/utils/logger';

/**
 * CORREGIDO: Valida sesión antes de hacer queries
 * Obtiene todos los proyectos. La RLS se encarga de filtrar según el rol.
 * FIX: Evitar embeds ambiguos según REFERENCIA_TECNICA_BD_SUPABASE.md
 * @returns {Promise<Array>} Lista de proyectos.
 */
export const getAllProjects = async () => {
  // Validar sesión antes de hacer queries
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }

  // RLS filtra automáticamente según el rol del usuario
  const { data, error } = await supabase
    .from('projects')
    .select('id, company_id, name, description, status, supervisor_id, created_by, created_at, updated_at, active');
  
  if (error) {
    logger.error('Error fetching projects:', error);
    throw new Error('No se pudieron cargar los proyectos.');
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
 * Obtiene los proyectos donde el usuario actual es miembro.
 * FIX: Evitar embeds ambiguos según REFERENCIA_TECNICA_BD_SUPABASE.md
 * @returns {Promise<Array>} Lista de proyectos.
 */
export const getMyProjects = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  const { data: memberships, error } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', user.id);

  if (error) {
    logger.error('Error fetching my projects:', error);
    return [];
  }

  if (!memberships || memberships.length === 0) return [];

  const projectIds = memberships.map(m => m.project_id);
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
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
  // Validar sesión antes de hacer queries
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Usuario no autenticado.");
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();
  
  if (profileError || !profile) {
    logger.error('Error fetching user profile:', profileError);
    throw new Error('No se pudo obtener el perfil del usuario.');
  }
  
  const { data, error } = await supabase
    .from('projects')
    .insert([{ ...projectData, company_id: profile.company_id, created_by: user.id }])
    .select()
    .single();
    
  if (error) {
    logger.error('Error creating project:', error);
    throw new Error(`Error al crear proyecto: ${error.message}`);
  }
  return data;
};

/**
 * Actualiza un proyecto existente.
 * @param {object} projectData - Datos a actualizar, debe incluir el id.
 * @returns {Promise<object>} El proyecto actualizado.
 */
export const updateProject = async (projectData) => {
  const { id, ...updateData } = projectData;
  const { data, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Error al actualizar proyecto: ${error.message}`);
  return data;
};

/**
 * Elimina un proyecto.
 * @param {string} projectId - ID del proyecto a eliminar.
 */
export const deleteProject = async (projectId) => {
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) throw new Error(`Error al eliminar proyecto: ${error.message}`);
};

/**
 * Obtiene los miembros de un proyecto.
 * FIX: Evitar embeds ambiguos según REFERENCIA_TECNICA_BD_SUPABASE.md
 * @param {string} projectId - ID del proyecto.
 * @returns {Promise<Array>} Lista de miembros.
 */
export const getProjectMembers = async (projectId) => {
    const { data: memberships, error: membersError } = await supabase
        .from('project_members')
        .select('user_id, role_in_project, added_at')
        .eq('project_id', projectId);
    
    if (membersError) {
        throw new Error(`Error al obtener miembros: ${membersError.message}`);
    }

    if (!memberships || memberships.length === 0) return [];

    const userIds = memberships.map(m => m.user_id);
    const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

    if (usersError) {
        throw new Error(`Error al obtener usuarios: ${usersError.message}`);
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
 * Agrega un miembro a un proyecto.
 * @param {string} projectId - ID del proyecto.
 * @param {string} userId - ID del usuario a agregar.
 */
export const addProjectMember = async (projectId, userId) => {
    const { error } = await supabase
        .from('project_members')
        .insert({ project_id: projectId, user_id: userId, role_in_project: 'member' });
    if (error) throw new Error(`Error al agregar miembro: ${error.message}`);
};

/**
 * Elimina un miembro de un proyecto.
 * @param {string} projectId - ID del proyecto.
 * @param {string} userId - ID del usuario a eliminar.
 */
export const removeProjectMember = async (projectId, userId) => {
    const { error } = await supabase
        .from('project_members')
        .delete()
        .match({ project_id: projectId, user_id: userId });
    if (error) throw new Error(`Error al eliminar miembro: ${error.message}`);
};
