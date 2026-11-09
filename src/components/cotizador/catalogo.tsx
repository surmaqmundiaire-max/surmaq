"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { puede } from "@/lib/selectors";
import { crew } from "@/lib/cotizador/calculo";
import type { Familia, ItemCatalogo } from "@/lib/cotizador/tipos";
import { norm } from "../filtros";
import { useAviso } from "../aviso";
import { cx } from "../ui";
import type { Base } from "../migas";
import { usd, useUsuarioCot } from "./editor";
import { BarraCambios, TablaEditable, hrs, useBorrador, type Columna } from "./tabla-editable";

const FAMS: [Familia, string][] = [["mant", "Mantenimiento"], ["inst", "Instalación de red y eléctrica"], ["pint", "Sistemas de pintura"]];
const NUEVO: Record<Familia, ItemCatalogo> = {
  mant: { cod: "NEW-01", grupo: "Compresor de tornillo", tipo: "Preventivo", act: "Nuevo mantenimiento", alcance: "", intervalo: "", unidad: "equipo", horas: 1, cx: "Baja", escala: "tamano", fam: "mant", cert: "" },
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
    { k: "escala", label: "Escala", tipo: "select", ancho: "130px", opciones: [{ v: "tamano", l: "Tamaño de equipo" }, { v: "altura", l: "Altura de trabajo" }, { v: "ninguna", l: "Sin escala" }] },
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
      {editor && (
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
