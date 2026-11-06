"use client";

import Link from "next/link";
import { ChevronRight, MapPin, Navigation, Play, Timer } from "lucide-react";
import { useStore } from "@/lib/store";
import { contexto, horasVisita, perfil } from "@/lib/selectors";
import { duracion, fechaLarga, fechaCorta, hora, horasEntre } from "@/lib/format";
import { TIPO_LABEL } from "@/lib/mock-data";
import type { Visita } from "@/lib/types";
import { Jornada } from "@/components/jornada";
import { Conexion } from "@/components/conexion";
import { Badge, EstadoVisitaBadge, Vacio } from "@/components/ui";

export default function Hoy() {
  const { visitas, trabajos, tecnicoActualId, ahora } = useStore();
  const yo = perfil(tecnicoActualId);
  const dia = ahora.slice(0, 10);
  const mias = visitas.filter((v) => v.tecnicoId === tecnicoActualId);
  const deHoy = mias
    .filter((v) => v.programadaInicio.startsWith(dia) || (v.estado === "en_curso"))
    .sort((a, b) => a.programadaInicio.localeCompare(b.programadaInicio));
  const enCurso = deHoy.find((v) => v.estado === "en_curso");
  const siguiente = !enCurso ? deHoy.find((v) => v.estado === "programada") : undefined;
  const principal = enCurso ?? siguiente;
  const resto = deHoy.filter((v) => v !== principal && v.estado === "programada");
  const terminadas = deHoy.filter((v) => v.estado === "finalizada");
  const proximas = mias.filter((v) => v.estado === "programada" && v.programadaInicio.slice(0, 10) > dia).sort((a, b) => a.programadaInicio.localeCompare(b.programadaInicio));
  const horasHoy = deHoy.filter((v) => v.checkinEn?.startsWith(dia)).reduce((a, v) => a + horasVisita(v, ahora), 0);

  return (
    <div>
      <header className="bg-marca-900 px-4 pt-4 pb-5 text-white">
        <div className="flex items-center justify-between">
          <p className="text-sm text-marca-100">{fechaLarga(dia)}</p>
          <Conexion />
        </div>
        <h1 className="mt-1 text-2xl font-bold">Hola, {yo.nombre.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-marca-100 tabular">
          {deHoy.length} {deHoy.length === 1 ? "visita" : "visitas"} hoy · {duracion(horasHoy)} trabajadas
        </p>
        <div className="mt-4">
          <Jornada visitas={mias} ahora={ahora} dia={dia} oscuro escala alto="h-6" />
        </div>
      </header>

      <div className="space-y-6 px-4 py-5">
        {principal ? (
          <TarjetaPrincipal v={principal} />
        ) : (
          <Vacio>No tienes más visitas para hoy. Las nuevas asignaciones aparecerán aquí.</Vacio>
        )}

        {resto.length > 0 && (
          <Seccion titulo="Más tarde hoy">
            {resto.map((v) => <Fila key={v.id} v={v} />)}
          </Seccion>
        )}
        {terminadas.length > 0 && (
          <Seccion titulo="Terminadas hoy">
            {terminadas.map((v) => <Fila key={v.id} v={v} />)}
          </Seccion>
        )}
        {proximas.length > 0 && (
          <Seccion titulo="Próximos días">
            {proximas.map((v) => <Fila key={v.id} v={v} conFecha />)}
          </Seccion>
        )}
      </div>
    </div>
  );

  function TarjetaPrincipal({ v }: { v: Visita }) {
    const { trabajo, equipo, cliente } = contexto(trabajos, v.trabajoId);
    const enCursoV = v.estado === "en_curso";
    const atraso = !enCursoV && horasEntre(v.programadaInicio, ahora);
    return (
      <section aria-label={enCursoV ? "Visita en curso" : "Siguiente visita"} className="overflow-hidden rounded-2xl border border-borde bg-superficie shadow-[0_2px_10px_rgba(11,42,74,0.08)]">
        <div className="p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-tinta-2">{enCursoV ? "En curso" : "Siguiente visita"}</h2>
            {enCursoV ? (
              <Badge tono="info" icono={<Timer size={12} />}>
                <span className="tabular">{duracion(horasVisita(v, ahora))}</span>
              </Badge>
            ) : atraso && atraso > 0.25 ? (
              <Badge tono="aviso">Debía iniciar {hora(v.programadaInicio)}</Badge>
            ) : (
              <span className="text-sm font-semibold tabular">{hora(v.programadaInicio)} – {hora(v.programadaFin)}</span>
            )}
          </div>
          <p className="mt-2 text-xl leading-tight font-bold">{cliente.razonSocial}</p>
          <p className="mt-1 text-[15px] text-tinta-2">{v.descripcion}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-tinta-2">
            <Badge tono="neutro">{TIPO_LABEL[trabajo.tipo]}</Badge>
            <span>{equipo.nombre}</span>
          </p>
          {!enCursoV && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${cliente.lat},${cliente.lng}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-marca-700"
            >
              <Navigation size={16} /> Cómo llegar · <MapPin size={14} /> {cliente.direccion}
            </a>
          )}
        </div>
        <Link
          href={`/tecnico/visita/${v.id}`}
          className="flex min-h-14 items-center justify-center gap-2 bg-marca-800 text-base font-semibold text-white transition-colors hover:bg-marca-900 active:bg-marca-950"
        >
          {enCursoV ? (
            <>Continuar visita <ChevronRight size={20} /></>
          ) : (
            <><Play size={18} fill="currentColor" /> Abrir e iniciar</>
          )}
        </Link>
      </section>
    );
  }

  function Fila({ v, conFecha }: { v: Visita; conFecha?: boolean }) {
    const { cliente } = contexto(trabajos, v.trabajoId);
    return (
      <li>
        <Link href={`/tecnico/visita/${v.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-fondo active:bg-marca-50">
          <div className="w-14 shrink-0 text-sm font-semibold tabular">
            {conFecha && <span className="block text-xs font-medium text-tinta-3">{fechaCorta(v.programadaInicio)}</span>}
            {hora(v.checkinEn ?? v.programadaInicio)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{cliente.razonSocial}</p>
            <p className="truncate text-sm text-tinta-2">{v.descripcion}</p>
          </div>
          {v.estado === "finalizada" ? (
            <span className="text-sm text-tinta-2 tabular">{duracion(horasVisita(v, ahora))}</span>
          ) : (
            <EstadoVisitaBadge estado={v.estado} />
          )}
          <ChevronRight size={18} className="shrink-0 text-tinta-3" />
        </Link>
      </li>
    );
  }
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-sm font-semibold text-tinta-2">{titulo}</h2>
      <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">{children}</ul>
    </section>
  );
}
