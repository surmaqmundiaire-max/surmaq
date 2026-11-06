"use client";

import { use } from "react";
import { DetalleMantenimiento } from "@/components/detalle-mantenimiento";

export default function MantenimientoAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <DetalleMantenimiento id={id} base="admin" />;
}
