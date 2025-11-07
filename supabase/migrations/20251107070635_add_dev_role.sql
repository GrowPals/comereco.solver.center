-- Add developer role and align policies/functions

alter type public.app_role_v2 add value if not exists 'dev';

create or replace function public.is_admin()
 returns boolean
 language plpgsql
 stable security definer
 set search_path to 'public'
as $$
declare
  v_role app_role_v2 := public.get_user_role_v2();
begin
  return v_role in ('admin'::app_role_v2, 'dev'::app_role_v2)
    or public.is_platform_admin();
end;
$$;

create or replace function public.is_admin_or_supervisor()
 returns boolean
 language plpgsql
 stable security definer
 set search_path to 'public'
as $$
declare
  v_role app_role_v2 := public.get_user_role_v2();
begin
  return v_role in (
    'admin'::app_role_v2,
    'dev'::app_role_v2,
    'supervisor'::app_role_v2
  );
end;
$$;

create or replace function public.is_platform_admin()
 returns boolean
 language plpgsql
 stable security definer
 set search_path to 'public'
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    return false;
  end if;

  if exists (
    select 1
    from public.profiles p
    where p.id = v_uid
      and p.role_v2 = 'dev'::app_role_v2
  ) then
    return true;
  end if;

  return exists (
    select 1 from public.platform_admins pa where pa.user_id = v_uid
  );
end;
$$;

-- Recreate project policies so dev/platform admins can manage company data

drop policy if exists "admin_insert_projects" on public.projects;

create policy "admin_insert_projects"
  on public.projects
  as permissive
  for insert
  to public
with check (
  public.is_admin() and (company_id = public.get_user_company_id())
);

drop policy if exists "admin_delete_projects" on public.projects;

create policy "admin_delete_projects"
  on public.projects
  as permissive
  for delete
  to public
using (
  public.is_admin() and (company_id = public.get_user_company_id())
);

create or replace function public.admin_upsert_profile(
  p_user_id uuid,
  p_company_id uuid,
  p_full_name text,
  p_role public.app_role_v2
)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $$
begin
  if p_user_id is null then
    raise exception 'User id is required';
  end if;

  insert into public.profiles (id, company_id, full_name, role_v2, is_active, updated_at)
  values (
    p_user_id,
    p_company_id,
    coalesce(nullif(p_full_name, ''), 'Usuario'),
    coalesce(p_role, 'user'::public.app_role_v2),
    true,
    now()
  )
  on conflict (id) do update
    set company_id = excluded.company_id,
        full_name = excluded.full_name,
        role_v2 = excluded.role_v2,
        is_active = true,
        updated_at = now();
end;
$$;

grant execute on function public.admin_upsert_profile(uuid, uuid, text, public.app_role_v2) to service_role;
