"use client";

// Estado de la maqueta en memoria (+ localStorage). Cuando conectemos Supabase,
// estas acciones se reemplazan por llamadas a la base de datos.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as mock from "./mock-data";
import type { Cliente, Equipo, Pendiente, Perfil, Trabajo, Visita } from "./types";
import { registro } from "./selectors";
import { toLocalIso } from "./format";

interface Estado {
  visitas: Visita[];
  pendientes: Pendiente[];
  trabajos: Trabajo[];
  equipos: Equipo[];
  clientes: Cliente[];
  perfiles: Perfil[];
  tecnicoActualId: string;
  /** Usuario con sesión iniciada en el panel (administrador, jefe o coordinador) */
  usuarioActualId: string;
}

const inicial = (): Estado => ({
  visitas: mock.visitas,
  pendientes: mock.pendientes,
  trabajos: mock.trabajos,
  equipos: mock.equipos,
  clientes: mock.clientes,
  perfiles: mock.perfiles,
  tecnicoActualId: "u-hchicazawa",
  usuarioActualId: "u-admin",
});

const KEY = "optimum-maqueta-v4";

function useAcciones(set: React.Dispatch<React.SetStateAction<Estado>>, ahora: () => string) {
  const patchVisita = useCallback(
    (id: string, cambios: Partial<Visita> | ((v: Visita) => Partial<Visita>)) =>
      set((s) => ({
        ...s,
        visitas: s.visitas.map((v) => (v.id === id ? { ...v, ...(typeof cambios === "function" ? cambios(v) : cambios) } : v)),
      })),
    [set],
  );

  return useMemo(
    () => ({
      setTecnicoActual: (id: string) => set((s) => ({ ...s, tecnicoActualId: id })),
      setUsuarioActual: (id: string) => set((s) => ({ ...s, usuarioActualId: id })),
      agregarPerfil: (p: Omit<Perfil, "id">) => {
        const id = `u-${Date.now()}`;
        set((s) => ({ ...s, perfiles: [...s.perfiles, { ...p, id, activo: true }] }));
        return id;
      },
      actualizarPerfil: (id: string, cambios: Partial<Perfil>) =>
        set((s) => ({ ...s, perfiles: s.perfiles.map((p) => (p.id === id ? { ...p, ...cambios } : p)) })),
      marcarVista: (id: string) => patchVisita(id, { vistaPorTecnico: true }),
      iniciarVisita: (id: string, distanciaM: number) =>
        patchVisita(id, { estado: "en_curso", checkinEn: ahora(), checkinDistanciaM: distanciaM }),
      /** Deshace una entrada marcada por error (vuelve a «programada»). */
      deshacerEntrada: (id: string) =>
        patchVisita(id, { estado: "programada", checkinEn: undefined, checkinDistanciaM: undefined }),
      finalizarVisita: (id: string) =>
        set((s) => {
          const v = s.visitas.find((x) => x.id === id)!;
          return {
            ...s,
            visitas: s.visitas.map((x) => (x.id === id ? { ...x, estado: "finalizada", checkoutEn: ahora() } : x)),
            trabajos: s.trabajos.map((t) => (t.id === v.trabajoId && t.estado === "abierto" ? { ...t, estado: "en_progreso" } : t)),
          };
        }),
      toggleChecklist: (id: string, item: string) =>
        patchVisita(id, (v) => ({ checklist: { ...v.checklist, [item]: !v.checklist[item] } })),
      setChecklistTodo: (id: string, valor: boolean) =>
        patchVisita(id, (v) => ({ checklist: Object.fromEntries(Object.keys(v.checklist).map((k) => [k, valor])) })),
      actualizarVisita: patchVisita,
      agregarFoto: (id: string, url: string, momento: "antes" | "despues") =>
        patchVisita(id, (v) => ({ fotos: [...v.fotos, { url, momento }] })),
      quitarFoto: (id: string, idx: number) => patchVisita(id, (v) => ({ fotos: v.fotos.filter((_, i) => i !== idx) })),
      agregarCliente: (c: Omit<Cliente, "id">) => {
        const id = `c-${Date.now()}`;
        set((s) => ({ ...s, clientes: [...s.clientes, { ...c, id }] }));
        return id;
      },
      /** Crea un mantenimiento (trabajo) con el siguiente número correlativo. */
      agregarTrabajo: (t: Omit<Trabajo, "id" | "numero">) => {
        const id = `t-${Date.now()}`;
        set((s) => ({ ...s, trabajos: [...s.trabajos, { ...t, id, numero: Math.max(0, ...s.trabajos.map((x) => x.numero)) + 1 }] }));
        return id;
      },
      /** Registra una salida olvidada con la hora que indica el técnico (queda marcada como corregida). */
      registrarSalidaOlvidada: (id: string, salida: string) =>
        patchVisita(id, { estado: "finalizada", checkoutEn: salida, salidaCorregida: true }),
      agregarEquipo: (e: Omit<Equipo, "id" | "codigoQr">) => {
        const id = `e-${Date.now()}`;
        set((s) => ({ ...s, equipos: [...s.equipos, { ...e, id, codigoQr: `OS-${id.slice(-5).toUpperCase()}` }] }));
        return id;
      },
      actualizarEquipo: (id: string, cambios: Partial<Equipo>) =>
        set((s) => ({ ...s, equipos: s.equipos.map((e) => (e.id === id ? { ...e, ...cambios } : e)) })),
      agregarVisita: (v: Omit<Visita, "id">) => {
        const id = `v-${Date.now()}`;
        set((s) => ({ ...s, visitas: [...s.visitas, { ...v, id }] }));
        return id;
      },
      agregarPendiente: (p: Omit<Pendiente, "id" | "creadoEn">) => {
        const id = `p-${Date.now()}`;
        set((s) => ({ ...s, pendientes: [...s.pendientes, { ...p, id, creadoEn: ahora() }] }));
        return id;
      },
      quitarPendiente: (id: string) => set((s) => ({ ...s, pendientes: s.pendientes.filter((p) => p.id !== id) })),
      resolverPendiente: (id: string) =>
        set((s) => ({ ...s, pendientes: s.pendientes.map((p) => (p.id === id ? { ...p, resueltoEn: p.resueltoEn ? undefined : ahora() } : p)) })),
      cerrarTrabajo: (id: string, estadoGeneral: string) =>
        set((s) => ({
          ...s,
          trabajos: s.trabajos.map((t) => (t.id === id ? { ...t, estado: "cerrado", fechaCierre: ahora(), estadoGeneralEquipo: estadoGeneral } : t)),
        })),
      reiniciar: () => {
        try {
          localStorage.removeItem(KEY);
        } catch {}
        set(inicial());
      },
    }),
    [set, patchVisita, ahora],
  );
}

