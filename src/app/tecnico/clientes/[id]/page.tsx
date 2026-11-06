"use client";

import { use } from "react";
import { FichaCliente } from "@/components/ficha-cliente";
import { BarraVolver } from "@/components/barra-tecnico";

export default function ClienteTecnico({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="px-4 pt-2 pb-4">
      <BarraVolver etiqueta="Clientes" respaldo="/tecnico/clientes" />
      <FichaCliente id={id} base="tecnico" />
    </div>
  );
}
