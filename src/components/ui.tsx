import Link from "next/link";
import { AlertTriangle, CheckCircle2, Circle, CircleDot, Clock, OctagonAlert, XCircle } from "lucide-react";
import type { EstadoTrabajo, EstadoVisita } from "@/lib/types";
import { iniciales } from "@/lib/format";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

type Tono = "ok" | "aviso" | "critico" | "info" | "neutro";
const TONOS: Record<Tono, string> = {
  ok: "bg-ok-bg text-ok",
  aviso: "bg-aviso-bg text-aviso",
  critico: "bg-critico-bg text-critico",
  info: "bg-info-bg text-info",
  neutro: "bg-fondo text-tinta-2",
};

export function Badge({ tono = "neutro", icono, children, className }: { tono?: Tono; icono?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap", TONOS[tono], className)}>
      {icono}
      {children}
    </span>
  );
}

const EV: Record<EstadoVisita, { tono: Tono; label: string; icono: React.ReactNode }> = {
  programada: { tono: "neutro", label: "Programada", icono: <Clock size={12} /> },
  en_curso: { tono: "info", label: "En curso", icono: <CircleDot size={12} className="pulso" /> },
  finalizada: { tono: "ok", label: "Finalizada", icono: <CheckCircle2 size={12} /> },
  cancelada: { tono: "critico", label: "Cancelada", icono: <XCircle size={12} /> },
};
export const EstadoVisitaBadge = ({ estado }: { estado: EstadoVisita }) => (
  <Badge tono={EV[estado].tono} icono={EV[estado].icono}>{EV[estado].label}</Badge>
);

const ET: Record<EstadoTrabajo, { tono: Tono; label: string; icono: React.ReactNode }> = {
  abierto: { tono: "neutro", label: "Abierto", icono: <Circle size={12} /> },
  en_progreso: { tono: "info", label: "En progreso", icono: <CircleDot size={12} /> },
  cerrado: { tono: "ok", label: "Cerrado", icono: <CheckCircle2 size={12} /> },
  cancelado: { tono: "critico", label: "Cancelado", icono: <XCircle size={12} /> },
};
export const EstadoTrabajoBadge = ({ estado }: { estado: EstadoTrabajo }) => (
  <Badge tono={ET[estado].tono} icono={ET[estado].icono}>{ET[estado].label}</Badge>
);

export const IconoNivel = ({ nivel, size = 18 }: { nivel: "critica" | "advertencia"; size?: number }) =>
  nivel === "critica" ? <OctagonAlert size={size} className="text-critico shrink-0" aria-label="Crítico" /> : <AlertTriangle size={size} className="text-aviso shrink-0" aria-label="Advertencia" />;

const COLORES_AVATAR = ["bg-marca-700", "bg-marca-800", "bg-marca-600", "bg-marca-900", "bg-[#3b5b7c]"];
export function Avatar({ nombre, size = 40 }: { nombre: string; size?: number }) {
  const i = nombre.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % COLORES_AVATAR.length;
  return (
    <span
      className={cx("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white", COLORES_AVATAR[i])}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {iniciales(nombre)}
    </span>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("rounded-2xl border border-borde bg-superficie", className)}>{children}</div>;
}

export function Barra({ valor, className }: { valor: number; className?: string }) {
  return (
    <div className={cx("h-2 w-full overflow-hidden rounded-full bg-fondo", className)} role="progressbar" aria-valuenow={valor} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-marca-700 transition-all" style={{ width: `${valor}%` }} />
    </div>
  );
}

export function Vacio({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-borde px-4 py-6 text-center text-sm text-tinta-3">{children}</p>;
}

export function Enlace({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cx("font-medium text-marca-700 hover:underline", className)}>
      {children}
    </Link>
  );
}
