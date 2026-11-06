"use client";

import { use } from "react";
import { FichaCliente } from "@/components/ficha-cliente";

export default function ClienteAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <div className="mx-auto max-w-5xl"><FichaCliente id={id} base="admin" /></div>;
}
