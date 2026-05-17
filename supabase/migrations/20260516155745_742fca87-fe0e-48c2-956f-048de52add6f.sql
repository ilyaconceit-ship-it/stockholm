
-- ENUMS
create type public.app_role as enum ('admin', 'broadcaster');
create type public.approval_status as enum ('pending', 'approved', 'rejected');
create type public.staff_category as enum ('admin_branch', 'curator', 'tech_curator', 'master', 'broadcaster');
create type public.attendance_status as enum ('present', 'absent', 'excused');
create type public.blacklist_status as enum ('active', 'expired', 'lifted');

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  discord_id text,
  status public.approval_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- USER ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique(user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;

create or replace function public.is_approved(_user_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=_user_id and status='approved')
$$;

-- STAFF
create table public.staff_members (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  discord_id text,
  name text,
  category public.staff_category not null default 'broadcaster',
  join_date date not null default current_date,
  warnings text default '-',
  vacation boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.staff_members enable row level security;

-- SCHEDULES (трибуны)
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  weekday text,
  tribune_type text,
  time text,
  host1_first text,
  host2_first text,
  host1_second text,
  host2_second text,
  ad_branches text,
  created_at timestamptz not null default now()
);
alter table public.schedules enable row level security;

-- MEETINGS
create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  title text not null default 'Собрание',
  created_at timestamptz not null default now()
);
alter table public.meetings enable row level security;

-- ATTENDANCE
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  staff_id uuid not null references public.staff_members(id) on delete cascade,
  status public.attendance_status not null default 'absent',
  unique(meeting_id, staff_id)
);
alter table public.attendance enable row level security;

-- NORMS
create table public.norms (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff_members(id) on delete cascade,
  period_start date not null,
  week int not null default 1,
  slot int not null default 1,
  completed boolean not null default false,
  unique(staff_id, period_start, week, slot)
);
alter table public.norms enable row level security;

-- SALARIES
create table public.salaries (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff_members(id) on delete cascade,
  period_start date not null,
  tribunes_count int not null default 0,
  amount int not null default 0,
  bonus int not null default 0,
  penalty int not null default 0,
  notes text,
  unique(staff_id, period_start)
);
alter table public.salaries enable row level security;

-- COUPLES
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  member1_nickname text not null,
  member1_discord_id text,
  member2_nickname text not null,
  member2_discord_id text,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.couples enable row level security;

-- BLACKLIST
create table public.blacklist (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  reason text,
  admin_name text,
  date date not null default current_date,
  duration text,
  status public.blacklist_status not null default 'active',
  created_at timestamptz not null default now()
);
alter table public.blacklist enable row level security;

-- ACTIVITY LOGS
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  actor_name text,
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);
alter table public.activity_logs enable row level security;

-- RLS POLICIES
-- profiles: user reads own + admin all; user updates own basic; admin updates all; insert via trigger
create policy "profiles self read" on public.profiles for select using (auth.uid()=id);
create policy "profiles admin read" on public.profiles for select using (public.has_role(auth.uid(),'admin'));
create policy "profiles admin update" on public.profiles for update using (public.has_role(auth.uid(),'admin'));
create policy "profiles self update" on public.profiles for update using (auth.uid()=id);

-- user_roles: user reads own; admin all
create policy "roles self read" on public.user_roles for select using (auth.uid()=user_id);
create policy "roles admin all" on public.user_roles for all using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- generic helper: approved users can read; admin can write
-- STAFF
create policy "staff read approved" on public.staff_members for select using (public.is_approved(auth.uid()));
create policy "staff admin write" on public.staff_members for all using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
-- SCHEDULES
create policy "sched read approved" on public.schedules for select using (public.is_approved(auth.uid()));
create policy "sched admin write" on public.schedules for all using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
-- MEETINGS
create policy "meet read approved" on public.meetings for select using (public.is_approved(auth.uid()));
create policy "meet admin write" on public.meetings for all using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
-- ATTENDANCE
create policy "att read approved" on public.attendance for select using (public.is_approved(auth.uid()));
create policy "att admin write" on public.attendance for all using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
-- NORMS
create policy "norms read approved" on public.norms for select using (public.is_approved(auth.uid()));
create policy "norms admin write" on public.norms for all using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
-- SALARIES
create policy "sal read approved" on public.salaries for select using (public.is_approved(auth.uid()));
create policy "sal admin write" on public.salaries for all using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
-- COUPLES
create policy "cpl read approved" on public.couples for select using (public.is_approved(auth.uid()));
create policy "cpl admin write" on public.couples for all using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
-- BLACKLIST
create policy "bl read approved" on public.blacklist for select using (public.is_approved(auth.uid()));
create policy "bl admin write" on public.blacklist for all using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
-- ACTIVITY LOGS
create policy "log read approved" on public.activity_logs for select using (public.is_approved(auth.uid()));
create policy "log admin write" on public.activity_logs for all using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- TRIGGER: auto-create profile + broadcaster role on signup
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

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated before update on public.profiles
for each row execute function public.set_updated_at();
create trigger staff_updated before update on public.staff_members
for each row execute function public.set_updated_at();
