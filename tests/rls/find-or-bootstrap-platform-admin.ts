import { type SupabaseClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const FALLBACK_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

export type PlatformAdminBootstrapResult = {
  userId: string;
  seeded: boolean;
};

export async function findOrBootstrapPlatformAdmin(serviceClient: SupabaseClient): Promise<PlatformAdminBootstrapResult> {
  const envValue = process.env.SUPABASE_TEST_PLATFORM_ADMIN_ID;
  const candidate = envValue && envValue !== FALLBACK_PLACEHOLDER ? envValue : null;

  if (candidate) {
    const { data, error } = await serviceClient.auth.admin.getUserById(candidate);
    if (!error && data?.user) {
      return { userId: data.user.id, seeded: false };
    }
    console.warn(`⚠️ SUPABASE_TEST_PLATFORM_ADMIN_ID (${candidate}) no existe; se intentará usar un fallback.`);
  }

  // Buscar un platform admin existente en la tabla
  const { data: existingAdmins, error: platformError } = await serviceClient
    .from('platform_admins')
    .select('user_id')
    .limit(1);

  if (platformError) {
    throw platformError;
  }

  if (existingAdmins && existingAdmins.length > 0) {
    const target = existingAdmins[0].user_id;
    const { data: userData, error: getUserError } = await serviceClient.auth.admin.getUserById(target);
    if (!getUserError && userData?.user) {
      console.warn(`⚠️ Usando platform_admin existente ${target} como invitador.`);
      return { userId: target, seeded: false };
    }
    console.warn(`⚠️ platform_admin ${target} no está en auth.users; se creará uno temporal.`);
  }

  // Crear un usuario temporal para las pruebas
  const email = `platform-admin-test+${crypto.randomUUID()}@example.com`;
  const password = `Adm!n-${crypto.randomBytes(6).toString('hex')}`;

  const { data: createdUser, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !createdUser?.user) {
    throw createError || new Error('No se pudo crear el platform admin temporal.');
  }

  const userId = createdUser.user.id;

  const { error: platformInsertError } = await serviceClient
    .from('platform_admins')
    .insert({ user_id: userId, granted_by: userId });

  if (platformInsertError) {
    throw platformInsertError;
  }

  console.warn(`⚠️ Se creó un platform_admin temporal ${userId} para las pruebas RLS.`);

  return { userId, seeded: true };
}
