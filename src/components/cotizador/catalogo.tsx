"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { puede } from "@/lib/selectors";
import { calcular, crew } from "@/lib/cotizador/calculo";
import type { Familia, ItemCatalogo } from "@/lib/cotizador/tipos";
import { norm } from "../filtros";
import { useAviso } from "../aviso";
import { cx } from "../ui";
import type { Base } from "../migas";
import { usd, useUsuarioCot } from "./editor";
import { BarraCambios, TablaEditable, hrs, useBorrador, type Columna } from "./tabla-editable";

const FAMS: [Familia, string][] = [["mant", "Mantenimiento"], ["vfd", "Variadores Parker"], ["inst", "Instalación de red y eléctrica"], ["pint", "Sistemas de pintura"]];
const NUEVO: Record<Familia, ItemCatalogo> = {
  mant: { cod: "NEW-01", grupo: "Compresor de tornillo", tipo: "Preventivo", act: "Nuevo mantenimiento", alcance: "", intervalo: "", unidad: "equipo", horas: 1, cx: "Baja", escala: "tamano", fam: "mant", cert: "" },
  vfd: { cod: "VAR-NEW", grupo: "Variador de velocidad Parker", tipo: "Preventivo", act: "Nuevo servicio a variador", alcance: "", intervalo: "", unidad: "equipo", horas: 1, cx: "Control / variadores", escala: "potencia", fam: "vfd", cert: "electrica", pot: "variador" },
  inst: { cod: "RED-NEW", grupo: "Red de tubería de aluminio", tipo: "Instalación", act: "Nueva partida", alcance: "", intervalo: "—", unidad: "u", horas: 1, cx: "Instalación", escala: "altura", fam: "inst", cert: "" },
  pint: { cod: "PIN-NEW", grupo: "Pintura en polvo (Gema)", tipo: "Preventivo", act: "Nuevo servicio", alcance: "", intervalo: "", unidad: "u", horas: 1, cx: "Pintura – servicio", escala: "ninguna", fam: "pint", cert: "pintura" },
};

export function CatalogoCot({ base }: { base: Base }) {
  const s = useStore();
  const aviso = useAviso();
  const yo = useUsuarioCot(base);
  const editor = puede(yo.rol, "editar_cotizador");
  const verPrecios = puede(yo.rol, "cotizar"); // quien cotiza ve precios de venta
  const cfg = s.configCot;
  const b = useBorrador(cfg.catalogo);
  const [fam, setFam] = useState<Familia>("mant");
  const [q, setQ] = useState("");
  const [vista, setVista] = useState<"partidas" | "potencia">("partidas");
  const todos = b.valor;
  const idx = todos.map((x, i) => [x, i] as const).filter(([x]) => x.fam === fam && norm(`${x.cod} ${x.act} ${x.grupo}`).includes(norm(q)));
  const filas = idx.map(([x]) => x);
  const dup = [...new Set(todos.map((x) => x.cod).filter((c, i, a) => a.indexOf(c) !== i))];

  const cols: Columna<ItemCatalogo>[] = [
    { k: "cod", label: "Código", ancho: "90px" },
    { k: "grupo", label: "Grupo / equipo", ancho: "150px" },
    { k: "tipo", label: "Tipo", tipo: "select", opciones: ["Preventivo", "Correctivo", "Instalación"], ancho: "120px" },
    { k: "act", label: "Actividad", ancho: "220px", fmt: (v) => <span className="font-medium">{String(v)}</span> },
    { k: "alcance", label: "Alcance", tipo: "area", ancho: "260px", fmt: (v) => <span className="text-xs text-tinta-2">{String(v)}</span> },
    { k: "intervalo", label: "Intervalo", ancho: "100px" },
    { k: "unidad", label: "Unidad", tipo: "select", opciones: ["equipo", "u", "m", "punto", "global"], ancho: "90px" },
    { k: "horas", label: "Horas / unidad", tipo: "num", step: "0.05", num: true, ancho: "80px", fmt: (v) => hrs(Number(v)) },
    { k: "escala", label: "Escala", tipo: "select", ancho: "130px", opciones: [{ v: "tamano", l: "Tamaño de equipo" }, { v: "potencia", l: "Potencia (HP)" }, { v: "altura", l: "Altura de trabajo" }, { v: "ninguna", l: "Sin escala" }] },
    { k: "pot", label: "Franjas", tipo: "select", ancho: "150px", opciones: [{ v: "", l: "—" }, ...cfg.potencias.map((g) => ({ v: g.k, l: g.n }))] },
    { k: "cert", label: "Certificación", tipo: "select", ancho: "100px", opciones: [{ v: "", l: "—" }, { v: "electrica", l: "Eléctrica" }, { v: "pintura", l: "Pintura" }] },
    { k: "cx", label: "Complejidad", tipo: "select", opciones: cfg.cuadrillas.map((c) => c.cx), ancho: "150px" },
    { label: "Cuadrilla", fn: (r) => { const c = crew(cfg, r.cx); return <span className="text-xs whitespace-nowrap text-tinta-2">{c.pers} pers. · {Object.entries(c.comp).map(([k, v]) => `${v}×${k}`).join(" + ")}</span>; } },
    ...(verPrecios ? [{ label: "Valor / unidad (base)", num: true, fn: (r: ItemCatalogo) => usd(r.horas * crew(cfg, r.cx).rate) }] : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Catálogo de servicios</h1>
          <p className="text-sm text-tinta-2">Horas por unidad para la cuadrilla. La escala ajusta el tiempo por tamaño del equipo o por altura de trabajo; la certificación indica qué personal debe ir en la cuadrilla.{editor ? " Puedes editar, agregar y eliminar partidas." : ""}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Familia" className="flex flex-wrap gap-1 rounded-xl bg-fondo p-1">
          {FAMS.map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={fam === k} onClick={() => setFam(k)} className={cx("min-h-10 rounded-lg px-3 text-sm font-semibold", fam === k ? "bg-superficie text-marca-900 shadow-sm" : "text-tinta-2")}>
              {l} <span className="text-xs opacity-70">({todos.filter((x) => x.fam === k).length})</span>
            </button>
          ))}
        </div>
        <label className="relative min-w-0 flex-1 basis-56">
          <span className="sr-only">Buscar en el catálogo</span>
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-tinta-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar código, actividad o grupo" className="h-11 w-full rounded-xl border border-borde bg-superficie pr-3 pl-9 text-sm" />
        </label>
      </div>
      {(fam === "mant" || fam === "vfd") && (
        <div role="tablist" aria-label="Vista" className="flex w-fit gap-1 rounded-xl bg-fondo p-1">
          {([["partidas", "Partidas"], ["potencia", "Tarifario por potencia"]] as const).map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={vista === k} onClick={() => setVista(k)} className={cx("min-h-10 rounded-lg px-3 text-sm font-semibold", vista === k ? "bg-superficie text-marca-900 shadow-sm" : "text-tinta-2")}>{l}</button>
          ))}
        </div>
      )}
      {(fam === "mant" || fam === "vfd") && vista === "potencia" ? <TarifarioPotencia filtro={q} fam={fam} /> : <>
      <TablaEditable
        filas={filas}
        cols={cols}
        editable={editor}
        vacio="Ninguna partida coincide con la búsqueda."
        onCambio={(i, c) => b.set((t) => t.map((x, j) => (j === idx[i][1] ? { ...x, ...c } : x)))}
        onQuitar={(i) => b.set((t) => t.filter((_, j) => j !== idx[i][1]))}
        onAgregar={() => { b.set((t) => [...t, { ...NUEVO[fam] }]); setQ(""); }}
        etiquetaAgregar="Agregar partida"
      />
      </>}
      {editor && (vista === "partidas" || fam === "inst" || fam === "pint") && (
        <BarraCambios
          sucio={b.sucio}
          onDescartar={b.descartar}
          onGuardar={() => { if (dup.length) return aviso(`Códigos repetidos: ${dup.join(", ")}`); s.setConfigCot({ catalogo: b.valor }); aviso("Catálogo guardado"); }}
          extra={dup.length ? <span className="text-sm font-semibold text-critico">Códigos repetidos: {dup.join(", ")}</span> : undefined}
        />
      )}
    </div>
  );
}

