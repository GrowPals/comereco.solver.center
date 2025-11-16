#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const url = process.env.SUPABASE_URL || process.env.SUPABASE_TEST_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
const grantById = process.env.PLATFORM_ADMIN_GRANTED_BY_ID;

const emailsFromEnv = process.env.PLATFORM_ADMIN_EMAILS?.split(',').map((email) => email.trim()).filter(Boolean) ?? [];
const emailsFromArgs = process.argv.slice(2).map((email) => email.trim()).filter(Boolean);

const emails = [...new Set([...emailsFromEnv, ...emailsFromArgs])];

if (!url || !serviceKey) {
  console.error('❌ Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para ejecutar este script.');
  process.exit(1);
}

if (emails.length === 0) {
  console.error('❌ Proporciona al menos un correo de usuario. Ejemplo: npm run seed:platform-admins -- admin@example.com');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const randomPassword = () => `Adm!n-${crypto.randomBytes(6).toString('hex')}`;

async function findOrCreateUser(email) {
  const normalized = email.toLowerCase();

  const list = await supabase.auth.admin.listUsers({ email: normalized, page: 1, perPage: 1 });
  const existing = list?.data?.users?.[0];
  if (existing) {
    return { user: existing, password: null, created: false };
  }

  const password = randomPassword();
  const { data, error } = await supabase.auth.admin.createUser({
    email: normalized,
    password,
    email_confirm: true,
  });
  if (error || !data?.user) {
    throw error || new Error(`No se pudo crear el usuario ${normalized}`);
  }
  return { user: data.user, password, created: true };
}

async function ensureProfile(user) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, company_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    console.warn(`⚠️ El usuario ${user.email} no tiene profile asociado. Asigna manualmente company_id antes de otorgar permisos globales.`);
  }

  return profile;
}

async function grantPlatformAdmin(userId, grantedBy) {
  const { error } = await supabase
    .from('platform_admins')
    .upsert({ user_id: userId, granted_by: grantedBy ?? userId }, { onConflict: 'user_id' });
  if (error) {
    throw error;
  }
}

(async () => {
  for (const email of emails) {
    try {
      const { user, password, created } = await findOrCreateUser(email);
      await ensureProfile(user);
      await grantPlatformAdmin(user.id, grantById);
      console.log(`✅ Usuario ${email} ahora es platform_admin (id: ${user.id}).${created ? ' (creado via admin API)' : ''}`);
      if (password) {
        console.log(`   ↳ Contraseña temporal: ${password}`);
      }
    } catch (error) {
      console.error(`❌ Error procesando ${email}:`, error.message || error);
    }
  }
})();
