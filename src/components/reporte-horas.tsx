"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Download, Loader2, Moon, Timer } from "lucide-react";
import { useStore } from "@/lib/store";
import { tecnicos } from "@/lib/selectors";
import { toLocalIso } from "@/lib/format";
import { claveGrupo, clavesConDatos, etiquetaGrupo, hhmm, registrosHoras, textoJornada, totales, type Agrupacion } from "@/lib/reporte-horas";
import { exportarHorasExcel } from "@/lib/exportar-excel";
import { Avatar, Vacio, cx } from "./ui";
import { Ficha } from "./visual";
import { Selector } from "./filtros";
import { useAviso } from "./aviso";

type Periodo = "hoy" | "semana" | "semana_pasada" | "mes" | "mes_pasado" | "personalizado";

function rango(p: Periodo, hoy: string): [string, string] {
  const d = new Date(hoy + "T00:00:00");
  const iso = (x: Date) => toLocalIso(x).slice(0, 10);
  const lunes = new Date(d);
  lunes.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  if (p === "hoy") return [hoy, hoy];
  if (p === "semana") return [iso(lunes), hoy];
  if (p === "semana_pasada") {
    const a = new Date(lunes); a.setDate(a.getDate() - 7);
    const b = new Date(lunes); b.setDate(b.getDate() - 1);
    return [iso(a), iso(b)];
  }
  if (p === "mes") return [hoy.slice(0, 8) + "01", hoy];
  const a = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const b = new Date(d.getFullYear(), d.getMonth(), 0);
  return [iso(a), iso(b)];
}

