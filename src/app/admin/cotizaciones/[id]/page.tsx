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
    <div className="mx-auto max-w-7xl">
      
      {existe ? <EditorCotizacion key={id} id={id} base="admin" /> : <Vacio>No se encontró la cotización.</Vacio>}
    </div>
  );
}
