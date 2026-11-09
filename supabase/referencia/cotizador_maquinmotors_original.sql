-- =====================================================================
--  Cotizador de servicio técnico Maquinmotors
--  Proyecto Supabase: Onteam (mismo de RRHH) – tablas con prefijo tar_
--  Respaldo del script aplicado. Si ya se aplicó, no hace falta repetirlo.
-- =====================================================================
create table if not exists public.tar_usuarios (
  id        uuid primary key references auth.users(id) on delete cascade,
  email     text not null,
  nombre    text,
  rol       text not null default 'pendiente'
            check (rol in ('admin','supervisor','ventas','mantenimiento','tecnico','pendiente')),
  creado    timestamptz not null default now()
);

create or replace function public.tar_rol()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select rol from public.tar_usuarios where id = auth.uid()), 'ninguno');
$$;
revoke execute on function public.tar_rol() from anon;

create table if not exists public.tar_config (
  clave            text primary key,
  datos            jsonb not null,
  actualizado      timestamptz not null default now(),
  actualizado_por  uuid references auth.users(id) on delete set null
);

create table if not exists public.tar_cotizaciones (
  id           bigserial primary key,
  numero       text unique,
  cliente      text,
  ciudad       text,
  estado       text not null default 'Borrador'
               check (estado in ('Borrador','Enviada','Aprobada','Rechazada','Ejecutada')),
  total        numeric(12,2),
  asignados    text[] not null default '{}',
  datos        jsonb not null,
  creado_por   uuid default auth.uid() references auth.users(id) on delete set null,
  creado       timestamptz not null default now(),
  actualizado  timestamptz not null default now()
);
create index if not exists tar_cot_estado_idx on public.tar_cotizaciones(estado);
create index if not exists tar_cot_asig_idx on public.tar_cotizaciones using gin(asignados);
create index if not exists tar_cot_creado_por_idx on public.tar_cotizaciones(creado_por);
create index if not exists tar_cfg_act_por_idx on public.tar_config(actualizado_por);

create or replace function public.tar_numerar()
returns trigger language plpgsql set search_path = public as $$
begin
  new.numero := 'COT-' || lpad(new.id::text, 4, '0');
  return new;
end $$;
drop trigger if exists tar_numerar_trg on public.tar_cotizaciones;
create trigger tar_numerar_trg before insert on public.tar_cotizaciones
  for each row execute function public.tar_numerar();

alter table public.tar_usuarios     enable row level security;
alter table public.tar_config       enable row level security;
alter table public.tar_cotizaciones enable row level security;

create policy tar_usr_sel on public.tar_usuarios for select to authenticated
  using (id = (select auth.uid()) or (select public.tar_rol()) = 'admin');
create policy tar_usr_ins on public.tar_usuarios for insert to authenticated
  with check (id = (select auth.uid()) and rol = 'pendiente');
create policy tar_usr_upd on public.tar_usuarios for update to authenticated
  using ((select public.tar_rol()) = 'admin') with check ((select public.tar_rol()) = 'admin');

create policy tar_cfg_sel on public.tar_config for select to authenticated using (
  case when clave = 'costos' then (select public.tar_rol()) in ('admin','supervisor')
       else (select public.tar_rol()) in ('admin','supervisor','ventas','mantenimiento','tecnico') end);
create policy tar_cfg_ins on public.tar_config for insert to authenticated with check (
  (select public.tar_rol()) = 'admin'
  or ((select public.tar_rol()) = 'supervisor' and clave in ('catalogo','ciudades','tecnicos')));
create policy tar_cfg_upd on public.tar_config for update to authenticated using (
  (select public.tar_rol()) = 'admin'
  or ((select public.tar_rol()) = 'supervisor' and clave in ('catalogo','ciudades','tecnicos')))
  with check (
  (select public.tar_rol()) = 'admin'
  or ((select public.tar_rol()) = 'supervisor' and clave in ('catalogo','ciudades','tecnicos')));

create policy tar_cot_sel on public.tar_cotizaciones for select to authenticated using (
  (select public.tar_rol()) in ('admin','supervisor','ventas','mantenimiento')
  or ((select public.tar_rol()) = 'tecnico' and lower((select auth.jwt()) ->> 'email') = any(asignados)));
create policy tar_cot_ins on public.tar_cotizaciones for insert to authenticated
  with check ((select public.tar_rol()) in ('admin','supervisor','ventas','mantenimiento'));
create policy tar_cot_upd on public.tar_cotizaciones for update to authenticated using (
  (select public.tar_rol()) in ('admin','supervisor')
  or ((select public.tar_rol()) in ('ventas','mantenimiento') and creado_por = (select auth.uid()) and estado in ('Borrador','Enviada')))
  with check (
  (select public.tar_rol()) in ('admin','supervisor')
  or ((select public.tar_rol()) in ('ventas','mantenimiento') and creado_por = (select auth.uid()) and estado in ('Borrador','Enviada')));
create policy tar_cot_del on public.tar_cotizaciones for delete to authenticated
  using ((select public.tar_rol()) = 'admin');

-- Primer administrador
insert into public.tar_usuarios (id, email, nombre, rol)
select id, email, 'Fernando McBride', 'admin' from auth.users where lower(email) = 'fmcbride@hotmail.com'
on conflict (id) do update set rol = 'admin';
