import * as mock from "./mock-data";
import type { Pendiente, Trabajo, Visita } from "./types";
import { diasEntre, horasEntre } from "./format";
import { horasEntreLugares, horasViaje, textoHoras } from "./geografia";

import type { Cliente, Equipo, Perfil, Rol } from "./types";

/** Equipos vigentes: el StoreProvider lo actualiza en cada render con el estado de la maqueta. */
export const registro: { equipos: Equipo[]; clientes: Cliente[]; perfiles: Perfil[] } = { equipos: mock.equipos, clientes: mock.clientes, perfiles: mock.perfiles };
export const perfil = (id: string) => registro.perfiles.find((p) => p.id === id) ?? { id, nombre: "Usuario eliminado", email: "", rol: "tecnico" as Rol, ciudad: "", area: "" };
export const cliente = (id: string) => registro.clientes.find((c) => c.id === id)!;
export const listaClientes = () => registro.clientes;
export const equipo = (id: string) => registro.equipos.find((e) => e.id === id)!;
export const listaEquipos = () => registro.equipos;
export const tecnicos = () => registro.perfiles.filter((p) => p.rol === "tecnico" && p.activo !== false);

// ---------- Roles y permisos ----------
export const ROL_LABEL: Record<Rol, string> = {
  admin: "Administrador",
  jefe: "Jefe de mantenimiento",
  coordinador: "Coordinador de mantenimiento",
  tecnico: "Técnico",
  vendedor: "Vendedor",
};

export type Permiso = "programar_tareas" | "gestionar_usuarios" | "ver_panel" | "aprobar_permisos" | "solicitar_visitas" | "aprobar_solicitudes" | "ver_calendario";
const PERMISOS: Record<Rol, Permiso[]> = {
  admin: ["programar_tareas", "gestionar_usuarios", "ver_panel", "aprobar_permisos", "solicitar_visitas", "aprobar_solicitudes", "ver_calendario"],
  jefe: ["programar_tareas", "gestionar_usuarios", "ver_panel", "aprobar_permisos", "solicitar_visitas", "aprobar_solicitudes", "ver_calendario"],
  coordinador: ["programar_tareas", "ver_panel", "solicitar_visitas", "aprobar_solicitudes", "ver_calendario"],
  tecnico: [],
  vendedor: ["solicitar_visitas", "ver_calendario"],
};
export const puede = (rol: Rol, p: Permiso) => PERMISOS[rol].includes(p);

/** Técnicos a los que un usuario puede programar tareas (el coordinador, solo los de su ciudad). */
export const tecnicosProgramables = (u: Perfil) =>
  u.rol === "tecnico" ? [u] : tecnicos().filter((t) => !u.ciudadesACargo?.length || u.ciudadesACargo.includes(t.ciudad));

export const contexto = (trabajos: Trabajo[], trabajoId: string) => {
  const t = trabajos.find((x) => x.id === trabajoId)!;
  const e = equipo(t.equipoId);
  const c = cliente(e.clienteId);
  return { trabajo: t, equipo: e, cliente: c };
};

/** Horas de una visita. Una visita sin salida de un día anterior no suma horas: queda como alerta. */
export const horasVisita = (v: Visita, ahora: string) => {
  if (!v.checkinEn) return 0;
  if (!v.checkoutEn) return v.checkinEn.slice(0, 10) === ahora.slice(0, 10) ? horasEntre(v.checkinEn, ahora) : 0;
  return horasEntre(v.checkinEn, v.checkoutEn);
};

export const esDeDia = (iso: string | undefined, dia: string) => !!iso && iso.startsWith(dia);

/** Avance calculado: ítems de checklist completados en las visitas del trabajo. */
export const avanceTrabajo = (t: Trabajo, visitas: Visita[]) => {
  if (t.estado === "cerrado") return 100;
  const items = visitas.filter((v) => v.trabajoId === t.id).flatMap((v) => Object.values(v.checklist));
  if (!items.length) return 0;
  return Math.round((items.filter(Boolean).length / items.length) * 100);
};

export type NivelAlerta = "critica" | "advertencia";
export interface Alerta {
  id: string;
  nivel: NivelAlerta;
  titulo: string;
  detalle: string;
  href: string;
}

export const UMBRAL_DISTANCIA_M = 500;
export const UMBRAL_HORAS_VISITA = 10;

