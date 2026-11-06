"use client";

import { Phone } from "lucide-react";
import { useStore } from "@/lib/store";
import { horasVisita, tecnicos, UMBRAL_DISTANCIA_M } from "@/lib/selectors";
import { diaSemana, fechaCorta, toLocalIso } from "@/lib/format";
import { permisos } from "@/lib/mock-data";
import { Avatar, Badge } from "@/components/ui";

const RAZON = { permiso: "Permiso", permiso_medico: "Permiso médico", vacaciones: "Vacaciones" } as const;

export default function Tecnicos() {
  const s = useStore();
  const hoy = s.ahora.slice(0, 10);
  // Últimos 10 días hábiles
  const dias: string[] = [];
  const d = new Date(hoy + "T00:00:00");
  while (dias.length < 10) {
    if (d.getDay() !== 0 && d.getDay() !== 6) dias.unshift(toLocalIso(d).slice(0, 10));
    d.setDate(d.getDate() - 1);
  }
  const max = 9;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Técnicos</h1>
        <p className="mt-1 text-sm text-tinta-2">Horas trabajadas por día (últimos 10 días hábiles) y calidad del registro.</p>
      </header>
      <ul className="space-y-4">
        {tecnicos().map((t) => {
          const vs = s.visitas.filter((v) => v.tecnicoId === t.id && v.checkinEn);
          const porDia = dias.map((dia) => ({ dia, h: vs.filter((v) => v.checkinEn!.startsWith(dia)).reduce((a, v) => a + horasVisita(v, s.ahora), 0) }));
          const total = porDia.reduce((a, x) => a + x.h, 0);
          const enRango = vs.filter((v) => v.checkinEn!.slice(0, 10) >= dias[0]);
          const lejos = enRango.filter((v) => (v.checkinDistanciaM ?? 0) > UMBRAL_DISTANCIA_M).length;
          const sinCerrar = enRango.filter((v) => v.estado === "en_curso" && !v.checkinEn!.startsWith(hoy)).length;
          const perm = permisos.filter((p) => p.perfilId === t.id && p.hasta.slice(0, 10) >= hoy);
          return (
            <li key={t.id} id={t.id} className="scroll-mt-4 rounded-2xl border border-borde bg-superficie p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar nombre={t.nombre} size={44} />
                  <div>
                    <p className="font-semibold">{t.nombre}</p>
                    <p className="text-sm text-tinta-2">{t.area} · {t.ciudad} · <a href={`tel:${t.telefono}`} className="inline-flex items-center gap-1 text-marca-700 hover:underline"><Phone size={13} />{t.telefono}</a></p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sinCerrar > 0 && <Badge tono="critico">{sinCerrar} tarea sin salida</Badge>}
                  {lejos > 0 && <Badge tono="aviso">{lejos} inicio lejos del cliente</Badge>}
                  {perm.map((p) => <Badge key={p.id} tono="info">{RAZON[p.razon]} {fechaCorta(p.desde)}{p.aprobado ? "" : " · por aprobar"}</Badge>)}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-4">
                <div className="grid h-28 grid-cols-10 items-end gap-1.5" role="img" aria-label={`Horas por día de ${t.nombre}`}>
                  {porDia.map(({ dia, h }) => (
                    <div key={dia} className="flex h-full flex-col justify-end text-center" title={`${diaSemana(dia)} ${fechaCorta(dia)}: ${h.toFixed(1)} h`}>
                      <span className="mb-0.5 text-[10px] text-tinta-3 tabular">{h ? h.toFixed(1) : ""}</span>
                      <span className={dia === hoy ? "rounded-t bg-marca-600" : "rounded-t bg-marca-800"} style={{ height: `${Math.min(h / max, 1) * 72}%`, minHeight: h ? 3 : 0 }} />
                      <span className="mt-1 text-[10px] text-tinta-3">{diaSemana(dia)} {dia.slice(8)}</span>
                    </div>
                  ))}
                </div>
                <div className="text-right">
                  <p className="text-xs text-tinta-2">Total 10 días</p>
                  <p className="text-xl font-semibold tabular">{total.toFixed(1)} h</p>
                  <p className="text-xs text-tinta-2 tabular">{enRango.length} tareas</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
