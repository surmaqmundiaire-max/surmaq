"use client";

// Estado de la maqueta en memoria (+ localStorage). Cuando conectemos Supabase,
// estas acciones se reemplazan por llamadas a la base de datos.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as mock from "./mock-data";
import type { Cliente, Equipo, Pendiente, Perfil, PuestaEnMarcha, Solicitud, TipoTrabajo, Trabajo, Visita } from "./types";
import type { ConfigCot, Cotizacion } from "./cotizador/tipos";
import { CONFIG_COT_DEF } from "./cotizador/config";
import { registro } from "./selectors";
import { toLocalIso } from "./format";

interface Estado {
  visitas: Visita[];
  pendientes: Pendiente[];
  trabajos: Trabajo[];
  equipos: Equipo[];
  clientes: Cliente[];
  perfiles: Perfil[];
  solicitudes: Solicitud[];
  puestas: PuestaEnMarcha[];
  cotizaciones: Cotizacion[];
  configCot: ConfigCot;
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
  solicitudes: mock.solicitudes,
  puestas: [],
  cotizaciones: [],
  configCot: CONFIG_COT_DEF,
  tecnicoActualId: "u-hchicazawa",
  usuarioActualId: "u-admin",
});

const KEY = "optimum-maqueta-v7";

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
      crearSolicitud: (sol: Omit<Solicitud, "id" | "numero" | "solicitadaEn" | "estado">) => {
        const id = `s-${Date.now()}`;
        set((s) => ({
          ...s,
          solicitudes: [...s.solicitudes, { ...sol, id, numero: Math.max(99, ...s.solicitudes.map((x) => x.numero)) + 1, solicitadaEn: ahora(), estado: "ingresada" }],
        }));
        return id;
      },
      actualizarSolicitud: (id: string, cambios: Partial<Solicitud>) =>
        set((s) => ({ ...s, solicitudes: s.solicitudes.map((x) => (x.id === id ? { ...x, ...cambios } : x)) })),
      eliminarSolicitud: (id: string) => set((s) => ({ ...s, solicitudes: s.solicitudes.filter((x) => x.id !== id) })),
      rechazarSolicitud: (id: string, motivo: string, por: string) =>
        set((s) => ({ ...s, solicitudes: s.solicitudes.map((x) => (x.id === id ? { ...x, estado: "rechazada", motivoRechazo: motivo, revisadaPor: por, revisadaEn: ahora() } : x)) })),
      /** Aprueba una solicitud: crea el mantenimiento y la tarea para el técnico. */
      aprobarSolicitud: (
        id: string,
        p: { por: string; tecnicoId: string; acompanantes: string[]; vehiculo: string; fecha: string; horaSalida: string; horaLlegada: string; horas: number; tipo: TipoTrabajo; descripcion: string },
      ) => {
        const trabajoId = `t-${Date.now()}`;
        set((s) => {
          const sol = s.solicitudes.find((x) => x.id === id)!;
          const ini = `${p.fecha}T${p.horaLlegada}:00`;
          const fin = new Date(ini);
          fin.setMinutes(fin.getMinutes() + p.horas * 60);
          const trabajo: Trabajo = {
            id: trabajoId,
            numero: Math.max(0, ...s.trabajos.map((x) => x.numero)) + 1,
            equipoId: sol.equipoId,
            titulo: p.descripcion,
            tipo: p.tipo,
            lugar: "en_cliente",
            estado: "abierto",
            asignadoId: p.tecnicoId,
            fechaIngreso: ahora(),
            solicitudId: id,
            vendedorId: sol.vendedorId,
            montoProducto: sol.montoProducto,
            montoManoObra: sol.montoManoObra,
          };
          const visita: Visita = {
            id: `v-${Date.now()}`,
            trabajoId,
            tecnicoId: p.tecnicoId,
            descripcion: p.descripcion,
            lugar: "en_cliente",
            programadaInicio: ini,
            programadaFin: toLocalIso(fin),
            salidaOficina: p.horaSalida,
            vehiculo: p.vehiculo,
            estado: "programada",
            autoEmpresa: p.vehiculo !== "Vehículo particular",
            acompanantes: p.acompanantes,
            checklist: Object.fromEntries(mock.CHECKLISTS[p.tipo].map((k) => [k, false])),
            fotos: [],
            programadaPor: p.por,
          };
          return {
            ...s,
            trabajos: [...s.trabajos, trabajo],
            visitas: [...s.visitas, visita],
            solicitudes: s.solicitudes.map((x) =>
              x.id === id
                ? { ...x, estado: "programada", tipo: p.tipo, descripcion: p.descripcion, revisadaPor: p.por, revisadaEn: ahora(), trabajoId, cambioHora: p.fecha !== x.fechaRequerida || p.horaLlegada !== x.horaRequerida }
                : x,
            ),
          };
        });
        return trabajoId;
      },
      crearPuesta: (p: Omit<PuestaEnMarcha, "id" | "numero" | "creadaEn" | "estado" | "fotos">) => {
        const id = `pem-${Date.now()}`;
        set((s) => ({
          ...s,
          puestas: [...s.puestas, { ...p, id, numero: Math.max(1800, ...s.puestas.map((x) => x.numero)) + 1, creadaEn: ahora(), estado: "borrador", fotos: [] }],
        }));
        return id;
      },
      actualizarPuesta: (id: string, cambios: Partial<PuestaEnMarcha> | ((p: PuestaEnMarcha) => Partial<PuestaEnMarcha>)) =>
        set((s) => ({ ...s, puestas: s.puestas.map((x) => (x.id === id ? { ...x, ...(typeof cambios === "function" ? cambios(x) : cambios) } : x)) })),
      responderPuesta: (id: string, campo: string, valor: unknown) =>
        set((s) => ({ ...s, puestas: s.puestas.map((x) => (x.id === id ? { ...x, respuestas: { ...x.respuestas, [campo]: valor } } : x)) })),
      completarPuesta: (id: string) =>
        set((s) => ({ ...s, puestas: s.puestas.map((x) => (x.id === id ? { ...x, estado: "completada", completadaEn: ahora() } : x)) })),
      /** Crea o actualiza una cotización (numerada COT-0001, COT-0002…). */
      guardarCotizacion: (q: Omit<Cotizacion, "id" | "numero" | "creadoEn" | "actualizado"> & { id?: string }) => {
        const id = q.id ?? `cot-${Date.now()}`;
        set((s) => {
          const existe = s.cotizaciones.find((x) => x.id === id);
          if (existe) return { ...s, cotizaciones: s.cotizaciones.map((x) => (x.id === id ? { ...x, ...q, id, actualizado: ahora() } : x)) };
          const n = s.cotizaciones.length ? Math.max(...s.cotizaciones.map((x) => Number(x.numero.slice(4)) || 0)) + 1 : 1;
          return { ...s, cotizaciones: [{ ...q, id, numero: `COT-${String(n).padStart(4, "0")}`, creadoEn: ahora(), actualizado: ahora() } as Cotizacion, ...s.cotizaciones] };
        });
        return id;
      },
      eliminarCotizacion: (id: string) => set((s) => ({ ...s, cotizaciones: s.cotizaciones.filter((x) => x.id !== id) })),
      setConfigCot: (c: Partial<ConfigCot>) => set((s) => ({ ...s, configCot: { ...s.configCot, ...c } })),
      restaurarConfigCot: () => set((s) => ({ ...s, configCot: CONFIG_COT_DEF })),
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
