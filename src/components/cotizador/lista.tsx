"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Plus, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { perfil } from "@/lib/selectors";
import { fechaCorta } from "@/lib/format";
import { ESTADOS_COT, equiposCot } from "@/lib/cotizador/tipos";
import { norm } from "../filtros";
import { Vacio, cx } from "../ui";
import { ESTILO_ESTADO, usd, useUsuarioCot } from "./editor";
import type { Base } from "../migas";

export function ListaCotizaciones({ base }: { base: Base }) {
  const s = useStore();
  const yo = useUsuarioCot(base);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  // El técnico ve las que hizo y en las que está asignado; los demás perfiles ven todas
  const visibles = s.cotizaciones.filter((c) => base !== "tecnico" || c.creadoPor === yo.id || Object.values(c.asig).includes(yo.id));
  const lista = visibles.filter((c) => (!estado || c.estado === estado) && norm(`${c.numero} ${c.cliente} ${c.ciudad}`).includes(norm(q)));
  const totalAprobado = visibles.filter((c) => c.estado === "Aprobada" || c.estado === "Ejecutada").reduce((a, c) => a + c.total, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Cotizaciones</h1>
          <p className="text-sm text-tinta-2">Cotiza el servicio técnico antes de hacerlo. Aprobadas: {usd(totalAprobado)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {base === "admin" && <Link href="/admin/cotizaciones/catalogo" className="inline-flex min-h-11 items-center rounded-xl border border-borde bg-superficie px-3 text-sm font-semibold hover:bg-fondo">Catálogo</Link>}
          {base === "admin" && <Link href="/admin/cotizaciones/parametros" className="inline-flex min-h-11 items-center rounded-xl border border-borde bg-superficie px-3 text-sm font-semibold hover:bg-fondo">Parámetros</Link>}
          <Link href={`/${base}/cotizaciones/nueva`} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-marca-800 px-4 text-sm font-semibold text-white hover:bg-marca-900"><Plus size={17} /> Nueva cotización</Link>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-0 flex-1 basis-56">
          <span className="sr-only">Buscar cotización</span>
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-tinta-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nº, cliente o ciudad" className="h-11 w-full rounded-xl border border-borde bg-superficie pr-3 pl-9 text-sm" />
        </label>
        <div role="radiogroup" aria-label="Estado" className="flex flex-wrap gap-1">
          {["", ...ESTADOS_COT].map((e) => (
            <button key={e || "todas"} type="button" role="radio" aria-checked={estado === e} onClick={() => setEstado(e)}
              className={cx("min-h-10 rounded-full px-3 text-sm font-medium", estado === e ? "bg-marca-800 text-white" : "border border-borde bg-superficie")}>
              {e || "Todas"} <span className="text-xs opacity-75">{e ? visibles.filter((c) => c.estado === e).length : visibles.length}</span>
            </button>
          ))}
        </div>
      </div>
      {lista.length === 0 ? (
        <Vacio>{visibles.length ? "Ninguna cotización coincide con el filtro." : "Aún no hay cotizaciones. Crea la primera con «Nueva cotización»."}</Vacio>
      ) : (
        <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
          {lista.map((c) => (
            <li key={c.id}>
              <Link href={`/${base}/cotizaciones/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-fondo">
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-semibold">{c.numero}</span><span className={cx("rounded-full px-2 py-0.5 text-xs font-semibold", ESTILO_ESTADO[c.estado])}>{c.estado}</span></span>
                  <span className="block truncate font-semibold">{c.cliente}</span>
                  <span className="block truncate text-sm text-tinta-2">{c.ciudad} · {c.lineas.length} trabajo(s){equiposCot(c).length > 1 ? ` · ${equiposCot(c).length} equipos` : ""} · {fechaCorta(c.fecha)} · {perfil(c.creadoPor).nombre}</span>
                </span>
                <span className="shrink-0 text-right font-semibold tabular">{usd(c.total)}</span>
                <ChevronRight size={18} className="shrink-0 text-tinta-3" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
