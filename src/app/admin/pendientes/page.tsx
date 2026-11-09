"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { contexto, perfil } from "@/lib/selectors";
import { diasEntre, fechaCorta } from "@/lib/format";
import { Vacio, cx } from "@/components/ui";
import { useAviso } from "@/components/aviso";
import { ChipResponsable } from "@/components/visual";
import { Selector } from "@/components/filtros";

export default function Pendientes() {
  const s = useStore();
  const aviso = useAviso();
  const [resp, setResp] = useState("todos");
  const [ver, setVer] = useState("abiertos");
  const hoy = s.ahora.slice(0, 10);
  const lista = s.pendientes
    .filter((p) => (resp === "todos" || p.responsable === resp) && (ver === "todos" || !p.resueltoEn))
    .sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold">Pendientes</h1>
      <p className="mt-1 text-sm text-tinta-2">Lo que los técnicos dejaron registrado al cerrar visitas. Los más antiguos primero.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Selector etiqueta="Responsable" valor={resp} onChange={setResp} opciones={[["todos", "Todos"], ["cliente", "Cliente"], ["surmaq", "Surmaq"]]} />
        <Selector etiqueta="Mostrar" valor={ver} onChange={setVer} opciones={[["abiertos", "Sin resolver"], ["todos", "Todos"]]} />
      </div>
      <div className="mt-4">
        {lista.length === 0 ? (
          <Vacio>No hay pendientes con estos filtros.</Vacio>
        ) : (
          <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
            {lista.map((p) => {
              const { trabajo, cliente } = contexto(s.trabajos, p.trabajoId);
              const dias = diasEntre(p.creadoEn, hoy);
              return (
                <li key={p.id} className="flex flex-wrap items-start gap-x-3 gap-y-1.5 px-4 py-3 @lg:flex-nowrap @lg:items-center">
                  <button type="button" role="checkbox" aria-checked={!!p.resueltoEn} aria-label={`Marcar «${p.descripcion}» como resuelto`} onClick={() => { s.resolverPendiente(p.id); aviso(p.resueltoEn ? "Pendiente reabierto" : "Pendiente resuelto", { texto: "Deshacer", onClick: () => s.resolverPendiente(p.id) }); }}
                    className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2", p.resueltoEn ? "border-ok bg-ok text-white" : "border-tinta-3/50 hover:border-marca-700")}>
                    {p.resueltoEn && <Check size={15} strokeWidth={3} />}
                  </button>
                  <div className="min-w-0 flex-1 basis-[calc(100%-2.5rem)] @lg:basis-auto">
                    <p className={cx("font-semibold break-words", p.resueltoEn && "text-tinta-3 line-through")}>{p.descripcion}</p>
                    <p className="text-sm text-tinta-2">
                      <Link href={`/admin/mantenimientos/${trabajo.id}`} className="text-marca-700 hover:underline">Nº {trabajo.numero}</Link> · {cliente.razonSocial} · {perfil(trabajo.asignadoId).nombre}
                    </p>
                  </div>
                  <div className="flex w-full items-center gap-3 pl-10 @lg:w-auto @lg:pl-0">
                  <ChipResponsable responsable={p.responsable} />
                  <span className={cx("text-xs tabular @lg:w-24 @lg:text-right", !p.resueltoEn && dias >= 3 ? "font-semibold text-aviso" : "text-tinta-3")}>
                    {p.resueltoEn ? `Resuelto ${fechaCorta(p.resueltoEn)}` : dias === 0 ? "Hoy" : `Hace ${dias} días`}
                  </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
