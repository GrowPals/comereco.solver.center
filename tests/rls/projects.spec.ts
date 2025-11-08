import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { findOrBootstrapPlatformAdmin } from './find-or-bootstrap-platform-admin';

const url = process.env.SUPABASE_TEST_URL;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY;
const serviceKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  describe.skip('RLS: projects_select_by_company', () => {
    test('skipped - missing env vars', () => {
      console.warn('Set SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY y SUPABASE_TEST_SERVICE_ROLE_KEY para ejecutar las pruebas RLS.');
    });
  });
} else {
  const serviceClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  describe('RLS: projects_select_by_company', () => {
    const resources: {
      companyId?: string;
      activeProjectId?: string;
      archivedProjectId?: string;
      user?: { id: string; email: string; password: string };
      admin?: { id: string; email: string; password: string };
      supervisor?: { id: string; email: string; password: string };
      userClient?: ReturnType<typeof createClient>;
      adminClient?: ReturnType<typeof createClient>;
      supervisorClient?: ReturnType<typeof createClient>;
      seededAdminId?: string;
    } = {};

    beforeAll(async () => {
      const suffix = crypto.randomUUID().slice(0, 8);
      const companyName = `QA Company ${suffix}`;
      const { userId: invitedById, seeded } = await findOrBootstrapPlatformAdmin(serviceClient);
      if (seeded) {
        resources.seededAdminId = invitedById;
      }

      // Crear compañía de prueba
      const { data: company, error: companyError } = await serviceClient
        .from('companies')
        .insert({ name: companyName })
        .select('id')
        .single();
      if (companyError) throw companyError;
      resources.companyId = company.id;

      const mkEmail = (label: string) => `${label}-${suffix}@example.com`;
      const mkPassword = () => `T3st!${suffix}`;

      const invitations = [
        { email: mkEmail('user'), role: 'user' },
        { email: mkEmail('admin'), role: 'admin' },
        { email: mkEmail('supervisor'), role: 'supervisor' },
      ];

      for (const invite of invitations) {
        const { error } = await serviceClient
          .from('user_invitations')
          .insert({
            email: invite.email,
            company_id: company.id,
            role: invite.role,
            invited_by: invitedById,
          });
        if (error && error.code !== '23505') throw error;
      }

      const createAuthUser = async (email: string, password: string) => {
        const { data, error } = await serviceClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (error || !data?.user) throw error || new Error('No se pudo crear el usuario');
        return data.user.id;
      };

      const userEmail = invitations[0].email;
      const userPassword = mkPassword();
      const userId = await createAuthUser(userEmail, userPassword);
      resources.user = { id: userId, email: userEmail, password: userPassword };

      const adminEmail = invitations[1].email;
      const adminPassword = mkPassword();
      const adminId = await createAuthUser(adminEmail, adminPassword);
      resources.admin = { id: adminId, email: adminEmail, password: adminPassword };

      const supervisorEmail = invitations[2].email;
      const supervisorPassword = mkPassword();
      const supervisorId = await createAuthUser(supervisorEmail, supervisorPassword);
      resources.supervisor = { id: supervisorId, email: supervisorEmail, password: supervisorPassword };

      // Crear proyectos (uno activo, otro archivado)
      const { data: projects, error: projectsError } = await serviceClient
        .from('projects')
        .insert([
          {
            company_id: company.id,
            name: `Proyecto Activo ${suffix}`,
            description: 'Proyecto activo para pruebas',
            created_by: adminId,
            supervisor_id: supervisorId,
            status: 'active',
          },
          {
            company_id: company.id,
            name: `Proyecto Archivado ${suffix}`,
            description: 'Proyecto archivado para pruebas',
            created_by: adminId,
            supervisor_id: supervisorId,
            status: 'archived',
          },
        ])
        .select('id, status');
      if (projectsError) throw projectsError;
      resources.activeProjectId = projects?.find((p) => p.status === 'active')?.id;
      resources.archivedProjectId = projects?.find((p) => p.status === 'archived')?.id;

      const bootstrapClient = async (email: string, password: string) => {
        const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return client;
      };

      resources.userClient = await bootstrapClient(userEmail, userPassword);
      resources.adminClient = await bootstrapClient(adminEmail, adminPassword);
      resources.supervisorClient = await bootstrapClient(supervisorEmail, supervisorPassword);
    }, 20000);

    afterAll(async () => {
      try {
        if (resources.activeProjectId) {
          await serviceClient.from('projects').delete().eq('id', resources.activeProjectId);
        }
        if (resources.archivedProjectId) {
          await serviceClient.from('projects').delete().eq('id', resources.archivedProjectId);
        }
        if (resources.user?.id) {
          await serviceClient.auth.admin.deleteUser(resources.user.id);
        }
        if (resources.admin?.id) {
          await serviceClient.auth.admin.deleteUser(resources.admin.id);
        }
        if (resources.supervisor?.id) {
          await serviceClient.auth.admin.deleteUser(resources.supervisor.id);
        }
        if (resources.companyId) {
          await serviceClient.from('user_invitations').delete().eq('company_id', resources.companyId);
          await serviceClient.from('companies').delete().eq('id', resources.companyId);
        }
        if (resources.seededAdminId) {
          await serviceClient.from('platform_admins').delete().eq('user_id', resources.seededAdminId);
          await serviceClient.auth.admin.deleteUser(resources.seededAdminId);
        }
      } catch (error) {
        console.warn('Error limpiando recursos de prueba RLS:', error);
      }
    });

    test('usuario estándar ve todos los proyectos de su compañía', async () => {
      const client = resources.userClient;
      expect(client).toBeDefined();
      const { data, error } = await client!
        .from('projects')
        .select('id, status')
        .order('created_at', { ascending: false });
      expect(error).toBeNull();
      expect(data).toBeDefined();

      // El usuario debe ver ambos proyectos
      const projectIds = (data ?? []).map((item) => item.id);
      expect(projectIds).toContain(resources.activeProjectId);
      expect(projectIds).toContain(resources.archivedProjectId);
    });

    test('admin ve todos los proyectos de su compañía', async () => {
      const client = resources.adminClient;
      expect(client).toBeDefined();
      const { data, error } = await client!
        .from('projects')
        .select('id, status')
        .order('created_at', { ascending: false });
      expect(error).toBeNull();
      expect(data).toBeDefined();

      // El admin debe ver ambos proyectos
      const projectIds = (data ?? []).map((item) => item.id);
      expect(projectIds).toContain(resources.activeProjectId);
      expect(projectIds).toContain(resources.archivedProjectId);
    });

    test('supervisor ve todos los proyectos de su compañía', async () => {
      const client = resources.supervisorClient;
      expect(client).toBeDefined();
      const { data, error } = await client!
        .from('projects')
        .select('id, status')
        .order('created_at', { ascending: false });
      expect(error).toBeNull();
      expect(data).toBeDefined();

      // El supervisor debe ver ambos proyectos
      const projectIds = (data ?? []).map((item) => item.id);
      expect(projectIds).toContain(resources.activeProjectId);
      expect(projectIds).toContain(resources.archivedProjectId);
    });

    test('solo admin puede crear proyectos', async () => {
      const suffix = crypto.randomUUID().slice(0, 6);

      // Usuario estándar NO puede crear proyecto
      const { error: userError } = await resources.userClient!
        .from('projects')
        .insert({
          company_id: resources.companyId!,
          name: `Proyecto User ${suffix}`,
          created_by: resources.user!.id,
          status: 'active',
        })
        .select('id')
        .single();
      expect(userError).not.toBeNull();

      // Admin SÍ puede crear proyecto
      const { data: adminProject, error: adminError } = await resources.adminClient!
        .from('projects')
        .insert({
          company_id: resources.companyId!,
          name: `Proyecto Admin ${suffix}`,
          created_by: resources.admin!.id,
          status: 'active',
        })
        .select('id')
        .single();
      expect(adminError).toBeNull();
      expect(adminProject?.id).toBeDefined();

      // Limpiar
      if (adminProject?.id) {
        await serviceClient.from('projects').delete().eq('id', adminProject.id);
      }
    });

    test('solo admin puede eliminar proyectos', async () => {
      // Crear proyecto temporal
      const suffix = crypto.randomUUID().slice(0, 6);
      const { data: tempProject } = await serviceClient
        .from('projects')
        .insert({
          company_id: resources.companyId!,
          name: `Proyecto Temp ${suffix}`,
          created_by: resources.admin!.id,
          status: 'active',
        })
        .select('id')
        .single();

      if (!tempProject?.id) throw new Error('No se pudo crear proyecto temporal');

      // Usuario estándar NO puede eliminar
      const { error: userError } = await resources.userClient!
        .from('projects')
        .delete()
        .eq('id', tempProject.id);
      expect(userError).not.toBeNull();

      // Admin SÍ puede eliminar
      const { error: adminError } = await resources.adminClient!
        .from('projects')
        .delete()
        .eq('id', tempProject.id);
      expect(adminError).toBeNull();
    });

    test('admin y supervisor pueden actualizar proyectos', async () => {
      // Admin puede actualizar cualquier proyecto
      const { error: adminError } = await resources.adminClient!
        .from('projects')
        .update({ description: 'Actualizado por admin' })
        .eq('id', resources.activeProjectId!);
      expect(adminError).toBeNull();

      // Supervisor puede actualizar proyectos que supervisa
      const { error: supervisorError } = await resources.supervisorClient!
        .from('projects')
        .update({ description: 'Actualizado por supervisor' })
        .eq('id', resources.activeProjectId!)
        .eq('supervisor_id', resources.supervisor!.id);
      expect(supervisorError).toBeNull();

      // Usuario estándar NO puede actualizar
      const { error: userError } = await resources.userClient!
        .from('projects')
        .update({ description: 'Intentando actualizar' })
        .eq('id', resources.activeProjectId!);
      expect(userError).not.toBeNull();
    });
  });
}
