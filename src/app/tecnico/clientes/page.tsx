"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2, ChevronRight, Plus, QrCode, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { cliente as getCliente } from "@/lib/selectors";
import { norm } from "@/components/filtros";
import { Vacio } from "@/components/ui";

export default function ClientesTecnico() {
  const { clientes, equipos, tecnicoActualId } = useStore();
  const [q, setQ] = useState("");
  const [aviso, setAviso] = useState(false);
  const nq = norm(q);
  const empresas = clientes
    .filter((c) => norm(`${c.razonSocial} ${c.ruc} ${c.ciudad}`).includes(nq))
    .sort((a, b) => Number(b.responsableId === tecnicoActualId) - Number(a.responsableId === tecnicoActualId) || a.razonSocial.localeCompare(b.razonSocial));
  const eqs = q.length >= 2 ? equipos.filter((e) => norm(`${e.nombre} ${e.marca} ${e.modelo} ${e.serie} ${e.codigoQr}`).includes(nq)).slice(0, 5) : [];

  return (
    <div>
      <header className="bg-marca-900 px-4 pt-4 pb-5 text-white">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="mt-1 text-sm text-marca-100">Empresa → equipos → mantenimientos → tareas</p>
        <label className="relative mt-4 block">
          <span className="sr-only">Buscar empresa o equipo</span>
          <Search size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-tinta-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Empresa, equipo o serie" className="min-h-12 w-full rounded-xl bg-white pr-3 pl-10 text-[16px] text-tinta outline-none focus:ring-2 focus:ring-white/40" />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setAviso(true)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 font-semibold active:bg-white/10">
            <QrCode size={20} /> Escanear QR
          </button>
          <Link href="/tecnico/clientes/nuevo" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white font-semibold text-marca-900 active:bg-marca-100">
            <Plus size={20} /> Nueva empresa
          </Link>
        </div>
      </header>
      {aviso && (
        <p className="mx-4 mt-4 rounded-xl bg-info-bg px-4 py-3 text-sm text-info" role="status">
          En la versión final se abre la cámara y lleva directo a la ficha del equipo. En la maqueta, búscalo por nombre o serie.
        </p>
      )}
      <div className="space-y-5 px-4 py-4">
        {eqs.length > 0 && (
          <section>
            <h2 className="mb-2 px-1 text-sm font-semibold text-tinta-2">Equipos</h2>
            <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
              {eqs.map((e) => (
                <li key={e.id}>
                  <Link href={`/tecnico/equipos/${e.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 active:bg-marca-50">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{e.nombre}</span>
                      <span className="block truncate text-sm text-tinta-2">{getCliente(e.clienteId).razonSocial} · serie {e.serie}</span>
                    </span>
                    <ChevronRight size={18} className="text-tinta-3" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <section>
          <h2 className="mb-2 px-1 text-sm font-semibold text-tinta-2">Empresas</h2>
          {empresas.length === 0 ? (
            <Vacio>Ninguna empresa coincide con «{q}». Puedes crearla con «Nueva empresa».</Vacio>
          ) : (
            <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
              {empresas.map((c) => {
                const n = equipos.filter((e) => e.clienteId === c.id).length;
                return (
                  <li key={c.id}>
                    <Link href={`/tecnico/clientes/${c.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 active:bg-marca-50">
                      <Building2 size={20} className="shrink-0 text-tinta-3" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{c.razonSocial}</span>
                        <span className="block truncate text-sm text-tinta-2">{c.ciudad} · {n} {n === 1 ? "equipo" : "equipos"}{c.responsableId === tecnicoActualId ? " · a tu cargo" : ""}</span>
                      </span>
                      <ChevronRight size={18} className="text-tinta-3" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
