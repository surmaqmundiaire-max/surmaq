"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormMantenimiento } from "@/components/formularios";
import { Migas } from "@/components/migas";

function Contenido() {
  const router = useRouter();
  const equipo = useSearchParams().get("equipo") ?? undefined;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Migas base="admin" equipoId={equipo} />
      <h1 className="text-2xl font-bold">Nuevo mantenimiento</h1>
      <div className="rounded-2xl border border-borde bg-superficie p-4 sm:p-6"><FormMantenimiento base="admin" equipoInicial={equipo} onGuardado={(id) => router.push(`/admin/mantenimientos/${id}`)} /></div>
    </div>
  );
}

export default function NuevoMantenimientoAdmin() {
  return <Suspense><Contenido /></Suspense>;
}
