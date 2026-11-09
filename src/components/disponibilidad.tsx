"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Ban, Check, ChevronLeft, ChevronRight, CircleCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { ocupacion, tecnicos, type Ocupacion } from "@/lib/selectors";
import { diaSemana, fechaCorta, hora, horasEntre, toLocalIso } from "@/lib/format";
import { Avatar, cx } from "./ui";

const INICIO = 7;
const FIN = 19;
const pct = (iso: string) => {
  const h = Number(iso.slice(11, 13)) + Number(iso.slice(14, 16)) / 60;
  return Math.min(100, Math.max(0, ((h - INICIO) / (FIN - INICIO)) * 100));
};

/** Barra del día 7h–19h con lo ocupado (y, opcional, el horario que se quiere pedir). */
function BarraDia({ dia, ocupado, pedido }: { dia: string; ocupado: Ocupacion[]; pedido?: { desde: string; hasta: string; choca: boolean } }) {
  return (
    <div className="relative h-6 w-full rounded-md bg-ok-bg" aria-hidden>
      {ocupado.map((o, i) => {
        const a = o.desde.slice(0, 10) < dia ? 0 : pct(o.desde);
        const b = o.hasta.slice(0, 10) > dia ? 100 : pct(o.hasta);
        return <span key={i} className={cx("absolute top-0 bottom-0 rounded-[4px]", o.tipo === "permiso" ? "bg-tinta-3/50" : "bg-marca-700")} style={{ left: `${a}%`, width: `${Math.max(b - a, 1)}%` }} />;
      })}
      {pedido && (
        <span className={cx("absolute -top-1 -bottom-1 rounded-[5px] border-2 border-dashed", pedido.choca ? "border-critico bg-critico/15" : "border-ok bg-ok/15")} style={{ left: `${pct(pedido.desde)}%`, width: `${Math.max(pct(pedido.hasta) - pct(pedido.desde), 1)}%` }} />
      )}
    </div>
  );
}

const describir = (o: Ocupacion) => (o.tipo === "permiso" ? `${o.detalle}` : `${hora(o.desde)}–${hora(o.hasta)} · ${o.detalle}`);

/**
 * Elegir técnico viendo su disponibilidad en el horario pedido.
 * Los ocupados (otra tarea o permiso) no se pueden elegir.
 */
