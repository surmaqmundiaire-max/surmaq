"use client";

import Link from "next/link";
import { use, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Camera, Car, Check, CheckCircle2, ChevronRight, History, Loader2, MapPin, Mic, MicOff,
  Navigation, Phone, Plus, Sparkles, Timer, Trash2, Users, X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { contexto, distanciaM, horasVisita, perfil, tecnicos, UMBRAL_DISTANCIA_M } from "@/lib/selectors";
import { CHECKLISTS, TIPO_LABEL } from "@/lib/mock-data";
import { duracion, fechaCorta, hora, metros } from "@/lib/format";
import { cx } from "@/components/ui";
import { Firma } from "@/components/firma";
import type { LugarTrabajo } from "@/lib/types";

const PENDIENTES_RAPIDOS: { texto: string; responsable: "cliente" | "surmaq" }[] = [
  { texto: "Falta punto eléctrico", responsable: "cliente" },
  { texto: "Cotizar repuesto", responsable: "surmaq" },
  { texto: "Cliente debe corregir instalación", responsable: "cliente" },
  { texto: "Volver a revisar", responsable: "surmaq" },
];

type Paso = "checklist" | "fotos" | "notas";

export default function VisitaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const s = useStore();
  const v = s.visitas.find((x) => x.id === id);
  const [paso, setPaso] = useState<Paso>("checklist");
  const [cerrando, setCerrando] = useState(false);

  if (!v) {
    return (
      <div className="p-6">
        <p className="text-tinta-2">No se encontró la tarea.</p>
        <Link href="/tecnico" className="mt-4 inline-block font-semibold text-marca-700">Volver a Hoy</Link>
      </div>
    );
  }

  const { trabajo, equipo, cliente } = contexto(s.trabajos, v.trabajoId);

  return (
    <div className="flex min-h-[calc(100dvh-28px)] flex-col">
      {/* Encabezado */}
      <header className="sticky top-0 z-10 bg-marca-900 px-2 pt-2 pb-3 text-white">
        <div className="flex items-center gap-1">
          <Link href="/tecnico" aria-label="Volver a Hoy" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10">
            <ArrowLeft size={22} />
          </Link>
          <p className="text-sm text-marca-100 tabular">Mantenimiento Nº {trabajo.numero} · {TIPO_LABEL[trabajo.tipo]}</p>
        </div>
        <div className="px-2">
          <h1 className="text-xl leading-tight font-bold">{cliente.razonSocial}</h1>
          <p className="mt-0.5 text-sm text-marca-100">{equipo.nombre} · {equipo.marca} {equipo.modelo}</p>
          {v.estado === "en_curso" && v.checkinEn && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold tabular">
              <Timer size={15} className="pulso" /> {duracion(horasVisita(v, s.ahora))} · desde {hora(v.checkinEn)}
            </p>
          )}
        </div>
      </header>

      {v.estado === "programada" && <Llegada id={id} />}
      {v.estado === "en_curso" && v.checkinEn && !v.checkinEn.startsWith(s.ahora.slice(0, 10)) && <SalidaOlvidada id={id} />}
      {v.estado === "en_curso" && v.checkinEn?.startsWith(s.ahora.slice(0, 10)) && !cerrando && <Trabajo id={id} paso={paso} setPaso={setPaso} setCerrando={setCerrando} />}
      {v.estado === "en_curso" && v.checkinEn?.startsWith(s.ahora.slice(0, 10)) && cerrando && <Cierre id={id} setPaso={setPaso} setCerrando={setCerrando} />}
      {v.estado === "finalizada" && <Resumen id={id} />}
    </div>
  );
}

function useVisita(id: string) {
  const s = useStore();
  const v = s.visitas.find((x) => x.id === id)!;
  const { trabajo, equipo, cliente } = contexto(s.trabajos, v.trabajoId);
  const pendientesTrabajo = s.pendientes.filter((p) => p.trabajoId === trabajo.id && !p.resueltoEn);
  return { s, v, trabajo, equipo, cliente, pendientesTrabajo };
}
type SetPaso = (p: Paso) => void;
type SetCerrando = (c: boolean) => void;

  // ---------------- 1. LLEGADA ----------------
