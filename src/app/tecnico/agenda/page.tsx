"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { Calendario, useEventos } from "@/components/calendario";

export default function AgendaTecnico() {
  const { tecnicoActualId, clientes, equipos } = useStore();
  // Mantenimientos por fecha de los equipos de las empresas a su cargo
  const misEquipos = useMemo(() => {
    const mios = new Set(clientes.filter((c) => c.responsableId === tecnicoActualId).map((c) => c.id));
    return new Set(equipos.filter((e) => mios.has(e.clienteId)).map((e) => e.id));
  }, [clientes, equipos, tecnicoActualId]);
  const eventos = useEventos({ base: "tecnico", tecnicoId: tecnicoActualId, equiposDeClientes: misEquipos });
  return (
    <div>
      <header className="bg-marca-900 px-4 pt-4 pb-5 text-white">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <p className="mt-1 text-sm text-marca-100">Tus tareas y los mantenimientos que les tocan a tus equipos.</p>
      </header>
      <div className="px-3 py-4">
        <Calendario eventos={eventos} compacto />
      </div>
    </div>
  );
}
