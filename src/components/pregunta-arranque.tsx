"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus, Play, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { CHECKLISTS } from "@/lib/mock-data";
import { toLocalIso } from "@/lib/format";
import { useAviso } from "./aviso";
import { IconoTipo } from "./visual";
import type { Base } from "./migas";

/** Después de registrar un equipo: ¿hacer el arranque ahora, programarlo o dejarlo para después? */
export function PreguntaArranque({ equipoId, base, onCerrar }: { equipoId: string; base: Base; onCerrar: () => void }) {
  const s = useStore();
  const router = useRouter();
  const aviso = useAviso();
  const e = s.equipos.find((x) => x.id === equipoId);
  if (!e) return null;

  const ahora = () => {
    const tec = s.tecnicoActualId;
    const inicio = s.ahora.slice(0, 16) + ":00";
    const fin = new Date(inicio);
    fin.setHours(fin.getHours() + 2);
    const trabajoId = s.agregarTrabajo({ equipoId, titulo: `Arranque de ${e.nombre}`, tipo: "arranque", lugar: "en_cliente", estado: "abierto", asignadoId: tec, fechaIngreso: s.ahora });
    const visitaId = s.agregarVisita({
      trabajoId,
      tecnicoId: tec,
      descripcion: `Arranque de ${e.nombre}`,
      lugar: "en_cliente",
      programadaInicio: inicio,
      programadaFin: toLocalIso(fin),
      estado: "programada",
      autoEmpresa: true,
      acompanantes: [],
      checklist: Object.fromEntries(CHECKLISTS.arranque.map((k) => [k, false])),
      fotos: [],
      programadaPor: tec,
      vistaPorTecnico: true,
    });
    aviso("Arranque creado · marca tu entrada para empezar");
    router.push(`/tecnico/visita/${visitaId}`);
  };

  return (
    <section className="rounded-2xl border-2 border-t-arr bg-t-arr-bg p-4" aria-label="¿Hacer el arranque?">
      <div className="flex items-start gap-3">
        <IconoTipo tipo="arranque" size={44} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-t-arr-tx">Equipo registrado. ¿Quieres hacer el arranque?</h2>
          <p className="text-sm text-tinta-2">El arranque deja el equipo funcionando, con su puesta en marcha y la etiqueta QR pegada.</p>
        </div>
        <button type="button" onClick={onCerrar} aria-label="Cerrar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-tinta-2 hover:bg-white/60"><X size={18} /></button>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {base === "tecnico" && (
          <button type="button" onClick={ahora} className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-t-arr font-semibold text-white hover:brightness-110">
            <Play size={18} fill="currentColor" /> Sí, hacerlo ahora
          </button>
        )}
        <Link href={`/${base}/mantenimientos/nuevo?equipo=${equipoId}&tipo=arranque`} className="flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-t-arr bg-superficie font-semibold text-t-arr-tx hover:bg-white">
          <CalendarPlus size={18} /> {base === "tecnico" ? "Programarlo para otro día" : "Programar el arranque"}
        </Link>
        <button type="button" onClick={onCerrar} className="flex min-h-14 items-center justify-center rounded-xl font-semibold text-tinta-2 hover:bg-white/60">
          Ahora no
        </button>
      </div>
    </section>
  );
}
