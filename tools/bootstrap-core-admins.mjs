#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`⚠️  Faltan variables de entorno: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const app = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const CORE_COMPANIES = [
  {
    name: 'Growpals',
    admin: {
      email: 'team@growpals.mx',
      fullName: 'Growpals Admin',
      role: 'dev',
      passwordEnv: 'CORE_PASSWORD_GROWPALS',
      passwordFallback: 'growpals#2025!',
      platformAdmin: true,
    },
  },
  {
    name: 'ComerECO',
    admin: {
      email: 'carmen@comereco-lab.com',
      fullName: 'Carmen',
      role: 'admin',
      passwordEnv: 'CORE_PASSWORD_COMERECO',
      passwordFallback: 'Comereco01#',
    },
  },
  {
    name: 'Manny',
    admin: {
      email: 'team@manny.mx',
      fullName: 'Alejandro Chavez',
      role: 'admin',
      passwordEnv: 'CORE_PASSWORD_MANNY',
      passwordFallback: 'Tupartnermanny24!',
    },
  },
  {
    name: 'Soluciones a la Orden',
    admin: {
      email: 'le.velazquez95@gmail.com',
      fullName: 'Luis Enrique',
      role: 'admin',
      passwordEnv: 'CORE_PASSWORD_SOLUCIONES',
      passwordFallback: 'SOLUCIONES#2030!',
    },
  },
];

const APP_ROLES = new Set(['admin', 'supervisor', 'user', 'dev']);

const getPassword = (entry) => {
  const envValue = process.env[entry.passwordEnv];
  return (envValue && envValue.trim()) || entry.passwordFallback;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function findUserByEmail(email) {
  const normalized = email.toLowerCase();
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await app.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data?.users?.find((user) => user.email?.toLowerCase() === normalized);
    if (match) return match;
    if (!data || data.users.length < perPage) break;
    page += 1;
    await delay(250);
  }
  return null;
}

async function ensureCompany(name) {
  const { data, error } = await app
    .from('companies')
    .select('id')
    .eq('name', name)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (data?.id) {
    return data.id;
  }

  const { data: insertData, error: insertError } = await app
    .from('companies')
    .insert({ name })
    .select('id')
    .single();

  if (insertError) {
    throw insertError;
  }

  console.log(`🏢 Empresa creada: ${name}`);
  return insertData.id;
}

async function ensureUser(companyId, adminConfig) {
  const { email, fullName, role, platformAdmin } = adminConfig;
  if (!APP_ROLES.has(role)) {
    throw new Error(`Rol inválido para ${email}: ${role}`);
  }

  const password = getPassword(adminConfig);
  if (!password) {
    throw new Error(`No hay contraseña para ${email}. Define ${adminConfig.passwordEnv}`);
  }

  let user = await findUserByEmail(email);
  if (!user) {
    console.log(`Creating user ${email}`);
    const { data, error } = await app.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role_v2: role,
      },
    });
    if (error) {
      console.error('createUser error', {
        status: error?.status,
        message: error?.message,
        name: error?.name,
        cause: error?.cause,
        raw: error,
      });
      if (error.message?.toLowerCase().includes('already registered')) {
        user = await findUserByEmail(email);
      } else {
        throw error;
      }
    } else {
      user = data.user;
      console.log(`👤 Usuario creado: ${email}`);
    }
  }

  if (!user) {
    throw new Error(`No se pudo crear ni localizar al usuario ${email}`);
  }

  console.log(`Updating auth metadata for ${email}`);
  const { error: updateError } = await app.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
    user_metadata: {
      ...(user.user_metadata || {}),
      full_name: fullName,
      role_v2: role,
    },
  });
  if (updateError) {
    console.error('updateUser error', {
      status: updateError?.status,
      message: updateError?.message,
      name: updateError?.name,
      cause: updateError?.cause,
      raw: updateError,
    });
    throw updateError;
  }

  console.log(`Upserting profile for ${email}`);
  const runProfileRpc = async () => app.rpc('admin_upsert_profile', {
    p_user_id: user.id,
    p_company_id: companyId,
    p_full_name: fullName,
    p_role: role,
  });

  let profileError = null;
  const rpcResult = await runProfileRpc();
  profileError = rpcResult.error;

  if (profileError) {
    console.warn('admin_upsert_profile error, attempting fallback', profileError);
    const { error: fallbackError } = await app
      .from('profiles')
      .upsert({
        id: user.id,
        company_id: companyId,
        full_name: fullName,
        role_v2: role,
        is_active: true,
      }, { onConflict: 'id' });
    if (fallbackError) {
      throw fallbackError;
    }
  }

  if (role === 'dev' || platformAdmin) {
    console.log(`Upserting platform_admin for ${email}`);
    const { error: platformError } = await app
      .from('platform_admins')
      .upsert({ user_id: user.id, granted_by: user.id }, { onConflict: 'user_id' });
    if (platformError) {
      console.warn('platform_admins upsert failed (continuing)', {
        message: platformError.message,
        code: platformError.code,
      });
    }
  }

  return user.id;
}

async function main() {
  const summary = [];
  for (const company of CORE_COMPANIES) {
    const companyId = await ensureCompany(company.name);
    try {
      const userId = await ensureUser(companyId, company.admin);
      summary.push({ company: company.name, admin: company.admin.email, role: company.admin.role, userId });
    } catch (error) {
      console.error('Failed ensuring user', {
        company: company.name,
        admin: company.admin.email,
        message: error?.message,
        status: error?.status,
        name: error?.name,
        cause: error?.cause,
        stack: error?.stack,
        raw: error,
      });
      throw error;
    }
  }

  console.table(summary);
  console.log('✅ Bootstrap completo.');
}

main().catch((error) => {
  console.error('❌ Error durante el bootstrap:', error.message || error);
  process.exit(1);
});
