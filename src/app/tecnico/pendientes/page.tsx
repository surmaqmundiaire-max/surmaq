"use client";

import { Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { contexto } from "@/lib/selectors";
import { fechaCorta } from "@/lib/format";
import { Vacio, cx } from "@/components/ui";
import { useAviso } from "@/components/aviso";

export default function PendientesTecnico() {
  const { pendientes, trabajos, tecnicoActualId, resolverPendiente } = useStore();
  const aviso = useAviso();
  const mios = new Set(trabajos.filter((t) => t.asignadoId === tecnicoActualId).map((t) => t.id));
  const lista = pendientes.filter((p) => mios.has(p.trabajoId)).sort((a, b) => Number(!!a.resueltoEn) - Number(!!b.resueltoEn));
  return (
    <div>
      <header className="bg-marca-900 px-4 pt-4 pb-5 text-white">
        <h1 className="text-2xl font-bold">Pendientes</h1>
        <p className="mt-1 text-sm text-marca-100">De tus trabajos. Toca para marcar como resuelto.</p>
      </header>
      <div className="px-4 py-4">
        {lista.length === 0 ? (
          <Vacio>No tienes pendientes. Los que registres al cerrar una tarea aparecerán aquí.</Vacio>
        ) : (
          <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
            {lista.map((p) => {
              const { cliente, trabajo } = contexto(trabajos, p.trabajoId);
              const ok = !!p.resueltoEn;
              return (
                <li key={p.id}>
                  <button type="button" role="checkbox" aria-checked={ok} onClick={() => { resolverPendiente(p.id); aviso(ok ? "Pendiente reabierto" : "Pendiente resuelto", { texto: "Deshacer", onClick: () => resolverPendiente(p.id) }); }} className="flex min-h-16 w-full items-start gap-3 px-4 py-3 text-left active:bg-marca-50">
                    <span className={cx("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2", ok ? "border-ok bg-ok text-white" : "border-tinta-3/50")}>
                      {ok && <Check size={16} strokeWidth={3} />}
                    </span>
                    <span className="min-w-0">
                      <span className={cx("block font-semibold", ok && "text-tinta-3 line-through")}>{p.descripcion}</span>
                      <span className="block text-sm text-tinta-2">
                        {cliente.razonSocial} · Nº {trabajo.numero} · {fechaCorta(p.creadoEn)} · {p.responsable === "cliente" ? "cliente" : "Surmaq"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
