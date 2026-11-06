"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudOff } from "lucide-react";

/** Indicador de conexión: la app guarda localmente y sincroniza cuando vuelve la señal. */
export function Conexion() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const upd = () => setOnline(navigator.onLine);
    upd();
    window.addEventListener("online", upd);
    window.addEventListener("offline", upd);
    return () => {
      window.removeEventListener("online", upd);
      window.removeEventListener("offline", upd);
    };
  }, []);
  return online ? (
    <span className="inline-flex items-center gap-1 text-xs text-marca-100"><Cloud size={14} /> Sincronizado</span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-aviso-bg px-2 py-0.5 text-xs font-semibold text-aviso">
      <CloudOff size={14} /> Sin señal · se guarda en el teléfono
    </span>
  );
}
