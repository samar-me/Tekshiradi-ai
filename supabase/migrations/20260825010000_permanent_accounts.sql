-- Permanent accounts migration. This is additive and preserves every existing teacher row.
begin;

alter table public.users alter column telegram_id drop not null;
alter table public.users add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;
alter table public.users add column if not exists phone text unique;
alter table public.users add column if not exists email text unique;
alter table public.users add column if not exists avatar_url text;
alter table public.users add column if not exists region text;
alter table public.users add column if not exists district text;
alter table public.users add column if not exists additional_subjects text[] not null default '{}';
alter table public.users add column if not exists onboarding_completed boolean not null default false;
alter table public.users add column if not exists deletion_requested_at timestamptz;
alter table public.users add column if not exists preferences jsonb not null default '{"language":"uz","theme":"system","notifications":true,"default_max_score":20}'::jsonb;

-- Existing teachers that already completed the old profile flow stay completed.
update public.users set onboarding_completed = true where subject is not null and btrim(subject) <> '';

alter table public.classes add column if not exists academic_year text;
alter table public.classes add column if not exists updated_at timestamptz not null default now();

alter table public.students add column if not exists teacher_id uuid references public.users(id) on delete cascade;
alter table public.students add column if not exists optional_student_code text;
alter table public.students add column if not exists updated_at timestamptz not null default now();
update public.students s set teacher_id = c.teacher_id from public.classes c where s.class_id = c.id and s.teacher_id is null;
alter table public.students alter column teacher_id set not null;

alter table public.results add column if not exists teacher_id uuid references public.users(id) on delete cascade;
alter table public.results add column if not exists teacher_comment text;
update public.results r set teacher_id = s.teacher_id from public.submissions s where r.submission_id = s.id and r.teacher_id is null;
alter table public.results alter column teacher_id set not null;

create table if not exists public.check_files (
  id uuid primary key default gen_random_uuid(),
  check_id uuid not null references public.submissions(id) on delete cascade,
  teacher_id uuid not null references public.users(id) on delete cascade,
  storage_path text not null,
  page_number integer not null default 1,
  created_at timestamptz not null default now()
);
create table if not exists public.subscriptions (
  teacher_id uuid primary key references public.users(id) on delete cascade,
  plan text not null default 'free', status text not null default 'active',
  started_at timestamptz not null default now(), expires_at timestamptz
);
create table if not exists public.usage (
  teacher_id uuid primary key references public.users(id) on delete cascade,
  checks_used integer not null default 0, reset_at timestamptz not null default (date_trunc('month',now()) + interval '1 month')
);
insert into public.subscriptions(teacher_id) select id from public.users on conflict do nothing;
insert into public.usage(teacher_id) select id from public.users on conflict do nothing;

create or replace function public.initialize_teacher_account()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.subscriptions(teacher_id) values(new.id) on conflict do nothing;
  insert into public.usage(teacher_id) values(new.id) on conflict do nothing;
  return new;
end; $$;
drop trigger if exists initialize_teacher_account_after_insert on public.users;
create trigger initialize_teacher_account_after_insert after insert on public.users for each row execute function public.initialize_teacher_account();

create index if not exists idx_users_auth_user_id on public.users(auth_user_id);
create index if not exists idx_students_teacher_id on public.students(teacher_id);
create index if not exists idx_results_teacher_id on public.results(teacher_id);
create index if not exists idx_check_files_teacher_id on public.check_files(teacher_id);

alter table public.users enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.submissions enable row level security;
alter table public.results enable row level security;
alter table public.events enable row level security;
alter table public.check_files enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage enable row level security;

revoke all on public.users,public.classes,public.students,public.submissions,public.results,public.events,public.check_files,public.subscriptions,public.usage from anon,authenticated;
grant select,update on public.users to authenticated;
grant select,insert,update,delete on public.classes,public.students,public.submissions,public.results,public.events,public.check_files to authenticated;
grant select on public.subscriptions,public.usage to authenticated;

-- Remove any previous broad policies before installing ownership policies.
do $$ declare r record; begin
  for r in select schemaname, tablename, policyname from pg_policies where schemaname='public' and tablename in ('users','classes','students','submissions','results','events','check_files','subscriptions','usage') loop
    execute format('drop policy if exists %I on %I.%I',r.policyname,r.schemaname,r.tablename);
  end loop;
end $$;

create policy users_select_own on public.users for select to authenticated using (auth_user_id = (select auth.uid()));
create policy users_update_own on public.users for update to authenticated using (auth_user_id = (select auth.uid())) with check (auth_user_id = (select auth.uid()));
create policy classes_own on public.classes for all to authenticated using (teacher_id in (select id from public.users where auth_user_id=(select auth.uid()))) with check (teacher_id in (select id from public.users where auth_user_id=(select auth.uid())));
create policy students_own on public.students for all to authenticated using (teacher_id in (select id from public.users where auth_user_id=(select auth.uid()))) with check (teacher_id in (select id from public.users where auth_user_id=(select auth.uid())));
create policy submissions_own on public.submissions for all to authenticated using (teacher_id in (select id from public.users where auth_user_id=(select auth.uid()))) with check (teacher_id in (select id from public.users where auth_user_id=(select auth.uid())));
create policy results_own on public.results for all to authenticated using (teacher_id in (select id from public.users where auth_user_id=(select auth.uid()))) with check (teacher_id in (select id from public.users where auth_user_id=(select auth.uid())));
create policy events_own on public.events for all to authenticated using (user_id in (select id from public.users where auth_user_id=(select auth.uid()))) with check (user_id in (select id from public.users where auth_user_id=(select auth.uid())));
create policy check_files_own on public.check_files for all to authenticated using (teacher_id in (select id from public.users where auth_user_id=(select auth.uid()))) with check (teacher_id in (select id from public.users where auth_user_id=(select auth.uid())));
create policy subscriptions_own on public.subscriptions for select to authenticated using (teacher_id in (select id from public.users where auth_user_id=(select auth.uid())));
create policy usage_own on public.usage for select to authenticated using (teacher_id in (select id from public.users where auth_user_id=(select auth.uid())));

-- Submission files are private and namespaced by Supabase auth user id.
update storage.buckets set public=false where id='submissions';
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Service Role / Authenticated Upload" on storage.objects;
create policy submission_files_select_own on storage.objects for select to authenticated using (bucket_id='submissions' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy submission_files_insert_own on storage.objects for insert to authenticated with check (bucket_id='submissions' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy submission_files_update_own on storage.objects for update to authenticated using (bucket_id='submissions' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='submissions' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy submission_files_delete_own on storage.objects for delete to authenticated using (bucket_id='submissions' and (storage.foldername(name))[1]=(select auth.uid())::text);

commit;
