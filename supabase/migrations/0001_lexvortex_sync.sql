-- CG VERTEX · Fase 2 · Nuvem e sincronização (local-first)
-- Cada escritório (firm) só vê os seus dados. Os registos são guardados como JSON (data)
-- com o mesmo formato que a app já usa no dispositivo, para a migração ser direta.

create extension if not exists pgcrypto;

create table public.firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.members (
  firm_id uuid not null references public.firms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'lawyer' check (role in ('admin','lawyer','trainee','assistant')),
  created_at timestamptz not null default now(),
  primary key (firm_id, user_id)
);
create index members_user_idx on public.members(user_id);

-- Funções de apoio às políticas (security definer evita recursão de RLS)
create or replace function public.is_member(f uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where firm_id = f and user_id = auth.uid())
$$;
create or replace function public.member_role(f uuid) returns text
language sql stable security definer set search_path = public as $$
  select role from members where firm_id = f and user_id = auth.uid()
$$;

-- O servidor marca sempre a hora e o autor da última alteração
create or replace function public.touch() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

-- Tabelas sincronizadas, todas com a mesma forma
do $$
declare t text;
begin
  foreach t in array array['clients','cases','deadlines','events','fees','expenses','recordings','documents','time_entries','templates','tasks','contacts']
  loop
    execute format($f$
      create table public.%1$I (
        firm_id uuid not null references public.firms(id) on delete cascade,
        id text not null,
        data jsonb not null,
        deleted boolean not null default false,
        updated_at timestamptz not null default now(),
        updated_by uuid,
        primary key (firm_id, id)
      );
      create index %1$s_sync_idx on public.%1$I (firm_id, updated_at);
      create trigger %1$s_touch before insert or update on public.%1$I
        for each row execute function public.touch();
      alter table public.%1$I enable row level security;
      create policy "%1$s: membros leem" on public.%1$I for select to authenticated
        using (public.is_member(firm_id));
      create policy "%1$s: membros criam" on public.%1$I for insert to authenticated
        with check (public.is_member(firm_id));
      create policy "%1$s: membros alteram" on public.%1$I for update to authenticated
        using (public.is_member(firm_id)) with check (public.is_member(firm_id));
    $f$, t);
  end loop;
end $$;
-- Sem política de DELETE: apagar é "deleted = true", para a remoção chegar a todos os dispositivos.

-- Colunas extra nos prazos, para a função agendada dos alertas (fase Web Push)
alter table public.deadlines add column due_date date, add column grace_end date, add column done boolean not null default false;
create index deadlines_due_idx on public.deadlines (due_date) where not done and not deleted;

-- Escritórios e membros
alter table public.firms enable row level security;
create policy "firms: ver o próprio" on public.firms for select to authenticated using (public.is_member(id));
create policy "firms: admin altera" on public.firms for update to authenticated using (public.member_role(id) = 'admin');

alter table public.members enable row level security;
create policy "members: ver colegas" on public.members for select to authenticated using (public.is_member(firm_id));
create policy "members: admin gere" on public.members for all to authenticated
  using (public.member_role(firm_id) = 'admin') with check (public.member_role(firm_id) = 'admin');

-- Criar escritório no primeiro login (fica admin quem o cria)
create or replace function public.create_firm(p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare f uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  insert into firms(name) values (coalesce(nullif(trim(p_name), ''), 'Escritório')) returning id into f;
  insert into members(firm_id, user_id, role) values (f, auth.uid(), 'admin');
  return f;
end $$;
revoke all on function public.create_firm(text) from public;
grant execute on function public.create_firm(text) to authenticated;

-- Ficheiros (áudio e documentos): pasta = id do escritório
insert into storage.buckets (id, name, public) values ('lexvortex-files', 'lexvortex-files', false)
on conflict (id) do nothing;
create policy "lexvortex-files: escritório" on storage.objects for all to authenticated
  using (bucket_id = 'lexvortex-files' and public.is_member(((storage.foldername(name))[1])::uuid))
  with check (bucket_id = 'lexvortex-files' and public.is_member(((storage.foldername(name))[1])::uuid));
