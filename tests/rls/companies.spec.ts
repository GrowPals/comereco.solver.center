import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { findOrBootstrapPlatformAdmin } from './find-or-bootstrap-platform-admin';

const url = process.env.SUPABASE_TEST_URL;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY;
const serviceKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  describe.skip('RLS: companies_select_access', () => {
    test('skipped - missing env vars', () => {
      console.warn('Set SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY y SUPABASE_TEST_SERVICE_ROLE_KEY para ejecutar las pruebas RLS.');
    });
  });
} else {
  const serviceClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  describe('RLS: companies_select_access', () => {
    const resources: {
      companyId?: string;
      otherCompanyId?: string;
      user?: { id: string; email: string; password: string };
      admin?: { id: string; email: string; password: string };
      userClient?: ReturnType<typeof createClient>;
      adminClient?: ReturnType<typeof createClient>;
      seededAdminId?: string;
    } = {};

    beforeAll(async () => {
      const suffix = crypto.randomUUID().slice(0, 8);
      const companyName = `QA Company ${suffix}`;
      const otherCompanyName = `QA Other Company ${suffix}`;
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

      // Crear otra compañía (para verificar aislamiento)
      const { data: otherCompany, error: otherCompanyError } = await serviceClient
        .from('companies')
        .insert({ name: otherCompanyName })
        .select('id')
        .single();
      if (otherCompanyError) throw otherCompanyError;
      resources.otherCompanyId = otherCompany.id;

      const mkEmail = (label: string) => `${label}-${suffix}@example.com`;
      const mkPassword = () => `T3st!${suffix}`;

      const invitations = [
        { email: mkEmail('user'), role: 'user' },
        { email: mkEmail('admin'), role: 'admin' },
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

      const bootstrapClient = async (email: string, password: string) => {
        const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return client;
      };

      resources.userClient = await bootstrapClient(userEmail, userPassword);
      resources.adminClient = await bootstrapClient(adminEmail, adminPassword);
    }, 20000);

    afterAll(async () => {
      try {
        if (resources.user?.id) {
          await serviceClient.auth.admin.deleteUser(resources.user.id);
        }
        if (resources.admin?.id) {
          await serviceClient.auth.admin.deleteUser(resources.admin.id);
        }
        if (resources.companyId) {
          await serviceClient.from('user_invitations').delete().eq('company_id', resources.companyId);
          await serviceClient.from('companies').delete().eq('id', resources.companyId);
        }
        if (resources.otherCompanyId) {
          await serviceClient.from('companies').delete().eq('id', resources.otherCompanyId);
        }
        if (resources.seededAdminId) {
          await serviceClient.from('platform_admins').delete().eq('user_id', resources.seededAdminId);
          await serviceClient.auth.admin.deleteUser(resources.seededAdminId);
        }
      } catch (error) {
        console.warn('Error limpiando recursos de prueba RLS:', error);
      }
    });

    test('usuario estándar solo ve su propia compañía', async () => {
      const client = resources.userClient;
      expect(client).toBeDefined();
      const { data, error } = await client!
        .from('companies')
        .select('id, name');
      expect(error).toBeNull();
      expect(data).toBeDefined();

      // El usuario solo debe ver su propia compañía
      expect(data?.length).toBe(1);
      expect(data?.[0].id).toBe(resources.companyId);
    });

    test('admin solo ve su propia compañía', async () => {
      const client = resources.adminClient;
      expect(client).toBeDefined();
      const { data, error } = await client!
        .from('companies')
        .select('id, name');
      expect(error).toBeNull();
      expect(data).toBeDefined();

      // El admin solo debe ver su propia compañía
      expect(data?.length).toBe(1);
      expect(data?.[0].id).toBe(resources.companyId);

      // NO debe ver la otra compañía
      const companyIds = data?.map((c) => c.id) ?? [];
      expect(companyIds).not.toContain(resources.otherCompanyId);
    });

    test('admin puede actualizar su propia compañía', async () => {
      const client = resources.adminClient;
      expect(client).toBeDefined();

      const newName = `Updated Company ${crypto.randomUUID().slice(0, 6)}`;

      // Admin puede actualizar su propia compañía
      const { error: updateError } = await client!
        .from('companies')
        .update({ name: newName })
        .eq('id', resources.companyId!);
      expect(updateError).toBeNull();

      // Verificar cambio
      const { data } = await client!
        .from('companies')
        .select('name')
        .eq('id', resources.companyId!)
        .single();
      expect(data?.name).toBe(newName);
    });

    test('usuario estándar NO puede actualizar compañía', async () => {
      const client = resources.userClient;
      expect(client).toBeDefined();

      const newName = `Attempt Update ${crypto.randomUUID().slice(0, 6)}`;

      // Usuario NO puede actualizar compañía
      const { error: updateError } = await client!
        .from('companies')
        .update({ name: newName })
        .eq('id', resources.companyId!);
      expect(updateError).not.toBeNull();
    });

    test('admin NO puede actualizar otra compañía', async () => {
      const client = resources.adminClient;
      expect(client).toBeDefined();

      const newName = `Attempt Update Other ${crypto.randomUUID().slice(0, 6)}`;

      // Admin NO puede actualizar otra compañía
      const { error: updateError } = await client!
        .from('companies')
        .update({ name: newName })
        .eq('id', resources.otherCompanyId!);
      expect(updateError).not.toBeNull();
    });

    test('solo platform admin puede crear compañías', async () => {
      const suffix = crypto.randomUUID().slice(0, 6);

      // Usuario NO puede crear compañía
      const { error: userError } = await resources.userClient!
        .from('companies')
        .insert({ name: `New Company User ${suffix}` })
        .select('id')
        .single();
      expect(userError).not.toBeNull();

      // Admin de compañía NO puede crear compañía
      const { error: adminError } = await resources.adminClient!
        .from('companies')
        .insert({ name: `New Company Admin ${suffix}` })
        .select('id')
        .single();
      expect(adminError).not.toBeNull();

      // Solo platform_admin puede crear (verificado en otros tests)
    });

    test('solo platform admin puede eliminar compañías', async () => {
      // Crear compañía temporal
      const suffix = crypto.randomUUID().slice(0, 6);
      const { data: tempCompany } = await serviceClient
        .from('companies')
        .insert({ name: `Temp Company ${suffix}` })
        .select('id')
        .single();

      if (!tempCompany?.id) throw new Error('No se pudo crear compañía temporal');

      // Usuario NO puede eliminar
      const { error: userError } = await resources.userClient!
        .from('companies')
        .delete()
        .eq('id', tempCompany.id);
      expect(userError).not.toBeNull();

      // Admin NO puede eliminar
      const { error: adminError } = await resources.adminClient!
        .from('companies')
        .delete()
        .eq('id', tempCompany.id);
      expect(adminError).not.toBeNull();

      // Limpiar con service client (que actúa como platform admin)
      await serviceClient.from('companies').delete().eq('id', tempCompany.id);
    });

    test('aislamiento multi-tenant: usuarios no ven datos de otras compañías', async () => {
      const client = resources.userClient;
      expect(client).toBeDefined();

      // Crear datos en otra compañía
      const suffix = crypto.randomUUID().slice(0, 6);
      const { data: otherProduct } = await serviceClient
        .from('products')
        .insert({
          company_id: resources.otherCompanyId!,
          bind_id: `OTHER-${suffix}`,
          name: `Producto Otra Compañía ${suffix}`,
          sku: `SKU-OTHER-${suffix}`,
          price: 100,
          stock: 10,
          unit: 'pz',
          category: 'test',
          is_active: true,
        })
        .select('id')
        .single();

      // Usuario NO debe ver productos de otra compañía
      const { data: products } = await client!
        .from('products')
        .select('id, company_id');

      const productIds = products?.map((p) => p.id) ?? [];
      expect(productIds).not.toContain(otherProduct?.id);

      // Todos los productos visibles deben ser de su compañía
      const allOwnCompany = products?.every((p) => p.company_id === resources.companyId);
      expect(allOwnCompany).toBe(true);

      // Limpiar
      if (otherProduct?.id) {
        await serviceClient.from('products').delete().eq('id', otherProduct.id);
      }
    });
  });
}
