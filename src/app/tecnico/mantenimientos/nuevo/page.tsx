"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EncabezadoTecnico } from "@/components/encabezado-tecnico";
import { FormMantenimiento } from "@/components/formularios";
import type { TipoTrabajo } from "@/lib/types";

function Contenido() {
  const router = useRouter();
  const sp = useSearchParams();
  const equipo = sp.get("equipo") ?? undefined;
  const tipo = (sp.get("tipo") ?? undefined) as TipoTrabajo | undefined;
  return (
    <div>
      <EncabezadoTecnico volver={equipo ? `/tecnico/equipos/${equipo}` : "/tecnico/clientes"} titulo="Nuevo mantenimiento" sub="Se crea con su primera tarea agendada." />
      <div className="px-4 pt-5">
        <FormMantenimiento tipoInicial={tipo} base="tecnico" equipoInicial={equipo} onGuardado={(id) => router.push(`/tecnico/mantenimientos/${id}`)} />
      </div>
    </div>
  );
}

export default function NuevoMantenimientoTecnico() {
  return <Suspense><Contenido /></Suspense>;
}
