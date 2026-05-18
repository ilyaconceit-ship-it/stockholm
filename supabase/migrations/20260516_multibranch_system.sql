-- =====================================================
-- MULTI-BRANCH SYSTEM MIGRATION
-- Adds support for multiple staff branches with data isolation
-- =====================================================

-- 1. CREATE BRANCHES TABLE
create table public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  discord_role_id text not null unique,
  display_name text not null,
  color text default '#ffffff',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.branches enable row level security;

-- Insert all staff branches
insert into public.branches (name, discord_role_id, display_name, color) values
  ('broadcaster', '993885878491549848', 'Broadcaster', '#ff6b9d'),
  ('support', '993642256856789082', 'Support', '#4ade80'),
  ('control', '993642219397460079', 'Control', '#60a5fa'),
  ('closemod', '1097305941386461184', 'Close Moderator', '#a78bfa'),
  ('eventsmod', '993642202842529792', 'Events Moderator', '#f59e0b'),
  ('moderator', '1097305667804594277', 'Moderator', '#ef4444'),
  ('contentmaker', '1015681838062239906', 'Content Maker', '#ec4899'),
  ('helper', '1341205509977542679', 'Helper', '#14b8a6');

-- 2. CREATE USER_BRANCHES TABLE (many-to-many)
create table public.user_branches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, branch_id)
);

alter table public.user_branches enable row level security;

-- 3. ADD BRANCH_ID TO ALL DATA TABLES
alter table public.staff_members add column branch_id uuid references public.branches(id) on delete cascade;
alter table public.schedules add column branch_id uuid references public.branches(id) on delete cascade;
alter table public.meetings add column branch_id uuid references public.branches(id) on delete cascade;
alter table public.norms add column branch_id uuid references public.branches(id) on delete cascade;
alter table public.salaries add column branch_id uuid references public.branches(id) on delete cascade;
alter table public.couples add column branch_id uuid references public.branches(id) on delete cascade;
alter table public.blacklist add column branch_id uuid references public.branches(id) on delete cascade;

-- Create indexes for performance
create index idx_staff_branch on public.staff_members(branch_id);
create index idx_schedules_branch on public.schedules(branch_id);
create index idx_meetings_branch on public.meetings(branch_id);
create index idx_norms_branch on public.norms(branch_id);
create index idx_salaries_branch on public.salaries(branch_id);
create index idx_couples_branch on public.couples(branch_id);
create index idx_blacklist_branch on public.blacklist(branch_id);
create index idx_user_branches_user on public.user_branches(user_id);
create index idx_user_branches_branch on public.user_branches(branch_id);

-- 4. HELPER FUNCTIONS
-- Check if user has access to specific branch
create or replace function public.has_branch_access(_user_id uuid, _branch_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.user_branches
    where user_id = _user_id and branch_id = _branch_id
  ) or public.has_role(_user_id, 'admin')
$$;

-- Get user's branches
create or replace function public.get_user_branches(_user_id uuid)
returns setof uuid language sql stable security definer set search_path=public as $$
  select branch_id from public.user_branches where user_id = _user_id
$$;

-- 5. UPDATE RLS POLICIES
-- Drop old policies
drop policy if exists "staff read approved" on public.staff_members;
drop policy if exists "staff admin write" on public.staff_members;
drop policy if exists "sched read approved" on public.schedules;
drop policy if exists "sched admin write" on public.schedules;
drop policy if exists "meet read approved" on public.meetings;
drop policy if exists "meet admin write" on public.meetings;
drop policy if exists "att read approved" on public.attendance;
drop policy if exists "att admin write" on public.attendance;
drop policy if exists "norms read approved" on public.norms;
drop policy if exists "norms admin write" on public.norms;
drop policy if exists "sal read approved" on public.salaries;
drop policy if exists "sal admin write" on public.salaries;
drop policy if exists "cpl read approved" on public.couples;
drop policy if exists "cpl admin write" on public.couples;
drop policy if exists "bl read approved" on public.blacklist;
drop policy if exists "bl admin write" on public.blacklist;

