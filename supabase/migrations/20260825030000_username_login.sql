begin;
alter table public.users add column if not exists username text;
create unique index if not exists users_username_unique on public.users (lower(username)) where username is not null;
alter table public.users add constraint users_username_format check (username is null or username ~ '^[a-z0-9_]{3,30}$') not valid;
alter table public.users validate constraint users_username_format;
commit;
