"use client";

import { use } from "react";
import { FichaEquipo } from "@/components/historial-equipo";

export default function EquipoAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <div className="mx-auto max-w-4xl"><FichaEquipo id={id} base="admin" /></div>;
}
