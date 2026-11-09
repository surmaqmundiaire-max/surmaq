"use client";

import { ListaCotizaciones } from "@/components/cotizador/lista";
import { BarraVolver } from "@/components/barra-tecnico";

export default function CotizacionesTecnico() {
  return (
    <div className="px-4 pt-2 pb-4">
      <BarraVolver etiqueta="Hoy" respaldo="/tecnico" />
      <ListaCotizaciones base="tecnico" />
    </div>
  );
}
