"use client";

import { use } from "react";
import { useStore } from "@/lib/store";
import { DetalleMantenimiento } from "@/components/detalle-mantenimiento";
import { BarraVolver } from "@/components/barra-tecnico";

export default function MantenimientoTecnico({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { trabajos, equipos } = useStore();
  const e = equipos.find((x) => x.id === trabajos.find((t) => t.id === id)?.equipoId);
  return (
    <div className="px-4 pt-2 pb-4">
      <BarraVolver etiqueta={e?.nombre ?? "Clientes"} respaldo={e ? `/tecnico/equipos/${e.id}` : "/tecnico/clientes"} />
      <DetalleMantenimiento id={id} base="tecnico" />
    </div>
  );
}
