"use client";

import Link from "next/link";
import { CalendarClock, QrCode } from "lucide-react";
import { useStore } from "@/lib/store";
import { cliente as getCliente, equipo as getEquipo, perfil } from "@/lib/selectors";
import { diasEntre, fechaCorta, fechaLarga } from "@/lib/format";
import { TIPO_LABEL } from "@/lib/mock-data";
import { Badge, EstadoTrabajoBadge, Vacio, cx } from "./ui";
import { LectorPlaca, SlotFoto, aplicarLectura } from "./fotos-equipo";

/** Ficha del equipo con su historial: compartida entre técnico y administración. */
export function FichaEquipo({ id, base }: { id: string; base: "tecnico" | "admin" }) {
  const { trabajos, visitas, ahora, actualizarEquipo } = useStore();
  const e = getEquipo(id);
  const c = getCliente(e.clienteId);
  const hoy = ahora.slice(0, 10);
  const historial = trabajos.filter((t) => t.equipoId === id).sort((a, b) => b.fechaIngreso.localeCompare(a.fechaIngreso));
  const dias = e.proximoMantenimiento ? diasEntre(hoy, e.proximoMantenimiento) : undefined;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-borde bg-superficie p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl leading-tight font-bold">{e.nombre}</h1>
            <p className="mt-0.5 text-sm text-tinta-2">
              {base === "admin" ? <Link className="text-marca-700 hover:underline" href={`/admin/clientes/${c.id}`}>{c.razonSocial}</Link> : c.razonSocial} · {c.ciudad}
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

      <section className="rounded-2xl border border-borde bg-superficie p-4" aria-label="Fotos del equipo">
        <div className="grid grid-cols-2 gap-3">
          <SlotFoto titulo="Equipo" url={e.fotoUrl} onFoto={(f) => actualizarEquipo(e.id, { fotoUrl: f })} />
          <SlotFoto titulo="Placa de datos" url={e.fotoPlacaUrl} ayuda="De frente y sin reflejos" onFoto={(f) => actualizarEquipo(e.id, { fotoPlacaUrl: f })} />
        </div>
        <LectorPlaca key={e.fotoPlacaUrl?.slice(-32)} foto={e.fotoPlacaUrl} onAplicar={(l) => actualizarEquipo(e.id, aplicarLectura(l))} />
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
        <h2 className="mb-2 px-1 text-sm font-semibold text-tinta-2">Historial de trabajos</h2>
        {historial.length === 0 ? (
          <Vacio>Este equipo aún no tiene trabajos registrados.</Vacio>
        ) : (
          <ol className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
            {historial.map((t) => {
              const nVis = visitas.filter((v) => v.trabajoId === t.id).length;
              const contenido = (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{t.titulo}</p>
                    <EstadoTrabajoBadge estado={t.estado} />
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-tinta-2 tabular">
                    <span>Nº {t.numero}</span>·<Badge>{TIPO_LABEL[t.tipo]}</Badge>·<span>{fechaCorta(t.fechaIngreso)}</span>·
                    <span>{perfil(t.asignadoId).nombre}</span>·<span>{nVis} {nVis === 1 ? "visita" : "visitas"}</span>
                  </p>
                  {t.estadoGeneralEquipo && <p className="mt-1 text-sm">Estado del equipo: {t.estadoGeneralEquipo}</p>}
                </>
              );
              return (
                <li key={t.id}>
                  {base === "admin" ? (
                    <Link href={`/admin/trabajos/${t.id}`} className="block px-4 py-3 hover:bg-fondo">{contenido}</Link>
                  ) : (
                    <div className="px-4 py-3">{contenido}</div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
