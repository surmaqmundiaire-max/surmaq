// Reporte de horas trabajadas por técnico, con horas extra.
// Jornada normal: lunes a viernes de 08:30 a 17:30. Todo lo demás (incluidos sábados y domingos) es extra.
import type { Trabajo, Visita } from "./types";
import { contexto, perfil, UMBRAL_DISTANCIA_M } from "./selectors";
import { TIPO_LABEL } from "./mock-data";
import { toLocalIso } from "./format";

export const JORNADA = { inicio: 8.5, fin: 17.5 }; // horas del día
export const textoJornada = "lunes a viernes de 08:30 a 17:30";

export interface RegistroHoras {
  visitaId: string;
  tecnicoId: string;
  tecnico: string;
  rol: "Responsable" | "Acompañante";
  fecha: string; // YYYY-MM-DD de la entrada
  entrada: string; // ISO
  salida: string; // ISO
  horas: number;
  normales: number;
  extra: number;
  cliente: string;
  ciudad: string;
  equipo: string;
  mantenimiento: number;
  tipo: string;
  tarea: string;
  observaciones: string;
}

const horaDec = (d: Date) => d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;

/** Separa un intervalo en horas normales y extra (puede cruzar la medianoche). */
export function dividirHoras(entrada: string, salida: string) {
  let normales = 0;
  let extra = 0;
  let cursor = new Date(entrada);
  const fin = new Date(salida);
  while (cursor < fin) {
    const finDia = new Date(cursor);
    finDia.setHours(24, 0, 0, 0);
    const tramoFin = finDia < fin ? finDia : fin;
    const a = horaDec(cursor);
    const b = tramoFin.getTime() === finDia.getTime() ? 24 : horaDec(tramoFin);
    const total = b - a;
    const laborable = cursor.getDay() >= 1 && cursor.getDay() <= 5;
    const dentro = laborable ? Math.max(0, Math.min(b, JORNADA.fin) - Math.max(a, JORNADA.inicio)) : 0;
    normales += dentro;
    extra += total - dentro;
    cursor = tramoFin;
  }
  return { normales, extra };
}

/** Registros de horas (una fila por técnico y tarea con entrada y salida) dentro del período. */
export function registrosHoras(visitas: Visita[], trabajos: Trabajo[], desde: string, hasta: string, tecnicoIds?: string[]): RegistroHoras[] {
  const out: RegistroHoras[] = [];
  for (const v of visitas) {
    if (!v.checkinEn || !v.checkoutEn) continue;
    const dia = v.checkinEn.slice(0, 10);
    if (dia < desde || dia > hasta) continue;
    const { trabajo, equipo, cliente } = contexto(trabajos, v.trabajoId);
    const { normales, extra } = dividirHoras(v.checkinEn, v.checkoutEn);
    const obs = [
      v.salidaCorregida ? "Salida registrada después" : "",
      (v.checkinDistanciaM ?? 0) > UMBRAL_DISTANCIA_M ? `Entrada a ${((v.checkinDistanciaM ?? 0) / 1000).toFixed(1)} km del cliente` : "",
      v.lugar === "en_oficina" ? "En oficina / taller" : "",
    ].filter(Boolean).join(" · ");
    const personas: [string, RegistroHoras["rol"]][] = [[v.tecnicoId, "Responsable"], ...v.acompanantes.map((a) => [a, "Acompañante"] as [string, RegistroHoras["rol"]])];
    for (const [tid, rol] of personas) {
      if (tecnicoIds && !tecnicoIds.includes(tid)) continue;
      out.push({
        visitaId: v.id,
        tecnicoId: tid,
        tecnico: perfil(tid).nombre,
        rol,
        fecha: dia,
        entrada: v.checkinEn,
        salida: v.checkoutEn,
        horas: normales + extra,
        normales,
        extra,
        cliente: cliente.razonSocial,
        ciudad: v.lugar === "en_oficina" ? perfil(tid).ciudad : cliente.ciudad,
        equipo: equipo.nombre,
        mantenimiento: trabajo.numero,
        tipo: TIPO_LABEL[trabajo.tipo],
        tarea: v.descripcion,
        observaciones: obs,
      });
    }
  }
  return out.sort((a, b) => a.tecnico.localeCompare(b.tecnico) || a.entrada.localeCompare(b.entrada));
}

export type Agrupacion = "dia" | "semana" | "mes";

const lunesDe = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return toLocalIso(d).slice(0, 10);
};
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

export const claveGrupo = (fecha: string, por: Agrupacion) => (por === "dia" ? fecha : por === "semana" ? lunesDe(fecha) : fecha.slice(0, 7));

export function etiquetaGrupo(clave: string, por: Agrupacion) {
  if (por === "mes") return `${MESES[Number(clave.slice(5, 7)) - 1]} ${clave.slice(0, 4)}`;
  const d = new Date(clave + "T00:00:00");
  if (por === "semana") {
    const f = new Date(d);
    f.setDate(f.getDate() + 6);
    return `Sem. ${d.getDate()} ${MESES[d.getMonth()].toLowerCase()} – ${f.getDate()} ${MESES[f.getMonth()].toLowerCase()}`;
  }
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()].toLowerCase()}`;
}

/** Todas las claves del período (para mostrar también los días/semanas sin horas). */
export function clavesPeriodo(desde: string, hasta: string, por: Agrupacion) {
  const out: string[] = [];
  const d = new Date(desde + "T00:00:00");
  const fin = new Date(hasta + "T00:00:00");
  while (d <= fin) {
    const iso = toLocalIso(d).slice(0, 10);
    const k = claveGrupo(iso, por);
    const laborable = d.getDay() >= 1 && d.getDay() <= 5;
    if (!out.includes(k) && (por !== "dia" || laborable)) out.push(k);
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export interface Totales { horas: number; normales: number; extra: number; tareas: number; dias: number }
export function totales(regs: RegistroHoras[]): Totales {
  return {
    horas: regs.reduce((a, r) => a + r.horas, 0),
    normales: regs.reduce((a, r) => a + r.normales, 0),
    extra: regs.reduce((a, r) => a + r.extra, 0),
    tareas: regs.length,
    dias: new Set(regs.map((r) => r.fecha)).size,
  };
}

/** 2.25 → "2:15" (formato de horas para reportes) */
export const hhmm = (h: number) => {
  const m = Math.round(h * 60);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
};

/** Claves del período más las que tengan horas aunque caigan en fin de semana. */
export function clavesConDatos(desde: string, hasta: string, por: Agrupacion, regs: RegistroHoras[]) {
  return [...new Set([...clavesPeriodo(desde, hasta, por), ...regs.map((r) => claveGrupo(r.fecha, por))])].sort();
}
