"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, CircleDot, Clock, OctagonAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import { contexto, cliente as getCliente, perfil } from "@/lib/selectors";
import { fechaLarga, hora, horasEntre, toLocalIso } from "@/lib/format";
import type { Visita } from "@/lib/types";
import { cx } from "./ui";
import type { Base } from "./migas";

export type TipoEvento = "programada" | "en_curso" | "finalizada" | "atrasada" | "sugerido";
export interface Evento {
  id: string;
  fecha: string; // YYYY-MM-DD
  hora?: string;
  titulo: string;
  detalle: string;
  tipo: TipoEvento;
  href: string;
}

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const ESTILO: Record<TipoEvento, { chip: string; punto: string; label: string; icono: React.ReactNode }> = {
  programada: { chip: "bg-superficie border border-marca-600/40 text-marca-900", punto: "bg-marca-600", label: "Programada", icono: <Clock size={12} /> },
  en_curso: { chip: "bg-info-bg text-info", punto: "bg-info", label: "En curso", icono: <CircleDot size={12} /> },
  finalizada: { chip: "bg-ok-bg text-ok", punto: "bg-ok", label: "Hecha", icono: <CheckCircle2 size={12} /> },
  atrasada: { chip: "bg-critico-bg text-critico", punto: "bg-critico", label: "Sin entrada", icono: <OctagonAlert size={12} /> },
  sugerido: { chip: "border border-dashed border-aviso/60 bg-aviso-bg text-aviso", punto: "bg-aviso", label: "Mant. por fecha", icono: <CalendarClock size={12} /> },
};

/** Arma los eventos del calendario: tareas + mantenimientos que les tocan a los equipos. */
export function useEventos({ base, tecnicoId, ciudad, equiposDeClientes }: { base: Base; tecnicoId?: string; ciudad?: string; equiposDeClientes?: Set<string> }) {
  const s = useStore();
  return useMemo(() => {
    const ev: Evento[] = [];
    const tipoDe = (v: Visita): TipoEvento =>
      v.estado === "finalizada" ? "finalizada" : v.estado === "en_curso" ? "en_curso" : horasEntre(v.programadaInicio, s.ahora) * 60 > 15 ? "atrasada" : "programada";
    for (const v of s.visitas) {
      if (v.estado === "cancelada" || (tecnicoId && v.tecnicoId !== tecnicoId)) continue;
      const { cliente, equipo } = contexto(s.trabajos, v.trabajoId);
      if (ciudad && perfil(v.tecnicoId).ciudad !== ciudad) continue;
      // el historial generado solo tiene «Visita técnica»: se muestra igual, con el cliente como título
      ev.push({
        id: v.id,
        fecha: v.programadaInicio.slice(0, 10),
        hora: hora(v.checkinEn ?? v.programadaInicio),
        titulo: cliente.razonSocial,
        detalle: `${v.descripcion} · ${equipo.nombre}${base === "admin" ? ` · ${perfil(v.tecnicoId).nombre}` : ""}`,
        tipo: tipoDe(v),
        href: base === "tecnico" ? `/tecnico/visita/${v.id}` : `/admin/mantenimientos/${v.trabajoId}`,
      });
    }
    for (const e of s.equipos) {
      if (!e.proximoMantenimiento) continue;
      if (equiposDeClientes && !equiposDeClientes.has(e.id)) continue;
      const c = getCliente(e.clienteId);
      if (ciudad && perfil(c.responsableId).ciudad !== ciudad) continue;
      ev.push({ id: `m-${e.id}`, fecha: e.proximoMantenimiento, titulo: c.razonSocial, detalle: `Le toca mantenimiento: ${e.nombre}`, tipo: "sugerido", href: `/${base}/equipos/${e.id}` });
    }
    return ev.sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora ?? "99").localeCompare(b.hora ?? "99"));
  }, [s.visitas, s.trabajos, s.equipos, s.ahora, base, tecnicoId, ciudad, equiposDeClientes]);
}