/** Reporte de horas por técnico, con horas extra, filtros por período y exportación a Excel. */
export function ReporteHoras({ soloTecnicoId }: { soloTecnicoId?: string }) {
  const s = useStore();
  const aviso = useAviso();
  const hoy = s.ahora.slice(0, 10);
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [desdeP, setDesdeP] = useState(hoy.slice(0, 8) + "01");
  const [hastaP, setHastaP] = useState(hoy);
  const [por, setPor] = useState<Agrupacion>("dia");
  const [tec, setTec] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [verTodo, setVerTodo] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [desde, hasta] = periodo === "personalizado" ? [desdeP <= hastaP ? desdeP : hastaP, desdeP <= hastaP ? hastaP : desdeP] : rango(periodo, hoy);

  const ids = soloTecnicoId ? [soloTecnicoId] : tecnicos().filter((t) => (!tec || t.id === tec) && (!ciudad || t.ciudad === ciudad)).map((t) => t.id);
  const regs = useMemo(() => registrosHoras(s.visitas, s.trabajos, desde, hasta, ids), [s.visitas, s.trabajos, desde, hasta, ids.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const t = totales(regs);
  const claves = clavesConDatos(desde, hasta, por, regs);
  const personas = ids.map((id) => s.perfiles.find((p) => p.id === id)!).filter(Boolean);
  const maxH = Math.max(1, ...personas.map((p) => totales(regs.filter((r) => r.tecnicoId === p.id)).horas));
  const filas = verTodo ? regs : regs.slice(0, 60);

  const exportar = async () => {
    setExportando(true);
    try {
      await exportarHorasExcel({ regs, desde, hasta, por, titulo: soloTecnicoId ? `Horas de ${personas[0]?.nombre}` : "Horas de técnicos · Surmaq" });
      aviso("Reporte descargado en Excel");
    } catch (err) {
      console.error("exportar excel", err);
      aviso("No se pudo generar el Excel. Intenta de nuevo.");
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <section className="space-y-3 rounded-2xl border border-borde bg-superficie p-4" aria-label="Filtros">
        <div role="radiogroup" aria-label="Período" className="flex flex-wrap gap-2">
          {([["hoy", "Hoy"], ["semana", "Esta semana"], ["semana_pasada", "Semana pasada"], ["mes", "Este mes"], ["mes_pasado", "Mes pasado"], ["personalizado", "Elegir fechas"]] as const).map(([k, l]) => (
            <button key={k} type="button" role="radio" aria-checked={periodo === k} onClick={() => setPeriodo(k)}
              className={cx("min-h-10 rounded-full border px-4 text-sm font-medium", periodo === k ? "border-marca-800 bg-marca-800 text-white" : "border-borde bg-superficie hover:bg-fondo")}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {periodo === "personalizado" && (
            <>
              <label className="text-sm"><span className="text-tinta-2">Desde</span><input type="date" value={desdeP} onChange={(e) => setDesdeP(e.target.value)} className="mt-1 block h-10 rounded-lg border border-borde px-2" /></label>
              <label className="text-sm"><span className="text-tinta-2">Hasta</span><input type="date" value={hastaP} onChange={(e) => setHastaP(e.target.value)} className="mt-1 block h-10 rounded-lg border border-borde px-2" /></label>
            </>
          )}
          <div className="text-sm">
            <span className="text-tinta-2">Ver por</span>
            <div role="radiogroup" aria-label="Agrupar por" className="mt-1 flex rounded-lg bg-fondo p-0.5">
              {([["dia", "Día"], ["semana", "Semana"], ["mes", "Mes"]] as const).map(([k, l]) => (
                <button key={k} type="button" role="radio" aria-checked={por === k} onClick={() => setPor(k)} className={cx("h-9 rounded-md px-3 font-medium", por === k ? "bg-superficie shadow-sm" : "text-tinta-2")}>{l}</button>
              ))}
            </div>
          </div>
          {!soloTecnicoId && (
            <>
              <Selector etiqueta="Técnico" valor={tec} onChange={setTec} opciones={[["", "Todos"], ...tecnicos().map((x) => [x.id, x.nombre] as [string, string])]} />
              <Selector etiqueta="Ciudad" valor={ciudad} onChange={setCiudad} opciones={[["", "Todas"], ...[...new Set(tecnicos().map((x) => x.ciudad))].map((c) => [c, c] as [string, string])]} />
            </>
          )}
          <button type="button" onClick={exportar} disabled={exportando || regs.length === 0}
            className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-xl bg-ok px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50">
            {exportando ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />} Exportar a Excel
          </button>
        </div>
        <p className="text-xs text-tinta-3">Del {desde} al {hasta}. Horas extra: todo lo trabajado fuera de {textoJornada}. Solo cuentan tareas con entrada y salida.</p>
      </section>

      {/* Cifras */}
      <dl className="grid grid-cols-2 gap-3 @xl:grid-cols-4">
        <Cifra icono={Clock} tono="marca" k="Horas totales" v={hhmm(t.horas)} />
        <Cifra icono={CheckCircle2} tono="ok" k="En horario normal" v={hhmm(t.normales)} />
        <Cifra icono={Moon} tono="aviso" k="Horas extra" v={hhmm(t.extra)} />
        <Cifra icono={Timer} tono="info" k="Tareas registradas" v={String(t.tareas)} />
      </dl>

      {regs.length === 0 ? (
        <Vacio>No hay tareas con entrada y salida en este período.</Vacio>
      ) : (
        <>
          {/* Resumen por técnico */}
          {!soloTecnicoId && (
            <section aria-labelledby="t-resumen">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 id="t-resumen" className="text-lg font-semibold">Resumen por técnico</h2>
                <p className="flex gap-3 text-xs text-tinta-2"><span className="inline-flex items-center gap-1"><span className="h-2.5 w-4 rounded bg-marca-800" /> Normal</span><span className="inline-flex items-center gap-1"><span className="h-2.5 w-4 rounded bg-[#d98c1a]" /> Extra</span></p>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-borde bg-superficie">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-fondo/60 text-left text-xs text-tinta-2">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Técnico</th>
                      <th className="w-64 px-4 py-2.5 font-semibold">Horas</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Total</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Normales</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Extra</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Tareas</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Días</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Prom./día</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borde tabular">
                    {personas.map((p) => {
                      const x = totales(regs.filter((r) => r.tecnicoId === p.id));
                      return (
                        <tr key={p.id} className="hover:bg-fondo">
                          <td className="px-4 py-2.5"><span className="flex items-center gap-2"><Avatar nombre={p.nombre} size={28} /><span className="font-medium">{p.nombre}</span><span className="text-xs text-tinta-3">{p.ciudad}</span></span></td>
                          <td className="px-4 py-2.5" title={`Normales ${hhmm(x.normales)} · Extra ${hhmm(x.extra)}`}>
                            <span className="flex h-3 overflow-hidden rounded-full bg-fondo">
                              <span className="h-full bg-marca-800" style={{ width: `${(x.normales / maxH) * 100}%` }} />
                              <span className="ml-px h-full bg-[#d98c1a]" style={{ width: `${(x.extra / maxH) * 100}%` }} />
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold">{hhmm(x.horas)}</td>
                          <td className="px-4 py-2.5 text-right">{hhmm(x.normales)}</td>
                          <td className="px-4 py-2.5 text-right">{x.extra > 0 ? <span className="rounded-md bg-aviso-bg px-1.5 py-0.5 font-semibold text-aviso">{hhmm(x.extra)}</span> : <span className="text-tinta-3">0:00</span>}</td>
                          <td className="px-4 py-2.5 text-right">{x.tareas}</td>
                          <td className="px-4 py-2.5 text-right">{x.dias}</td>
                          <td className="px-4 py-2.5 text-right">{x.dias ? hhmm(x.horas / x.dias) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Técnico × período */}
          <section aria-labelledby="t-matriz">
            <h2 id="t-matriz" className="mb-2 text-lg font-semibold">Horas por {por === "dia" ? "día" : por}</h2>
            <div className="overflow-x-auto rounded-2xl border border-borde bg-superficie">
              <table className="w-full text-sm tabular">
                <thead className="bg-fondo/60 text-xs text-tinta-2">
                  <tr>
                    <th className="sticky left-0 z-[1] bg-fondo px-3 py-2.5 text-left font-semibold">Técnico</th>
                    {claves.map((k) => {
                      const finde = por === "dia" && [0, 6].includes(new Date(k + "T00:00:00").getDay());
                      return <th key={k} className={cx("px-2 py-2.5 text-center font-semibold whitespace-nowrap", finde && "text-aviso")}>{etiquetaGrupo(k, por)}</th>;
                    })}
                    <th className="px-3 py-2.5 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borde">
                  {personas.map((p) => {
                    const suyos = regs.filter((r) => r.tecnicoId === p.id);
                    const x = totales(suyos);
                    return (
                      <tr key={p.id}>
                        <td className="sticky left-0 z-[1] bg-superficie px-3 py-2 font-medium whitespace-nowrap">{p.nombre}</td>
                        {claves.map((k) => {
                          const c = totales(suyos.filter((r) => claveGrupo(r.fecha, por) === k));
                          return (
                            <td key={k} className="px-2 py-2 text-center whitespace-nowrap">
                              {c.horas ? (
                                <>
                                  <span className="block font-semibold">{hhmm(c.horas)}</span>
                                  {c.extra > 0 && <span className="block text-xs font-semibold text-aviso">+{hhmm(c.extra)} extra</span>}
                                </>
                              ) : (
                                <span className="text-tinta-3">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <span className="block font-semibold">{hhmm(x.horas)}</span>
                          {x.extra > 0 && <span className="block text-xs font-semibold text-aviso">+{hhmm(x.extra)} extra</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Detalle */}
          <section aria-labelledby="t-detalle">
            <h2 id="t-detalle" className="mb-2 text-lg font-semibold">Detalle <span className="font-normal text-tinta-3">({regs.length} registros)</span></h2>
            <div className="overflow-x-auto rounded-2xl border border-borde bg-superficie">
              <table className="w-full min-w-[1100px] text-sm tabular">
                <thead className="bg-fondo/60 text-left text-xs text-tinta-2">
                  <tr>
                    {["Fecha", ...(soloTecnicoId ? [] : ["Técnico"]), "Entrada", "Salida", "Horas", "Normales", "Extra", "Cliente", "Ciudad", "Equipo", "Mant.", "Observaciones"].map((h) => (
                      <th key={h} className={cx("px-3 py-2.5 font-semibold whitespace-nowrap", ["Horas", "Normales", "Extra"].includes(h) && "text-right")}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-borde">
                  {filas.map((r) => (
                    <tr key={r.visitaId + r.tecnicoId} className={cx("hover:bg-fondo", r.extra > 0 && "bg-aviso-bg/30")}>
                      <td className="px-3 py-2 whitespace-nowrap">{etiquetaGrupo(r.fecha, "dia")}</td>
                      {!soloTecnicoId && <td className="px-3 py-2 whitespace-nowrap">{r.tecnico}{r.rol === "Acompañante" && <span className="ml-1 text-xs text-tinta-3">(acomp.)</span>}</td>}
                      <td className={cx("px-3 py-2", Number(r.entrada.slice(11, 13)) + Number(r.entrada.slice(14, 16)) / 60 < 8.5 && "font-semibold text-aviso")}>{r.entrada.slice(11, 16)}</td>
                      <td className={cx("px-3 py-2 whitespace-nowrap", (r.salida.slice(0, 10) !== r.fecha || Number(r.salida.slice(11, 13)) + Number(r.salida.slice(14, 16)) / 60 > 17.5) && "font-semibold text-aviso")}>{r.salida.slice(11, 16)}{r.salida.slice(0, 10) !== r.fecha && " (+1)"}</td>
                      <td className="px-3 py-2 text-right font-semibold">{hhmm(r.horas)}</td>
                      <td className="px-3 py-2 text-right">{hhmm(r.normales)}</td>
                      <td className="px-3 py-2 text-right">{r.extra > 0 ? <span className="rounded-md bg-aviso-bg px-1.5 py-0.5 font-semibold text-aviso">{hhmm(r.extra)}</span> : <span className="text-tinta-3">—</span>}</td>
                      <td className="max-w-56 truncate px-3 py-2" title={r.cliente}>{r.cliente}</td>
                      <td className="px-3 py-2">{r.ciudad}</td>
                      <td className="max-w-48 truncate px-3 py-2" title={r.equipo}>{r.equipo}</td>
                      <td className="px-3 py-2">{r.mantenimiento}</td>
                      <td className="max-w-64 truncate px-3 py-2 text-xs text-tinta-2" title={r.observaciones}>{r.observaciones || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {regs.length > filas.length && (
              <button type="button" onClick={() => setVerTodo(true)} className="mt-2 min-h-10 text-sm font-semibold text-marca-700">Ver los {regs.length} registros</button>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Cifra({ k, v, icono, tono }: { k: string; v: string; icono: typeof Clock; tono: "marca" | "ok" | "aviso" | "info" }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-2xl border border-borde bg-superficie p-3 @md:flex-row @md:items-center @md:gap-3">
      <Ficha icono={icono} tono={tono} size={34} />
      <div>
        <dt className="text-xs text-tinta-2">{k}</dt>
        <dd className={cx("text-xl leading-tight font-semibold tabular", tono === "aviso" && "text-aviso")}>{v}</dd>
      </div>
    </div>
  );
}