function Llegada({ id }: { id: string }) {
    const { s, v, equipo, cliente, pendientesTrabajo } = useVisita(id);
    // Solo una tarea abierta a la vez: así ninguna salida queda sin marcar.
    const otraAbierta = s.visitas.find((x) => x.tecnicoId === v.tecnicoId && x.estado === "en_curso" && x.id !== v.id);
    const otraCliente = otraAbierta ? contexto(s.trabajos, otraAbierta.trabajoId).cliente.razonSocial : "";
    const [estadoGps, setEstadoGps] = useState<"idle" | "buscando" | "lejos">("idle");
    const [dist, setDist] = useState(0);
    const companeros = tecnicos().filter((t) => t.id !== v!.tecnicoId);

    const iniciar = () => {
      setEstadoGps("buscando");
      const seguir = (d: number) => {
        setDist(d);
        if (d > UMBRAL_DISTANCIA_M) setEstadoGps("lejos");
        else s.iniciarVisita(v!.id, d);
      };
      if (!("geolocation" in navigator)) return seguir(0);
      navigator.geolocation.getCurrentPosition(
        (p) => seguir(distanciaM(p.coords.latitude, p.coords.longitude, cliente.lat, cliente.lng)),
        () => seguir(0), // sin permiso o sin señal: se registra igual y se marca para revisión en la versión real
        { enableHighAccuracy: true, timeout: 6000 },
      );
    };

    return (
      <>
        <div className="flex-1 space-y-5 px-4 py-5">
          <div className="grid grid-cols-3 gap-2">
            <Accion href={`tel:${cliente.contacto.telefono}`} icono={<Phone size={20} />} texto="Llamar" />
            <Accion href={`https://www.google.com/maps/dir/?api=1&destination=${cliente.lat},${cliente.lng}`} icono={<Navigation size={20} />} texto="Cómo llegar" externo />
            <Accion href={`/tecnico/equipos/${equipo.id}`} icono={<History size={20} />} texto="Historial" />
          </div>

          <section className="rounded-2xl border border-borde bg-superficie p-4">
            <h2 className="text-sm font-semibold text-tinta-2">Tarea programada</h2>
            <p className="mt-1 text-lg font-semibold">{v!.descripcion}</p>
            <p className="mt-1 text-sm text-tinta-2 tabular">{fechaCorta(v!.programadaInicio)} · {hora(v!.programadaInicio)} – {hora(v!.programadaFin)}</p>
            <p className="mt-2 flex items-start gap-1.5 text-sm text-tinta-2"><MapPin size={16} className="mt-0.5 shrink-0" /> {cliente.direccion}, {cliente.ciudad}</p>
            <p className="mt-1 text-sm text-tinta-2">Contacto: <span className="font-medium text-tinta">{cliente.contacto.nombre}</span></p>
          </section>

          {pendientesTrabajo.length > 0 && (
            <section className="rounded-2xl bg-aviso-bg p-4">
              <h2 className="text-sm font-semibold text-aviso">Pendientes de este mantenimiento</h2>
              <ul className="mt-2 space-y-1.5 text-[15px]">
                {pendientesTrabajo.map((p) => (
                  <li key={p.id} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-aviso" />
                    <span>{p.descripcion} <span className="text-sm text-tinta-2">· {p.responsable === "cliente" ? "lo resuelve el cliente" : "lo resuelve Surmaq"}</span></span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="space-y-4 rounded-2xl border border-borde bg-superficie p-4">
            <Interruptor
              icono={<Car size={20} />}
              texto="Voy en auto de la empresa"
              valor={v!.autoEmpresa}
              onChange={(x) => s.actualizarVisita(v!.id, { autoEmpresa: x })}
            />
            <div>
              <p className="flex items-center gap-2 text-[15px] font-medium"><Users size={20} className="text-tinta-2" /> Acompañantes</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {companeros.map((c) => {
                  const on = v!.acompanantes.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => s.actualizarVisita(v!.id, { acompanantes: on ? v!.acompanantes.filter((x) => x !== c.id) : [...v!.acompanantes, c.id] })}
                      className={cx(
                        "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
                        on ? "border-marca-800 bg-marca-800 text-white" : "border-borde bg-superficie text-tinta hover:bg-fondo",
                      )}
                    >
                      {on && <Check size={15} />} {c.nombre.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-[15px] font-medium">Lugar</p>
              <Segmentado
                opciones={[["en_cliente", "En planta del cliente"], ["en_oficina", "En oficina / taller"]]}
                valor={v!.lugar}
                onChange={(x) => s.actualizarVisita(v!.id, { lugar: x as LugarTrabajo })}
              />
            </div>
          </section>
        </div>

        <BarraAccion>
          {otraAbierta ? (
            <div className="space-y-2" role="alert">
              <p className="text-[15px]">
                <span className="font-semibold text-critico">Tienes otra tarea abierta en {otraCliente}.</span> Marca su salida antes de entrar aquí.
              </p>
              <Link href={`/tecnico/visita/${otraAbierta.id}`} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-marca-800 text-[17px] font-semibold text-white">
                Ir a marcar la salida <ChevronRight size={20} />
              </Link>
            </div>
          ) : estadoGps === "lejos" ? (
            <div className="space-y-2" role="alert">
              <p className="text-[15px]">
                <span className="font-semibold text-aviso">Estás a {metros(dist)} del cliente.</span> Se registrará así y el administrador lo verá.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <BotonSecundario onClick={() => setEstadoGps("idle")}>Cancelar</BotonSecundario>
                <BotonPrincipal onClick={() => s.iniciarVisita(v!.id, dist)}>Iniciar igual</BotonPrincipal>
              </div>
            </div>
          ) : (
            <BotonPrincipal onClick={iniciar} disabled={estadoGps === "buscando"}>
              {estadoGps === "buscando" ? (
                <><Loader2 size={20} className="animate-spin" /> Obteniendo ubicación…</>
              ) : (
                <><MapPin size={20} /> Llegué · Marcar entrada</>
              )}
            </BotonPrincipal>
          )}
          <p className="mt-2 text-center text-xs text-tinta-3">Se guardan la hora y tu ubicación automáticamente</p>
        </BarraAccion>
      </>
    );
  }

  // ---------------- 2. TRABAJO ----------------
function Trabajo({ id, paso, setPaso, setCerrando }: { id: string; paso: Paso; setPaso: SetPaso; setCerrando: SetCerrando }) {
    const { s, v, trabajo } = useVisita(id);
    const items = Object.entries(v!.checklist);
    const hechos = items.filter(([, x]) => x).length;
    const nFotos = v!.fotos.length;
    const pendVisita = s.pendientes.filter((p) => p.visitaId === v!.id);
    const tabs: { id: Paso; texto: string; cuenta: string }[] = [
      { id: "checklist", texto: "Checklist", cuenta: `${hechos}/${items.length}` },
      { id: "fotos", texto: "Fotos", cuenta: String(nFotos) },
      { id: "notas", texto: "Notas", cuenta: pendVisita.length ? `${pendVisita.length} pend.` : "" },
    ];
    return (
      <>
        <nav className="border-b border-borde bg-superficie" aria-label="Pasos de la tarea">
          <ul className="grid grid-cols-3">
            {tabs.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setPaso(t.id)}
                  aria-current={paso === t.id}
                  className={cx(
                    "flex min-h-13 w-full flex-col items-center justify-center border-b-2 py-2 text-sm font-semibold transition-colors",
                    paso === t.id ? "border-marca-800 text-marca-900" : "border-transparent text-tinta-3",
                  )}
                >
                  {t.texto}
                  <span className="text-xs font-medium tabular">{t.cuenta || "—"}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex-1 px-4 py-4">
          {paso === "checklist" && (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-semibold">{TIPO_LABEL[trabajo.tipo]}</h2>
                <button type="button" className="min-h-11 text-sm font-semibold text-marca-700" onClick={() => s.setChecklistTodo(v!.id, hechos !== items.length)}>
                  {hechos === items.length ? "Desmarcar todo" : "Marcar todo"}
                </button>
              </div>
              <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
                {items.map(([item, ok]) => (
                  <li key={item}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={ok}
                      onClick={() => s.toggleChecklist(v!.id, item)}
                      className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-marca-50"
                    >
                      <span className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors", ok ? "border-ok bg-ok text-white" : "border-tinta-3/50")}>
                        {ok && <Check size={16} strokeWidth={3} />}
                      </span>
                      <span className={cx("text-[16px]", ok && "text-tinta-2")}>{item}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {paso === "fotos" && <Fotos id={id} />}
          {paso === "notas" && <Notas id={id} />}
        </div>

        <BarraAccion>
          <div className="grid grid-cols-[auto_1fr] gap-2">
            {paso !== "notas" ? (
              <BotonSecundario onClick={() => setPaso(paso === "checklist" ? "fotos" : "notas")}>
                Siguiente <ChevronRight size={18} />
              </BotonSecundario>
            ) : (
              <span />
            )}
            <BotonPrincipal onClick={() => setCerrando(true)}>
              <CheckCircle2 size={20} /> Terminar y marcar salida
            </BotonPrincipal>
          </div>
        </BarraAccion>
      </>
    );
  }

function Fotos({ id }: { id: string }) {
    const { s, v } = useVisita(id);
    const antes = v!.fotos.map((f, i) => ({ ...f, i })).filter((f) => f.momento === "antes");
    const despues = v!.fotos.map((f, i) => ({ ...f, i })).filter((f) => f.momento === "despues");
    return (
      <div className="space-y-5">
        {([["antes", "Antes", antes], ["despues", "Después", despues]] as const).map(([m, titulo, lista]) => (
          <section key={m}>
            <h2 className="mb-2 font-semibold">{titulo} <span className="font-normal text-tinta-3 tabular">({lista.length})</span></h2>
            <div className="grid grid-cols-3 gap-2">
              {lista.map((f) => (
                <div key={f.i} className="relative aspect-square overflow-hidden rounded-xl bg-fondo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url} alt={`Foto ${titulo.toLowerCase()}`} className="h-full w-full object-cover" />
                  <button type="button" aria-label="Quitar foto" onClick={() => s.quitarFoto(v!.id, f.i)} className="absolute top-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white">
                    <X size={16} />
                  </button>
                </div>
              ))}
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-marca-600/40 bg-marca-50 text-sm font-semibold text-marca-800 active:bg-marca-100">
                <Camera size={26} />
                Tomar foto
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) s.agregarFoto(v!.id, URL.createObjectURL(file), m);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </section>
        ))}
        <p className="text-xs text-tinta-3">Las fotos se guardan en el teléfono y se suben cuando haya señal.</p>
      </div>
    );
  }

function Notas({ id }: { id: string }) {
    const { s, v, trabajo } = useVisita(id);
    const [escuchando, setEscuchando] = useState(false);
    const [texto, setTexto] = useState(v!.comentarios ?? "");
    const [otro, setOtro] = useState("");
    const [resp, setResp] = useState<"cliente" | "surmaq">("surmaq");
    const rec = useRef<{ stop: () => void } | null>(null);
    const pendVisita = s.pendientes.filter((p) => p.visitaId === v!.id);
    const guardar = (t: string) => s.actualizarVisita(v!.id, { comentarios: t });

    const dictar = () => {
      if (escuchando) {
        rec.current?.stop();
        return;
      }
      const W = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
      const SR = W.SpeechRecognition ?? W.webkitSpeechRecognition;
      if (!SR) {
        // Navegador sin dictado: ejemplo para la maqueta
        const ejemplo = "Se realizó el trabajo según checklist. Equipo operando normal, presión estable en 7,5 bar.";
        const nuevo = texto ? `${texto} ${ejemplo}` : ejemplo;
        setTexto(nuevo);
        guardar(nuevo);
        return;
      }
      const r = new SR();
      r.lang = "es-EC";
      r.interimResults = false;
      r.onresult = (e) => {
        const dicho = Array.from(e.results).map((x) => x[0].transcript).join(" ");
        setTexto((prev) => {
          const nuevo = prev ? `${prev} ${dicho}` : dicho;
          guardar(nuevo);
          return nuevo;
        });
      };
      r.onend = () => setEscuchando(false);
      rec.current = r;
      setEscuchando(true);
      r.start();
    };

    return (
      <div className="space-y-6">
        <section>
          <div className="flex items-center justify-between">
            <label htmlFor="comentarios" className="font-semibold">¿Qué se hizo?</label>
            <button
              type="button"
              onClick={dictar}
              className={cx(
                "inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors",
                escuchando ? "bg-critico text-white" : "bg-marca-100 text-marca-900",
              )}
            >
              {escuchando ? <><MicOff size={16} /> Detener</> : <><Mic size={16} /> Dictar</>}
            </button>
          </div>
          <textarea
            id="comentarios"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={() => guardar(texto)}
            rows={4}
            placeholder="Toca «Dictar» y cuenta lo que hiciste"
            className="mt-2 w-full rounded-xl border border-borde bg-superficie p-3 text-[16px] outline-none focus:border-marca-600 focus:ring-2 focus:ring-marca-600/20"
          />
        </section>

        <section>
          <h2 className="font-semibold">Pendientes</h2>
          <p className="text-sm text-tinta-2">Lo que quedó por hacer. El administrador les dará seguimiento.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PENDIENTES_RAPIDOS.map((p) => (
              <button
                key={p.texto}
                type="button"
                onClick={() => s.agregarPendiente({ trabajoId: trabajo.id, visitaId: v!.id, descripcion: p.texto, responsable: p.responsable })}
                className="inline-flex min-h-11 items-center gap-1 rounded-full border border-borde bg-superficie px-3.5 text-sm font-medium hover:bg-fondo active:bg-marca-50"
              >
                <Plus size={15} /> {p.texto}
              </button>
            ))}
          </div>
          <form
            className="mt-3 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!otro.trim()) return;
              s.agregarPendiente({ trabajoId: trabajo.id, visitaId: v!.id, descripcion: otro.trim(), responsable: resp });
              setOtro("");
            }}
          >
            <label htmlFor="otro-pend" className="sr-only">Otro pendiente</label>
            <div className="flex gap-2">
              <input
                id="otro-pend"
                value={otro}
                onChange={(e) => setOtro(e.target.value)}
                placeholder="Otro pendiente…"
                className="min-h-12 flex-1 rounded-xl border border-borde bg-superficie px-3 text-[16px] outline-none focus:border-marca-600 focus:ring-2 focus:ring-marca-600/20"
              />
              <button type="submit" className="min-h-12 rounded-xl bg-marca-800 px-4 font-semibold text-white disabled:opacity-40" disabled={!otro.trim()}>
                Agregar
              </button>
            </div>
            <Segmentado opciones={[["surmaq", "Lo resuelve Surmaq"], ["cliente", "Lo resuelve el cliente"]]} valor={resp} onChange={(x) => setResp(x as "cliente" | "surmaq")} />
          </form>
          {pendVisita.length > 0 && (
            <ul className="mt-3 divide-y divide-borde rounded-2xl border border-borde bg-superficie">
              {pendVisita.map((p) => (
                <li key={p.id} className="flex items-center gap-2 py-1 pr-1 pl-4">
                  <span className="flex-1 text-[15px]">{p.descripcion} <span className="text-xs text-tinta-3">· {p.responsable === "cliente" ? "cliente" : "Surmaq"}</span></span>
                  <button type="button" aria-label={`Quitar ${p.descripcion}`} onClick={() => s.quitarPendiente(p.id)} className="flex h-11 w-11 items-center justify-center text-tinta-3 hover:text-critico">
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  }

  // ---------------- 3. CIERRE ----------------
function Cierre({ id, setPaso, setCerrando }: { id: string; setPaso: SetPaso; setCerrando: SetCerrando }) {
    const { s, v, trabajo, equipo, cliente } = useVisita(id);
    const [terminado, setTerminado] = useState<"si" | "no" | null>(null);
    const [estadoEquipo, setEstadoEquipo] = useState("");
    const [proxima, setProxima] = useState<string>("");
    const [firmante, setFirmante] = useState(v!.firmadoPor ?? cliente.contacto.nombre);
    const [generando, setGenerando] = useState(false);
    const items = Object.entries(v!.checklist);
    const faltan = items.filter(([, x]) => !x).map(([k]) => k);
    const pendVisita = s.pendientes.filter((p) => p.visitaId === v!.id);
    const opcionesProxima = useMemo(() => {
      const base = new Date(s.ahora.slice(0, 10) + "T00:00:00");
      // suma días hábiles (sin sábados ni domingos)
      const mk = (habiles: number, etiqueta: string) => {
        const d = new Date(base);
        for (let n = 0; n < habiles; ) {
          d.setDate(d.getDate() + 1);
          if (d.getDay() !== 0 && d.getDay() !== 6) n++;
        }
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return { iso, etiqueta: `${etiqueta} · ${fechaCorta(iso)}` };
      };
      return [mk(1, "Próximo día hábil"), mk(3, "En 3 días hábiles"), mk(5, "En una semana")];
    }, [s.ahora]);

    const listo = terminado === "si" ? !!estadoEquipo : terminado === "no" ? !!proxima : false;

    const redactar = () => {
      setGenerando(true);
      setTimeout(() => {
        const hechos = items.filter(([, x]) => x).map(([k]) => k.toLowerCase());
        const informe =
          `${TIPO_LABEL[trabajo.tipo]} de ${equipo.nombre} (${equipo.marca} ${equipo.modelo}, serie ${equipo.serie}) en ${cliente.razonSocial.replace(/\.$/, "")}. ` +
          (hechos.length ? `Se realizó: ${hechos.join(", ")}. ` : "") +
          (faltan.length ? `Quedó sin completar: ${faltan.map((f) => f.toLowerCase()).join(", ")}. ` : "") +
          (v!.comentarios ? `Observaciones del técnico: ${v!.comentarios} ` : "") +
          (pendVisita.length ? `Pendientes: ${pendVisita.map((p) => `${p.descripcion} (${p.responsable === "cliente" ? "cliente" : "Surmaq"})`).join("; ")}.` : "");
        s.actualizarVisita(v!.id, { informe });
        setGenerando(false);
      }, 700);
    };

    const confirmar = () => {
      s.actualizarVisita(v!.id, { firmadoPor: firmante });
      s.finalizarVisita(v!.id);
      if (terminado === "si") s.cerrarTrabajo(trabajo.id, estadoEquipo);
      else
        s.agregarVisita({
          trabajoId: trabajo.id,
          tecnicoId: v!.tecnicoId,
          descripcion: `Seguimiento: ${v!.descripcion}`,
          lugar: v!.lugar,
          programadaInicio: `${proxima}T09:00:00`,
          programadaFin: `${proxima}T11:00:00`,
          estado: "programada",
          autoEmpresa: v!.autoEmpresa,
          acompanantes: [],
          checklist: Object.fromEntries(CHECKLISTS[trabajo.tipo].map((k) => [k, false])),
          fotos: [],
        });
      setCerrando(false);
    };

    return (
      <>
        <div className="flex-1 space-y-5 px-4 py-5">
          <button type="button" onClick={() => setCerrando(false)} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-marca-700">
            <ArrowLeft size={16} /> Seguir trabajando
          </button>

          <section className="rounded-2xl border border-borde bg-superficie p-4">
            <h2 className="font-semibold">Resumen</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Dato k="Tiempo" v={duracion(horasVisita(v!, s.ahora))} />
              <Dato k="Checklist" v={`${items.length - faltan.length} de ${items.length}`} />
              <Dato k="Fotos" v={String(v!.fotos.length)} />
              <Dato k="Pendientes" v={String(pendVisita.length)} />
            </dl>
            {faltan.length > 0 && (
              <p className="mt-3 rounded-lg bg-aviso-bg px-3 py-2 text-sm text-aviso">
                Sin marcar: {faltan.join(", ")}.{" "}
                <button type="button" className="font-semibold underline underline-offset-2" onClick={() => { setCerrando(false); setPaso("checklist"); }}>Revisar</button>
              </p>
            )}
          </section>

          <section>
            <h2 className="font-semibold">¿El mantenimiento quedó terminado?</h2>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Opcion activo={terminado === "si"} onClick={() => setTerminado("si")} titulo="Sí, terminado" sub="Se cierra el mantenimiento" />
              <Opcion activo={terminado === "no"} onClick={() => setTerminado("no")} titulo="No, falta" sub="Agendar otra tarea" />
            </div>
            {terminado === "si" && (
              <div className="mt-3">
                <p className="text-sm font-medium">Estado general del equipo</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["Bueno", "Regular", "Requiere atención"].map((e) => (
                    <Chip key={e} activo={estadoEquipo === e} onClick={() => setEstadoEquipo(e)}>{e}</Chip>
                  ))}
                </div>
              </div>
            )}
            {terminado === "no" && (
              <div className="mt-3">
                <p className="text-sm font-medium">Próxima tarea</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {opcionesProxima.map((o) => (
                    <Chip key={o.iso} activo={proxima === o.iso} onClick={() => setProxima(o.iso)}>{o.etiqueta}</Chip>
                  ))}
                </div>
                <p className="mt-2 text-xs text-tinta-3">El administrador puede ajustar la hora después.</p>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Informe interno</h2>
              <button type="button" onClick={redactar} disabled={generando} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-marca-100 px-4 text-sm font-semibold text-marca-900 disabled:opacity-60">
                {generando ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} {v!.informe ? "Volver a redactar" : "Redactar con IA"}
              </button>
            </div>
            {v!.informe ? (
              <textarea
                aria-label="Informe interno"
                defaultValue={v!.informe}
                onBlur={(e) => s.actualizarVisita(v!.id, { informe: e.target.value })}
                rows={6}
                className="mt-2 w-full rounded-xl border border-borde bg-superficie p-3 text-[15px] outline-none focus:border-marca-600 focus:ring-2 focus:ring-marca-600/20"
              />
            ) : (
              <p className="mt-1 text-sm text-tinta-2">La IA arma el informe con el checklist, tus notas y los pendientes. Puedes editarlo.</p>
            )}
          </section>

          <section>
            <h2 className="font-semibold">Recibe conforme <span className="font-normal text-tinta-3">(opcional)</span></h2>
            <label htmlFor="firmante" className="sr-only">Nombre de quien recibe</label>
            <input
              id="firmante"
              value={firmante}
              onChange={(e) => setFirmante(e.target.value)}
              className="mt-2 mb-2 min-h-12 w-full rounded-xl border border-borde bg-superficie px-3 text-[16px] outline-none focus:border-marca-600 focus:ring-2 focus:ring-marca-600/20"
            />
            <Firma valor={v!.firmaCliente} onChange={(f) => s.actualizarVisita(v!.id, { firmaCliente: f })} />
          </section>
        </div>

        <BarraAccion>
          <BotonPrincipal onClick={confirmar} disabled={!listo}>
            <CheckCircle2 size={20} /> Confirmar salida · {hora(s.ahora)}
          </BotonPrincipal>
          {!listo && (
            <p className="mt-2 text-center text-xs text-tinta-3">
              {terminado === null ? "Indica si el mantenimiento quedó terminado" : terminado === "si" ? "Elige el estado general del equipo" : "Elige la fecha de la próxima tarea"}
            </p>
          )}
        </BarraAccion>
      </>
    );
  }

  // ---------------- 4. RESUMEN ----------------
function Resumen({ id }: { id: string }) {
    const { s, v } = useVisita(id);
    const pendVisita = s.pendientes.filter((p) => p.visitaId === v!.id);
    const items = Object.entries(v!.checklist);
    return (
      <div className="flex-1 space-y-5 px-4 py-5">
        <section className="rounded-2xl bg-ok-bg p-4 text-ok">
          <p className="flex items-center gap-2 text-lg font-bold"><CheckCircle2 size={24} /> Tarea finalizada</p>
          <p className="mt-1 text-sm tabular">
            Entrada {hora(v!.checkinEn)} · Salida {hora(v!.checkoutEn)} · {duracion(horasVisita(v!, s.ahora))}
          </p>
        </section>
        <section className="rounded-2xl border border-borde bg-superficie p-4">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Dato k="Distancia al iniciar" v={metros(v!.checkinDistanciaM)} />
            <Dato k="Auto de la empresa" v={v!.autoEmpresa ? "Sí" : "No"} />
            <Dato k="Checklist" v={`${items.filter(([, x]) => x).length} de ${items.length}`} />
            <Dato k="Acompañantes" v={v!.acompanantes.map((a) => perfil(a).nombre.split(" ")[0]).join(", ") || "—"} />
          </dl>
          {v!.comentarios && <p className="mt-3 border-t border-borde pt-3 text-[15px]">{v!.comentarios}</p>}
        </section>
        {pendVisita.length > 0 && (
          <section className="rounded-2xl bg-aviso-bg p-4">
            <h2 className="text-sm font-semibold text-aviso">Pendientes registrados</h2>
            <ul className="mt-1 list-disc pl-5 text-[15px]">{pendVisita.map((p) => <li key={p.id}>{p.descripcion}</li>)}</ul>
          </section>
        )}
        {v!.informe && (
          <section className="rounded-2xl border border-borde bg-superficie p-4">
            <h2 className="text-sm font-semibold text-tinta-2">Informe interno</h2>
            <p className="mt-1 text-[15px] leading-relaxed">{v!.informe}</p>
          </section>
        )}
        <Link href="/tecnico" className="flex min-h-14 items-center justify-center rounded-2xl bg-marca-800 font-semibold text-white">
          Volver a Hoy
        </Link>
      </div>
    );
  }

// ---------------- SALIDA OLVIDADA ----------------
function SalidaOlvidada({ id }: { id: string }) {
    const { s, v } = useVisita(id);
    const dia = v.checkinEn!.slice(0, 10);
    const sugerida = v.programadaFin.startsWith(dia) && v.programadaFin > v.checkinEn! ? v.programadaFin.slice(11, 16) : "17:00";
    const [horaSalida, setHoraSalida] = useState(sugerida);
    const valida = `${dia}T${horaSalida}:00` > v.checkinEn!;
    return (
      <>
        <div className="flex-1 space-y-4 px-4 py-5">
          <section className="rounded-2xl bg-critico-bg p-4 text-critico" role="alert">
            <p className="text-lg font-bold">No se marcó la salida</p>
            <p className="mt-1 text-[15px] text-tinta">
              Entraste el <strong>{fechaCorta(dia)}</strong> a las <strong>{hora(v.checkinEn)}</strong> y la tarea quedó abierta.
              Indica a qué hora saliste ese día. El administrador verá que la salida se registró después.
            </p>
          </section>
          <label className="block">
            <span className="font-semibold">Hora de salida del {fechaCorta(dia)}</span>
            <input
              type="time"
              value={horaSalida}
              onChange={(e) => setHoraSalida(e.target.value)}
              aria-invalid={!valida}
              className="mt-2 min-h-14 w-full rounded-xl border border-borde bg-superficie px-4 text-xl font-semibold tabular outline-none focus:border-marca-600 focus:ring-2 focus:ring-marca-600/20"
            />
            {!valida && <span className="mt-1 block text-sm text-critico">La salida debe ser después de la entrada ({hora(v.checkinEn)}).</span>}
          </label>
        </div>
        <BarraAccion>
          <BotonPrincipal disabled={!valida} onClick={() => s.registrarSalidaOlvidada(v.id, `${dia}T${horaSalida}:00`)}>
            <CheckCircle2 size={20} /> Registrar salida a las {horaSalida}
          </BotonPrincipal>
        </BarraAccion>
      </>
    );
}

// ---------- piezas ----------
interface SpeechRec {
  lang: string;
  interimResults: boolean;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

function BarraAccion({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 border-t border-borde bg-superficie/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur">
      {children}
    </div>
  );
}

function BotonPrincipal({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-marca-800 px-4 text-[17px] font-semibold text-white transition-colors hover:bg-marca-900 active:bg-marca-950 disabled:bg-tinta-3/40 disabled:text-white"
    >
      {children}
    </button>
  );
}

function BotonSecundario({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-14 items-center justify-center gap-1 rounded-2xl border border-borde bg-superficie px-5 font-semibold text-tinta transition-colors hover:bg-fondo">
      {children}
    </button>
  );
}

function Accion({ href, icono, texto, externo }: { href: string; icono: React.ReactNode; texto: string; externo?: boolean }) {
  const cls = "flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-borde bg-superficie text-sm font-medium text-marca-800 hover:bg-fondo active:bg-marca-50";
  return externo || href.startsWith("tel:") ? (
    <a href={href} target={externo ? "_blank" : undefined} rel="noreferrer" className={cls}>{icono}{texto}</a>
  ) : (
    <Link href={href} className={cls}>{icono}{texto}</Link>
  );
}

function Interruptor({ icono, texto, valor, onChange }: { icono: React.ReactNode; texto: string; valor: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={valor} onClick={() => onChange(!valor)} className="flex min-h-11 w-full items-center gap-2 text-left text-[15px] font-medium">
      <span className="text-tinta-2">{icono}</span>
      <span className="flex-1">{texto}</span>
      <span className={cx("relative h-7 w-12 rounded-full transition-colors", valor ? "bg-marca-800" : "bg-tinta-3/40")}>
        <span className={cx("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all", valor ? "left-[22px]" : "left-0.5")} />
      </span>
    </button>
  );
}

function Segmentado({ opciones, valor, onChange }: { opciones: [string, string][]; valor: string; onChange: (v: string) => void }) {
  return (
    <div className="mt-2 grid grid-flow-col gap-1 rounded-xl bg-fondo p-1" role="radiogroup">
      {opciones.map(([k, label]) => (
        <button
          key={k}
          type="button"
          role="radio"
          aria-checked={valor === k}
          onClick={() => onChange(k)}
          className={cx("min-h-11 rounded-lg px-2 text-sm font-semibold transition-colors", valor === k ? "bg-superficie text-marca-900 shadow-sm" : "text-tinta-2")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Opcion({ activo, onClick, titulo, sub }: { activo: boolean; onClick: () => void; titulo: string; sub: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={activo}
      onClick={onClick}
      className={cx("min-h-18 rounded-2xl border-2 p-3 text-left transition-colors", activo ? "border-marca-800 bg-marca-50" : "border-borde bg-superficie")}
    >
      <span className="block font-semibold">{titulo}</span>
      <span className="block text-sm text-tinta-2">{sub}</span>
    </button>
  );
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={cx("inline-flex min-h-11 items-center gap-1 rounded-full border px-4 text-sm font-medium transition-colors", activo ? "border-marca-800 bg-marca-800 text-white" : "border-borde bg-superficie hover:bg-fondo")}
    >
      {activo && <Check size={15} />} {children}
    </button>
  );
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-tinta-3">{k}</dt>
      <dd className="font-semibold tabular">{v}</dd>
    </div>
  );
}

