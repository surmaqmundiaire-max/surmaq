"use client";

import Link from "next/link";
import { use } from "react";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { clientes, equipos } from "@/lib/mock-data";
import { perfil } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { diasEntre, fechaCorta } from "@/lib/format";
import { Badge } from "@/components/ui";

export default function ClienteDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { ahora, trabajos } = useStore();
  const c = clientes.find((x) => x.id === id);
  if (!c) return <p>No se encontró el cliente.</p>;
  const eqs = equipos.filter((e) => e.clienteId === id);
  const hoy = ahora.slice(0, 10);
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/admin/clientes" className="inline-flex items-center gap-1 text-sm font-semibold text-marca-700 hover:underline"><ArrowLeft size={16} /> Clientes</Link>
      <header>
        <h1 className="text-2xl font-bold">{c.razonSocial}</h1>
        <p className="mt-1 text-tinta-2 tabular">RUC {c.ruc} · {c.industria} · {c.recurrente ? "Cliente recurrente" : "No recurrente"}</p>
      </header>
      <section className="grid gap-4 rounded-2xl border border-borde bg-superficie p-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-tinta-3">Dirección</p>
          <a className="inline-flex items-start gap-1 font-semibold text-marca-700 hover:underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}`}>
            <MapPin size={15} className="mt-0.5 shrink-0" /> {c.direccion}, {c.ciudad}
          </a>
        </div>
        <div>
          <p className="text-tinta-3">Contacto</p>
          <p className="font-semibold">{c.contacto.nombre}</p>
          <p className="flex flex-wrap gap-x-3">
            <a href={`tel:${c.contacto.telefono}`} className="inline-flex items-center gap-1 text-marca-700 hover:underline"><Phone size={14} /> {c.contacto.telefono}</a>
            {c.contacto.correo && <a href={`mailto:${c.contacto.correo}`} className="inline-flex items-center gap-1 text-marca-700 hover:underline"><Mail size={14} /> Correo</a>}
          </p>
        </div>
        <div>
          <p className="text-tinta-3">Responsable Surmaq</p>
          <p className="font-semibold">{perfil(c.responsableId).nombre}</p>
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold">Equipos <span className="font-normal text-tinta-3 tabular">({eqs.length})</span></h2>
        <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
          {eqs.map((e) => {
            const d = e.proximoMantenimiento ? diasEntre(hoy, e.proximoMantenimiento) : undefined;
            const ultimo = trabajos.filter((t) => t.equipoId === e.id).sort((a, b) => b.fechaIngreso.localeCompare(a.fechaIngreso))[0];
            return (
              <li key={e.id}>
                <Link href={`/admin/equipos/${e.id}`} className="grid gap-1 px-4 py-3 hover:bg-fondo sm:grid-cols-[1fr_200px_180px] sm:items-center">
                  <span>
                    <span className="block font-semibold">{e.nombre}</span>
                    <span className="block text-sm text-tinta-2">{e.marca} {e.modelo} · serie {e.serie}</span>
                  </span>
                  <span className="text-sm text-tinta-2">{ultimo ? `Último: ${fechaCorta(ultimo.fechaIngreso)} · Nº ${ultimo.numero}` : "Sin trabajos"}</span>
                  <span className="sm:text-right">
                    {d === undefined ? (
                      <span className="text-sm text-tinta-3">Sin mantenimiento programado</span>
                    ) : d < 0 ? (
                      <Badge tono="critico">Vencido hace {-d} días</Badge>
                    ) : (
                      <Badge tono={d <= 14 ? "aviso" : "neutro"}>Mantenimiento en {d} días</Badge>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
