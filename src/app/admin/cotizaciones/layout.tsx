"use client";

import { SeccionCotizador } from "@/components/cotizador/seccion";


export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl">
      
      <SeccionCotizador base="admin">{children}</SeccionCotizador>
    </div>
  );
}
