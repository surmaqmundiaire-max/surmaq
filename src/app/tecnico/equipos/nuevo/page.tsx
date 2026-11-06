"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EncabezadoTecnico } from "@/components/encabezado-tecnico";
import { FormEquipo } from "@/components/formularios";

function Contenido() {
  const router = useRouter();
  const cliente = useSearchParams().get("cliente") ?? undefined;
  return (
    <div>
      <EncabezadoTecnico volver={cliente ? `/tecnico/clientes/${cliente}` : "/tecnico/clientes"} titulo="Agregar equipo" sub="Toma la foto de la placa y la IA llena los datos." />
      <div className="px-4 pt-5">
        <FormEquipo clienteInicial={cliente} onGuardado={(id) => router.push(`/tecnico/equipos/${id}`)} />
      </div>
    </div>
  );
}

export default function NuevoEquipoTecnico() {
  return <Suspense><Contenido /></Suspense>;
}
