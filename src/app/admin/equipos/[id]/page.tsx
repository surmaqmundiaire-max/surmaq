"use client";

import { Suspense, use, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PreguntaArranque } from "@/components/pregunta-arranque";
import { FichaEquipo } from "@/components/historial-equipo";

export default function EquipoAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <div className="mx-auto max-w-4xl"><Suspense><Pregunta id={id} /></Suspense>
      <FichaEquipo id={id} base="admin" /></div>;
}

function Pregunta({ id }: { id: string }) {
  const nuevo = useSearchParams().get("nuevo") === "1";
  const [visible, setVisible] = useState(true);
  return nuevo && visible ? <div className="mb-4"><PreguntaArranque equipoId={id} base="admin" onCerrar={() => setVisible(false)} /></div> : null;
}
