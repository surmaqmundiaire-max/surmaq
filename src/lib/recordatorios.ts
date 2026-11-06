import type { Trabajo, Visita } from "./types";
import { contexto, perfil, ROL_LABEL } from "./selectors";
import { fechaCorta, hora, horasEntre } from "./format";

export interface Recordatorio {
  id: string;
  nivel: "critico" | "aviso" | "info";
  titulo: string;
  detalle: string;
  accion: string;
  href: string;
}

export const MIN_TOLERANCIA_ENTRADA = 15;
export const MIN_TOLERANCIA_SALIDA = 30;

/** Qué debe hacer el técnico ahora para que sus entradas y salidas queden bien marcadas. */
export function recordatoriosTecnico(visitas: Visita[], trabajos: Trabajo[], tecnicoId: string, ahora: string): Recordatorio[] {
  const hoy = ahora.slice(0, 10);
  const out: Recordatorio[] = [];
  for (const v of visitas) {
    if (v.tecnicoId !== tecnicoId) continue;
    const cli = contexto(trabajos, v.trabajoId).cliente.razonSocial;
    const href = `/tecnico/visita/${v.id}`;
    if (v.estado === "programada" && v.programadaPor && v.programadaPor !== tecnicoId && !v.vistaPorTecnico) {
      const quien = perfil(v.programadaPor);
      out.push({ id: `new-${v.id}`, nivel: "info", titulo: `Nueva tarea: ${cli}`, detalle: `${fechaCorta(v.programadaInicio)} a las ${hora(v.programadaInicio)} · asignada por ${quien.nombre} (${ROL_LABEL[quien.rol].toLowerCase()})`, accion: "Ver", href });
    }
    if (v.estado === "en_curso" && v.checkinEn && !v.checkinEn.startsWith(hoy)) {
      out.push({ id: `olv-${v.id}`, nivel: "critico", titulo: "Te falta marcar una salida", detalle: `${cli} · entrada el ${fechaCorta(v.checkinEn)} a las ${hora(v.checkinEn)}`, accion: "Registrar salida", href });
    } else if (v.estado === "en_curso" && horasEntre(v.programadaFin, ahora) * 60 > MIN_TOLERANCIA_SALIDA) {
      out.push({ id: `sal-${v.id}`, nivel: "aviso", titulo: `¿Ya terminaste en ${cli}?`, detalle: `Estaba prevista hasta las ${hora(v.programadaFin)}. Marca tu salida al irte.`, accion: "Marcar salida", href });
    } else if (v.estado === "programada" && v.programadaInicio.startsWith(hoy)) {
      const min = horasEntre(v.programadaInicio, ahora) * 60;
      if (min > MIN_TOLERANCIA_ENTRADA) {
        out.push({ id: `ent-${v.id}`, nivel: "aviso", titulo: `¿Ya llegaste a ${cli}?`, detalle: `Programada a las ${hora(v.programadaInicio)}. Marca tu entrada al llegar.`, accion: "Marcar entrada", href });
      } else if (min > -30 && min <= 0) {
        out.push({ id: `pro-${v.id}`, nivel: "info", titulo: `En ${Math.round(-min)} min: ${cli}`, detalle: v.descripcion, accion: "Ver tarea", href });
      }
    }
  }
  const orden = { critico: 0, aviso: 1, info: 2 };
  return out.sort((a, b) => orden[a.nivel] - orden[b.nivel]);
}
