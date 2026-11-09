"use client";

import { Suspense, use, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PreguntaArranque } from "@/components/pregunta-arranque";
import { useStore } from "@/lib/store";
import { FichaEquipo } from "@/components/historial-equipo";
import { BarraVolver } from "@/components/barra-tecnico";

export default function EquipoTecnico({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { equipos, clientes } = useStore();
  const e = equipos.find((x) => x.id === id);
  const c = e && clientes.find((x) => x.id === e.clienteId);
  return (
    <div className="px-4 pt-2 pb-4">
      <BarraVolver etiqueta={c?.razonSocial ?? "Clientes"} respaldo={c ? `/tecnico/clientes/${c.id}` : "/tecnico/clientes"} />
      <Suspense><Pregunta id={id} /></Suspense>
      <FichaEquipo id={id} base="tecnico" />
    </div>
  );
}

function Pregunta({ id }: { id: string }) {
  const nuevo = useSearchParams().get("nuevo") === "1";
  const [visible, setVisible] = useState(true);
  return nuevo && visible ? <div className="mb-4"><PreguntaArranque equipoId={id} base="tecnico" onCerrar={() => setVisible(false)} /></div> : null;
}
