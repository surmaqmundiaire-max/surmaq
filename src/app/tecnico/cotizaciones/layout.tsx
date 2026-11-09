"use client";

import { SeccionCotizador } from "@/components/cotizador/seccion";
import { BarraVolver } from "@/components/barra-tecnico";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pt-2 pb-4">
      <BarraVolver etiqueta="Hoy" respaldo="/tecnico" />
      <SeccionCotizador base="tecnico">{children}</SeccionCotizador>
    </div>
  );
}
