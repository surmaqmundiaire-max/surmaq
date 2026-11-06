"use client";

import Link from "next/link";
import { use } from "react";
import { ArrowLeft } from "lucide-react";
import { equipo } from "@/lib/selectors";
import { FichaEquipo } from "@/components/historial-equipo";

export default function EquipoAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const e = equipo(id);
  return (
    <div className="mx-auto max-w-4xl">
      <Link href={`/admin/clientes/${e.clienteId}`} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-marca-700 hover:underline">
        <ArrowLeft size={16} /> Volver al cliente
      </Link>
      <FichaEquipo id={id} base="admin" />
    </div>
  );
}