export function alertas(visitas: Visita[], pendientes: Pendiente[], trabajos: Trabajo[], ahora: string): Alerta[] {
  const out: Alerta[] = [];
  const hoy = ahora.slice(0, 10);
  for (const v of visitas) {
    const tec = perfil(v.tecnicoId).nombre;
    const href = `/admin/mantenimientos/${v.trabajoId}`;
    if (v.estado === "en_curso" && v.checkinEn && !v.checkinEn.startsWith(hoy)) {
      out.push({ id: `olv-${v.id}`, nivel: "critica", titulo: `${tec} no marcó la salida`, detalle: `Tarea del ${v.checkinEn.slice(8, 10)}/${v.checkinEn.slice(5, 7)} sigue abierta: las horas no se pueden calcular`, href });
    } else if (v.estado === "en_curso" && horasVisita(v, ahora) > UMBRAL_HORAS_VISITA) {
      out.push({ id: `larga-${v.id}`, nivel: "advertencia", titulo: `${tec}: tarea de más de ${UMBRAL_HORAS_VISITA} h`, detalle: v.descripcion, href });
    }
    if (v.checkinEn?.startsWith(hoy) && (v.checkinDistanciaM ?? 0) > UMBRAL_DISTANCIA_M) {
      const km = ((v.checkinDistanciaM ?? 0) / 1000).toFixed(1);
      out.push({ id: `gps-${v.id}`, nivel: "advertencia", titulo: `${tec} inició a ${km} km del cliente`, detalle: v.descripcion, href });
    }
    if (v.estado === "programada" && v.programadaInicio.startsWith(hoy) && horasEntre(v.programadaInicio, ahora) > 0.5) {
      out.push({ id: `atraso-${v.id}`, nivel: "advertencia", titulo: `${tec} no ha marcado entrada`, detalle: `Programada a las ${v.programadaInicio.slice(11, 16)} · ${v.descripcion}`, href });
    }
  }
  for (const e of registro.equipos) {
    if (e.proximoMantenimiento && e.proximoMantenimiento < hoy) {
      const c = cliente(e.clienteId);
      out.push({ id: `mant-${e.id}`, nivel: "critica", titulo: `Mantenimiento vencido hace ${diasEntre(e.proximoMantenimiento, hoy)} días`, detalle: `${e.nombre} · ${c.razonSocial}`, href: `/admin/equipos/${e.id}` });
    }
  }
  for (const p of pendientes) {
    if (!p.resueltoEn && diasEntre(p.creadoEn, hoy) >= 3) {
      out.push({ id: `pend-${p.id}`, nivel: "advertencia", titulo: `Pendiente sin resolver hace ${diasEntre(p.creadoEn, hoy)} días`, detalle: p.descripcion, href: `/admin/mantenimientos/${p.trabajoId}` });
    }
  }
  void trabajos;
  return out.sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === "critica" ? -1 : 1));
}

/** Distancia en metros entre dos coordenadas (haversine). */
export function distanciaM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

// ---------- Disponibilidad de técnicos (con tiempos de viaje) ----------
export interface Ocupacion {
  tipo: "tarea" | "permiso";
  desde: string;
  hasta: string;
  detalle: string;
  ciudad?: string;
  /** horas de viaje desde la ciudad base del técnico (antes) y de regreso (después) */
  viajeAntes?: number;
  viajeDespues?: number;
}

const RAZON_PERMISO = { permiso: "Permiso", permiso_medico: "Permiso médico", vacaciones: "Vacaciones" } as const;

const sumarHoras = (iso: string, h: number) => {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + Math.round(h * 60));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
};

/** Dónde se hace una tarea: la ciudad del cliente (o la base del técnico si es en oficina). */
const lugarDe = (v: Visita, trabajos: Trabajo[], base: string) => {
  const c = contexto(trabajos, v.trabajoId).cliente;
  return v.lugar === "en_oficina" ? { ciudad: base, clienteId: "oficina", nombre: "Oficina / taller" } : { ciudad: c.ciudad, clienteId: c.id, nombre: c.razonSocial };
};

const tareasActivas = (tecnicoId: string, visitas: Visita[]) =>
  visitas.filter((v) => v.estado !== "cancelada" && v.estado !== "finalizada" && (v.tecnicoId === tecnicoId || v.acompanantes.includes(tecnicoId)));

