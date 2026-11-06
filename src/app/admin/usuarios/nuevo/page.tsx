"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FormUsuario } from "@/components/form-usuario";

export default function NuevoUsuario() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/admin/usuarios" className="inline-flex items-center gap-1 text-sm font-semibold text-marca-700 hover:underline"><ArrowLeft size={16} /> Usuarios</Link>
      <h1 className="text-2xl font-bold">Nuevo usuario</h1>
      <div className="rounded-2xl border border-borde bg-superficie p-4 sm:p-6"><FormUsuario onGuardado={(id) => router.push(`/admin/usuarios/${id}`)} /></div>
    </div>
  );
}
