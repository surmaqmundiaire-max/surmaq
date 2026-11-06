"use client";

import { useState } from "react";
import { Camera, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { comprimirImagen } from "@/lib/imagen";
import type { DatosPlaca, Equipo } from "@/lib/types";
import { cx } from "./ui";

/** Casilla de foto: vacía invita a tomarla; llena muestra la foto y permite cambiarla. */
export function SlotFoto({ titulo, url, onFoto, ayuda }: { titulo: string; url?: string; onFoto: (dataUrl: string) => void; ayuda?: string }) {
  const [cargando, setCargando] = useState(false);
  const input = (
    <input
      type="file"
      accept="image/*"
      capture="environment"
      className="sr-only"
      onChange={async (e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        setCargando(true);
        try {
          onFoto(await comprimirImagen(f));
        } finally {
          setCargando(false);
        }
      }}
    />
  );
  return (
    <figure>
      <figcaption className="mb-1.5 text-sm font-semibold">{titulo}</figcaption>
      {url ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-fondo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={titulo} className="h-full w-full object-cover" />
          <label className="absolute right-2 bottom-2 inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full bg-black/65 px-3 text-sm font-semibold text-white">
            <RefreshCw size={15} /> Cambiar
            {input}
          </label>
        </div>
      ) : (
        <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-marca-600/40 bg-marca-50 px-3 text-center text-sm font-semibold text-marca-800 active:bg-marca-100">
          {cargando ? <Loader2 size={26} className="animate-spin" /> : <Camera size={28} />}
          Tomar foto
          {ayuda && <span className="text-xs font-normal text-tinta-2">{ayuda}</span>}
          {input}
        </label>
      )}
    </figure>
  );
}

export interface LecturaPlaca {
  legible: boolean;
  tipoEquipo: string | null;
  marca: string | null;
  modelo: string | null;
  serie: string | null;
  anio: number | null;
  potencia: string | null;
  voltaje: string | null;
  frecuencia: string | null;
  corriente: string | null;
  presionMax: string | null;
  caudal: string | null;
  otros: { etiqueta: string; valor: string }[];
  observaciones: string | null;
}

// Lectura de ejemplo para cuando la IA no está activada (sin clave de Claude).
const EJEMPLO: LecturaPlaca = {
  legible: true,
  tipoEquipo: "Compresor de tornillo",
  marca: "ABAC",
  modelo: "Genesis 15.10-500",
  serie: "CAI-931967",
  anio: 2019,
  potencia: "15 kW / 20 HP",
  voltaje: "220/440 V",
  frecuencia: "60 Hz",
  corriente: "52/26 A",
  presionMax: "10 bar",
  caudal: "1.950 l/min",
  otros: [{ etiqueta: "Volumen tanque", valor: "500 l" }],
  observaciones: "Ejemplo de demostración: la lectura real requiere activar la IA.",
};

type Campo = { k: keyof LecturaPlaca; label: string };
const CAMPOS: Campo[] = [
  { k: "marca", label: "Marca" },
  { k: "modelo", label: "Modelo" },
  { k: "serie", label: "Serie" },
  { k: "anio", label: "Año" },
  { k: "potencia", label: "Potencia" },
  { k: "voltaje", label: "Voltaje" },
  { k: "frecuencia", label: "Frecuencia" },
  { k: "corriente", label: "Corriente" },
  { k: "presionMax", label: "Presión máx." },
  { k: "caudal", label: "Caudal" },
];

