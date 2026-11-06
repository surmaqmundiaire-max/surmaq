"use client";

import Link from "next/link";
import { use } from "react";
import { ArrowLeft, Camera, Car, Check, MapPin, PenLine, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { avanceTrabajo, contexto, horasVisita, perfil, UMBRAL_DISTANCIA_M } from "@/lib/selectors";
import { duracion, fechaCorta, fechaLarga, hora, metros } from "@/lib/format";
import { TIPO_LABEL } from "@/lib/mock-data";
import { Avatar, Badge, Barra, EstadoTrabajoBadge, EstadoVisitaBadge, Vacio, cx } from "@/components/ui";

export default function TrabajoDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const s = useStore();
  const t = s.trabajos.find((x) => x.id === id);
  if (!t) return <p>No se encontró el trabajo.</p>;
  const { equipo, cliente } = contexto(s.trabajos, id);
  const vis = s.visitas.filter((v) => v.trabajoId === id).sort((a, b) => b.programadaInicio.localeCompare(a.programadaInicio));
  const pend = s.pendientes.filter((p) => p.trabajoId === id);
  const horas = vis.reduce((a, v) => a + (v.checkoutEn ? horasVisita(v, s.ahora) : 0), 0);
  const av = avanceTrabajo(t, s.visitas);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/admin/trabajos" className="inline-flex items-center gap-1 text-sm font-semibold text-marca-700 hover:underline"><ArrowLeft size={16} /> Trabajos</Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-tinta-2 tabular">Trabajo Nº {t.numero}</p>
          <h1 className="text-2xl font-bold">{t.titulo}</h1>
          <p className="mt-1 text-tinta-2">
            <Link href={`/admin/clientes/${cliente.id}`} className="font-medium text-marca-700 hover:underline">{cliente.razonSocial}</Link>
            {" · "}
            <Link href={`/admin/equipos/${equipo.id}`} className="font-medium text-marca-700 hover:underline">{equipo.nombre}</Link>
          </p>
        </div>
        <EstadoTrabajoBadge estado={t.estado} />
      </header>

      <section className="grid gap-4 rounded-2xl border border-borde bg-superficie p-4 text-sm sm:grid-cols-3 lg:grid-cols-6">
        <Dato k="Tipo" v={TIPO_LABEL[t.tipo]} />
        <Dato k="Técnico" v={perfil(t.asignadoId).nombre} />
        <Dato k="Ingreso" v={fechaCorta(t.fechaIngreso)} />
        <Dato k="Cierre" v={t.fechaCierre ? fechaCorta(t.fechaCierre) : "—"} />
        <Dato k="Horas totales" v={duracion(horas)} />
        <div>
          <dt className="text-tinta-3">Avance</dt>
          <dd className="mt-1 flex items-center gap-2"><Barra valor={av} /><span className="font-semibold tabular">{av}%</span></dd>
        </div>
        {t.estadoGeneralEquipo && <div className="sm:col-span-3 lg:col-span-6"><Dato k="Estado general del equipo" v={t.estadoGeneralEquipo} /></div>}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Pendientes <span className="font-normal text-tinta-3 tabular">({pend.filter((p) => !p.resueltoEn).length} abiertos)</span></h2>
        {pend.length === 0 ? (
          <Vacio>Sin pendientes registrados.</Vacio>
        ) : (
          <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
            {pend.map((p) => (
              <li key={p.id}>
                <button type="button" role="checkbox" aria-checked={!!p.resueltoEn} onClick={() => s.resolverPendiente(p.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-fondo">
                  <span className={cx("flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2", p.resueltoEn ? "border-ok bg-ok text-white" : "border-tinta-3/50")}>
                    {p.resueltoEn && <Check size={14} strokeWidth={3} />}
                  </span>
                  <span className={cx("flex-1", p.resueltoEn && "text-tinta-3 line-through")}>{p.descripcion}</span>
                  <Badge tono={p.responsable === "cliente" ? "aviso" : "info"}>{p.responsable === "cliente" ? "Cliente" : "Surmaq"}</Badge>
                  <span className="w-16 text-right text-xs text-tinta-3 tabular">{fechaCorta(p.creadoEn)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Visitas <span className="font-normal text-tinta-3 tabular">({vis.length})</span></h2>
        <ol className="space-y-3">
          {vis.map((v) => {
            const lejos = (v.checkinDistanciaM ?? 0) > UMBRAL_DISTANCIA_M;
            const items = Object.values(v.checklist);
            return (
              <li key={v.id} className="rounded-2xl border border-borde bg-superficie p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar nombre={perfil(v.tecnicoId).nombre} size={32} />
                    <div>
                      <p className="font-semibold">{v.descripcion}</p>
                      <p className="text-sm text-tinta-2">{fechaLarga(v.programadaInicio)}</p>
                    </div>
                  </div>
                  <EstadoVisitaBadge estado={v.estado} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <Dato k="Programada" v={`${hora(v.programadaInicio)} – ${hora(v.programadaFin)}`} />
                  <Dato k="Real" v={v.checkinEn ? `${hora(v.checkinEn)} – ${v.checkoutEn ? hora(v.checkoutEn) : "en curso"}` : "—"} />
                  <Dato k="Horas" v={v.checkinEn ? duracion(horasVisita(v, s.ahora)) : "—"} />
                  <div>
                    <dt className="text-tinta-3">Ubicación al iniciar</dt>
                    <dd className={cx("inline-flex items-center gap-1 font-semibold tabular", lejos && "text-aviso")}>
                      <MapPin size={14} /> {v.checkinEn ? `${metros(v.checkinDistanciaM)} del cliente` : "—"}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 flex flex-wrap gap-2 text-xs">
                  {items.length > 0 && <Badge icono={<Check size={12} />}>Checklist {items.filter(Boolean).length}/{items.length}</Badge>}
                  <Badge icono={<Camera size={12} />}>{v.fotos.length} fotos</Badge>
                  {v.autoEmpresa && <Badge icono={<Car size={12} />}>Auto de la empresa</Badge>}
                  {v.acompanantes.length > 0 && <Badge icono={<Users size={12} />}>Con {v.acompanantes.map((a) => perfil(a).nombre.split(" ")[0]).join(", ")}</Badge>}
                  {v.firmadoPor && v.estado === "finalizada" && <Badge icono={<PenLine size={12} />}>Recibió {v.firmadoPor}</Badge>}
                </p>
                {v.comentarios && <p className="mt-3 rounded-lg bg-fondo px-3 py-2 text-sm">«{v.comentarios}»</p>}
                {v.informe && (
                  <details className="mt-2 text-sm">
                    <summary className="cursor-pointer font-semibold text-marca-700">Ver informe interno</summary>
                    <p className="mt-1 leading-relaxed">{v.informe}</p>
                  </details>
                )}
                {v.fotos.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {v.fotos.map((f, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={f.url} alt={`Foto ${f.momento}`} className="h-20 w-20 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-tinta-3">{k}</dt>
      <dd className="font-semibold tabular">{v}</dd>
    </div>
  );
}
