alter table private.admin_credentials add column if not exists must_change_password boolean not null default false;
update private.admin_credentials set must_change_password = true where id = 1;

create or replace function public.admin_password_change_required()
returns boolean
language sql
security definer
set search_path = pg_catalog, public, private
as $$
  select must_change_password from private.admin_credentials where id = 1;
$$;

revoke all on function public.admin_password_change_required() from public, anon, authenticated;
grant execute on function public.admin_password_change_required() to service_role;

create or replace function public.admin_update_password(p_current_password text, p_new_password text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, private, extensions
as $$
declare
  changed integer;
begin
  update private.admin_credentials
  set password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf', 12)), updated_at = now(), must_change_password = false
  where id = 1 and password_hash = extensions.crypt(p_current_password, password_hash)
    and length(p_new_password) between 12 and 128;
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;
revoke all on function public.admin_update_password(text, text) from public, anon, authenticated;
grant execute on function public.admin_update_password(text, text) to service_role;
