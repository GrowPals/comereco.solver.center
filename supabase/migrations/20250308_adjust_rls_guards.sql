-- Ajustes adicionales a reglas RLS: funciones booleanas robustas y guardias que generan errores claros

-- Normalizar helpers booleanos existentes
create or replace function public.is_admin()
returns boolean
language plpgsql
stable security definer
set search_path = public
as $$
declare
  v_role public.app_role_v2 := public.get_user_role_v2();
begin
  return (v_role = 'admin'::public.app_role_v2) is true or public.is_platform_admin();
end;
$$;

create or replace function public.is_supervisor()
returns boolean
language plpgsql
stable security definer
set search_path = public
as $$
declare
  v_role public.app_role_v2 := public.get_user_role_v2();
begin
  return (v_role = 'supervisor'::public.app_role_v2) is true;
end;
$$;

create or replace function public.is_admin_or_supervisor()
returns boolean
language plpgsql
stable security definer
set search_path = public
as $$
declare
  v_role public.app_role_v2 := public.get_user_role_v2();
begin
  return (v_role in ('admin'::public.app_role_v2, 'supervisor'::public.app_role_v2)) is true or public.is_platform_admin();
end;
$$;

-- Limpiar triggers legacy (la lógica pasa a guardias RLS)
drop trigger if exists trg_enforce_company_update on public.companies;
drop trigger if exists trg_enforce_company_delete on public.companies;
drop trigger if exists trg_enforce_profile_update on public.profiles;
drop trigger if exists trg_enforce_project_update on public.projects;
drop trigger if exists trg_enforce_project_delete on public.projects;
drop trigger if exists trg_enforce_requisition_update on public.requisitions;

drop function if exists public.enforce_company_mutations cascade;
drop function if exists public.enforce_profile_update cascade;
drop function if exists public.enforce_project_mutations cascade;
drop function if exists public.enforce_requisition_update cascade;

-- Guardias reutilizables ----------------------------------------------------

create or replace function public.company_update_guard(target_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid := public.get_user_company_id();
begin
  if public.is_service_role() then
    return true;
  end if;

  if auth.uid() is null then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;

  if public.is_platform_admin() then
    return true;
  end if;

  if target_id is not distinct from v_company and public.is_admin() then
    return true;
  end if;

  raise exception 'Solo administradores pueden actualizar la compañía' using errcode = '42501';
end;
$$;

create or replace function public.company_delete_guard(target_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_service_role() or public.is_platform_admin() then
    return true;
  end if;

  raise exception 'Solo platform admin puede eliminar compañías' using errcode = '42501';
end;
$$;

create or replace function public.profile_update_guard(target_id uuid, target_company uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid := public.get_user_company_id();
begin
  if public.is_service_role() then
    return true;
  end if;

  if auth.uid() is null then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;

  if public.is_platform_admin() then
    return true;
  end if;

  if auth.uid() = target_id then
    return true;
  end if;

  if public.is_admin() and target_company is not distinct from v_company then
    return true;
  end if;

  raise exception 'No autorizado para actualizar este perfil' using errcode = '42501';
end;
$$;

create or replace function public.project_update_guard(target_company uuid, target_supervisor uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_company uuid := public.get_user_company_id();
begin
  if public.is_service_role() then
    return true;
  end if;

  if v_uid is null then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;

  if public.is_platform_admin() then
    return true;
  end if;

  if public.is_admin() and target_company is not distinct from v_company then
    return true;
  end if;

  if public.is_supervisor() and target_company is not distinct from v_company and target_supervisor = v_uid then
    return true;
  end if;

  raise exception 'No autorizado para actualizar proyectos' using errcode = '42501';
end;
$$;

create or replace function public.project_delete_guard(target_company uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_service_role() or public.is_platform_admin() then
    return true;
  end if;

  if public.is_admin() and target_company is not distinct from public.get_user_company_id() then
    return true;
  end if;

  raise exception 'Solo administradores pueden eliminar proyectos' using errcode = '42501';
end;
$$;

create or replace function public.requisition_update_guard(target_company uuid, creator uuid, status public.business_status)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_company uuid := public.get_user_company_id();
begin
  if public.is_service_role() then
    return true;
  end if;

  if v_uid is null then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;

  if public.is_platform_admin() then
    return true;
  end if;

  if public.is_admin() and target_company is not distinct from v_company then
    return true;
  end if;

  if v_uid = creator and status = 'draft'::public.business_status then
    return true;
  end if;

  raise exception 'Solo el creador puede modificar requisiciones en borrador' using errcode = '42501';
end;
$$;

-- Alterar políticas para usar guardias --------------------------------------

alter policy "companies_update_manage"
  on public.companies
  using (public.company_update_guard(id))
  with check (public.company_update_guard(id));

alter policy "companies_delete_platform"
  on public.companies
  using (public.company_delete_guard(id));

alter policy "profiles_update_unified"
  on public.profiles
  using (public.profile_update_guard(id, company_id))
  with check (public.profile_update_guard(id, company_id));

alter policy "projects_update_manage"
  on public.projects
  using (public.project_update_guard(company_id, supervisor_id))
  with check (public.project_update_guard(company_id, supervisor_id));

drop policy if exists "projects_delete_manage" on public.projects;
create policy "projects_delete_manage"
  on public.projects
  as permissive
  for delete
  to public
  using (public.project_delete_guard(company_id));

alter policy "requisitions_update_manage"
  on public.requisitions
  using (public.requisition_update_guard(company_id, created_by, business_status))
  with check (public.requisition_update_guard(company_id, created_by, business_status));
