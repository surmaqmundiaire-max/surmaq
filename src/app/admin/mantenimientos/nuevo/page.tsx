"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormMantenimiento } from "@/components/formularios";
import type { TipoTrabajo } from "@/lib/types";
import { Migas } from "@/components/migas";

function Contenido() {
  const router = useRouter();
  const sp = useSearchParams();
  const equipo = sp.get("equipo") ?? undefined;
  const tipo = (sp.get("tipo") ?? undefined) as TipoTrabajo | undefined;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Migas base="admin" equipoId={equipo} />
      <h1 className="text-2xl font-bold">Nuevo mantenimiento</h1>
      <div className="rounded-2xl border border-borde bg-superficie p-4 sm:p-6"><FormMantenimiento tipoInicial={tipo} base="admin" equipoInicial={equipo} onGuardado={(id) => router.push(`/admin/mantenimientos/${id}`)} /></div>
    </div>
  );
}

export default function NuevoMantenimientoAdmin() {
  return <Suspense><Contenido /></Suspense>;
}
