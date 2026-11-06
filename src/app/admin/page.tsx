"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, ChevronRight, ClipboardList, Clock, MapPinned, type LucideIcon } from "lucide-react";
import { ChipTipo, Ficha, IconoTipo } from "@/components/visual";
import { useStore } from "@/lib/store";
import { alertas, avanceTrabajo, contexto, horasVisita, tecnicos } from "@/lib/selectors";
import { duracion, fechaLarga, hora, horasEntre, toLocalIso } from "@/lib/format";
import { TIPO_LABEL } from "@/lib/mock-data";
import type { Perfil, TipoTrabajo } from "@/lib/types";
import { Jornada, LeyendaJornada } from "@/components/jornada";
import { Avatar, Barra, IconoNivel, cx } from "@/components/ui";

export default function Panel() {
  const s = useStore();
  const dia = s.ahora.slice(0, 10);
  const tecs = tecnicos();
  const visitasHoy = s.visitas.filter((v) => v.programadaInicio.startsWith(dia) || v.checkinEn?.startsWith(dia));
  const enCampo = tecs.filter((t) => s.visitas.some((v) => v.tecnicoId === t.id && v.estado === "en_curso" && v.checkinEn?.startsWith(dia)));
  const horasHoy = visitasHoy.filter((v) => v.checkinEn?.startsWith(dia)).reduce((a, v) => a + horasVisita(v, s.ahora), 0);
  const finalizadasHoy = visitasHoy.filter((v) => v.estado === "finalizada").length;
  const abiertos = s.trabajos.filter((t) => t.estado !== "cerrado" && t.estado !== "cancelado");
  const lista = alertas(s.visitas, s.pendientes, s.trabajos, s.ahora);
  const ciudades = [...new Set(tecs.map((t) => t.ciudad))];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Panel</h1>
          <p className="text-sm text-tinta-2">{fechaLarga(dia)} · actualizado {hora(s.ahora)}</p>
        </div>
        <dl className="flex flex-wrap gap-x-8 gap-y-2">
          <Cifra icono={MapPinned} tono="info" k="En campo ahora" v={`${enCampo.length} de ${tecs.length}`} />
          <Cifra icono={Clock} tono="marca" k="Horas hoy" v={duracion(horasHoy)} />
          <Cifra icono={CheckCircle2} tono="ok" k="Tareas hoy" v={`${finalizadasHoy} de ${visitasHoy.length} hechas`} />
          <Cifra icono={ClipboardList} tono="aviso" k="Mantenimientos abiertos" v={String(abiertos.length)} />
        </dl>
      </header>

      {/* 1. ¿Dónde está cada técnico? */}
      <section aria-labelledby="t-jornada">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 id="t-jornada" className="text-lg font-semibold">Jornada de hoy</h2>
          <LeyendaJornada />
        </div>
        <div className="overflow-hidden rounded-2xl border border-borde bg-superficie">
          {ciudades.map((ciudad) => (
            <div key={ciudad}>
              <div className="grid grid-cols-1 items-end gap-2 border-b border-borde bg-fondo/60 px-4 py-2 md:grid-cols-[260px_1fr_150px]">
                <p className="text-xs font-semibold text-tinta-2">{ciudad}</p>
                <div className="hidden md:block"><Jornada visitas={[]} ahora={s.ahora} dia="" alto="h-0" escala /></div>
                <p className="hidden text-right text-xs font-semibold text-tinta-2 md:block">Horas · tareas</p>
              </div>
              <ul className="divide-y divide-borde">
                {tecs.filter((t) => t.ciudad === ciudad).map((t) => <FilaTecnico key={t.id} t={t} />)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <HorasPorTecnico />
        <EstadoTrabajos />
      </div>

      {/* Excepciones */}
      <section aria-labelledby="t-atencion">
        <h2 id="t-atencion" className="mb-3 text-lg font-semibold">
          Requiere atención <span className="font-normal text-tinta-3 tabular">({lista.length})</span>
        </h2>
        {lista.length === 0 ? (
          <p className="text-sm text-tinta-2">Todo en orden.</p>
        ) : (
          <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
            {lista.map((a) => (
              <li key={a.id}>
                <Link href={a.href} className="flex items-center gap-3 px-4 py-3 hover:bg-fondo">
                  <IconoNivel nivel={a.nivel} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{a.titulo}</p>
                    <p className="truncate text-sm text-tinta-2">{a.detalle}</p>
                  </div>
                  <ChevronRight size={18} className="text-tinta-3" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function FilaTecnico({ t }: { t: Perfil }) {
  const s = useStore();
  const dia = s.ahora.slice(0, 10);

    const suyas = s.visitas.filter((v) => v.tecnicoId === t.id);
    const hoyV = suyas.filter((v) => v.programadaInicio.startsWith(dia) || v.checkinEn?.startsWith(dia));
    const actual = hoyV.find((v) => v.estado === "en_curso");
    const siguiente = hoyV.filter((v) => v.estado === "programada").sort((a, b) => a.programadaInicio.localeCompare(b.programadaInicio))[0];
    const horas = hoyV.filter((v) => v.checkinEn?.startsWith(dia)).reduce((a, v) => a + horasVisita(v, s.ahora), 0);
    const hechas = hoyV.filter((v) => v.estado === "finalizada").length;
    let estado: React.ReactNode;
    if (actual) {
      const { cliente } = contexto(s.trabajos, actual.trabajoId);
      estado = <><span className="font-semibold text-marca-700">En {cliente.razonSocial}</span> desde {hora(actual.checkinEn)}</>;
    } else if (siguiente && horasEntre(siguiente.programadaInicio, s.ahora) > 0.5) {
      estado = <span className="font-semibold text-aviso">Sin iniciar · programada {hora(siguiente.programadaInicio)}</span>;
    } else if (siguiente) {
      estado = <>Libre · próxima {hora(siguiente.programadaInicio)}</>;
    } else {
      estado = <span className="text-tinta-3">Sin más tareas hoy</span>;
    }
    return (
      <li className="grid grid-cols-1 items-center gap-3 px-4 py-3 md:grid-cols-[260px_1fr_150px]">
        <Link href={`/admin/tecnicos#${t.id}`} className="flex min-w-0 items-center gap-3">
          <Avatar nombre={t.nombre} size={36} />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{t.nombre}</span>
            <span className="block truncate text-sm text-tinta-2">{estado}</span>
          </span>
        </Link>
        <Jornada visitas={suyas} ahora={s.ahora} dia={dia} />
        <p className="text-sm md:text-right tabular">
          <span className="font-semibold">{duracion(horas)}</span>
          <span className="text-tinta-2"> · {hechas}/{hoyV.length}</span>
        </p>
      </li>
    );
  }

function HorasPorTecnico() {
  const s = useStore();
  const dia = s.ahora.slice(0, 10);
  const tecs = tecnicos();
    const [rango, setRango] = useState<"semana" | "mes">("semana");
    const desde = new Date(dia + "T00:00:00");
    desde.setDate(desde.getDate() - (rango === "semana" ? desde.getDay() - 1 : 27));
    const desdeIso = toLocalIso(desde).slice(0, 10);
    const datos = tecs
      .map((t) => {
        const vs = s.visitas.filter((v) => v.tecnicoId === t.id && v.checkinEn && v.checkinEn.slice(0, 10) >= desdeIso && (v.checkoutEn || v.checkinEn.startsWith(dia)));
        return { t, horas: vs.reduce((a, v) => a + horasVisita(v, s.ahora), 0), visitas: vs.length };
      })
      .sort((a, b) => b.horas - a.horas);
    const max = Math.max(...datos.map((d) => d.horas), 1);
    return (
      <section aria-labelledby="t-horas">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="t-horas" className="text-lg font-semibold">Horas trabajadas</h2>
          <div className="flex rounded-lg bg-fondo p-0.5 text-sm" role="radiogroup" aria-label="Rango">
            {([["semana", "Esta semana"], ["mes", "Últimas 4 semanas"]] as const).map(([k, l]) => (
              <button key={k} type="button" role="radio" aria-checked={rango === k} onClick={() => setRango(k)} className={cx("rounded-md px-3 py-1.5 font-medium", rango === k ? "bg-superficie shadow-sm" : "text-tinta-2")}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-borde bg-superficie p-4">
          <ul className="space-y-3">
            {datos.map(({ t, horas, visitas }) => (
              <li key={t.id} className="grid grid-cols-[130px_1fr_auto] items-center gap-3 text-sm" title={`${t.nombre}: ${horas.toFixed(1)} h en ${visitas} visitas`}>
                <span className="truncate font-medium">{t.nombre}</span>
                <span className="h-5 rounded-r bg-fondo">
                  <span className="block h-full rounded-r bg-marca-700 transition-all" style={{ width: `${(horas / max) * 100}%` }} />
                </span>
                <span className="w-28 text-right tabular">
                  <span className="font-semibold">{horas.toFixed(1)} h</span> <span className="text-tinta-3">· {visitas} tareas</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-tinta-3">Solo cuenta tareas con entrada y salida registradas.</p>
        </div>
      </section>
    );
  }

function EstadoTrabajos() {
  const s = useStore();
    const tipos = Object.keys(TIPO_LABEL) as TipoTrabajo[];
    const enCurso = s.trabajos.filter((t) => t.estado === "en_progreso" || t.estado === "abierto").sort((a, b) => a.numero - b.numero);
    return (
      <section aria-labelledby="t-trabajos">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="t-trabajos" className="text-lg font-semibold">Mantenimientos en curso</h2>
          <Link href="/admin/mantenimientos" className="text-sm font-semibold text-marca-700 hover:underline">Ver todos</Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-borde bg-superficie">
          <div className="flex flex-wrap gap-2 border-b border-borde px-4 py-3">
            {tipos.map((tp) => {
              const n = enCurso.filter((t) => t.tipo === tp).length;
              return n ? <span key={tp} className="inline-flex items-center gap-1"><ChipTipo tipo={tp} /><span className="text-xs font-semibold tabular">{n}</span></span> : null;
            })}
          </div>
          <ul className="divide-y divide-borde">
            {enCurso.map((t) => {
              const { cliente } = contexto(s.trabajos, t.id);
              const av = avanceTrabajo(t, s.visitas);
              return (
                <li key={t.id}>
                  <Link href={`/admin/mantenimientos/${t.id}`} className="grid grid-cols-[auto_1fr_100px] items-center gap-3 px-4 py-2.5 hover:bg-fondo">
                    <IconoTipo tipo={t.tipo} size={32} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">Nº {t.numero} · {t.titulo}</span>
                      <span className="block truncate text-xs text-tinta-2">{cliente.razonSocial}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Barra valor={av} />
                      <span className="w-9 text-right text-xs tabular">{av}%</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    );
  }

function Cifra({ k, v, icono, tono }: { k: string; v: string; icono: LucideIcon; tono: "marca" | "ok" | "aviso" | "info" }) {
  return (
    <div className="flex items-center gap-2.5">
      <Ficha icono={icono} tono={tono} size={36} />
      <div>
        <dt className="text-xs text-tinta-2">{k}</dt>
        <dd className="text-lg leading-tight font-semibold tabular">{v}</dd>
      </div>
    </div>
  );
}
