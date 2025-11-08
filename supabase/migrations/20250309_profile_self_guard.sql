-- Impedir que un usuario cambie su propio rol o compañía desde perfiles

create or replace function public.prevent_self_role_escalation()
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

  if auth.uid() = OLD.id then
    if NEW.role_v2 is distinct from OLD.role_v2
       or NEW.company_id is distinct from OLD.company_id
       or coalesce(NEW.can_submit_without_approval, false) <> coalesce(OLD.can_submit_without_approval, false) then
      raise exception 'No puedes modificar tu propio rol o permisos' using errcode = '42501';
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_prevent_self_role_escalation on public.profiles;

create trigger trg_prevent_self_role_escalation
before update on public.profiles
for each row execute function public.prevent_self_role_escalation();
