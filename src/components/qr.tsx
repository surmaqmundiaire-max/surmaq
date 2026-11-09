"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, QrCode } from "lucide-react";
import type { Equipo } from "@/lib/types";
import { cliente as getCliente } from "@/lib/selectors";

/** Dirección pública que abre el QR: el cliente pide servicio técnico sin usuario ni contraseña. */
export const urlServicio = (codigoQr: string) => `${typeof window !== "undefined" ? window.location.origin : ""}/s/${codigoQr}`;

export function CodigoQR({ texto, size = 160 }: { texto: string; size?: number }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(texto, { margin: 1, width: size * 2, errorCorrectionLevel: "M", color: { dark: "#061a30", light: "#ffffff" } })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [texto, size]);
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={`Código QR: ${texto}`} width={size} height={size} className="block" />
  ) : (
    <span className="flex items-center justify-center bg-fondo text-tinta-3" style={{ width: size, height: size }}><QrCode size={size / 3} /></span>
  );
}

/** Etiqueta para pegar en el equipo (≈ 100 × 60 mm al imprimir). */
export function EtiquetaEquipo({ equipo, escala = 1 }: { equipo: Equipo; escala?: number }) {
  const [url, setUrl] = useState("");
  useEffect(() => setUrl(urlServicio(equipo.codigoQr)), [equipo.codigoQr]);
  const c = getCliente(equipo.clienteId);
  return (
    <div className="etiqueta-qr flex items-stretch gap-3 overflow-hidden rounded-xl border-2 border-marca-900 bg-white p-3 text-tinta" style={{ width: 380 * escala, minHeight: 228 * escala, fontSize: 12 * escala }}>
      <div className="flex shrink-0 flex-col items-center justify-center">
        {url && <CodigoQR texto={url} size={150 * escala} />}
        <span className="mt-1 font-mono font-bold tracking-wide" style={{ fontSize: 13 * escala }}>{equipo.codigoQr}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="font-bold text-marca-900" style={{ fontSize: 15 * escala }}>SURMAQ</p>
        <p className="font-semibold" style={{ fontSize: 13 * escala }}>¿Necesita servicio técnico?</p>
        <p className="leading-snug text-tinta-2">Escanee este código con la cámara de su celular y pida la visita en un minuto.</p>
        <dl className="mt-auto space-y-0.5 border-t border-borde pt-1.5 leading-tight">
          <div className="truncate font-semibold">{equipo.nombre}</div>
          <div className="truncate">{equipo.marca} {equipo.modelo}</div>
          <div className="truncate">Serie: {equipo.serie}</div>
          <div className="truncate text-tinta-2">{c.razonSocial}</div>
        </dl>
      </div>
    </div>
  );
}

/** En la ficha del equipo: vista de la etiqueta, imprimir y confirmar que quedó pegada. */
export function SeccionEtiqueta({ equipo, onPegada, compacta }: { equipo: Equipo; onPegada: (pegada: boolean) => void; compacta?: boolean }) {
  const pegada = !!equipo.etiquetaPegadaEn;
  return (
    <div className="space-y-3">
      <div className="flex justify-center overflow-hidden">
        <EtiquetaEquipo equipo={equipo} escala={compacta ? 0.78 : 0.9} />
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={`/etiqueta/${equipo.id}`} className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-marca-800 px-4 text-sm font-semibold text-marca-800 hover:bg-marca-50">
          <QrCode size={17} /> Imprimir etiqueta
        </a>
        <button
          type="button"
          role="switch"
          aria-checked={pegada}
          onClick={() => onPegada(!pegada)}
          className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold ${pegada ? "bg-ok text-white" : "bg-fondo text-tinta"}`}
        >
          {pegada ? <><Check size={17} /> Etiqueta pegada en el equipo</> : "Marcar: etiqueta pegada"}
        </button>
      </div>
    </div>
  );
}
