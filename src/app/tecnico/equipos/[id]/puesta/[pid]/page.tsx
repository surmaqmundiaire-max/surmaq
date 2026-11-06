"use client";

import { use } from "react";
import { useStore } from "@/lib/store";
import { FormPuesta } from "@/components/puesta-en-marcha";
import { BarraVolver } from "@/components/barra-tecnico";

export default function PuestaTecnico({ params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id, pid } = use(params);
  const { equipos } = useStore();
  const e = equipos.find((x) => x.id === id);
  return (
    <div className="px-4 pt-2 pb-4">
      <BarraVolver etiqueta={e?.nombre ?? "Equipo"} respaldo={`/tecnico/equipos/${id}`} />
      <FormPuesta id={pid} base="tecnico" />
    </div>
  );
}
