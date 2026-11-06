"use client";

import { use } from "react";
import { DetalleMantenimiento } from "@/components/detalle-mantenimiento";

export default function MantenimientoTecnico({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <div className="px-4 py-4"><DetalleMantenimiento id={id} base="tecnico" /></div>;
}
