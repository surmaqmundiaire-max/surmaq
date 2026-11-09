"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { cliente as getCliente, equipo as getEquipo, pedidoPor, perfil, puede } from "@/lib/selectors";
import { fechaCorta } from "@/lib/format";
import type { EstadoSolicitud } from "@/lib/types";
import { Badge, Vacio, cx } from "@/components/ui";
import { IconoTipo } from "@/components/visual";
import { EstadoSolicitudBadge } from "@/components/solicitud-estado";

export default function Solicitudes() {
  const s = useStore();
  const yo = perfil(s.usuarioActualId);
  const aprueba = puede(yo.rol, "aprobar_solicitudes");
  const [filtro, setFiltro] = useState<EstadoSolicitud | "todas">("ingresada");
  // El vendedor ve las suyas; el coordinador, las de sus ciudades; jefe y administrador, todas.
  const visibles = s.solicitudes.filter((x) =>
    yo.rol === "vendedor" ? x.vendedorId === yo.id : !yo.ciudadesACargo?.length || yo.ciudadesACargo.includes(x.dpto),
  );
  const lista = visibles.filter((x) => filtro === "todas" || x.estado === filtro).sort((a, b) => b.solicitadaEn.localeCompare(a.solicitadaEn));
  const cuenta = (e: EstadoSolicitud) => visibles.filter((x) => x.estado === e).length;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{yo.rol === "vendedor" ? "Mis solicitudes de visita" : "Solicitudes de visita técnica"}</h1>
          <p className="text-sm text-tinta-2">{aprueba ? "Revisa lo que piden vendedores y clientes (por el QR del equipo): aprueba y programa, cambia la hora o rechaza." : "Pide una visita técnica para tu cliente. Mantenimiento la revisa y la programa."}</p>
        </div>
        <Link href="/admin/solicitudes/nueva" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-marca-800 px-4 text-sm font-semibold text-white hover:bg-marca-900"><Plus size={17} /> Nueva solicitud</Link>
      </div>

      <div role="tablist" aria-label="Estado" className="flex flex-wrap gap-1 rounded-xl bg-fondo p-1">
        {([["ingresada", "Por revisar"], ["programada", "Programadas"], ["rechazada", "Rechazadas"], ["todas", "Todas"]] as const).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={filtro === k} onClick={() => setFiltro(k)}
            className={cx("flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold whitespace-nowrap", filtro === k ? "bg-superficie text-marca-900 shadow-sm" : "text-tinta-2")}>
            {l} {k !== "todas" && <span className="text-xs tabular opacity-70">{cuenta(k)}</span>}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <Vacio>{filtro === "ingresada" ? (aprueba ? "No hay solicitudes por revisar." : "No tienes solicitudes esperando revisión.") : "No hay solicitudes en este estado."}</Vacio>
      ) : (
        <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
          {lista.map((x) => {
            const c = getCliente(x.clienteId);
            const e = getEquipo(x.equipoId);
            const visita = x.trabajoId ? s.visitas.find((v) => v.trabajoId === x.trabajoId) : undefined;
            return (
              <li key={x.id}>
                <Link href={`/admin/solicitudes/${x.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-fondo">
                  <IconoTipo tipo={x.tipo} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 font-semibold">{c.razonSocial} <EstadoSolicitudBadge estado={x.estado} />{x.cambioHora && x.estado === "programada" && <Badge tono="info">Hora cambiada</Badge>}{x.origen === "cliente_qr" && <Badge tono="info">Cliente vía QR</Badge>}{x.urgente && x.estado === "ingresada" && <Badge tono="critico">Urgente</Badge>}</span>
                    <span className="block truncate text-sm text-tinta-2">Nº {x.numero} · {e?.nombre} · {x.descripcion}</span>
                    <span className="block text-xs text-tinta-3">
                      {x.estado === "programada" && visita
                        ? `Programada ${fechaCorta(visita.programadaInicio)} ${visita.programadaInicio.slice(11, 16)} · ${perfil(visita.tecnicoId).nombre}`
                        : `Requerida ${fechaCorta(x.fechaRequerida)} ${x.horaRequerida}`}
                      {yo.rol !== "vendedor" && ` · pedida por ${pedidoPor(x)}`} · Mant. {x.dpto}
                    </span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-tinta-3" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
