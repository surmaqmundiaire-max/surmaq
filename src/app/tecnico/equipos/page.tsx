"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, QrCode, Search } from "lucide-react";
import { equipos } from "@/lib/mock-data";
import { cliente } from "@/lib/selectors";
import { Vacio } from "@/components/ui";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function EquiposTecnico() {
  const [q, setQ] = useState("");
  const [escaneo, setEscaneo] = useState(false);
  const lista = equipos.filter((e) => {
    const c = cliente(e.clienteId);
    return norm(`${e.nombre} ${e.marca} ${e.modelo} ${e.serie} ${e.codigoQr} ${c.razonSocial}`).includes(norm(q));
  });
  return (
    <div>
      <header className="bg-marca-900 px-4 pt-4 pb-5 text-white">
        <h1 className="text-2xl font-bold">Equipos</h1>
        <p className="mt-1 text-sm text-marca-100">Escanea el código pegado en la máquina o búscala.</p>
        <button
          type="button"
          onClick={() => setEscaneo(true)}
          className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white text-[17px] font-semibold text-marca-900 active:bg-marca-100"
        >
          <QrCode size={22} /> Escanear código QR
        </button>
      </header>

      {escaneo && (
        <div className="mx-4 mt-4 rounded-2xl border border-borde bg-superficie p-4 text-sm" role="status">
          <p className="font-semibold">Cámara de escaneo</p>
          <p className="mt-1 text-tinta-2">En la versión final se abre la cámara. Para la maqueta, elige un equipo de la lista.</p>
          <button type="button" className="mt-2 min-h-11 font-semibold text-marca-700" onClick={() => setEscaneo(false)}>Entendido</button>
        </div>
      )}

      <div className="px-4 py-4">
        <label className="relative block">
          <span className="sr-only">Buscar equipo</span>
          <Search size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-tinta-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cliente, marca, modelo o serie"
            className="min-h-12 w-full rounded-xl border border-borde bg-superficie pr-3 pl-10 text-[16px] outline-none focus:border-marca-600 focus:ring-2 focus:ring-marca-600/20"
          />
        </label>
        <ul className="mt-3 divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
          {lista.map((e) => (
            <li key={e.id}>
              <Link href={`/tecnico/equipos/${e.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-fondo active:bg-marca-50">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{e.nombre}</p>
                  <p className="truncate text-sm text-tinta-2">{cliente(e.clienteId).razonSocial} · {e.marca} {e.modelo}</p>
                </div>
                <ChevronRight size={18} className="text-tinta-3" />
              </Link>
            </li>
          ))}
        </ul>
        {lista.length === 0 && <div className="mt-3"><Vacio>Ningún equipo coincide con «{q}». Prueba con el nombre del cliente o la serie.</Vacio></div>}
      </div>
    </div>
  );
}
