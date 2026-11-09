"use client";

import { use, useState } from "react";
import { AlertTriangle, CheckCircle2, Flame, Gauge, Power, Volume2, Wind, Wrench, type LucideIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { cliente as getCliente } from "@/lib/selectors";
import { fechaCorta, fechaLarga, toLocalIso } from "@/lib/format";
import { claseCampo } from "@/components/formularios";
import { MiniaturaEquipo } from "@/components/visual";
import { cx } from "@/components/ui";
import type { TipoTrabajo } from "@/lib/types";

const PROBLEMAS: { k: string; l: string; icono: LucideIcon; tipo: TipoTrabajo }[] = [
  { k: "no_arranca", l: "No arranca", icono: Power, tipo: "revision" },
  { k: "fuga", l: "Fuga de aire o aceite", icono: Wind, tipo: "revision" },
  { k: "ruido", l: "Ruido o vibración", icono: Volume2, tipo: "revision" },
  { k: "temperatura", l: "Alta temperatura / alarma", icono: Flame, tipo: "revision" },
  { k: "presion", l: "Baja presión", icono: Gauge, tipo: "revision" },
  { k: "preventivo", l: "Mantenimiento preventivo", icono: Wrench, tipo: "mantenimiento" },
];
const CIUDADES_QUITO = /quito|cayambe|ibarra|latacunga|ambato|riobamba|santo domingo/i;

/** Página pública que abre el QR del equipo: el cliente pide servicio técnico sin iniciar sesión. */
export default function PedirServicio({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = use(params);
  const s = useStore();
  const e = s.equipos.find((x) => x.codigoQr.toLowerCase() === codigo.toLowerCase());
  const [problema, setProblema] = useState("");
  const [detalle, setDetalle] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [urgente, setUrgente] = useState(false);
  const [enviada, setEnviada] = useState<number | null>(null);

  if (!e) {
    return (
      <Marco>
        <p className="text-lg font-semibold">No reconocemos este código</p>
        <p className="mt-1 text-tinta-2">Revise que la etiqueta esté completa o comuníquese con Surmaq.</p>
      </Marco>
    );
  }
  const c = getCliente(e.clienteId);
  const ultimo = s.trabajos.filter((t) => t.equipoId === e.id && t.estado === "cerrado").sort((a, b) => (b.fechaCierre ?? "").localeCompare(a.fechaCierre ?? ""))[0];
  const p = PROBLEMAS.find((x) => x.k === problema);
  const telOk = telefono.replace(/\D/g, "").length >= 7;
  const listo = !!p && nombre.trim().length > 1 && telOk;

  if (enviada !== null) {
    return (
      <Marco>
        <CheckCircle2 className="text-ok" size={44} />
        <p className="mt-3 text-xl font-bold">Recibimos su pedido Nº {enviada}</p>
        <p className="mt-1 text-tinta-2">El equipo de mantenimiento de Surmaq lo revisará y lo llamará al {telefono} para confirmar la visita.</p>
      </Marco>
    );
  }

  const enviar = () => {
    const d = new Date(s.ahora.slice(0, 10) + "T00:00:00");
    do d.setDate(d.getDate() + 1); while (d.getDay() === 0 || d.getDay() === 6);
    s.crearSolicitud({
      vendedorId: "",
      origen: "cliente_qr",
      solicitante: { nombre: nombre.trim(), telefono, correo: correo || undefined },
      urgente,
      clienteId: c.id,
      contacto: nombre.trim(),
      equipoId: e.id,
      tipo: p!.tipo,
      descripcion: `${p!.l}${detalle.trim() ? `: ${detalle.trim()}` : ""}`,
      dpto: CIUDADES_QUITO.test(c.ciudad) ? "Quito" : "Guayaquil",
      fechaRequerida: urgente ? s.ahora.slice(0, 10) : toLocalIso(d).slice(0, 10),
      horaRequerida: urgente ? `${String(Math.min(17, Number(s.ahora.slice(11, 13)) + 1)).padStart(2, "0")}:00` : "09:00",
      duracionH: 2,
      notificarA: correo.includes("@") ? [correo] : [],
    });
    setEnviada(Math.max(99, ...s.solicitudes.map((x) => x.numero)) + 1);
  };

  return (
    <Marco>
      <div className="flex items-center gap-3">
        <MiniaturaEquipo linea={e.lineaProducto} foto={e.fotoUrl} size={56} />
        <div className="min-w-0">
          <p className="font-semibold">{e.nombre}</p>
          <p className="text-sm text-tinta-2">{e.marca} {e.modelo} · serie {e.serie}</p>
          <p className="text-sm text-tinta-2">{c.razonSocial}</p>
        </div>
      </div>
      {ultimo && <p className="mt-3 rounded-lg bg-fondo px-3 py-2 text-sm text-tinta-2">Último servicio: {fechaLarga(ultimo.fechaCierre)}</p>}

      <h1 className="mt-6 text-xl font-bold">¿Qué le pasa al equipo?</h1>
      <div role="radiogroup" aria-label="Problema" className="mt-3 grid grid-cols-2 gap-2">
        {PROBLEMAS.map(({ k, l, icono: I }) => (
          <button key={k} type="button" role="radio" aria-checked={problema === k} onClick={() => setProblema(k)}
            className={cx("flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-2 text-center text-sm font-semibold", problema === k ? "border-marca-800 bg-marca-50 text-marca-900" : "border-borde bg-superficie")}>
            <I size={22} /> {l}
          </button>
        ))}
      </div>
      <label className="mt-4 block text-sm">
        <span className="font-medium text-tinta-2">Cuéntenos más <span className="font-normal text-tinta-3">(opcional)</span></span>
        <textarea value={detalle} onChange={(ev) => setDetalle(ev.target.value)} rows={3} className={cx(claseCampo, "py-2")} />
      </label>
      <button type="button" role="switch" aria-checked={urgente} onClick={() => setUrgente(!urgente)}
        className={cx("mt-3 flex min-h-12 w-full items-center gap-2 rounded-xl border-2 px-3 text-left text-sm font-semibold", urgente ? "border-critico bg-critico-bg text-critico" : "border-borde")}>
        <AlertTriangle size={18} /> Es urgente: el equipo está detenido
      </button>

      <h2 className="mt-6 font-semibold">Sus datos</h2>
      <div className="mt-2 space-y-3">
        <label className="block text-sm"><span className="font-medium text-tinta-2">Nombre</span><input value={nombre} onChange={(ev) => setNombre(ev.target.value)} autoComplete="name" className={claseCampo} /></label>
        <label className="block text-sm"><span className="font-medium text-tinta-2">Teléfono / WhatsApp</span><input value={telefono} onChange={(ev) => setTelefono(ev.target.value)} inputMode="tel" autoComplete="tel" className={claseCampo} /></label>
        <label className="block text-sm"><span className="font-medium text-tinta-2">Correo <span className="font-normal text-tinta-3">(opcional)</span></span><input type="email" value={correo} onChange={(ev) => setCorreo(ev.target.value)} autoComplete="email" className={claseCampo} /></label>
      </div>
      <button type="button" disabled={!listo} onClick={enviar} className="mt-6 flex min-h-14 w-full items-center justify-center rounded-2xl bg-marca-800 text-[17px] font-semibold text-white disabled:bg-tinta-3/40">
        Pedir servicio técnico
      </button>
      {!listo && <p className="mt-2 text-center text-xs text-tinta-3">{!p ? "Elija qué le pasa al equipo" : !nombre.trim() ? "Escriba su nombre" : "Escriba un teléfono de contacto"}</p>}
      <p className="mt-4 text-center text-xs text-tinta-3">Código del equipo {e.codigoQr} · {fechaCorta(s.ahora)}</p>
    </Marco>
  );
}

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-fondo">
      <header className="bg-marca-900 px-4 py-4 text-white">
        <p className="text-lg font-bold">SURMAQ</p>
        <p className="text-sm text-marca-100">Servicio técnico</p>
      </header>
      <div className="mx-auto max-w-md px-4 py-5">
        <div className="rounded-2xl border border-borde bg-superficie p-4">{children}</div>
      </div>
    </main>
  );
}
