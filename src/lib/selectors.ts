import * as mock from "./mock-data";
import type { Pendiente, Trabajo, Visita } from "./types";
import { diasEntre, horasEntre } from "./format";

export const perfil = (id: string) => mock.perfiles.find((p) => p.id === id)!;
export const cliente = (id: string) => mock.clientes.find((c) => c.id === id)!;
export const equipo = (id: string) => mock.equipos.find((e) => e.id === id)!;
export const tecnicos = () => mock.perfiles.filter((p) => p.rol === "tecnico");

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
    const href = `/admin/trabajos/${v.trabajoId}`;
    if (v.estado === "en_curso" && v.checkinEn && !v.checkinEn.startsWith(hoy)) {
      out.push({ id: `olv-${v.id}`, nivel: "critica", titulo: `${tec} no marcó la salida`, detalle: `Visita del ${v.checkinEn.slice(8, 10)}/${v.checkinEn.slice(5, 7)} sigue abierta: las horas no se pueden calcular`, href });
    } else if (v.estado === "en_curso" && horasVisita(v, ahora) > UMBRAL_HORAS_VISITA) {
      out.push({ id: `larga-${v.id}`, nivel: "advertencia", titulo: `${tec}: visita de más de ${UMBRAL_HORAS_VISITA} h`, detalle: v.descripcion, href });
    }
    if (v.checkinEn?.startsWith(hoy) && (v.checkinDistanciaM ?? 0) > UMBRAL_DISTANCIA_M) {
      const km = ((v.checkinDistanciaM ?? 0) / 1000).toFixed(1);
      out.push({ id: `gps-${v.id}`, nivel: "advertencia", titulo: `${tec} inició a ${km} km del cliente`, detalle: v.descripcion, href });
    }
    if (v.estado === "programada" && v.programadaInicio.startsWith(hoy) && horasEntre(v.programadaInicio, ahora) > 0.5) {
      out.push({ id: `atraso-${v.id}`, nivel: "advertencia", titulo: `${tec} no ha iniciado una visita`, detalle: `Programada a las ${v.programadaInicio.slice(11, 16)} · ${v.descripcion}`, href });
    }
  }
  for (const e of mock.equipos) {
    if (e.proximoMantenimiento && e.proximoMantenimiento < hoy) {
      const c = cliente(e.clienteId);
      out.push({ id: `mant-${e.id}`, nivel: "critica", titulo: `Mantenimiento vencido hace ${diasEntre(e.proximoMantenimiento, hoy)} días`, detalle: `${e.nombre} · ${c.razonSocial}`, href: `/admin/equipos/${e.id}` });
    }
  }
  for (const p of pendientes) {
    if (!p.resueltoEn && diasEntre(p.creadoEn, hoy) >= 3) {
      out.push({ id: `pend-${p.id}`, nivel: "advertencia", titulo: `Pendiente sin resolver hace ${diasEntre(p.creadoEn, hoy)} días`, detalle: p.descripcion, href: `/admin/trabajos/${p.trabajoId}` });
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
