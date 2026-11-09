"use client";

import { use } from "react";
import { useStore } from "@/lib/store";
import { EditorCotizacion } from "@/components/cotizador/editor";
import { Vacio } from "@/components/ui";

export default function VerCotizacion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { cotizaciones } = useStore();
  const existe = cotizaciones.some((c) => c.id === id);
  return (
    <>
      {existe ? <EditorCotizacion key={id} id={id} base="tecnico" /> : <Vacio>No se encontró la cotización.</Vacio>}
    </>
  );
}
