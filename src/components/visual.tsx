// Sistema visual de reconocimiento rápido: color + ícono por tipo de trabajo y por línea de equipo.
import {
  Box, Building2, ClipboardList, Cog, Crown, Handshake, HardHat, ShieldCheck, Cpu, Cylinder, Fan, Gauge, PackagePlus, Paintbrush, Power, ScanSearch, Snowflake, SprayCan, Waypoints, Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Rol, TipoTrabajo } from "@/lib/types";
import { ROL_LABEL } from "@/lib/selectors";
import { TIPO_LABEL } from "@/lib/mock-data";
import { cx } from "./ui";

export const TIPO_VISUAL: Record<TipoTrabajo, { icono: LucideIcon; solido: string; chip: string; texto: string }> = {
  mantenimiento: { icono: Wrench, solido: "bg-t-mant", chip: "bg-t-mant-bg text-t-mant-tx", texto: "text-t-mant-tx" },
  revision: { icono: ScanSearch, solido: "bg-t-rev", chip: "bg-t-rev-bg text-t-rev-tx", texto: "text-t-rev-tx" },
  instalacion: { icono: PackagePlus, solido: "bg-t-ins", chip: "bg-t-ins-bg text-t-ins-tx", texto: "text-t-ins-tx" },
  arranque: { icono: Power, solido: "bg-t-arr", chip: "bg-t-arr-bg text-t-arr-tx", texto: "text-t-arr-tx" },
  ensamblaje: { icono: Cog, solido: "bg-t-ens", chip: "bg-t-ens-bg text-t-ens-tx", texto: "text-t-ens-tx" },
};

/** Cuadro de color con el ícono del tipo de trabajo. */
export function IconoTipo({ tipo, size = 40 }: { tipo: TipoTrabajo; size?: number }) {
  const V = TIPO_VISUAL[tipo];
  const I = V.icono;
  return (
    <span className={cx("inline-flex shrink-0 items-center justify-center rounded-xl text-white", V.solido)} style={{ width: size, height: size }} title={TIPO_LABEL[tipo]}>
      <I size={Math.round(size * 0.52)} strokeWidth={2.2} aria-hidden />
    </span>
  );
}

/** Etiqueta del tipo de trabajo con su color e ícono. */
export function ChipTipo({ tipo, className }: { tipo: TipoTrabajo; className?: string }) {
  const V = TIPO_VISUAL[tipo];
  const I = V.icono;
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap", V.chip, className)}>
      <I size={12} strokeWidth={2.4} aria-hidden /> {TIPO_LABEL[tipo]}
    </span>
  );
}

const LINEA_ICONO: [RegExp, LucideIcon][] = [
  [/tornillo/i, Fan],
  [/pist[oó]n/i, Cylinder],
  [/tratamiento|secador|aire$/i, Snowflake],
  [/tuber/i, Waypoints],
  [/polvo/i, SprayCan],
  [/pintura/i, Paintbrush],
  [/automat/i, Cpu],
  [/instrument/i, Gauge],
];

export const iconoLinea = (linea: string): LucideIcon => LINEA_ICONO.find(([re]) => re.test(linea))?.[1] ?? Box;

/** Miniatura del equipo: su foto si la tiene, si no el ícono de su línea. */
export function MiniaturaEquipo({ linea, foto, size = 56 }: { linea: string; foto?: string; size?: number }) {
  if (foto) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={foto} alt="" className="shrink-0 rounded-xl object-cover" style={{ width: size, height: size }} />;
  }
  const I = iconoLinea(linea);
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-xl bg-marca-100 text-marca-800" style={{ width: size, height: size }} title={linea}>
      <I size={Math.round(size * 0.48)} strokeWidth={1.9} aria-hidden />
    </span>
  );
}

/** Quién debe resolver un pendiente: el cliente o Surmaq. */
export function ChipResponsable({ responsable }: { responsable: "cliente" | "surmaq" }) {
  const cli = responsable === "cliente";
  const I = cli ? Building2 : HardHat;
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap", cli ? "bg-aviso-bg text-aviso" : "bg-info-bg text-info")}>
      <I size={12} strokeWidth={2.4} aria-hidden /> {cli ? "Cliente" : "Surmaq"}
    </span>
  );
}

/** Cuadro de ícono genérico con tono (para encabezados de sección e indicadores). */
export function Ficha({ icono: I, tono = "marca", size = 36 }: { icono: LucideIcon; tono?: "marca" | "ok" | "aviso" | "critico" | "info"; size?: number }) {
  const t = { marca: "bg-marca-100 text-marca-800", ok: "bg-ok-bg text-ok", aviso: "bg-aviso-bg text-aviso", critico: "bg-critico-bg text-critico", info: "bg-info-bg text-info" }[tono];
  return (
    <span className={cx("inline-flex shrink-0 items-center justify-center rounded-xl", t)} style={{ width: size, height: size }}>
      <I size={Math.round(size * 0.5)} strokeWidth={2.1} aria-hidden />
    </span>
  );
}

export const ROL_VISUAL: Record<Rol, { icono: LucideIcon; chip: string }> = {
  admin: { icono: ShieldCheck, chip: "bg-marca-100 text-marca-900" },
  jefe: { icono: Crown, chip: "bg-t-ins-bg text-t-ins-tx" },
  coordinador: { icono: ClipboardList, chip: "bg-t-rev-bg text-t-rev-tx" },
  tecnico: { icono: HardHat, chip: "bg-t-ens-bg text-t-ens-tx" },
  vendedor: { icono: Handshake, chip: "bg-t-arr-bg text-t-arr-tx" },
};

/** Etiqueta del rol del usuario con su ícono. */
export function ChipRol({ rol }: { rol: Rol }) {
  const V = ROL_VISUAL[rol];
  const I = V.icono;
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap", V.chip)}>
      <I size={12} strokeWidth={2.4} aria-hidden /> {ROL_LABEL[rol]}
    </span>
  );
}
