"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";
import { perfil } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { Badge, Vacio } from "@/components/ui";
import { Buscador, Selector, norm } from "@/components/filtros";

export default function Clientes() {
  const { trabajos, equipos, clientes } = useStore();
  const [q, setQ] = useState("");
  const [ciudad, setCiudad] = useState("todas");
  const ciudades = [...new Set(clientes.map((c) => c.ciudad))].sort();
  const filas = clientes.filter(
    (c) => (ciudad === "todas" || c.ciudad === ciudad) && norm(`${c.razonSocial} ${c.ruc} ${c.industria} ${c.contacto.nombre}`).includes(norm(q)),
  );
  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Link href="/admin/clientes/nuevo" className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-marca-800 px-4 text-sm font-semibold text-white hover:bg-marca-900"><Plus size={17} /> Nueva empresa</Link>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Buscador valor={q} onChange={setQ} placeholder="Buscar por nombre, RUC, industria o contacto…" />
        <Selector etiqueta="Ciudad" valor={ciudad} onChange={setCiudad} opciones={[["todas", "Todas"], ...ciudades.map((c) => [c, c] as [string, string])]} />
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-borde bg-superficie">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-fondo/60 text-left text-xs text-tinta-2">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Cliente</th>
              <th className="px-4 py-2.5 font-semibold">Ciudad</th>
              <th className="px-4 py-2.5 font-semibold">Industria</th>
              <th className="px-4 py-2.5 font-semibold">Responsable</th>
              <th className="px-4 py-2.5 text-right font-semibold">Equipos</th>
              <th className="px-4 py-2.5 text-right font-semibold">Mant. abiertos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {filas.map((c) => {
              const eqs = equipos.filter((e) => e.clienteId === c.id);
              const abiertos = trabajos.filter((t) => eqs.some((e) => e.id === t.equipoId) && t.estado !== "cerrado").length;
              return (
                <tr key={c.id} className="hover:bg-fondo">
                  <td className="px-4 py-3">
                    <Link href={`/admin/clientes/${c.id}`} className="font-semibold hover:underline">{c.razonSocial}</Link>
                    <span className="block text-xs text-tinta-3 tabular">RUC {c.ruc}</span>
                  </td>
                  <td className="px-4 py-3">{c.ciudad}</td>
                  <td className="px-4 py-3">{c.industria}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{perfil(c.responsableId).nombre}</td>
                  <td className="px-4 py-3 text-right tabular">{eqs.length}</td>
                  <td className="px-4 py-3 text-right tabular">{abiertos ? <Badge tono="info">{abiertos}</Badge> : <span className="text-tinta-3">0</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filas.length === 0 && <div className="p-4"><Vacio>Ningún cliente coincide con la búsqueda.</Vacio></div>}
      </div>
    </div>
  );
}
