"use client";

import { useRouter } from "next/navigation";
import { FormCliente } from "@/components/formularios";
import { Migas } from "@/components/migas";

export default function NuevaEmpresaAdmin() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Migas base="admin" />
      <h1 className="text-2xl font-bold">Nueva empresa</h1>
      <div className="rounded-2xl border border-borde bg-superficie p-4 sm:p-6"><FormCliente onGuardado={(id) => router.push(`/admin/clientes/${id}`)} /></div>
    </div>
  );
}
