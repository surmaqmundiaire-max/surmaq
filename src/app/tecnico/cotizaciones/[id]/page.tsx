"use client";

import { use } from "react";
import { useStore } from "@/lib/store";
import { EditorCotizacion } from "@/components/cotizador/editor";
import { Vacio } from "@/components/ui";
import { BarraVolver } from "@/components/barra-tecnico";

export default function VerCotizacion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { cotizaciones } = useStore();
  const existe = cotizaciones.some((c) => c.id === id);
  return (
    <div className="px-4 pt-2 pb-4">
      <BarraVolver etiqueta="Cotizaciones" respaldo="/tecnico/cotizaciones" />
      {existe ? <EditorCotizacion key={id} id={id} base="tecnico" /> : <Vacio>No se encontró la cotización.</Vacio>}
    </div>
  );
}