export function Calendario({ eventos, compacto }: { eventos: Evento[]; compacto?: boolean }) {
  const { ahora } = useStore();
  const hoy = ahora.slice(0, 10);
  const [mes, setMes] = useState(() => new Date(hoy.slice(0, 7) + "-01T00:00:00"));
  const [sel, setSel] = useState(hoy);

  const porDia = useMemo(() => {
    const m = new Map<string, Evento[]>();
    for (const e of eventos) m.set(e.fecha, [...(m.get(e.fecha) ?? []), e]);
    return m;
  }, [eventos]);

  const celdas = useMemo(() => {
    const ini = new Date(mes);
    ini.setDate(1 - ((ini.getDay() + 6) % 7)); // lunes anterior
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(ini);
      d.setDate(ini.getDate() + i);
      return toLocalIso(d).slice(0, 10);
    });
  }, [mes]);
  const mesIso = toLocalIso(mes).slice(0, 7);
  const delDia = porDia.get(sel) ?? [];
  const cambiarMes = (n: number) => setMes((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));

  return (
    <div className={cx("grid grid-cols-1 gap-4 [&>*]:min-w-0", !compacto && "lg:grid-cols-[minmax(0,1fr)_340px]")}>
      <section className="rounded-2xl border border-borde bg-superficie p-3 sm:p-4" aria-label="Calendario">
        <div className="mb-3 flex items-center justify-between gap-2">
          <button type="button" onClick={() => cambiarMes(-1)} aria-label="Mes anterior" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-fondo"><ChevronLeft size={20} /></button>
          <div className="text-center">
            <p className="text-lg font-semibold">{MESES[mes.getMonth()]} {mes.getFullYear()}</p>
            {mesIso !== hoy.slice(0, 7) && (
              <button type="button" onClick={() => { setMes(new Date(hoy.slice(0, 7) + "-01T00:00:00")); setSel(hoy); }} className="text-xs font-semibold text-marca-700">Volver a hoy</button>
            )}
          </div>
          <button type="button" onClick={() => cambiarMes(1)} aria-label="Mes siguiente" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-fondo"><ChevronRight size={20} /></button>
        </div>
        <div className="grid grid-cols-7 text-center text-xs font-semibold text-tinta-3">
          {SEMANA.map((d) => <div key={d} className="pb-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-borde bg-borde">
          {celdas.map((d) => {
            const evs = porDia.get(d) ?? [];
            const fuera = d.slice(0, 7) !== mesIso;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setSel(d)}
                aria-pressed={sel === d}
                aria-label={`${fechaLarga(d)}: ${evs.length} ${evs.length === 1 ? "evento" : "eventos"}`}
                className={cx(
                  "flex flex-col items-stretch gap-1 bg-superficie p-1 text-left align-top transition-colors hover:bg-fondo",
                  compacto ? "min-h-14" : "min-h-14 sm:min-h-24",
                  fuera && "bg-fondo/60 text-tinta-3",
                  sel === d && "ring-2 ring-marca-700 ring-inset",
                )}
              >
                <span className={cx("mx-auto flex h-7 w-7 items-center justify-center rounded-full text-sm tabular sm:mx-0", d === hoy && "bg-marca-800 font-bold text-white")}>{Number(d.slice(8))}</span>
                {/* celular: puntos · escritorio: etiquetas */}
                <span className={cx("flex flex-wrap justify-center gap-0.5", !compacto && "sm:hidden")}>
                  {evs.slice(0, 4).map((e) => <span key={e.id} className={cx("h-1.5 w-1.5 rounded-full", ESTILO[e.tipo].punto)} />)}
                </span>
                {!compacto && (
                  <span className="hidden flex-col gap-0.5 sm:flex">
                    {evs.slice(0, 3).map((e) => (
                      <span key={e.id} className={cx("truncate rounded px-1 py-0.5 text-[11px] leading-tight font-medium", ESTILO[e.tipo].chip)}>
                        {e.hora && <span className="tabular">{e.hora} </span>}{e.titulo}
                      </span>
                    ))}
                    {evs.length > 3 && <span className="px-1 text-[11px] text-tinta-3">+{evs.length - 3} más</span>}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-tinta-2" aria-label="Leyenda">
          {(Object.keys(ESTILO) as TipoEvento[]).map((k) => (
            <li key={k} className="inline-flex items-center gap-1.5"><span className={cx("h-2 w-2 rounded-full", ESTILO[k].punto)} /> {ESTILO[k].label}</li>
          ))}
        </ul>
      </section>

      <section aria-label="Eventos del día">
        <h2 className="mb-2 px-1 font-semibold">{sel === hoy ? "Hoy · " : ""}{fechaLarga(sel)}</h2>
        {delDia.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-borde px-4 py-6 text-center text-sm text-tinta-3">Nada programado este día.</p>
        ) : (
          <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
            {delDia.map((e) => (
              <li key={e.id}>
                <Link href={e.href} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-fondo active:bg-marca-50">
                  <span className="w-12 shrink-0 text-sm font-semibold tabular">{e.hora ?? "—"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{e.titulo}</span>
                    <span className="block truncate text-sm text-tinta-2">{e.detalle}</span>
                  </span>
                  <span className={cx("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", ESTILO[e.tipo].chip)}>
                    {ESTILO[e.tipo].icono} {ESTILO[e.tipo].label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
