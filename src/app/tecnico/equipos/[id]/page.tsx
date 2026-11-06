"use client";

import { use } from "react";
import { FichaEquipo } from "@/components/historial-equipo";

export default function EquipoTecnico({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <div className="px-4 py-4"><FichaEquipo id={id} base="tecnico" /></div>;
}