/** Mano de obra en sitio por franja de potencia (1 equipo, horario normal, planta industrial). */
function TarifarioPotencia({ filtro, fam }: { filtro: string; fam: Familia }) {
  const { configCot: cfg } = useStore();
  return (
    <div className="space-y-5">
      <p className="text-sm text-tinta-2">Valor de mano de obra en sitio para un equipo, en horario normal y planta industrial. No incluye traslado ni viáticos. La cuadrilla sube según la potencia: se usa la mayor entre la que pide el trabajo y la mínima de la franja.</p>
      {cfg.potencias.map((g) => {
        const items = cfg.catalogo.filter((x) => x.fam === fam && x.escala === "potencia" && x.pot === g.k && norm(`${x.cod} ${x.act}`).includes(norm(filtro)));
        if (!items.length) return null;
        return (
          <section key={g.k}>
            <h2 className="mb-2 font-semibold">{g.n} <span className="text-sm font-normal text-tinta-3">· {g.u === "cfm" ? "capacidad en cfm" : "potencia en HP"}</span></h2>
            <div className="relative overflow-x-auto rounded-xl border border-borde bg-superficie">
              <table className="w-full text-sm">
                <thead className="bg-fondo text-left text-xs text-tinta-2">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Trabajo</th>
                    {g.franjas.map((f) => <th key={f.n} className="px-3 py-2 text-right font-semibold whitespace-nowrap">{f.n}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-borde">
                  <tr className="bg-fondo/50 text-xs text-tinta-2">
                    <td className="px-3 py-1.5">Cuadrilla mínima · factor de tiempo</td>
                    {g.franjas.map((f) => { const c = crew(cfg, f.cx); return <td key={f.n} className="px-3 py-1.5 text-right whitespace-nowrap">{c.pers} pers. · ×{f.f}</td>; })}
                  </tr>
                  {items.map((it) => (
                    <tr key={it.cod}>
                      <td className="px-3 py-2"><span className="font-mono text-xs text-tinta-3">{it.cod}</span> <span className="font-medium">{it.act}</span></td>
                      {g.franjas.map((f) => {
                        const R = calcular({ lineas: [{ cod: it.cod, cant: 1, tam: cfg.tamanos[0].n, alt: cfg.alturas[0].n, hor: cfg.horarios[0].n, pot: f.n }], ciudad: "", entorno: cfg.entornos[0].n, descuento: 0 }, cfg);
                        const L = R.lines[0];
                        return <td key={f.n} className="px-3 py-2 text-right whitespace-nowrap tabular"><b>{usd(L.mo)}</b><span className="block text-xs text-tinta-3">{hrs(L.h)} · {L.cr.pers} pers.</span></td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
