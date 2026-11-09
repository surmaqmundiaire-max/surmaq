"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, Plus, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { perfil, puede, tecnicos } from "@/lib/selectors";
import { Calendario, useEventos } from "@/components/calendario";
import { SemanaDisponibilidad } from "@/components/disponibilidad";
import { Selector } from "@/components/filtros";
import { cx } from "@/components/ui";
import { Proximos } from "./proximos";

function Contenido() {
  const s = useStore();
  const yo = perfil(s.usuarioActualId);
  const programa = puede(yo.rol, "programar_tareas");
  const esVendedor = !puede(yo.rol, "ver_panel");
  const [vista, setVista] = useState<"calendario" | "disponibilidad">(useSearchParams().get("vista") === "disponibilidad" || esVendedor ? "disponibilidad" : "calendario");
  const [tec, setTec] = useState("");
  const [ciudad, setCiudad] = useState(yo.ciudadesACargo?.length === 1 ? yo.ciudadesACargo[0] : esVendedor ? yo.ciudad : "");
  const eventos = useEventos({ base: "admin", tecnicoId: tec || undefined, ciudad: ciudad || undefined, sinEnlaces: esVendedor });
  const ciudades = [...new Set(tecnicos().map((t) => t.ciudad))];
  const enlace = (tecnicoId: string, fecha: string) =>
    programa ? `/admin/programar?tecnico=${tecnicoId}` : `/admin/solicitudes/nueva?tecnico=${tecnicoId}&fecha=${fecha}`;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Calendario</h1>
        {programa ? (
          <Link href="/admin/programar" className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-marca-800 px-4 text-sm font-semibold text-white hover:bg-marca-900"><Plus size={17} /> Programar tarea</Link>
        ) : (
          <Link href="/admin/solicitudes/nueva" className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-marca-800 px-4 text-sm font-semibold text-white hover:bg-marca-900"><Plus size={17} /> Solicitar visita</Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Vista" className="flex gap-1 rounded-xl bg-fondo p-1">
          {([["disponibilidad", "Disponibilidad de técnicos", Users], ["calendario", "Calendario del mes", CalendarDays]] as const).map(([k, l, I]) => (
            <button key={k} type="button" role="tab" aria-selected={vista === k} onClick={() => setVista(k)}
              className={cx("flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold", vista === k ? "bg-superficie text-marca-900 shadow-sm" : "text-tinta-2")}>
              <I size={16} /> {l}
            </button>
          ))}
        </div>
        {vista === "calendario" && <Selector etiqueta="Técnico" valor={tec} onChange={setTec} opciones={[["", "Todos"], ...tecnicos().map((t) => [t.id, t.nombre] as [string, string])]} />}
        <Selector etiqueta="Ciudad" valor={ciudad} onChange={setCiudad} opciones={[["", "Todas"], ...ciudades.map((c) => [c, c] as [string, string])]} />
      </div>

      {vista === "disponibilidad" ? (
        <>
          <p className="text-sm text-tinta-2">
            Barra verde = libre, azul = con tarea, gris = permiso o vacaciones (de 7h a 19h). {programa ? "Toca un día para programar a ese técnico." : "Toca un día libre para pedir la visita con ese técnico."}
          </p>
          <SemanaDisponibilidad ciudad={ciudad || undefined} enlace={enlace} />
        </>
      ) : (
        <Calendario eventos={eventos} />
      )}

      {!esVendedor && (
        <section>
          <h2 className="mb-1 text-lg font-semibold">Equipos por fecha de mantenimiento</h2>
          <p className="mb-3 text-sm text-tinta-2">Los vencidos son servicio pendiente y una oportunidad de venta.</p>
          <Proximos />
        </section>
      )}
    </div>
  );
}

export default function CalendarioAdmin() {
  return <Suspense><Contenido /></Suspense>;
}
