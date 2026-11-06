"use client";

import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { cliente, perfil } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { diasEntre, fechaLarga } from "@/lib/format";
import { Badge } from "@/components/ui";

/** Equipos ordenados por la fecha en que les toca mantenimiento. */
export function Proximos() {
  const { ahora, equipos } = useStore();
  const hoy = ahora.slice(0, 10);
  const lista = equipos
    .filter((e) => e.proximoMantenimiento)
    .map((e) => ({ e, d: diasEntre(hoy, e.proximoMantenimiento!) }))
    .sort((a, b) => a.d - b.d);
  const grupos: [string, typeof lista][] = [
    ["Vencidos", lista.filter((x) => x.d < 0)],
    ["Próximos 30 días", lista.filter((x) => x.d >= 0 && x.d <= 30)],
    ["Más adelante", lista.filter((x) => x.d > 30)],
  ];
  return (
    <div className="space-y-6">
      {grupos.map(([titulo, items]) =>
        items.length ? (
          <section key={titulo}>
            <h2 className="mb-2 font-semibold">{titulo} <span className="font-normal text-tinta-3 tabular">({items.length})</span></h2>
            <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
              {items.map(({ e, d }) => {
                const c = cliente(e.clienteId);
                return (
                  <li key={e.id}>
                    <Link href={`/admin/equipos/${e.id}`} className="grid gap-1 px-4 py-3 hover:bg-fondo sm:grid-cols-[1fr_220px_170px] sm:items-center">
                      <span>
                        <span className="block font-semibold">{e.nombre}</span>
                        <span className="block text-sm text-tinta-2">{c.razonSocial} · {c.ciudad} · resp. {perfil(c.responsableId).nombre}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sm"><CalendarClock size={15} className="text-tinta-3" />{fechaLarga(e.proximoMantenimiento)}</span>
                      <span className="sm:text-right">
                        {d < 0 ? <Badge tono="critico">Vencido hace {-d} días</Badge> : d === 0 ? <Badge tono="aviso">Hoy</Badge> : <Badge tono={d <= 14 ? "aviso" : "neutro"}>En {d} días</Badge>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null,
      )}
    </div>
  );
}
