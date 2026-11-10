"use client";

// Selector de trabajos del cotizador: tipo de servicio → equipo → potencia/capacidad → trabajo.
import { useState } from "react";
import { Plus } from "lucide-react";
import { calcular, crew } from "@/lib/cotizador/calculo";
import type { ConfigCot, Familia, GrupoPotencia, ItemCatalogo } from "@/lib/cotizador/tipos";
import { claseCampo } from "../formularios";
import { cx } from "../ui";
import { usd } from "./editor";
import { hrs } from "./tabla-editable";

export const FAMILIAS: [Familia, string, string][] = [
  ["mant", "Mantenimiento", "Mant."],
  ["vfd", "Variadores Parker", "Variadores"],
  ["inst", "Instalación", "Instalación"],
  ["pint", "Pintura", "Pintura"],
];

export const unidadTxt = (g?: GrupoPotencia) => (g?.u === "cfm" ? "Capacidad (cfm)" : "Potencia (HP)");

export function AgregarTrabajo({ cfg, sugerida, nEquipos, onAgregar }: {
  cfg: ConfigCot;
  /** franja que corresponde a los equipos elegidos, por grupo de franjas */
  sugerida: (g: GrupoPotencia) => string | undefined;
  nEquipos: number;
  onAgregar: (it: ItemCatalogo, franja?: string) => void;
}) {
  const [fam, setFam] = useState<Familia>("mant");
  const [grupoSel, setGrupoSel] = useState("");
  const [franjaSel, setFranjaSel] = useState<Record<string, string>>({});
  const [itemSel, setItemSel] = useState("");
  const items = cfg.catalogo.filter((x) => x.fam === fam);
  const grupos = [...new Set(items.map((x) => x.grupo))];
  const grupo = grupos.includes(grupoSel) ? grupoSel : grupos[0];
  const delGrupo = items.filter((x) => x.grupo === grupo);
  const gPot = cfg.potencias.find((g) => delGrupo.some((x) => x.escala === "potencia" && x.pot === g.k));
  const franja = gPot ? (gPot.franjas.some((f) => f.n === franjaSel[gPot.k]) ? franjaSel[gPot.k] : sugerida(gPot) ?? gPot.franjas[0]?.n) : undefined;
  const conSelectorGuiado = fam === "mant" || fam === "vfd";
  const precio = (it: ItemCatalogo) => calcular({ lineas: [{ cod: it.cod, cant: 1, tam: cfg.tamanos[0].n, alt: cfg.alturas[0].n, hor: cfg.horarios[0].n, pot: franja }], ciudad: "", entorno: cfg.entornos[0].n, descuento: 0 }, cfg).lines[0];
  const tipos = [...new Set(delGrupo.map((x) => x.tipo))];

  return (
    <div className="mb-4 space-y-3 rounded-xl bg-fondo p-3">
      <div role="radiogroup" aria-label="Tipo de servicio" className="grid grid-cols-2 gap-1 rounded-lg bg-superficie p-1 @xl:grid-cols-4">
        {FAMILIAS.map(([k, l]) => (
          <button key={k} type="button" role="radio" aria-checked={fam === k} onClick={() => { setFam(k); setGrupoSel(""); setItemSel(""); }}
            className={cx("min-h-10 rounded-md px-1 text-sm font-semibold", fam === k ? "bg-marca-800 text-white" : "text-tinta-2 hover:bg-fondo")}>{l}</button>
        ))}
      </div>

      {conSelectorGuiado ? (
        <>
          {grupos.length > 1 && (
            <fieldset>
              <legend className="mb-1.5 text-xs font-semibold tracking-wide text-tinta-3 uppercase">1 · Equipo</legend>
              <div className="flex flex-wrap gap-1.5">
                {grupos.map((g) => (
                  <button key={g} type="button" aria-pressed={g === grupo} onClick={() => setGrupoSel(g)}
                    className={cx("min-h-10 rounded-full border px-3 text-sm font-medium", g === grupo ? "border-marca-800 bg-marca-800 text-white" : "border-borde bg-superficie hover:border-marca-600")}>{g}</button>
                ))}
              </div>
            </fieldset>
          )}

          {gPot && (
            <fieldset>
              <legend className="mb-1.5 text-xs font-semibold tracking-wide text-tinta-3 uppercase">{grupos.length > 1 ? "2 · " : ""}{unidadTxt(gPot)}</legend>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-1.5">
                {gPot.franjas.map((f) => {
                  const c = crew(cfg, f.cx);
                  const on = f.n === franja;
                  return (
                    <button key={f.n} type="button" aria-pressed={on} onClick={() => setFranjaSel((x) => ({ ...x, [gPot.k]: f.n }))}
                      className={cx("flex min-h-14 flex-col items-center justify-center rounded-xl border px-2 py-1.5 text-center", on ? "border-marca-800 bg-marca-50 ring-2 ring-marca-800" : "border-borde bg-superficie hover:border-marca-600")}>
                      <span className={cx("text-sm font-bold whitespace-nowrap tabular", on ? "text-marca-900" : "text-tinta")}>{f.n}</span>
                      <span className="text-[11px] whitespace-nowrap text-tinta-3">{c.pers} {c.pers === 1 ? "técnico" : "técnicos"} mín.</span>
                    </button>
                  );
                })}
              </div>
              {nEquipos > 0 && <p className="mt-1.5 text-xs text-tinta-2">Con equipos elegidos se usa la {gPot.u === "cfm" ? "capacidad" : "potencia"} de la placa de cada uno; esta franja aplica a los que no la tienen.</p>}
            </fieldset>
          )}

          <fieldset>
            <legend className="mb-1.5 text-xs font-semibold tracking-wide text-tinta-3 uppercase">{grupos.length > 1 ? (gPot ? "3 · " : "2 · ") : gPot ? "2 · " : ""}Trabajo</legend>
            <div className="space-y-3">
              {tipos.map((tp) => (
                <div key={tp}>
                  <p className="mb-1 text-xs font-medium text-tinta-2">{tp === "Preventivo" ? "Preventivos" : tp === "Correctivo" ? "Correctivos" : tp}</p>
                  <ul className="divide-y divide-borde overflow-hidden rounded-xl border border-borde bg-superficie">
                    {delGrupo.filter((x) => x.tipo === tp).map((it) => {
                      const L = precio(it);
                      return (
                        <li key={it.cod}>
                          <button type="button" onClick={() => onAgregar(it, franja)} className="flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left hover:bg-marca-50">
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium">{it.act}</span>
                              <span className="block text-xs text-tinta-3"><span className="font-mono">{it.cod}</span> · {it.intervalo}{it.cert ? ` · cert. ${it.cert === "electrica" ? "eléctrica" : it.cert}` : ""}</span>
                            </span>
                            <span className="shrink-0 text-right text-xs text-tinta-2 tabular">
                              <span className="block text-sm font-semibold text-tinta">{usd(L.mo)}</span>
                              {hrs(L.h)} · {L.cr.pers} pers.
                            </span>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-marca-800 text-white" aria-hidden><Plus size={18} /></span>
                            <span className="sr-only">Agregar</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-tinta-3">Mano de obra en sitio por equipo, horario normal. El traslado y los viáticos se suman en el resumen.{nEquipos > 1 ? ` Se agrega para los ${nEquipos} equipos elegidos.` : ""}</p>
          </fieldset>
        </>
      ) : (
        <div className="flex flex-col gap-2 @xl:flex-row">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Partida</span>
            <select value={itemSel || items[0]?.cod} onChange={(e) => setItemSel(e.target.value)} className={cx(claseCampo, "mt-0")}>
              {grupos.map((g) => <optgroup key={g} label={g}>{items.filter((x) => x.grupo === g).map((x) => <option key={x.cod} value={x.cod}>{x.cod} · {x.act}</option>)}</optgroup>)}
            </select>
          </label>
          <button type="button" onClick={() => { const it = items.find((x) => x.cod === (itemSel || items[0]?.cod)); if (it) onAgregar(it); }} className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-marca-800 px-4 font-semibold text-white"><Plus size={18} /> Agregar{nEquipos > 1 ? ` a ${nEquipos} equipos` : ""}</button>
        </div>
      )}
    </div>
  );
}
