"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { EditorCotizacion } from "@/components/cotizador/editor";


function Contenido() {
  const sp = useSearchParams();
  return <EditorCotizacion base="admin" prefill={{ clienteId: sp.get("cliente") ?? undefined, equipoId: sp.get("equipo") ?? undefined, solicitudId: sp.get("solicitud") ?? undefined }} />;
}

export default function NuevaCotizacion() {
  return (
    <>
      
      <Suspense><Contenido /></Suspense>
    </>
  );
}
