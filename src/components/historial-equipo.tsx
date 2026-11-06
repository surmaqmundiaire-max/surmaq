"use client";

import Link from "next/link";
import { CalendarClock, Camera, Plus, QrCode } from "lucide-react";
import { ChipTipo, IconoTipo, MiniaturaEquipo } from "./visual";
import { useStore } from "@/lib/store";
import { cliente as getCliente, equipo as getEquipo, perfil } from "@/lib/selectors";
import { diasEntre, fechaCorta, fechaLarga } from "@/lib/format";
import { EstadoTrabajoBadge, Vacio, cx } from "./ui";
import { LectorPlaca, SlotFoto, aplicarLectura } from "./fotos-equipo";
import { Migas, rutas } from "./migas";

/** Ficha del equipo con su historial: compartida entre técnico y administración. */
export function FichaEquipo({ id, base }: { id: string; base: "tecnico" | "admin" }) {
  const { trabajos, visitas, ahora, actualizarEquipo } = useStore();
  const e = getEquipo(id);
  const c = getCliente(e.clienteId);
  const hoy = ahora.slice(0, 10);
  const historial = trabajos.filter((t) => t.equipoId === id).sort((a, b) => b.fechaIngreso.localeCompare(a.fechaIngreso));
  const dias = e.proximoMantenimiento ? diasEntre(hoy, e.proximoMantenimiento) : undefined;

  const r = rutas(base);
  return (
    <div className="space-y-4">
      <Migas base={base} equipoId={id} />
      <section className="rounded-2xl border border-borde bg-superficie p-4">
        <div className="flex items-start justify-between gap-3">
          <MiniaturaEquipo linea={e.lineaProducto} foto={e.fotoUrl} size={56} />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl leading-tight font-bold">{e.nombre}</h1>
            <p className="mt-0.5 text-sm text-tinta-2">
              <Link className="text-marca-700 hover:underline" href={r.cliente(c.id)}>{c.razonSocial}</Link> · {c.ciudad}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-fondo px-2 py-1 text-xs font-semibold text-tinta-2" title="Código QR pegado en la máquina">
            <QrCode size={14} /> {e.codigoQr}
          </span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          {[
            ["Marca", e.marca],
            ["Modelo", e.modelo],
            ["Serie", e.serie],
            ["Año", e.anio ? String(e.anio) : "—"],
            ["Línea", e.lineaProducto],
            ["Horas de uso", e.horasUso ? e.horasUso.toLocaleString("es-EC") + " h" : "—"],
            ...([
              ["Potencia", e.datosPlaca?.potencia],
              ["Voltaje", e.datosPlaca?.voltaje],
              ["Frecuencia", e.datosPlaca?.frecuencia],
              ["Corriente", e.datosPlaca?.corriente],
              ["Presión máx.", e.datosPlaca?.presionMax],
              ["Caudal", e.datosPlaca?.caudal],
              ...(e.datosPlaca?.otros ?? []).map((o) => [o.etiqueta, o.valor]),
            ].filter(([, v]) => v) as [string, string][]),
          ].map(([k, val]) => (
            <div key={k}>
              <dt className="text-tinta-3">{k}</dt>
              <dd className="font-semibold tabular">{val}</dd>
            </div>
          ))}
        </dl>
      </section>

      {e.proximoMantenimiento && dias !== undefined && (
        <section className={cx("flex items-center gap-3 rounded-2xl p-4", dias < 0 ? "bg-critico-bg text-critico" : dias <= 14 ? "bg-aviso-bg text-aviso" : "bg-info-bg text-info")}>
          <CalendarClock size={22} className="shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">
              {dias < 0 ? `Mantenimiento vencido hace ${-dias} días` : dias === 0 ? "Mantenimiento programado para hoy" : `Próximo mantenimiento en ${dias} días`}
            </p>
            <p >{fechaLarga(e.proximoMantenimiento)}</p>
          </div>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <h2 className="text-lg font-semibold">Mantenimientos <span className="font-normal text-tinta-3 tabular">({historial.length})</span></h2>
          <Link href={r.nuevoMantenimiento(id)} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-marca-800 px-4 text-sm font-semibold text-white hover:bg-marca-900">
            <Plus size={17} /> Nuevo<span className="hidden sm:inline"> mantenimiento</span>
          </Link>
        </div>
        {historial.length === 0 ? (
          <Vacio>Este equipo aún no tiene mantenimientos registrados.</Vacio>
        ) : (
          <ol className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
            {historial.map((t) => {
              const nVis = visitas.filter((v) => v.trabajoId === t.id).length;
              const contenido = (
                <span className="flex items-start gap-3">
                  <IconoTipo tipo={t.tipo} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="font-semibold">{t.titulo}</span>
                      <EstadoTrabajoBadge estado={t.estado} />
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-tinta-2 tabular">
                      <ChipTipo tipo={t.tipo} /> <span>Nº {t.numero}</span>·<span>{fechaCorta(t.fechaIngreso)}</span>·
                      <span>{perfil(t.asignadoId).nombre}</span>·<span>{nVis} {nVis === 1 ? "tarea" : "tareas"}</span>
                    </span>
                    {t.estadoGeneralEquipo && <span className="mt-1 block text-sm">Estado del equipo: {t.estadoGeneralEquipo}</span>}
                  </span>
                </span>
              );
              return (
                <li key={t.id}>
                  <Link href={r.mantenimiento(t.id)} className="block px-4 py-3 hover:bg-fondo active:bg-marca-50">{contenido}</Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="rounded-2xl border border-borde bg-superficie p-4" aria-label="Fotos del equipo">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><Camera size={20} className="text-marca-700" /> Fotos y placa</h2>
        <div className="grid grid-cols-2 gap-3">
          <SlotFoto titulo="Equipo" url={e.fotoUrl} onFoto={(f) => actualizarEquipo(e.id, { fotoUrl: f })} />
          <SlotFoto titulo="Placa de datos" url={e.fotoPlacaUrl} ayuda="De frente y sin reflejos" onFoto={(f) => actualizarEquipo(e.id, { fotoPlacaUrl: f })} />
        </div>
        <LectorPlaca key={e.fotoPlacaUrl?.slice(-32)} foto={e.fotoPlacaUrl} onAplicar={(l) => actualizarEquipo(e.id, aplicarLectura(l))} />
      </section>

    </div>
  );
}