/** Botón «Leer placa con IA» + formulario de revisión con los datos detectados. */
export function LectorPlaca({ foto, onAplicar }: { foto?: string; onAplicar: (l: LecturaPlaca) => void }) {
  const [estado, setEstado] = useState<"idle" | "leyendo" | "revisar" | "sinclave" | "error">("idle");
  const [lectura, setLectura] = useState<LecturaPlaca | null>(null);
  const [esEjemplo, setEsEjemplo] = useState(false);

  const leer = async () => {
    if (!foto) return;
    setEstado("leyendo");
    try {
      const r = await fetch("/api/leer-placa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imagen: foto }) });
      if (r.status === 503) return setEstado("sinclave");
      if (!r.ok) return setEstado("error");
      setLectura(await r.json());
      setEsEjemplo(false);
      setEstado("revisar");
    } catch {
      setEstado("error");
    }
  };

  if (!foto) return null;

  if (estado === "revisar" && lectura) {
    const set = (k: keyof LecturaPlaca, v: string) => setLectura({ ...lectura, [k]: k === "anio" ? (v ? Number(v) || null : null) : v || null });
    return (
      <section className="mt-3 rounded-2xl border border-marca-600/30 bg-marca-50 p-4" aria-label="Datos leídos de la placa">
        <h3 className="flex items-center gap-1.5 font-semibold text-marca-900">
          <Sparkles size={17} /> {esEjemplo ? "Datos de ejemplo" : "La IA leyó esto"} · revisa y confirma
        </h3>
        {!lectura.legible && <p className="mt-2 rounded-lg bg-aviso-bg px-3 py-2 text-sm text-aviso">No se pudo leer bien la placa. Prueba otra foto más cerca, de frente y sin reflejos.</p>}
        {lectura.observaciones && <p className="mt-2 text-sm text-tinta-2">{lectura.observaciones}</p>}
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
          {CAMPOS.map(({ k, label }) => {
            const v = lectura[k];
            return (
              <label key={k} className="block text-sm">
                <span className="text-tinta-2">{label}</span>
                <input
                  value={v == null ? "" : String(v)}
                  inputMode={k === "anio" ? "numeric" : undefined}
                  onChange={(e) => set(k, e.target.value)}
                  placeholder="No se ve"
                  className={cx(
                    "mt-0.5 min-h-11 w-full rounded-lg border bg-superficie px-2.5 text-[15px] font-semibold outline-none focus:border-marca-600 focus:ring-2 focus:ring-marca-600/20",
                    v == null ? "border-dashed border-tinta-3/50 font-normal" : "border-borde",
                  )}
                />
              </label>
            );
          })}
        </div>
        {lectura.otros.length > 0 && (
          <p className="mt-3 text-sm text-tinta-2">También en la placa: {lectura.otros.map((o) => `${o.etiqueta}: ${o.valor}`).join(" · ")}</p>
        )}
        <div className="mt-4 grid grid-cols-[auto_1fr] gap-2">
          <button type="button" onClick={() => setEstado("idle")} className="min-h-12 rounded-xl border border-borde bg-superficie px-4 font-semibold">Descartar</button>
          <button type="button" onClick={() => { onAplicar(lectura); setEstado("idle"); }} className="min-h-12 rounded-xl bg-marca-800 font-semibold text-white hover:bg-marca-900">
            Guardar datos del equipo
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={leer}
        disabled={estado === "leyendo"}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-marca-100 font-semibold text-marca-900 hover:bg-marca-100/70 disabled:opacity-70"
      >
        {estado === "leyendo" ? <><Loader2 size={18} className="animate-spin" /> Leyendo la placa…</> : <><Sparkles size={18} /> Leer placa con IA</>}
      </button>
      {estado === "sinclave" && (
        <div className="mt-2 rounded-lg bg-aviso-bg px-3 py-2 text-sm text-aviso" role="status">
          La lectura con IA no está activada en esta maqueta (falta la clave de Claude).{" "}
          <button type="button" className="font-semibold underline underline-offset-2" onClick={() => { setLectura(EJEMPLO); setEsEjemplo(true); setEstado("revisar"); }}>
            Ver cómo funciona con un ejemplo
          </button>
        </div>
      )}
      {estado === "error" && <p className="mt-2 rounded-lg bg-critico-bg px-3 py-2 text-sm text-critico" role="alert">No se pudo leer la placa. Revisa la conexión y vuelve a intentar.</p>}
    </div>
  );
}

/** Convierte la lectura en cambios para el equipo (solo campos con valor). */
export function aplicarLectura(l: LecturaPlaca): Partial<Equipo> {
  const datos: DatosPlaca = {
    potencia: l.potencia ?? undefined,
    voltaje: l.voltaje ?? undefined,
    frecuencia: l.frecuencia ?? undefined,
    corriente: l.corriente ?? undefined,
    presionMax: l.presionMax ?? undefined,
    caudal: l.caudal ?? undefined,
    otros: l.otros.length ? l.otros : undefined,
  };
  const c: Partial<Equipo> = { datosPlaca: datos };
  if (l.marca) c.marca = l.marca;
  if (l.modelo) c.modelo = l.modelo;
  if (l.serie) c.serie = l.serie;
  if (l.anio) c.anio = l.anio;
  return c;
}
