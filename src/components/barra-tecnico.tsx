"use client";

import { ArrowLeft } from "lucide-react";
import { useVolver } from "@/lib/volver";

/** Botón grande «← Pantalla anterior» para las pantallas internas del técnico. */
export function BarraVolver({ etiqueta, respaldo }: { etiqueta: string; respaldo: string }) {
  const volver = useVolver(respaldo);
  return (
    <button type="button" onClick={volver} className="-ml-2 flex min-h-12 max-w-full items-center gap-1.5 rounded-xl px-2 text-[15px] font-semibold text-marca-700 active:bg-marca-50">
      <ArrowLeft size={20} className="shrink-0" />
      <span className="truncate">{etiqueta}</span>
    </button>
  );
}
