import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const VALID_ROLES = new Set(["admin", "supervisor", "user", "dev"]);
const DEV_ROLE = "dev";
const DEFAULT_REDIRECT_URL = "https://comereco.solver.center/reset-password";

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

const buildRedirectUrl = () => {
  const explicitRedirect = Deno.env.get("INVITE_REDIRECT_URL")?.trim();
  if (explicitRedirect) {
    return explicitRedirect;
  }

  const baseUrl = Deno.env.get("INVITE_REDIRECT_BASE_URL")?.trim()
    || Deno.env.get("SITE_URL")?.trim();
  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, "")}/reset-password`;
  }

  return DEFAULT_REDIRECT_URL;
};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return jsonResponse({ error: "No autorizado" }, 401);
  }

  const token = authHeader.substring(7).trim();
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

  if (userError || !userData?.user) {
    console.error("invite-user: invalid session", userError);
    return jsonResponse({ error: "Sesión inválida" }, 401);
  }

  const requester = userData.user;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("company_id, role_v2")
    .eq("id", requester.id)
    .single();

  if (profileError || !profile) {
    console.error("invite-user: profile fetch failed", profileError);
    return jsonResponse({ error: "No se pudo obtener el perfil del usuario" }, 403);
  }

  const requesterRole = profile.role_v2;
  const requesterIsDev = requesterRole === DEV_ROLE;
  if (!requesterIsDev && requesterRole !== "admin") {
    return jsonResponse({ error: "No tienes permisos para invitar usuarios" }, 403);
  }

  let payload: { email?: string; role?: string } = {};
  try {
    payload = await req.json();
  } catch (error) {
    console.error("invite-user: invalid JSON", error);
    return jsonResponse({ error: "Formato JSON inválido" }, 400);
  }

  const email = payload.email?.trim().toLowerCase();
  const role = payload.role?.trim();

  if (!email) {
    return jsonResponse({ error: "El email es requerido" }, 400);
  }

  if (!role || !VALID_ROLES.has(role)) {
    return jsonResponse({ error: "Rol inválido" }, 400);
  }

  if (role === DEV_ROLE && !requesterIsDev) {
    return jsonResponse({ error: "Solo un developer puede crear otros developers" }, 403);
  }

  const redirectTo = buildRedirectUrl();

  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      company_id: profile.company_id,
      role_v2: role,
    },
    redirectTo,
  });

  if (inviteError) {
    console.error("invite-user: supabase error", inviteError);

    if (inviteError.message?.includes("already registered")) {
      return jsonResponse({ error: "Este correo ya tiene una cuenta activa" }, 400);
    }

    if (inviteError.message?.includes("email rate limit")) {
      return jsonResponse({ error: "Has enviado demasiadas invitaciones. Intenta más tarde." }, 429);
    }

    return jsonResponse({ error: "No se pudo enviar la invitación" }, 500);
  }

  if (role === DEV_ROLE && inviteData?.user?.id) {
    const { error: platformError } = await supabaseAdmin
      .from("platform_admins")
      .upsert({
        user_id: inviteData.user.id,
        granted_by: requester.id,
      }, { onConflict: "user_id" });

    if (platformError) {
      console.error("invite-user: platform_admins upsert failed", platformError);
    }
  }

  return jsonResponse({
    success: true,
    redirectTo,
    data: inviteData,
  });
});
