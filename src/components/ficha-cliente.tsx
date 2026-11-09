"use client";

import Link from "next/link";
import { ChevronRight, MapPin, Phone, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { perfil } from "@/lib/selectors";
import { diasEntre, fechaCorta } from "@/lib/format";
import { Badge, Vacio } from "./ui";
import { Migas, rutas, type Base } from "./migas";
import { MiniaturaEquipo } from "./visual";

/** Empresa con todos sus equipos. Compartida entre administración y técnico. */
export function FichaCliente({ id, base }: { id: string; base: Base }) {
  const { clientes, equipos, trabajos, ahora } = useStore();
  const c = clientes.find((x) => x.id === id);
  if (!c) return <Vacio>No se encontró la empresa.</Vacio>;
  const r = rutas(base);
  const eqs = equipos.filter((e) => e.clienteId === id);
  const hoy = ahora.slice(0, 10);
  const tieneUbic = c.lat !== 0 || c.lng !== 0;

  return (
    <div className="space-y-5">
      <Migas base={base} clienteId={id} />
      <header>
        <h1 className="text-2xl font-bold">{c.razonSocial}</h1>
        <p className="mt-1 text-sm text-tinta-2 tabular">{c.ruc ? `RUC ${c.ruc} · ` : ""}{c.industria} · {c.ciudad}</p>
      </header>
      <section className="grid gap-3 text-sm @xl:grid-cols-3">
        {tieneUbic ? (
          <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}`} className="flex min-h-14 items-center gap-2 rounded-2xl border border-borde bg-superficie px-4 font-medium text-marca-800 hover:bg-fondo">
            <MapPin size={18} className="shrink-0" /> <span className="truncate">{c.direccion || "Ver en el mapa"}</span>
          </a>
        ) : (
          <p className="flex min-h-14 items-center gap-2 rounded-2xl border border-dashed border-borde px-4 text-tinta-3"><MapPin size={18} /> {c.direccion || "Sin dirección"}</p>
        )}
        {c.contacto.telefono ? (
          <a href={`tel:${c.contacto.telefono}`} className="flex min-h-14 items-center gap-2 rounded-2xl border border-borde bg-superficie px-4 font-medium text-marca-800 hover:bg-fondo">
            <Phone size={18} className="shrink-0" /> <span className="truncate">{c.contacto.nombre} · {c.contacto.telefono}</span>
          </a>
        ) : (
          <p className="flex min-h-14 items-center gap-2 rounded-2xl border border-dashed border-borde px-4 text-tinta-3"><Phone size={18} /> Sin teléfono</p>
        )}
        <p className="flex min-h-14 items-center rounded-2xl border border-borde bg-superficie px-4">Responsable: <span className="ml-1 font-semibold">{perfil(c.responsableId)?.nombre ?? "—"}</span></p>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Equipos <span className="font-normal text-tinta-3 tabular">({eqs.length})</span></h2>
          <Link href={r.nuevoEquipo(id)} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-marca-800 px-4 text-sm font-semibold text-white hover:bg-marca-900">
            <Plus size={17} /> Agregar equipo
          </Link>
        </div>
        {eqs.length === 0 ? (
          <Vacio>Esta empresa aún no tiene equipos. Agrega el primero con una foto de su placa.</Vacio>
        ) : (
          <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
            {eqs.map((e) => {
              const d = e.proximoMantenimiento ? diasEntre(hoy, e.proximoMantenimiento) : undefined;
              const mts = trabajos.filter((t) => t.equipoId === e.id);
              const abiertos = mts.filter((t) => t.estado !== "cerrado" && t.estado !== "cancelado").length;
              const ultimo = [...mts].sort((a, b) => b.fechaIngreso.localeCompare(a.fechaIngreso))[0];
              return (
                <li key={e.id}>
                  <Link href={r.equipo(e.id)} className="flex items-center gap-3 px-4 py-3 hover:bg-fondo active:bg-marca-50">
                    <MiniaturaEquipo linea={e.lineaProducto} foto={e.fotoUrl} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{e.nombre}</span>
                      <span className="block text-sm text-tinta-2">{e.marca} {e.modelo} · {mts.length} mant.{ultimo ? ` · último ${fechaCorta(ultimo.fechaIngreso)}` : ""}</span>
                      <span className="mt-1 flex flex-wrap gap-1.5">
                        {abiertos > 0 && <Badge tono="info">{abiertos} en curso</Badge>}
                        {d !== undefined && (d < 0 ? <Badge tono="critico">Vencido hace {-d} días</Badge> : <Badge tono={d <= 14 ? "aviso" : "neutro"}>Próximo en {d} días</Badge>)}
                      </span>
                    </span>
                    <ChevronRight size={18} className="shrink-0 text-tinta-3" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
