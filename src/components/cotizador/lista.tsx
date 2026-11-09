"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Plus, Search, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { perfil, ROL_LABEL } from "@/lib/selectors";
import type { Rol } from "@/lib/types";
import { useAviso } from "../aviso";
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
  const [rol, setRol] = useState<"" | Rol>("");
  const [borrar, setBorrar] = useState<string | null>(null);
  const aviso = useAviso();
  const esAdmin = yo.rol === "admin";
  // El técnico ve las que hizo y en las que está asignado; los demás perfiles ven todas
  const visibles = s.cotizaciones.filter((c) => base !== "tecnico" || c.creadoPor === yo.id || Object.values(c.asig).includes(yo.id));
  const lista = visibles.filter((c) => (!estado || c.estado === estado) && (!rol || perfil(c.creadoPor).rol === rol) && norm(`${c.numero} ${c.cliente} ${c.ciudad}`).includes(norm(q)));
  const totalLista = lista.reduce((a, c) => a + c.total, 0);
  const cuadrilla = (c: (typeof lista)[number]) => [...new Set(Object.values(c.asig).filter(Boolean))].map((id) => perfil(id).nombre.split(" ")[0]).join(", ") || "—";
  const totalAprobado = visibles.filter((c) => c.estado === "Aprobada" || c.estado === "Ejecutada").reduce((a, c) => a + c.total, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Cotizaciones</h1>
          <p className="text-sm text-tinta-2">Historial de cotizaciones guardadas. Ábrela para editarla, cambiar su estado o verla como cliente. Aprobadas: {usd(totalAprobado)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${base}/cotizaciones/nueva`} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-marca-800 px-4 text-sm font-semibold text-white hover:bg-marca-900"><Plus size={17} /> Nueva cotización</Link>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-0 flex-1 basis-56">
          <span className="sr-only">Buscar cotización</span>
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-tinta-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nº, cliente o ciudad" className="h-11 w-full rounded-xl border border-borde bg-superficie pr-3 pl-9 text-sm" />
        </label>
        <label className="shrink-0">
          <span className="sr-only">Elaborada por</span>
          <select value={rol} onChange={(e) => setRol(e.target.value as "" | Rol)} className="h-11 rounded-xl border border-borde bg-superficie px-2 text-sm">
            <option value="">Todos los equipos</option>
            {(["vendedor", "tecnico", "coordinador", "jefe", "admin"] as Rol[]).map((r) => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}
          </select>
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
      {lista.length > 0 && <p className="text-sm text-tinta-2">{lista.length} cotización(es) · <b className="tabular">{usd(totalLista)}</b></p>}
      {lista.length === 0 ? (
        <Vacio>{visibles.length ? "Ninguna cotización coincide con el filtro." : "Aún no hay cotizaciones. Crea la primera en «Cotizar»."}</Vacio>
      ) : (
        <>
          {/* Pantallas anchas: tabla como en el cotizador original */}
          <div className="hidden overflow-x-auto rounded-2xl border border-borde bg-superficie @4xl:block">
            <table className="w-full text-sm">
              <thead className="bg-fondo text-left text-xs text-tinta-2">
                <tr>{["Número", "Fecha", "Cliente", "Ciudad", "Estado", "Horas", "Total", "Elaborada por", "Cuadrilla", ""].map((h, i) => <th key={i} className={cx("px-3 py-2.5 font-semibold whitespace-nowrap", (h === "Horas" || h === "Total") && "text-right")}>{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {lista.map((c) => {
                  const autor = perfil(c.creadoPor);
                  return (
                    <tr key={c.id} className="align-top hover:bg-fondo">
                      <td className="px-3 py-2 font-mono font-semibold whitespace-nowrap"><Link href={`/${base}/cotizaciones/${c.id}`} className="text-marca-700 hover:underline">{c.numero}</Link></td>
                      <td className="px-3 py-2 whitespace-nowrap">{fechaCorta(c.fecha)}</td>
                      <td className="px-3 py-2 font-medium">{c.cliente}{equiposCot(c).length > 1 && <span className="block text-xs font-normal text-tinta-3">{equiposCot(c).length} equipos</span>}</td>
                      <td className="px-3 py-2">{c.ciudad}</td>
                      <td className="px-3 py-2"><span className={cx("rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap", ESTILO_ESTADO[c.estado])}>{c.estado}</span></td>
                      <td className="px-3 py-2 text-right whitespace-nowrap tabular">{c.horas.toLocaleString("es-EC", { maximumFractionDigits: 2 })} h</td>
                      <td className="px-3 py-2 text-right font-semibold whitespace-nowrap tabular">{usd(c.total)}</td>
                      <td className="px-3 py-2">{autor.nombre}<span className="block text-xs text-tinta-3">{ROL_LABEL[autor.rol]}</span></td>
                      <td className="px-3 py-2 text-xs">{cuadrilla(c)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Link href={`/${base}/cotizaciones/${c.id}`} className="rounded-lg border border-borde px-2.5 py-1.5 text-xs font-semibold hover:bg-superficie">Abrir</Link>
                          {esAdmin && (borrar === c.id ? (
                            <>
                              <button type="button" onClick={() => { s.eliminarCotizacion(c.id); setBorrar(null); aviso(`${c.numero} eliminada`); }} className="rounded-lg bg-critico px-2.5 py-1.5 text-xs font-semibold text-white">Eliminar</button>
                              <button type="button" onClick={() => setBorrar(null)} className="rounded-lg border border-borde px-2.5 py-1.5 text-xs">No</button>
                            </>
                          ) : (
                            <button type="button" aria-label={`Eliminar ${c.numero}`} onClick={() => setBorrar(c.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-tinta-3 hover:bg-critico-bg hover:text-critico"><Trash2 size={15} /></button>
                          ))}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Celular: lista */}
          <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie @4xl:hidden">
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
        </>
      )}
    </div>
  );
}
