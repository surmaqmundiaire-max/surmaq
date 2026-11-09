"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { EditorCotizacion } from "@/components/cotizador/editor";
import { BarraVolver } from "@/components/barra-tecnico";

function Contenido() {
  const sp = useSearchParams();
  return <EditorCotizacion base="tecnico" prefill={{ clienteId: sp.get("cliente") ?? undefined, equipoId: sp.get("equipo") ?? undefined, solicitudId: sp.get("solicitud") ?? undefined }} />;
}

export default function NuevaCotizacion() {
  return (
    <div className="px-4 pt-2 pb-4">
      <BarraVolver etiqueta="Cotizaciones" respaldo="/tecnico/cotizaciones" />
      <Suspense><Contenido /></Suspense>
    </div>
  );
}
