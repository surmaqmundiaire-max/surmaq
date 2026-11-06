"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { tecnicos } from "@/lib/selectors";
import { Calendario, useEventos } from "@/components/calendario";
import { Selector } from "@/components/filtros";
import { Proximos } from "./proximos";

export default function CalendarioAdmin() {
  const [tec, setTec] = useState("");
  const [ciudad, setCiudad] = useState("");
  const eventos = useEventos({ base: "admin", tecnicoId: tec || undefined, ciudad: ciudad || undefined });
  const ciudades = [...new Set(tecnicos().map((t) => t.ciudad))];
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Calendario</h1>
        <Link href="/admin/mantenimientos/nuevo" className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-marca-800 px-4 text-sm font-semibold text-white hover:bg-marca-900"><Plus size={17} /> Nuevo mantenimiento</Link>
      </div>
      <div className="flex flex-wrap gap-3">
        <Selector etiqueta="Técnico" valor={tec} onChange={setTec} opciones={[["", "Todos"], ...tecnicos().map((t) => [t.id, t.nombre] as [string, string])]} />
        <Selector etiqueta="Ciudad" valor={ciudad} onChange={setCiudad} opciones={[["", "Todas"], ...ciudades.map((c) => [c, c] as [string, string])]} />
      </div>
      <Calendario eventos={eventos} />
      <section>
        <h2 className="mb-1 text-lg font-semibold">Equipos por fecha de mantenimiento</h2>
        <p className="mb-3 text-sm text-tinta-2">Los vencidos son servicio pendiente y una oportunidad de venta.</p>
        <Proximos />
      </section>
    </div>
  );
}
