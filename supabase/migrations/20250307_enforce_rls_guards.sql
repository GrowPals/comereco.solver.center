-- Reforzar seguridad en mutaciones críticas para reflejar reglas de negocio
-- Ejecutar en conjunto con los tests RLS (npm run test:rls)

create or replace function public.is_service_role()
returns boolean
language sql
stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), '') = 'service_role'
$$;

create or replace function public.enforce_company_mutations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_service_role() then
    if TG_OP = 'DELETE' then
      return OLD;
    else
      return NEW;
    end if;
  end if;

  if auth.uid() is null then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;

  if TG_OP = 'UPDATE' then
    if public.is_platform_admin() then
      return NEW;
    end if;

    if NEW.id <> public.get_user_company_id() then
      raise exception 'Solo puedes actualizar tu compañía' using errcode = '42501';
    end if;

    if not public.is_admin() then
      raise exception 'Solo administradores pueden actualizar la compañía' using errcode = '42501';
    end if;

    return NEW;
  elsif TG_OP = 'DELETE' then
    if not public.is_platform_admin() then
      raise exception 'Solo platform admin puede eliminar compañías' using errcode = '42501';
    end if;
    return OLD;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_enforce_company_update on public.companies;
drop trigger if exists trg_enforce_company_delete on public.companies;

create trigger trg_enforce_company_update
before update on public.companies
for each row execute function public.enforce_company_mutations();

create trigger trg_enforce_company_delete
before delete on public.companies
for each row execute function public.enforce_company_mutations();


create or replace function public.enforce_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_service_role() then
    return NEW;
  end if;

  if auth.uid() is null then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;

  if public.is_platform_admin() then
    return NEW;
  end if;

  if auth.uid() = OLD.id then
    if NEW.role_v2 <> OLD.role_v2
       or NEW.company_id <> OLD.company_id
       or coalesce(NEW.can_submit_without_approval, false) <> coalesce(OLD.can_submit_without_approval, false) then
      raise exception 'No puedes modificar tus permisos' using errcode = '42501';
    end if;
    return NEW;
  end if;

  if public.is_admin() and OLD.company_id = public.get_user_company_id() then
    return NEW;
  end if;

  raise exception 'No autorizado para actualizar este perfil' using errcode = '42501';
end;
$$;

drop trigger if exists trg_enforce_profile_update on public.profiles;

create trigger trg_enforce_profile_update
before update on public.profiles
for each row execute function public.enforce_profile_update();


create or replace function public.enforce_project_mutations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if public.is_service_role() then
    if TG_OP = 'DELETE' then
      return OLD;
    else
      return NEW;
    end if;
  end if;

  if v_uid is null then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;

  if public.is_platform_admin() then
    if TG_OP = 'DELETE' then
      return OLD;
    else
      return NEW;
    end if;
  end if;

  if TG_OP = 'DELETE' then
    if public.is_admin() and OLD.company_id = public.get_user_company_id() then
      return OLD;
    end if;
    raise exception 'Solo administradores pueden eliminar proyectos' using errcode = '42501';
  elsif TG_OP = 'UPDATE' then
    if public.is_admin() and OLD.company_id = public.get_user_company_id() then
      return NEW;
    end if;
    if public.is_supervisor() and OLD.company_id = public.get_user_company_id() and OLD.supervisor_id = v_uid then
      return NEW;
    end if;
    raise exception 'No autorizado para actualizar este proyecto' using errcode = '42501';
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_enforce_project_update on public.projects;
drop trigger if exists trg_enforce_project_delete on public.projects;

create trigger trg_enforce_project_update
before update on public.projects
for each row execute function public.enforce_project_mutations();

create trigger trg_enforce_project_delete
before delete on public.projects
for each row execute function public.enforce_project_mutations();


create or replace function public.enforce_requisition_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if public.is_service_role() then
    return NEW;
  end if;

  if v_uid is null then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;

  if public.is_platform_admin() then
    return NEW;
  end if;

  if public.is_admin() and OLD.company_id = public.get_user_company_id() then
    return NEW;
  end if;

  if v_uid = OLD.created_by and OLD.business_status = 'draft'::public.business_status then
    return NEW;
  end if;

  raise exception 'Solo el creador puede modificar requisiciones en borrador' using errcode = '42501';
end;
$$;

drop trigger if exists trg_enforce_requisition_update on public.requisitions;

create trigger trg_enforce_requisition_update
before update on public.requisitions
for each row execute function public.enforce_requisition_update();
