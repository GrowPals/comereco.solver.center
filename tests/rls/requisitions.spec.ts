import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { findOrBootstrapPlatformAdmin } from './find-or-bootstrap-platform-admin';

const url = process.env.SUPABASE_TEST_URL;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY;
const serviceKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  describe.skip('RLS: requisitions_select_unified', () => {
    test('skipped - missing env vars', () => {
      console.warn('Set SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY y SUPABASE_TEST_SERVICE_ROLE_KEY para ejecutar las pruebas RLS.');
    });
  });
} else {
  const serviceClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  describe('RLS: requisitions_select_unified', () => {
    const resources: {
      companyId?: string;
      projectId?: string;
      draftRequisitionId?: string;
      submittedRequisitionId?: string;
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

      // Crear proyecto (creado por admin, supervisado por supervisor)
      const { data: project, error: projectError } = await serviceClient
        .from('projects')
        .insert({
          company_id: company.id,
          name: `Proyecto Test ${suffix}`,
          description: 'Proyecto para pruebas RLS',
          created_by: adminId,
          supervisor_id: supervisorId,
          status: 'active',
        })
        .select('id')
        .single();
      if (projectError) throw projectError;
      resources.projectId = project.id;

      // Crear requisiciones (una draft del user, otra submitted del admin)
      const { data: requisitions, error: requisitionsError } = await serviceClient
        .from('requisitions')
        .insert([
          {
            company_id: company.id,
            project_id: project.id,
            created_by: userId,
            internal_folio: `REQ-DRAFT-${suffix}`,
            business_status: 'draft',
            integration_status: 'draft',
            total_amount: 1000,
            comments: 'Requisición en borrador',
          },
          {
            company_id: company.id,
            project_id: project.id,
            created_by: adminId,
            internal_folio: `REQ-SUBMITTED-${suffix}`,
            business_status: 'submitted',
            integration_status: 'draft',
            total_amount: 2000,
            comments: 'Requisición enviada',
          },
        ])
        .select('id, business_status');
      if (requisitionsError) throw requisitionsError;
      resources.draftRequisitionId = requisitions?.find((r) => r.business_status === 'draft')?.id;
      resources.submittedRequisitionId = requisitions?.find((r) => r.business_status === 'submitted')?.id;

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
        if (resources.draftRequisitionId) {
          await serviceClient.from('requisitions').delete().eq('id', resources.draftRequisitionId);
        }
        if (resources.submittedRequisitionId) {
          await serviceClient.from('requisitions').delete().eq('id', resources.submittedRequisitionId);
        }
        if (resources.projectId) {
          await serviceClient.from('projects').delete().eq('id', resources.projectId);
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

    test('usuario estándar solo ve sus propias requisiciones', async () => {
      const client = resources.userClient;
      expect(client).toBeDefined();
      const { data, error } = await client!
        .from('requisitions')
        .select('id, business_status, created_by')
        .order('created_at', { ascending: false });
      expect(error).toBeNull();
      expect(data).toBeDefined();

      // El usuario solo debe ver su propia requisición
      const requisitionIds = (data ?? []).map((item) => item.id);
      expect(requisitionIds).toContain(resources.draftRequisitionId);
      expect(requisitionIds).not.toContain(resources.submittedRequisitionId);

      // Todas las requisiciones visibles deben ser del usuario
      const allOwnedByUser = (data ?? []).every((r) => r.created_by === resources.user?.id);
      expect(allOwnedByUser).toBe(true);
    });

    test('admin ve todas las requisiciones de su compañía', async () => {
      const client = resources.adminClient;
      expect(client).toBeDefined();
      const { data, error } = await client!
        .from('requisitions')
        .select('id, business_status, created_by')
        .order('created_at', { ascending: false });
      expect(error).toBeNull();
      expect(data).toBeDefined();

      // El admin debe ver ambas requisiciones
      const requisitionIds = (data ?? []).map((item) => item.id);
      expect(requisitionIds).toContain(resources.draftRequisitionId);
      expect(requisitionIds).toContain(resources.submittedRequisitionId);
    });

    test('supervisor ve requisiciones de proyectos que supervisa', async () => {
      const client = resources.supervisorClient;
      expect(client).toBeDefined();
      const { data, error } = await client!
        .from('requisitions')
        .select('id, business_status, project_id')
        .order('created_at', { ascending: false });
      expect(error).toBeNull();
      expect(data).toBeDefined();

      // El supervisor debe ver ambas requisiciones del proyecto que supervisa
      const requisitionIds = (data ?? []).map((item) => item.id);
      expect(requisitionIds).toContain(resources.draftRequisitionId);
      expect(requisitionIds).toContain(resources.submittedRequisitionId);

      // Todas deben ser del proyecto supervisado
      const allFromSupervisedProject = (data ?? []).every((r) => r.project_id === resources.projectId);
      expect(allFromSupervisedProject).toBe(true);
    });

    test('usuario puede actualizar solo requisiciones draft propias', async () => {
      const client = resources.userClient;
      expect(client).toBeDefined();

      // Debe poder actualizar su propia draft
      const { error: updateOwnError } = await client!
        .from('requisitions')
        .update({ comments: 'Comentario actualizado' })
        .eq('id', resources.draftRequisitionId!);
      expect(updateOwnError).toBeNull();

      // NO debe poder actualizar la submitted del admin
      const { error: updateOthersError } = await client!
        .from('requisitions')
        .update({ comments: 'Intentando actualizar' })
        .eq('id', resources.submittedRequisitionId!);
      expect(updateOthersError).not.toBeNull();
    });

    test('usuario puede crear requisiciones en su compañía', async () => {
      const client = resources.userClient;
      expect(client).toBeDefined();

      const suffix = crypto.randomUUID().slice(0, 6);
      const { data, error } = await client!
        .from('requisitions')
        .insert({
          company_id: resources.companyId!,
          project_id: resources.projectId!,
          created_by: resources.user!.id,
          internal_folio: `REQ-NEW-${suffix}`,
          business_status: 'draft',
          integration_status: 'draft',
          total_amount: 500,
          comments: 'Nueva requisición',
        })
        .select('id')
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBeDefined();

      // Limpiar
      if (data?.id) {
        await serviceClient.from('requisitions').delete().eq('id', data.id);
      }
    });
  });
}