/** Lo que ocupa a un técnico en una ventana de tiempo, incluido el viaje desde y hacia su ciudad base. */
export function ocupacion(tecnicoId: string, desde: string, hasta: string, visitas: Visita[], trabajos: Trabajo[]): Ocupacion[] {
  const base = perfil(tecnicoId).ciudad;
  const out: Ocupacion[] = [];
  for (const v of tareasActivas(tecnicoId, visitas)) {
    const l = lugarDe(v, trabajos, base);
    const ida = horasViaje(base, l.ciudad);
    if (sumarHoras(v.programadaInicio, -ida) < hasta && sumarHoras(v.programadaFin, ida) > desde) {
      out.push({ tipo: "tarea", desde: v.programadaInicio, hasta: v.programadaFin, detalle: l.ciudad !== base ? `${l.nombre} (${l.ciudad})` : l.nombre, ciudad: l.ciudad, viajeAntes: ida, viajeDespues: ida });
    }
  }
  for (const p of mock.permisos) {
    if (p.perfilId === tecnicoId && p.aprobado !== false && p.desde < hasta && p.hasta > desde) {
      out.push({ tipo: "permiso", desde: p.desde, hasta: p.hasta, detalle: RAZON_PERMISO[p.razon] });
    }
  }
  return out.sort((a, b) => a.desde.localeCompare(b.desde));
}

/**
 * Choques de un horario nuevo (en la ciudad y cliente de destino) con lo que ya tiene el técnico,
 * contando el tiempo de viaje entre un trabajo y otro. Devuelve el motivo en palabras.
 */
export function choques(
  tecnicoId: string,
  desde: string,
  hasta: string,
  destino: { ciudad: string; clienteId: string },
  visitas: Visita[],
  trabajos: Trabajo[],
  ignorarTrabajo?: string,
): Ocupacion[] {
  const base = perfil(tecnicoId).ciudad;
  const out: Ocupacion[] = [];
  for (const v of tareasActivas(tecnicoId, visitas)) {
    if (v.trabajoId === ignorarTrabajo) continue;
    const l = lugarDe(v, trabajos, base);
    const viaje = horasEntreLugares(l.ciudad, l.clienteId, destino.ciudad, destino.clienteId);
    const finConViaje = sumarHoras(v.programadaFin, viaje);
    const inicioConViaje = sumarHoras(v.programadaInicio, -viaje);
    if (inicioConViaje < hasta && finConViaje > desde) {
      const lejos = l.ciudad !== destino.ciudad;
      let detalle: string;
      if (v.programadaInicio < hasta && v.programadaFin > desde) detalle = `${v.programadaInicio.slice(11, 16)}–${v.programadaFin.slice(11, 16)} en ${l.nombre}${lejos ? ` (${l.ciudad})` : ""}`;
      else if (v.programadaFin <= desde) detalle = `${lejos ? `Vuelve de ${l.ciudad}` : `Sale de ${l.nombre}`} y queda libre a las ${finConViaje.slice(11, 16)} (${textoHoras(viaje)} de ${lejos ? "viaje" : "movilización"})`;
      else detalle = `Tiene ${l.nombre}${lejos ? ` en ${l.ciudad}` : ""} a las ${v.programadaInicio.slice(11, 16)}: necesita ${textoHoras(viaje)} para llegar`;
      out.push({ tipo: "tarea", desde: v.programadaInicio, hasta: v.programadaFin, detalle, ciudad: l.ciudad });
    }
  }
  for (const p of mock.permisos) {
    if (p.perfilId === tecnicoId && p.aprobado !== false && p.desde < hasta && p.hasta > desde) {
      out.push({ tipo: "permiso", desde: p.desde, hasta: p.hasta, detalle: RAZON_PERMISO[p.razon] });
    }
  }
  return out;
}

/** Dónde está o estará el técnico ese día (última tarea que empieza antes de la hora dada). */
export function ubicacionTecnico(tecnicoId: string, momento: string, visitas: Visita[], trabajos: Trabajo[]) {
  const base = perfil(tecnicoId).ciudad;
  const dia = momento.slice(0, 10);
  const previa = tareasActivas(tecnicoId, visitas)
    .filter((v) => v.programadaInicio.startsWith(dia) && v.programadaInicio <= momento)
    .sort((a, b) => b.programadaInicio.localeCompare(a.programadaInicio))[0];
  return previa ? lugarDe(previa, trabajos, base).ciudad : base;
}

/** Quién pidió una solicitud, en palabras. */
export const pedidoPor = (sol: { origen?: string; vendedorId: string; solicitante?: { nombre: string; telefono: string } }) =>
  sol.origen === "cliente_qr" ? `el cliente (QR) · ${sol.solicitante?.nombre ?? ""} · ${sol.solicitante?.telefono ?? ""}` : `${perfil(sol.vendedorId).nombre} (vendedor)`;