export function SelectorDisponibilidad({
  ciudad,
  fecha,
  horaIni,
  horas,
  valor,
  onChange,
  permitirSinPreferencia = true,
  ignorarTrabajo,
}: {
  ciudad: string;
  fecha: string;
  horaIni: string;
  horas: number;
  valor: string;
  onChange: (id: string) => void;
  permitirSinPreferencia?: boolean;
  ignorarTrabajo?: string;
}) {
  const s = useStore();
  const desde = `${fecha}T${horaIni}:00`;
  const finD = new Date(desde);
  finD.setMinutes(finD.getMinutes() + horas * 60);
  const hasta = toLocalIso(finD);
  const lista = useMemo(
    () =>
      tecnicos()
        .filter((t) => t.ciudad === ciudad)
        .map((t) => {
          const delDia = ocupacion(t.id, `${fecha}T00:00:00`, `${fecha}T23:59:59`, s.visitas, s.trabajos);
          const choques = ocupacion(t.id, desde, hasta, s.visitas.filter((v) => v.trabajoId !== ignorarTrabajo), s.trabajos);
          const horasOcupadas = delDia.filter((o) => o.tipo === "tarea").reduce((a, o) => a + horasEntre(o.desde, o.hasta), 0);
          return { t, delDia, choques, horasOcupadas };
        })
        .sort((a, b) => a.choques.length - b.choques.length || a.horasOcupadas - b.horasOcupadas),
    [ciudad, fecha, desde, hasta, s.visitas, s.trabajos, ignorarTrabajo],
  );
  const elegido = lista.find((x) => x.t.id === valor);

  // Si el técnico elegido queda ocupado al cambiar la hora, se suelta la elección
  useEffect(() => {
    if (elegido && elegido.choques.length) onChange("");
  }, [elegido, onChange]);

  return (
    <div>
      <p className="text-sm text-tinta-2">
        Disponibilidad el <strong className="text-tinta">{diaSemana(fecha)} {fechaCorta(fecha)}</strong> de <strong className="text-tinta">{horaIni}</strong> a <strong className="text-tinta">{hasta.slice(11, 16)}</strong> · {ciudad}
      </p>
      <ul className="mt-2 space-y-2" role="radiogroup" aria-label="Técnico">
        {permitirSinPreferencia && (
          <li>
            <button type="button" role="radio" aria-checked={valor === ""} onClick={() => onChange("")}
              className={cx("flex min-h-12 w-full items-center gap-3 rounded-xl border-2 px-3 text-left text-sm font-semibold", valor === "" ? "border-marca-800 bg-marca-50" : "border-borde bg-superficie hover:bg-fondo")}>
              {valor === "" && <Check size={16} />} Sin preferencia · que Mantenimiento elija
            </button>
          </li>
        )}
        {lista.map(({ t, delDia, choques, horasOcupadas }) => {
          const ocupado = choques.length > 0;
          const sel = valor === t.id;
          return (
            <li key={t.id}>
              <button
                type="button"
                role="radio"
                aria-checked={sel}
                aria-disabled={ocupado}
                disabled={ocupado}
                onClick={() => onChange(t.id)}
                className={cx(
                  "w-full rounded-xl border-2 p-3 text-left transition-colors",
                  ocupado ? "cursor-not-allowed border-borde bg-fondo/70" : sel ? "border-marca-800 bg-marca-50" : "border-borde bg-superficie hover:bg-fondo",
                )}
              >
                <span className="flex items-center gap-3">
                  <Avatar nombre={t.nombre} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className={cx("block font-semibold", ocupado && "text-tinta-2")}>{t.nombre}</span>
                    <span className={cx("flex items-center gap-1 text-sm", ocupado ? "text-critico" : "text-ok")}>
                      {ocupado ? <Ban size={14} /> : <CircleCheck size={14} />}
                      {ocupado ? `Ocupado: ${choques.map(describir).join(" · ")}` : `Libre en ese horario${horasOcupadas ? ` · ${horasOcupadas.toFixed(0)} h ocupadas ese día` : " · día libre"}`}
                    </span>
                  </span>
                  {sel && <Check size={18} className="text-marca-800" />}
                </span>
                <span className="mt-2 block">
                  <BarraDia dia={fecha} ocupado={delDia} pedido={{ desde, hasta, choca: ocupado }} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-tinta-2">
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-4 rounded bg-ok-bg ring-1 ring-ok/30" /> Libre</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-4 rounded bg-marca-700" /> Con tarea</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-4 rounded bg-tinta-3/50" /> Permiso / vacaciones</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-4 rounded border-2 border-dashed border-ok" /> Horario pedido</span>
      </p>
    </div>
  );
}

/** Semana por técnico: qué días y horas están ocupados. Toca un día libre para pedir/programar ahí. */
export function SemanaDisponibilidad({ ciudad, enlace }: { ciudad?: string; enlace: (tecnicoId: string, fecha: string) => string }) {
  const s = useStore();
  const hoy = s.ahora.slice(0, 10);
  // Desde hoy: los próximos 5 días hábiles (las flechas avanzan o retroceden 5 días hábiles)
  const [salto, setSalto] = useState(0);
  const dias: string[] = [];
  {
    const d = new Date(hoy + "T00:00:00");
    let saltados = 0;
    while (dias.length < 5) {
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        if (saltados >= salto * 5) dias.push(toLocalIso(d).slice(0, 10));
        else saltados++;
      }
      d.setDate(d.getDate() + 1);
    }
  }
  const mover = (n: number) => setSalto((x) => Math.max(0, x + n));
  const lista = tecnicos().filter((t) => !ciudad || t.ciudad === ciudad);

  return (
    <section className="rounded-2xl border border-borde bg-superficie p-3 sm:p-4" aria-label="Disponibilidad semanal">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button type="button" onClick={() => mover(-1)} disabled={salto === 0} aria-label="Días anteriores" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-fondo disabled:opacity-30"><ChevronLeft size={20} /></button>
        <p className="font-semibold">{salto === 0 ? "Próximos días hábiles" : "Del"} · {fechaCorta(dias[0])} al {fechaCorta(dias[4])}</p>
        <button type="button" onClick={() => mover(1)} aria-label="Días siguientes" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-fondo"><ChevronRight size={20} /></button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] table-fixed border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              <th className="w-44 text-left text-xs font-semibold text-tinta-2">Técnico</th>
              {dias.map((d) => (
                <th key={d} className={cx("text-xs font-semibold", d === hoy ? "text-marca-800" : "text-tinta-2")}>{diaSemana(d)} {fechaCorta(d)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.map((t) => (
              <tr key={t.id}>
                <td className="pr-2">
                  <span className="flex items-center gap-2"><Avatar nombre={t.nombre} size={28} /><span className="leading-tight"><span className="block font-medium">{t.nombre}</span><span className="text-xs text-tinta-3">{t.ciudad}</span></span></span>
                </td>
                {dias.map((d) => {
                  const oc = ocupacion(t.id, `${d}T00:00:00`, `${d}T23:59:59`, s.visitas, s.trabajos);
                  const permiso = oc.find((o) => o.tipo === "permiso");
                  const h = oc.filter((o) => o.tipo === "tarea").reduce((a, o) => a + horasEntre(o.desde, o.hasta), 0);
                  const pasado = d < hoy;
                  const titulo = oc.length ? oc.map(describir).join("\n") : "Libre todo el día";
                  const contenido = (
                    <>
                      <BarraDia dia={d} ocupado={oc} />
                      <span className={cx("mt-1 block text-xs", permiso ? "text-tinta-2" : h >= 8 ? "text-critico" : h ? "text-tinta-2" : "text-ok")}>
                        {permiso ? permiso.detalle : h >= 8 ? "Lleno" : h ? `${h.toFixed(0)} h ocupadas` : "Libre"}
                      </span>
                    </>
                  );
                  return (
                    <td key={d} className="align-top">
                      {pasado || permiso || h >= 8 ? (
                        <div title={titulo} className="rounded-lg p-1.5 opacity-80">{contenido}</div>
                      ) : (
                        <Link href={enlace(t.id, d)} title={`${titulo}\nToca para pedir este día`} className="block rounded-lg p-1.5 hover:bg-marca-50 focus-visible:ring-2 focus-visible:ring-marca-600">{contenido}</Link>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
