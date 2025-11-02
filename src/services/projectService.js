
import { supabase } from '@/lib/customSupabaseClient';
import logger from '@/utils/logger';

/**
 * Obtiene todos los proyectos. La RLS se encarga de filtrar según el rol.
 * @returns {Promise<Array>} Lista de proyectos.
 */
export const getAllProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select('*, supervisor:profiles(id, full_name)');
  if (error) {
    logger.error('Error fetching projects:', error);
    throw new Error('No se pudieron cargar los proyectos.');
  }
  return data;
};

/**
 * Obtiene los proyectos donde el usuario actual es miembro.
 * @returns {Promise<Array>} Lista de proyectos.
 */
export const getMyProjects = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('project_members')
    .select('project:projects(*)')
    .eq('user_id', user.id);

  if (error) {
    logger.error('Error fetching my projects:', error);
    return [];
  }
  return data.map(item => item.project);
};

/**
 * Crea un nuevo proyecto.
 * @param {object} projectData - Datos del proyecto.
 * @returns {Promise<object>} El proyecto creado.
 */
export const createProject = async (projectData) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
  
  const { data, error } = await supabase
    .from('projects')
    .insert([{ ...projectData, company_id: profile.company_id, created_by: user.id }])
    .select()
    .single();
  if (error) throw new Error(`Error al crear proyecto: ${error.message}`);
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
 * @param {string} projectId - ID del proyecto.
 * @returns {Promise<Array>} Lista de miembros.
 */
export const getProjectMembers = async (projectId) => {
    const { data, error } = await supabase
        .from('project_members')
        .select('*, user:profiles(id, full_name)')
        .eq('project_id', projectId);
    if (error) throw new Error(`Error al obtener miembros: ${error.message}`);
    return data;
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
