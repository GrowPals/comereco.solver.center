-- Permitir que platform_admins (rol dev) puedan consultar y actualizar perfiles
-- de cualquier compañía para herramientas globales (Gestión de Usuarios, reportes, etc.)

drop policy if exists "profiles_select_unified" on public.profiles;

create policy "profiles_select_unified"
  on public.profiles
  as permissive
  for select
  to public
using (
  public.is_platform_admin()
  or (id = (select auth.uid()))
  or (public.is_admin() and company_id = public.get_user_company_id())
  or (public.is_supervisor() and company_id = public.get_user_company_id())
);

drop policy if exists "profiles_update_unified" on public.profiles;

create policy "profiles_update_unified"
  on public.profiles
  as permissive
  for update
  to public
using (
  public.is_platform_admin()
  or (id = (select auth.uid()))
  or (public.is_admin() and company_id = public.get_user_company_id())
)
with check (
  public.is_platform_admin()
  or (id = (select auth.uid()))
  or (public.is_admin() and company_id = public.get_user_company_id())
);