-- New branch-aware policies
-- BRANCHES
create policy "branches read all" on public.branches for select using (true);
create policy "branches admin write" on public.branches for all using (public.has_role(auth.uid(), 'admin'));

-- USER_BRANCHES
create policy "user_branches self read" on public.user_branches for select using (auth.uid() = user_id);
create policy "user_branches admin all" on public.user_branches for all using (public.has_role(auth.uid(), 'admin'));

-- STAFF_MEMBERS
create policy "staff read branch" on public.staff_members for select
  using (public.is_approved(auth.uid()) and public.has_branch_access(auth.uid(), branch_id));
create policy "staff admin write" on public.staff_members for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- SCHEDULES
create policy "schedules read branch" on public.schedules for select
  using (public.is_approved(auth.uid()) and public.has_branch_access(auth.uid(), branch_id));
create policy "schedules admin write" on public.schedules for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- MEETINGS
create policy "meetings read branch" on public.meetings for select
  using (public.is_approved(auth.uid()) and public.has_branch_access(auth.uid(), branch_id));
create policy "meetings admin write" on public.meetings for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ATTENDANCE (через meeting_id -> meetings.branch_id)
create policy "attendance read branch" on public.attendance for select
  using (
    public.is_approved(auth.uid()) and
    exists(
      select 1 from public.meetings m
      where m.id = meeting_id and public.has_branch_access(auth.uid(), m.branch_id)
    )
  );
create policy "attendance admin write" on public.attendance for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- NORMS (через staff_id -> staff_members.branch_id)
create policy "norms read branch" on public.norms for select
  using (
    public.is_approved(auth.uid()) and
    exists(
      select 1 from public.staff_members s
      where s.id = staff_id and public.has_branch_access(auth.uid(), s.branch_id)
    )
  );
create policy "norms admin write" on public.norms for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- SALARIES (через staff_id -> staff_members.branch_id)
create policy "salaries read branch" on public.salaries for select
  using (
    public.is_approved(auth.uid()) and
    exists(
      select 1 from public.staff_members s
      where s.id = staff_id and public.has_branch_access(auth.uid(), s.branch_id)
    )
  );
create policy "salaries admin write" on public.salaries for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- COUPLES
create policy "couples read branch" on public.couples for select
  using (public.is_approved(auth.uid()) and public.has_branch_access(auth.uid(), branch_id));
create policy "couples admin write" on public.couples for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- BLACKLIST
create policy "blacklist read branch" on public.blacklist for select
  using (public.is_approved(auth.uid()) and public.has_branch_access(auth.uid(), branch_id));
create policy "blacklist admin write" on public.blacklist for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ACTIVITY_LOGS (no branch_id, global for admins)
create policy "logs read approved" on public.activity_logs for select
  using (public.is_approved(auth.uid()));
create policy "logs admin write" on public.activity_logs for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 6. MIGRATE EXISTING DATA (optional - assign all existing data to broadcaster branch)
-- Uncomment if you want to preserve existing data
/*
do $$
declare
  broadcaster_branch_id uuid;
begin
  select id into broadcaster_branch_id from public.branches where name = 'broadcaster';

  update public.staff_members set branch_id = broadcaster_branch_id where branch_id is null;
  update public.schedules set branch_id = broadcaster_branch_id where branch_id is null;
  update public.meetings set branch_id = broadcaster_branch_id where branch_id is null;
  update public.couples set branch_id = broadcaster_branch_id where branch_id is null;
  update public.blacklist set branch_id = broadcaster_branch_id where branch_id is null;
end $$;
*/

-- 7. MAKE BRANCH_ID REQUIRED (uncomment after migration)
-- alter table public.staff_members alter column branch_id set not null;
-- alter table public.schedules alter column branch_id set not null;
-- alter table public.meetings alter column branch_id set not null;
-- alter table public.couples alter column branch_id set not null;
-- alter table public.blacklist alter column branch_id set not null;

-- 8. REVOKE PUBLIC ACCESS
revoke execute on function public.has_branch_access(uuid, uuid) from anon;
revoke execute on function public.get_user_branches(uuid) from anon;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
