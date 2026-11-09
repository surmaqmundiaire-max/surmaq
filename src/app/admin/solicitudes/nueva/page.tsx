"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FormSolicitud } from "@/components/form-solicitud";

function Contenido() {
  const router = useRouter();
  const sp = useSearchParams();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/admin/solicitudes" className="inline-flex items-center gap-1 text-sm font-semibold text-marca-700 hover:underline"><ArrowLeft size={16} /> Solicitudes</Link>
      <h1 className="text-2xl font-bold">Solicitar visita técnica</h1>
      <div className="rounded-2xl border border-borde bg-superficie p-4 sm:p-6">
        <FormSolicitud clienteInicial={sp.get("cliente") ?? undefined} equipoInicial={sp.get("equipo") ?? undefined} tecnicoInicial={sp.get("tecnico") ?? undefined} fechaInicial={sp.get("fecha") ?? undefined} onGuardado={(id) => router.push(`/admin/solicitudes/${id}`)} />
      </div>
    </div>
  );
}

export default function NuevaSolicitud() {
  return <Suspense><Contenido /></Suspense>;
}
