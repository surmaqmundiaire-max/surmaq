"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { avanceTrabajo, contexto, perfil, tecnicos } from "@/lib/selectors";
import { fechaCorta } from "@/lib/format";
import { TIPO_LABEL } from "@/lib/mock-data";
import { Barra, Badge, EstadoTrabajoBadge, Vacio } from "@/components/ui";
import { Buscador, Selector, norm } from "@/components/filtros";

export default function Trabajos() {
  const s = useStore();
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("activos");
  const [tipo, setTipo] = useState("todos");
  const [tec, setTec] = useState("todos");

  const filas = s.trabajos
    .map((t) => ({ t, ...contexto(s.trabajos, t.id) }))
    .filter(({ t, cliente, equipo }) =>
      (estado === "todos" || (estado === "activos" ? t.estado === "abierto" || t.estado === "en_progreso" : t.estado === estado)) &&
      (tipo === "todos" || t.tipo === tipo) &&
      (tec === "todos" || t.asignadoId === tec) &&
      norm(`${t.numero} ${t.titulo} ${cliente.razonSocial} ${equipo.nombre}`).includes(norm(q)),
    )
    .sort((a, b) => b.t.numero - a.t.numero);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Mantenimientos</h1>
        <Link href="/admin/mantenimientos/nuevo" className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-marca-800 px-4 text-sm font-semibold text-white hover:bg-marca-900"><Plus size={17} /> Nuevo mantenimiento</Link>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Buscador valor={q} onChange={setQ} placeholder="Buscar por Nº, cliente, equipo…" />
        <Selector etiqueta="Estado" valor={estado} onChange={setEstado} opciones={[["activos", "Abiertos y en progreso"], ["cerrado", "Cerrados"], ["todos", "Todos"]]} />
        <Selector etiqueta="Tipo" valor={tipo} onChange={setTipo} opciones={[["todos", "Todos"], ...Object.entries(TIPO_LABEL)]} />
        <Selector etiqueta="Técnico" valor={tec} onChange={setTec} opciones={[["todos", "Todos"], ...tecnicos().map((t) => [t.id, t.nombre] as [string, string])]} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-borde bg-superficie">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-fondo/60 text-left text-xs text-tinta-2">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Nº</th>
              <th className="px-4 py-2.5 font-semibold">Mantenimiento</th>
              <th className="px-4 py-2.5 font-semibold">Tipo</th>
              <th className="px-4 py-2.5 font-semibold">Técnico</th>
              <th className="px-4 py-2.5 font-semibold">Ingreso</th>
              <th className="w-40 px-4 py-2.5 font-semibold">Avance</th>
              <th className="px-4 py-2.5 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {filas.map(({ t, cliente, equipo }) => {
              const av = avanceTrabajo(t, s.visitas);
              return (
                <tr key={t.id} className="hover:bg-fondo">
                  <td className="px-4 py-3 font-semibold tabular">
                    <Link href={`/admin/mantenimientos/${t.id}`} className="text-marca-700 hover:underline">{t.numero}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/mantenimientos/${t.id}`} className="block font-semibold hover:underline">{t.titulo}</Link>
                    <span className="text-tinta-2">{cliente.razonSocial} · {equipo.nombre}</span>
                  </td>
                  <td className="px-4 py-3"><Badge>{TIPO_LABEL[t.tipo]}</Badge></td>
                  <td className="px-4 py-3 whitespace-nowrap">{perfil(t.asignadoId).nombre}</td>
                  <td className="px-4 py-3 whitespace-nowrap tabular">{fechaCorta(t.fechaIngreso)}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2"><Barra valor={av} /><span className="w-9 text-right text-xs tabular">{av}%</span></span>
                  </td>
                  <td className="px-4 py-3"><EstadoTrabajoBadge estado={t.estado} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filas.length === 0 && <div className="p-4"><Vacio>Ningún mantenimiento coincide con los filtros. Prueba con «Estado: Todos».</Vacio></div>}
      </div>
      <p className="mt-2 text-xs text-tinta-3">El avance se calcula con los ítems del checklist completados en las visitas.</p>
    </div>
  );
}
