"use client";

import { useStore } from "@/lib/store";
import { ReporteHoras } from "@/components/reporte-horas";

export default function MisHoras() {
  const { tecnicoActualId } = useStore();
  return (
    <div>
      <header className="bg-marca-900 px-4 pt-4 pb-5 text-white">
        <h1 className="text-2xl font-bold">Mis horas</h1>
        <p className="mt-1 text-sm text-marca-100">Lo que has trabajado y tus horas extra. Puedes descargarlo en Excel.</p>
      </header>
      <div className="px-3 py-4"><ReporteHoras soloTecnicoId={tecnicoActualId} /></div>
    </div>
  );
}
