import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { findOrBootstrapPlatformAdmin } from './find-or-bootstrap-platform-admin';

const url = process.env.SUPABASE_TEST_URL;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY;
const serviceKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  describe.skip('RLS: products_select_access', () => {
    test('skipped - missing env vars', () => {
      console.warn('Set SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY y SUPABASE_TEST_SERVICE_ROLE_KEY para ejecutar las pruebas RLS.');
    });
  });
} else {
  const serviceClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  describe('RLS: products_select_access', () => {
    const resources: {
      companyId?: string;
      activeProductId?: string;
      inactiveProductId?: string;
      user?: { id: string; email: string; password: string };
      admin?: { id: string; email: string; password: string };
      userClient?: ReturnType<typeof createClient>;
      adminClient?: ReturnType<typeof createClient>;
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

      // Insertar productos (uno activo y otro inactivo)
      const bindIdBase = crypto.randomUUID();

      const { data: products, error: productsError } = await serviceClient
        .from('products')
        .insert([
          {
            company_id: company.id,
            bind_id: `${bindIdBase}-ACT`,
            name: `Producto Activo ${suffix}`,
            sku: `SKU-ACT-${suffix}`,
            price: 199,
            stock: 5,
            unit: 'pz',
            category: 'test',
            is_active: true,
          },
          {
            company_id: company.id,
            bind_id: `${bindIdBase}-INA`,
            name: `Producto Inactivo ${suffix}`,
            sku: `SKU-INA-${suffix}`,
            price: 299,
            stock: 2,
            unit: 'pz',
            category: 'test',
            is_active: false,
          },
        ])
        .select('id, is_active');
      if (productsError) throw productsError;
      resources.activeProductId = products?.find((p) => p.is_active)?.id;
      resources.inactiveProductId = products?.find((p) => !p.is_active)?.id;

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
        if (resources.activeProductId) {
          await serviceClient.from('products').delete().eq('id', resources.activeProductId);
        }
        if (resources.inactiveProductId) {
          await serviceClient.from('products').delete().eq('id', resources.inactiveProductId);
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

    test('usuario estándar sólo ve productos activos', async () => {
      const client = resources.userClient;
      expect(client).toBeDefined();
      const { data, error } = await client!
        .from('products')
        .select('id, is_active')
        .order('created_at', { ascending: false });
      expect(error).toBeNull();
      expect(data).toBeDefined();
      const productIds = (data ?? []).map((item) => item.id);
      expect(productIds).toContain(resources.activeProductId);
      expect(productIds).not.toContain(resources.inactiveProductId);
    });

    test('admin de la compañía ve productos activos e inactivos', async () => {
      const client = resources.adminClient;
      expect(client).toBeDefined();
      const { data, error } = await client!
        .from('products')
        .select('id, is_active')
        .order('created_at', { ascending: false });
      expect(error).toBeNull();
      expect(data).toBeDefined();
      const productIds = (data ?? []).map((item) => item.id);
      expect(productIds).toContain(resources.activeProductId);
      expect(productIds).toContain(resources.inactiveProductId);
    });
  });
}
