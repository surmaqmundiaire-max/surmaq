"use client";

import { use } from "react";
import { FichaCliente } from "@/components/ficha-cliente";

export default function ClienteTecnico({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <div className="px-4 py-4"><FichaCliente id={id} base="tecnico" /></div>;
}
