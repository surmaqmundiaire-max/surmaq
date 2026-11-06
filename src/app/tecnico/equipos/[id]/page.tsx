"use client";

import Link from "next/link";
import { use } from "react";
import { ArrowLeft } from "lucide-react";
import { FichaEquipo } from "@/components/historial-equipo";

export default function EquipoTecnico({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="px-4 py-3">
      <Link href="/tecnico/equipos" className="mb-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-marca-700">
        <ArrowLeft size={16} /> Equipos
      </Link>
      <FichaEquipo id={id} base="tecnico" />
    </div>
  );
}