type Ctx = Estado & ReturnType<typeof useAcciones> & { ahora: string };
const StoreCtx = createContext<Ctx | null>(null);

/** Reloj de demostración: arranca en AHORA_DEMO y avanza en tiempo real. */
function useRelojDemo() {
  const [inicioReal] = useState(() => Date.now());
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(i);
  }, []);
  const ahora = useCallback(
    () => toLocalIso(new Date(new Date(mock.AHORA_DEMO).getTime() + (Date.now() - inicioReal))),
    [inicioReal],
  );
  // tick fuerza el recálculo periódico
  return { ahora, ahoraStr: tick >= 0 ? ahora() : "" };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>(inicial);
  const [cargado, setCargado] = useState(false);
  const { ahora, ahoraStr } = useRelojDemo();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setEstado({ ...inicial(), ...JSON.parse(raw) });
    } catch {}
    setCargado(true);
  }, []);

  useEffect(() => {
    if (!cargado) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(estado));
    } catch {}
  }, [estado, cargado]);

  const acciones = useAcciones(setEstado, ahora);
  registro.equipos = estado.equipos; // los selectores leen los datos vigentes
  registro.clientes = estado.clientes;
  registro.perfiles = estado.perfiles;
  return <StoreCtx.Provider value={{ ...estado, ...acciones, ahora: ahoraStr }}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore fuera de StoreProvider");
  return c;
}
