"use client";

// Elemento distintivo: la jornada como línea de tiempo.
// Bloque con borde = programado · bloque relleno = trabajado (entrada→salida real) · línea = ahora.
import type { Visita } from "@/lib/types";
import { hora } from "@/lib/format";
import { cx } from "./ui";

const INICIO = 7;
const FIN = 19;
const pct = (iso: string) => {
  const h = Number(iso.slice(11, 13)) + Number(iso.slice(14, 16)) / 60;
  return Math.min(100, Math.max(0, ((h - INICIO) / (FIN - INICIO)) * 100));
};

export function Jornada({
  visitas,
  ahora,
  dia,
  alto = "h-7",
  escala = false,
  oscuro = false,
}: {
  visitas: Visita[];
  ahora: string;
  dia: string;
  alto?: string;
  escala?: boolean;
  oscuro?: boolean;
}) {
  const delDia = visitas.filter((v) => v.programadaInicio.startsWith(dia) || v.checkinEn?.startsWith(dia));
  const esHoy = ahora.startsWith(dia);
  return (
    <div>
      <div className={cx("relative w-full rounded-md", alto, oscuro ? "bg-white/10" : "bg-fondo")}>
        {/* marcas de hora */}
        {Array.from({ length: FIN - INICIO - 1 }, (_, i) => (
          <span
            key={i}
            className={cx("absolute top-0 bottom-0 w-px", oscuro ? "bg-white/10" : "bg-borde")}
            style={{ left: `${((i + 1) / (FIN - INICIO)) * 100}%` }}
          />
        ))}
        {delDia.map((v) => {
          const ini = pct(v.programadaInicio);
          const fin = pct(v.programadaFin);
          const realIni = v.checkinEn && pct(v.checkinEn);
          const realFin = v.checkinEn && pct(v.checkoutEn ?? ahora);
          const titulo = `${v.descripcion} · programada ${hora(v.programadaInicio)}–${hora(v.programadaFin)}${v.checkinEn ? ` · real ${hora(v.checkinEn)}–${v.checkoutEn ? hora(v.checkoutEn) : "en curso"}` : ""}`;
          return (
            <span key={v.id} title={titulo}>
              <span
                className={cx("absolute top-1 bottom-1 rounded-[4px] border border-dashed", oscuro ? "border-white/50" : "border-marca-600/60")}
                style={{ left: `${ini}%`, width: `${Math.max(fin - ini, 0.8)}%` }}
              />
              {realIni !== undefined && realFin !== undefined && realIni !== "" && realFin !== "" && (
                <span
                  className={cx(
                    "absolute top-1.5 bottom-1.5 rounded-[4px]",
                    v.estado === "en_curso" ? (oscuro ? "bg-white pulso" : "bg-marca-600 pulso") : oscuro ? "bg-white/85" : "bg-marca-800",
                  )}
                  style={{ left: `${realIni}%`, width: `${Math.max(Number(realFin) - Number(realIni), 0.8)}%` }}
                />
              )}
            </span>
          );
        })}
        {esHoy && (
          <span className="absolute -top-1 -bottom-1 w-0.5 rounded bg-critico" style={{ left: `${pct(ahora)}%` }} aria-label={`Ahora ${hora(ahora)}`} />
        )}
      </div>
      {escala && (
        <div className={cx("relative mt-1 h-4 text-[10px] tabular", oscuro ? "text-marca-100/70" : "text-tinta-3")}>
          {[8, 10, 12, 14, 16, 18].map((h) => (
            <span key={h} className="absolute -translate-x-1/2" style={{ left: `${((h - INICIO) / (FIN - INICIO)) * 100}%` }}>
              {h}h
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function LeyendaJornada() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-tinta-2">
      <span className="inline-flex items-center gap-1.5"><span className="h-3 w-5 rounded-[3px] border border-dashed border-marca-600/60" /> Programado</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-3 w-5 rounded-[3px] bg-marca-800" /> Trabajado</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-3 w-5 rounded-[3px] bg-marca-600" /> En curso</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-3 w-0.5 bg-critico" /> Ahora</span>
    </div>
  );
}
