"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EncabezadoTecnico } from "@/components/encabezado-tecnico";
import { FormMantenimiento } from "@/components/formularios";

function Contenido() {
  const router = useRouter();
  const equipo = useSearchParams().get("equipo") ?? undefined;
  return (
    <div>
      <EncabezadoTecnico volver={equipo ? `/tecnico/equipos/${equipo}` : "/tecnico/clientes"} titulo="Nuevo mantenimiento" sub="Se crea con su primera tarea agendada." />
      <div className="px-4 pt-5">
        <FormMantenimiento base="tecnico" equipoInicial={equipo} onGuardado={(id) => router.push(`/tecnico/mantenimientos/${id}`)} />
      </div>
    </div>
  );
}

export default function NuevoMantenimientoTecnico() {
  return <Suspense><Contenido /></Suspense>;
}
