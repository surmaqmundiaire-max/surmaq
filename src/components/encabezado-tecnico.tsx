"use client";

import { ArrowLeft } from "lucide-react";
import { useVolver } from "@/lib/volver";

/** Encabezado azul de las pantallas internas del técnico: volver + título. */
export function EncabezadoTecnico({ volver, titulo, sub, children }: { volver?: string; titulo: string; sub?: React.ReactNode; children?: React.ReactNode }) {
  const irAtras = useVolver(volver ?? "/tecnico");
  return (
    <header className="bg-marca-900 px-2 pt-2 pb-4 text-white">
      {volver ? (
        <button type="button" onClick={irAtras} aria-label="Volver" className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-white/10 active:bg-white/15">
          <ArrowLeft size={22} />
        </button>
      ) : (
        <div className="h-2" />
      )}
      <div className="px-2">
        <h1 className="text-2xl leading-tight font-bold">{titulo}</h1>
        {sub && <div className="mt-1 text-sm text-marca-100">{sub}</div>}
        {children}
      </div>
    </header>
  );
}
