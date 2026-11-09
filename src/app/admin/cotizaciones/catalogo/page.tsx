"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { perfil, puede } from "@/lib/selectors";
import type { Familia } from "@/lib/cotizador/tipos";
import { norm } from "@/components/filtros";
import { cx } from "@/components/ui";

export default function CatalogoCotizador() {
  const s = useStore();
  const editor = puede(perfil(s.usuarioActualId).rol, "editar_cotizador");
  const [fam, setFam] = useState<Familia>("mant");
  const [q, setQ] = useState("");
  const cat = s.configCot.catalogo;
  const lista = cat.filter((x) => x.fam === fam && norm(`${x.cod} ${x.act} ${x.grupo} ${x.alcance}`).includes(norm(q)));
  const editar = (cod: string, c: Partial<(typeof cat)[number]>) => s.setConfigCot({ catalogo: cat.map((x) => (x.cod === cod ? { ...x, ...c } : x)) });

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <Link href="/admin/cotizaciones" className="inline-flex items-center gap-1 text-sm font-semibold text-marca-700 hover:underline"><ArrowLeft size={16} /> Cotizaciones</Link>
      <div>
        <h1 className="text-2xl font-bold">Catálogo de servicios</h1>
        <p className="text-sm text-tinta-2">{cat.length} servicios con sus horas estándar y la cuadrilla que requieren.{editor ? " Puedes ajustar horas y cuadrilla; los cambios aplican a las cotizaciones nuevas y a las que se recalculen." : ""}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Familia" className="flex gap-1 rounded-xl bg-fondo p-1">
          {([["mant", "Mantenimiento"], ["inst", "Instalación"], ["pint", "Pintura"]] as const).map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={fam === k} onClick={() => setFam(k)} className={cx("min-h-10 rounded-lg px-3 text-sm font-semibold", fam === k ? "bg-superficie text-marca-900 shadow-sm" : "text-tinta-2")}>
              {l} <span className="text-xs opacity-70">{cat.filter((x) => x.fam === k).length}</span>
            </button>
          ))}
        </div>
        <label className="relative min-w-0 flex-1 basis-56">
          <span className="sr-only">Buscar servicio</span>
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-tinta-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Código, actividad o equipo" className="h-11 w-full rounded-xl border border-borde bg-superficie pr-3 pl-9 text-sm" />
        </label>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-borde bg-superficie">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-fondo/60 text-left text-xs text-tinta-2">
            <tr>{["Código", "Actividad", "Equipo / grupo", "Tipo", "Unidad", "Horas", "Cuadrilla", "Intervalo"].map((h) => <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {lista.map((x) => (
              <tr key={x.cod} className="align-top hover:bg-fondo">
                <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{x.cod}</td>
                <td className="px-3 py-2"><span className="font-medium">{x.act}</span><span className="block text-xs text-tinta-3">{x.alcance}</span>{x.cert && <span className="mt-1 inline-block rounded bg-aviso-bg px-1.5 text-xs text-aviso">Cert. {x.cert === "electrica" ? "eléctrica" : x.cert}</span>}</td>
                <td className="px-3 py-2 text-tinta-2">{x.grupo}</td>
                <td className="px-3 py-2">{x.tipo}</td>
                <td className="px-3 py-2">{x.unidad}</td>
                <td className="px-3 py-2 tabular">
                  {editor ? <input type="number" min={0} step={0.05} value={x.horas} onChange={(e) => editar(x.cod, { horas: Math.max(0, +e.target.value || 0) })} aria-label={`Horas de ${x.cod}`} className="h-9 w-20 rounded-lg border border-borde px-2 text-right" /> : x.horas}
                </td>
                <td className="px-3 py-2">
                  {editor ? (
                    <select value={x.cx} onChange={(e) => editar(x.cod, { cx: e.target.value })} aria-label={`Cuadrilla de ${x.cod}`} className="h-9 max-w-44 rounded-lg border border-borde px-1 text-xs">
                      {s.configCot.cuadrillas.map((c) => <option key={c.cx}>{c.cx}</option>)}
                    </select>
                  ) : x.cx}
                </td>
                <td className="px-3 py-2 text-xs text-tinta-2">{x.intervalo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
