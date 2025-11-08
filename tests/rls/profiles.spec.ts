import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { findOrBootstrapPlatformAdmin } from './find-or-bootstrap-platform-admin';

const url = process.env.SUPABASE_TEST_URL;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY;
const serviceKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  describe.skip('RLS: profiles_select_unified', () => {
    test('skipped - missing env vars', () => {
      console.warn('Set SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY y SUPABASE_TEST_SERVICE_ROLE_KEY para ejecutar las pruebas RLS.');
    });
  });
} else {
  const serviceClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  describe('RLS: profiles_select_unified', () => {
    const resources: {
      companyId?: string;
      platformCompanyId?: string;
      user?: { id: string; email: string; password: string };
      admin?: { id: string; email: string; password: string };
      supervisor?: { id: string; email: string; password: string };
      otherUser?: { id: string; email: string; password: string };
      platformAdmin?: { id: string; email: string; password: string };
      userClient?: ReturnType<typeof createClient>;
      adminClient?: ReturnType<typeof createClient>;
      supervisorClient?: ReturnType<typeof createClient>;
      otherUserClient?: ReturnType<typeof createClient>;
      platformAdminClient?: ReturnType<typeof createClient>;
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
        { email: mkEmail('otheruser'), role: 'user' },
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

      const otherUserEmail = invitations[3].email;
      const otherUserPassword = mkPassword();
      const otherUserId = await createAuthUser(otherUserEmail, otherUserPassword);
      resources.otherUser = { id: otherUserId, email: otherUserEmail, password: otherUserPassword };

      const { data: platformCompany, error: platformCompanyError } = await serviceClient
        .from('companies')
        .insert({ name: `QA Platform Company ${suffix}` })
        .select('id')
        .single();
      if (platformCompanyError) throw platformCompanyError;
      resources.platformCompanyId = platformCompany.id;

      const platformAdminEmail = mkEmail('platform');
      const { error: platformInvitationError } = await serviceClient
        .from('user_invitations')
        .insert({
          email: platformAdminEmail,
          company_id: platformCompany.id,
          role: 'dev',
          invited_by: invitedById,
        });
      if (platformInvitationError && platformInvitationError.code !== '23505') throw platformInvitationError;

      const platformAdminPassword = mkPassword();
      const platformAdminId = await createAuthUser(platformAdminEmail, platformAdminPassword);
      resources.platformAdmin = {
        id: platformAdminId,
        email: platformAdminEmail,
        password: platformAdminPassword,
      };

      const { error: platformFlagError } = await serviceClient
        .from('platform_admins')
        .insert({ user_id: platformAdminId, granted_by: invitedById });
      if (platformFlagError) throw platformFlagError;

      const { error: platformProfileError } = await serviceClient.rpc('admin_upsert_profile', {
        p_user_id: platformAdminId,
        p_company_id: platformCompany.id,
        p_full_name: 'Platform Admin QA',
        p_role: 'dev',
      });
      if (platformProfileError) throw platformProfileError;

      const bootstrapClient = async (email: string, password: string) => {
        const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return client;
      };

      resources.userClient = await bootstrapClient(userEmail, userPassword);
      resources.adminClient = await bootstrapClient(adminEmail, adminPassword);
      resources.supervisorClient = await bootstrapClient(supervisorEmail, supervisorPassword);
      resources.otherUserClient = await bootstrapClient(otherUserEmail, otherUserPassword);
      resources.platformAdminClient = await bootstrapClient(platformAdminEmail, platformAdminPassword);
    }, 20000);

    afterAll(async () => {
      try {
        if (resources.user?.id) {
          await serviceClient.auth.admin.deleteUser(resources.user.id);
        }
        if (resources.admin?.id) {
          await serviceClient.auth.admin.deleteUser(resources.admin.id);
        }
        if (resources.supervisor?.id) {
          await serviceClient.auth.admin.deleteUser(resources.supervisor.id);
        }
        if (resources.otherUser?.id) {
          await serviceClient.auth.admin.deleteUser(resources.otherUser.id);
        }
        if (resources.platformAdmin?.id) {
          await serviceClient.from('platform_admins').delete().eq('user_id', resources.platformAdmin.id);
          await serviceClient.auth.admin.deleteUser(resources.platformAdmin.id);
        }
        if (resources.platformCompanyId) {
          await serviceClient.from('companies').delete().eq('id', resources.platformCompanyId);
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

    test('usuario estándar solo ve su propio perfil', async () => {
      const client = resources.userClient;
      expect(client).toBeDefined();
      const { data, error } = await client!
        .from('profiles')
        .select('id, role_v2, full_name');
      expect(error).toBeNull();
      expect(data).toBeDefined();

      // El usuario solo debe ver su propio perfil
      expect(data?.length).toBe(1);
      expect(data?.[0].id).toBe(resources.user?.id);
    });

    test('admin ve todos los perfiles de su compañía', async () => {
      const client = resources.adminClient;
      expect(client).toBeDefined();
      const { data, error } = await client!
        .from('profiles')
        .select('id, role_v2, company_id');
      expect(error).toBeNull();
      expect(data).toBeDefined();

      // El admin debe ver al menos los 4 perfiles creados
      expect(data!.length).toBeGreaterThanOrEqual(4);

      // Verificar que incluye todos los usuarios creados
      const profileIds = data?.map((p) => p.id) ?? [];
      expect(profileIds).toContain(resources.user?.id);
      expect(profileIds).toContain(resources.admin?.id);
      expect(profileIds).toContain(resources.supervisor?.id);
      expect(profileIds).toContain(resources.otherUser?.id);

      // Todos los perfiles visibles deben ser de la misma compañía
      const allSameCompany = data?.every((p) => p.company_id === resources.companyId);
      expect(allSameCompany).toBe(true);
    });

    test('supervisor ve todos los perfiles de su compañía', async () => {
      const client = resources.supervisorClient;
      expect(client).toBeDefined();
      const { data, error } = await client!
        .from('profiles')
        .select('id, role_v2, company_id');
      expect(error).toBeNull();
      expect(data).toBeDefined();

      // El supervisor debe ver al menos los 4 perfiles creados
      expect(data!.length).toBeGreaterThanOrEqual(4);

      // Verificar que incluye todos los usuarios creados
      const profileIds = data?.map((p) => p.id) ?? [];
      expect(profileIds).toContain(resources.user?.id);
      expect(profileIds).toContain(resources.admin?.id);
      expect(profileIds).toContain(resources.supervisor?.id);
      expect(profileIds).toContain(resources.otherUser?.id);
    });

    test('platform admin puede ver perfiles de cualquier compañía', async () => {
      const client = resources.platformAdminClient;
      expect(client).toBeDefined();

      const { data, error } = await client!
        .from('profiles')
        .select('id, company_id');
      expect(error).toBeNull();
      expect(data).toBeDefined();
      const includesForeignCompany = data?.some((profile) => profile.company_id === resources.companyId) ?? false;
      expect(includesForeignCompany).toBe(true);
    });

    test('usuario puede actualizar solo su propio perfil', async () => {
      const client = resources.userClient;
      expect(client).toBeDefined();

      const { data: baselineProfile, error: baselineError } = await serviceClient
        .from('profiles')
        .select('full_name')
        .eq('id', resources.otherUser!.id)
        .single();
      expect(baselineError).toBeNull();
      const originalFullName = baselineProfile?.full_name;

      // Debe poder actualizar su propio perfil
      const { error: updateOwnError } = await client!
        .from('profiles')
        .update({ full_name: 'Nombre Actualizado' })
        .eq('id', resources.user!.id);
      expect(updateOwnError).toBeNull();

      // Intentar actualizar el perfil de otro usuario no debe modificarlo
      const { error: updateOtherError } = await client!
        .from('profiles')
        .update({ full_name: 'Intentando actualizar' })
        .eq('id', resources.otherUser!.id);
      if (updateOtherError) {
        expect(updateOtherError.code).toBe('42501');
      }

      const { data: afterProfile, error: verifyError } = await serviceClient
        .from('profiles')
        .select('full_name')
        .eq('id', resources.otherUser!.id)
        .single();
      expect(verifyError).toBeNull();
      expect(afterProfile?.full_name).toBe(originalFullName);
    });

    test('admin puede actualizar perfiles de su compañía', async () => {
      const client = resources.adminClient;
      expect(client).toBeDefined();

      // Admin puede actualizar el perfil de otros usuarios
      const { error: updateError } = await client!
        .from('profiles')
        .update({ full_name: 'Actualizado por Admin' })
        .eq('id', resources.user!.id)
        .eq('company_id', resources.companyId!);
      expect(updateError).toBeNull();

      // Verificar cambio
      const { data } = await client!
        .from('profiles')
        .select('full_name')
        .eq('id', resources.user!.id)
        .single();
      expect(data?.full_name).toBe('Actualizado por Admin');
    });

    test('admin puede cambiar roles de usuarios', async () => {
      const client = resources.adminClient;
      expect(client).toBeDefined();

      // Admin puede cambiar el role_v2 de un usuario
      const { error: updateError } = await client!
        .from('profiles')
        .update({ role_v2: 'supervisor' })
        .eq('id', resources.otherUser!.id)
        .eq('company_id', resources.companyId!);
      expect(updateError).toBeNull();

      // Verificar cambio
      const { data } = await client!
        .from('profiles')
        .select('role_v2')
        .eq('id', resources.otherUser!.id)
        .single();
      expect(data?.role_v2).toBe('supervisor');

      // Restaurar role original
      await client!
        .from('profiles')
        .update({ role_v2: 'user' })
        .eq('id', resources.otherUser!.id);
    });

    test('usuario NO puede cambiar su propio rol', async () => {
      const client = resources.userClient;
      expect(client).toBeDefined();

      // Obtener role actual
      const { data: beforeData } = await client!
        .from('profiles')
        .select('role_v2')
        .eq('id', resources.user!.id)
        .single();
      const originalRole = beforeData?.role_v2;

      // Intentar cambiar role (no debería funcionar, pero no necesariamente da error)
      await client!
        .from('profiles')
        .update({ role_v2: 'admin' })
        .eq('id', resources.user!.id);

      // Verificar que el role NO cambió
      const { data: afterData } = await client!
        .from('profiles')
        .select('role_v2')
        .eq('id', resources.user!.id)
        .single();
      expect(afterData?.role_v2).toBe(originalRole);
    });
  });
}
