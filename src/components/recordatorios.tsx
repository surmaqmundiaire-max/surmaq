"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BellRing, ChevronDown, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { recordatoriosTecnico, type Recordatorio } from "@/lib/recordatorios";
import { cx } from "./ui";

const KEY = "optimum-avisos-enviados";

const TONO: Record<Recordatorio["nivel"], string> = {
  critico: "bg-critico text-white",
  aviso: "bg-aviso-bg text-aviso",
  info: "bg-info-bg text-info",
};

/**
 * Recordatorios para que el técnico nunca deje una entrada o salida sin marcar.
 * Se muestran arriba en la app y, si el técnico lo permite, como notificación del teléfono.
 * (En producción se enviarán también desde el servidor aunque la app esté cerrada.)
 */
export function Recordatorios() {
  const s = useStore();
  const path = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [permiso, setPermiso] = useState<NotificationPermission | "no">("no");
  const lista = recordatoriosTecnico(s.visitas, s.trabajos, s.tecnicoActualId, s.ahora).filter((r) => !path.endsWith(r.href.split("/").pop()!));

  useEffect(() => {
    setPermiso("Notification" in window ? Notification.permission : "no");
  }, []);

  // Notificación del teléfono una sola vez por recordatorio
  useEffect(() => {
    if (permiso !== "granted") return;
    let enviados: string[] = [];
    try {
      enviados = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    } catch {}
    const nuevos = lista.filter((r) => (r.nivel !== "info" || r.id.startsWith("new-")) && !enviados.includes(r.id));
    for (const r of nuevos) {
      try {
        new Notification(r.titulo, { body: r.detalle, tag: r.id });
      } catch {}
    }
    if (nuevos.length) {
      navigator.vibrate?.(200);
      try {
        localStorage.setItem(KEY, JSON.stringify([...enviados, ...nuevos.map((r) => r.id)].slice(-100)));
      } catch {}
    }
  }, [lista, permiso]);

  if (lista.length === 0) return null;
  const [primero, ...resto] = lista;

  return (
    <div className="sticky top-0 z-30" role="region" aria-label="Recordatorios">
      <Fila r={primero} />
      {resto.length > 0 && (
        <>
          {abierto && resto.map((r) => <Fila key={r.id} r={r} />)}
          <button type="button" onClick={() => setAbierto(!abierto)} className="flex w-full items-center justify-center gap-1 bg-superficie py-1.5 text-xs font-semibold text-tinta-2 shadow-sm">
            {abierto ? "Ocultar" : `${resto.length} ${resto.length === 1 ? "recordatorio más" : "recordatorios más"}`} <ChevronDown size={14} className={cx("transition-transform", abierto && "rotate-180")} />
          </button>
        </>
      )}
      {permiso === "default" && (
        <button
          type="button"
          onClick={async () => setPermiso(await Notification.requestPermission())}
          className="flex w-full items-center justify-center gap-1.5 bg-marca-800 py-2 text-xs font-semibold text-white"
        >
          <BellRing size={14} /> Activar avisos en este teléfono
        </button>
      )}
    </div>
  );
}

function Fila({ r }: { r: Recordatorio }) {
  return (
    <Link href={r.href} className={cx("flex items-center gap-3 px-4 py-2.5", TONO[r.nivel])}>
      <BellRing size={18} className="shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{r.titulo}</span>
        <span className="block truncate text-xs opacity-90">{r.detalle}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-tinta">
        {r.accion} <ChevronRight size={14} />
      </span>
    </Link>
  );
}
