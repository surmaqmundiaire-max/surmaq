"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardPlus, ListPlus, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { contexto, perfil, tecnicosProgramables } from "@/lib/selectors";
import { horasEntre } from "@/lib/format";
import { toLocalIso } from "@/lib/format";
import { FormMantenimiento, FormTarea, claseCampo } from "@/components/formularios";
import { norm } from "@/components/filtros";
import { Avatar, cx } from "@/components/ui";
import { ChipTipo, IconoTipo } from "@/components/visual";

function Contenido() {
  const s = useStore();
  const router = useRouter();
  const tecnicoParam = useSearchParams().get("tecnico") ?? "";
  const yo = perfil(s.usuarioActualId);
  const programables = tecnicosProgramables(yo);
  const [tecnico, setTecnico] = useState(tecnicoParam);
  const [modo, setModo] = useState<"nuevo" | "existente">("nuevo");
  const [q, setQ] = useState("");
  const [trabajoSel, setTrabajoSel] = useState("");

  // Carga de los próximos 7 días para decidir a quién asignar
  const hoy = s.ahora.slice(0, 10);
  const en7 = new Date(hoy + "T00:00:00");
  en7.setDate(en7.getDate() + 7);
  const hasta = toLocalIso(en7).slice(0, 10);
  const carga = programables.map((t) => {
    const vs = s.visitas.filter((v) => v.tecnicoId === t.id && v.estado === "programada" && v.programadaInicio.slice(0, 10) >= hoy && v.programadaInicio.slice(0, 10) <= hasta);
    return { t, tareas: vs.length, horas: vs.reduce((a, v) => a + horasEntre(v.programadaInicio, v.programadaFin), 0) };
  });
  const maxH = Math.max(8, ...carga.map((c) => c.horas));

  const abiertos = s.trabajos
    .filter((t) => t.estado !== "cerrado" && t.estado !== "cancelado")
    .map((t) => ({ t, ...contexto(s.trabajos, t.id) }))
    .filter(({ t, cliente, equipo }) => norm(`${t.numero} ${t.titulo} ${cliente.razonSocial} ${equipo.nombre}`).includes(norm(q)))
    .sort((a, b) => b.t.numero - a.t.numero);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Programar tareas</h1>
        <p className="text-sm text-tinta-2">Asigna trabajo a los técnicos. Ellos reciben el aviso en su celular.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] [&>*]:min-w-0">
        <div className="space-y-5">
          <div role="tablist" aria-label="Cómo programar" className="grid grid-cols-2 gap-1 rounded-xl bg-fondo p-1">
            {([["nuevo", "Nuevo mantenimiento", ClipboardPlus], ["existente", "En un mantenimiento abierto", ListPlus]] as const).map(([k, l, I]) => (
              <button key={k} type="button" role="tab" aria-selected={modo === k} onClick={() => setModo(k)}
                className={cx("flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 text-sm font-semibold", modo === k ? "bg-superficie text-marca-900 shadow-sm" : "text-tinta-2")}>
                <I size={17} /> <span className="truncate">{l}</span>
              </button>
            ))}
          </div>

          {modo === "nuevo" ? (
            <div className="rounded-2xl border border-borde bg-superficie p-4 sm:p-6">
              <FormMantenimiento key={tecnico} base="admin" tecnicoInicial={tecnico || undefined} onGuardado={(id) => router.push(`/admin/mantenimientos/${id}`)} />
            </div>
          ) : trabajoSel ? (
            <div className="rounded-2xl border border-borde bg-superficie p-4 sm:p-6">
              {(() => {
                const { t, cliente } = abiertos.find((x) => x.t.id === trabajoSel) ?? { t: s.trabajos.find((x) => x.id === trabajoSel)!, cliente: contexto(s.trabajos, trabajoSel).cliente };
                return (
                  <div className="mb-4 flex items-center gap-3">
                    <IconoTipo tipo={t.tipo} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">Nº {t.numero} · {t.titulo}</p>
                      <p className="truncate text-sm text-tinta-2">{cliente.razonSocial}</p>
                    </div>
                    <button type="button" onClick={() => setTrabajoSel("")} className="min-h-10 text-sm font-semibold text-marca-700">Cambiar</button>
                  </div>
                );
              })()}
              <FormTarea key={trabajoSel + tecnico} trabajoId={trabajoSel} base="admin" tecnicoInicial={tecnico || undefined} onGuardado={() => router.push(`/admin/mantenimientos/${trabajoSel}`)} />
            </div>
          ) : (
            <div className="rounded-2xl border border-borde bg-superficie p-4">
              <label className="relative block">
                <span className="sr-only">Buscar mantenimiento</span>
                <Search size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-tinta-3" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nº, empresa o equipo" className={cx(claseCampo, "mt-0 pl-10")} />
              </label>
              <ul className="mt-3 divide-y divide-borde overflow-hidden rounded-xl border border-borde">
                {abiertos.map(({ t, cliente, equipo }) => (
                  <li key={t.id}>
                    <button type="button" onClick={() => setTrabajoSel(t.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-fondo">
                      <IconoTipo tipo={t.tipo} size={34} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">Nº {t.numero} · {t.titulo}</span>
                        <span className="block truncate text-xs text-tinta-2">{cliente.razonSocial} · {equipo.nombre}</span>
                      </span>
                      <ChipTipo tipo={t.tipo} className="hidden sm:inline-flex" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside aria-label="Carga de los técnicos">
          <h2 className="mb-1 font-semibold">Carga próximos 7 días</h2>
          <p className="mb-3 text-sm text-tinta-2">Toca un técnico para asignarle la tarea.</p>
          <ul className="space-y-2">
            {carga.sort((a, b) => a.horas - b.horas).map(({ t, tareas, horas }) => (
              <li key={t.id}>
                <button type="button" aria-pressed={tecnico === t.id} onClick={() => setTecnico(t.id)}
                  className={cx("w-full rounded-xl border p-3 text-left transition-colors", tecnico === t.id ? "border-marca-800 bg-marca-50" : "border-borde bg-superficie hover:bg-fondo")}>
                  <span className="flex items-center gap-2">
                    <Avatar nombre={t.nombre} size={32} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{t.nombre}</span>
                      <span className="block text-xs text-tinta-2">{t.ciudad} · {tareas} {tareas === 1 ? "tarea" : "tareas"} · {horas.toFixed(0)} h</span>
                    </span>
                  </span>
                  <span className="mt-2 block h-1.5 rounded-full bg-fondo">
                    <span className={cx("block h-full rounded-full", horas > 32 ? "bg-aviso" : "bg-marca-700")} style={{ width: `${Math.min(100, (horas / maxH) * 100)}%` }} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

export default function Programar() {
  return <Suspense><Contenido /></Suspense>;
}
