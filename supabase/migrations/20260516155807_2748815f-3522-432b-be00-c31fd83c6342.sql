
-- fix search_path on remaining funcs
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id, username, discord_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'discord_id'
  );
  insert into public.user_roles(user_id, role) values (new.id, 'broadcaster');
  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql security definer set search_path=public as $$
begin new.updated_at = now(); return new; end;
$$;

-- revoke public execute on internal/trigger-only funcs
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from anon;
revoke execute on function public.is_approved(uuid) from anon;
