"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEquipo } from "@/components/formularios";
import { Migas } from "@/components/migas";

function Contenido() {
  const router = useRouter();
  const cliente = useSearchParams().get("cliente") ?? undefined;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Migas base="admin" clienteId={cliente} />
      <h1 className="text-2xl font-bold">Agregar equipo</h1>
      <div className="rounded-2xl border border-borde bg-superficie p-4 sm:p-6"><FormEquipo clienteInicial={cliente} onGuardado={(id) => router.push(`/admin/equipos/${id}?nuevo=1`)} /></div>
    </div>
  );
}

export default function NuevoEquipoAdmin() {
  return <Suspense><Contenido /></Suspense>;
}
