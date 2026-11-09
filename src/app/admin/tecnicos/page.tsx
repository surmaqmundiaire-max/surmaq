"use client";

import { ReporteHoras } from "@/components/reporte-horas";

export default function HorasTecnicos() {
  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Horas de técnicos</h1>
        <p className="text-sm text-tinta-2">Lo que ha trabajado cada técnico por día, semana o mes, con horas extra. Se puede exportar a Excel.</p>
      </div>
      <ReporteHoras />
    </div>
  );
}
