"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { cliente as getCliente, equipo as getEquipo } from "@/lib/selectors";

export type Base = "admin" | "tecnico";

export const rutas = (base: Base) => ({
  cliente: (id: string) => `/${base}/clientes/${id}`,
  equipo: (id: string) => `/${base}/equipos/${id}`,
  mantenimiento: (id: string) => `/${base}/mantenimientos/${id}`,
  tarea: (id: string) => (base === "tecnico" ? `/tecnico/visita/${id}` : `/admin/mantenimientos/`),
  nuevoEquipo: (clienteId: string) => `/${base}/equipos/nuevo?cliente=${clienteId}`,
  nuevoMantenimiento: (equipoId: string) => `/${base}/mantenimientos/nuevo?equipo=${equipoId}`,
});

/** Ruta de navegación Empresa › Equipo › Mantenimiento, para saber siempre dónde está uno. */
export function Migas({ base, clienteId, equipoId, trabajoId, oscuro }: { base: Base; clienteId?: string; equipoId?: string; trabajoId?: string; oscuro?: boolean }) {
  const { trabajos } = useStore();
  const r = rutas(base);
  const t = trabajoId ? trabajos.find((x) => x.id === trabajoId) : undefined;
  const eId = equipoId ?? t?.equipoId;
  const e = eId ? getEquipo(eId) : undefined;
  const cId = clienteId ?? e?.clienteId;
  const c = cId ? getCliente(cId) : undefined;
  const items: [string, string][] = [[base === "admin" ? "/admin/clientes" : "/tecnico/clientes", "Clientes"]];
  if (c) items.push([r.cliente(c.id), c.razonSocial]);
  if (e) items.push([r.equipo(e.id), e.nombre]);
  if (t) items.push([r.mantenimiento(t.id), `Mant. Nº ${t.numero}`]);
  return (
    <nav aria-label="Ubicación" className={oscuro ? "text-marca-100" : "text-tinta-2"}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm">
        {items.map(([href, label], i) => (
          <li key={href} className="flex min-w-0 items-center gap-1">
            {i > 0 && <ChevronRight size={14} className="shrink-0 opacity-60" />}
            <Link href={href} className={`max-w-[14rem] truncate hover:underline ${oscuro ? "hover:text-white" : "hover:text-marca-700"}`}>{label}</Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
