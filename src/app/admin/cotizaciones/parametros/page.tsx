"use client";

import Link from "next/link";
import { ArrowLeft, Lock, RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";
import { perfil, puede } from "@/lib/selectors";
import { nivelCosto } from "@/lib/cotizador/calculo";
import type { Parametros } from "@/lib/cotizador/tipos";
import { usd } from "@/components/cotizador/editor";
import { useAviso } from "@/components/aviso";

const CAMPOS: [keyof Parametros, string, string?][] = [
  ["EMPRESA", "Empresa (documento)"], ["BASE", "Dirección base"], ["VALIDEZ", "Validez de la oferta", "días"],
  ["IVA", "IVA", "fracción (0,15 = 15 %)"], ["VEL", "Velocidad de ida", "km/h"], ["VEL_REG", "Velocidad de regreso", "km/h"],
  ["COSTO_KM", "Costo por km de vehículo", "USD"], ["PAX_VEH", "Personas por vehículo"], ["PCT_TRASLADO", "Horas de traslado que se cobran", "fracción"],
  ["ALIM", "Alimentación por persona y día", "USD"], ["HOSP", "Hospedaje por persona y noche", "USD"], ["PASAJE", "Pasaje aéreo por persona", "USD"],
  ["T_AEREO", "Tiempo de viaje aéreo", "h"], ["R_URB", "Radio urbano sin viático", "km"], ["D_REG", "Distancia regional", "km"],
  ["D_PERN", "Distancia con pernocta", "km"], ["JORNADA", "Jornada", "h"], ["JORNADA_MAX", "Jornada máxima con viaje", "h"], ["HMIN", "Mínimo de horas por visita", "h"],
];

export default function ParametrosCotizador() {
  const s = useStore();
  const aviso = useAviso();
  const yo = perfil(s.usuarioActualId);
  const editor = puede(yo.rol, "editar_cotizador");
  const verCostos = puede(yo.rol, "ver_costos");
  const { costos, params } = s.configCot;
  if (!verCostos) {
    return (
      <div className="mx-auto mt-10 max-w-md rounded-2xl border border-borde bg-superficie p-6 text-center">
        <Lock className="mx-auto text-tinta-3" size={32} />
        <p className="mt-2 font-semibold">Solo administración y jefatura ven los costos y parámetros.</p>
        <Link href="/admin/cotizaciones" className="mt-3 inline-block font-semibold text-marca-700">Volver a cotizaciones</Link>
      </div>
    );
  }
  const setParam = (k: keyof Parametros, v: string) => s.setConfigCot({ params: { ...params, [k]: typeof params[k] === "number" ? Number(v.replace(",", ".")) || 0 : v } });
  const setCosto = (k: "SBU" | "IESS_PAT" | "FONDOS" | "HPROD" | "FACTOR", v: string) => s.setConfigCot({ costos: { ...costos, [k]: Number(v.replace(",", ".")) || 0 } });
  const setSueldo = (cod: string, v: string) => s.setConfigCot({ costos: { ...costos, niveles: costos.niveles.map((n) => (n.cod === cod ? { ...n, sueldo: Number(v) || 0 } : n)) } });

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link href="/admin/cotizaciones" className="inline-flex items-center gap-1 text-sm font-semibold text-marca-700 hover:underline"><ArrowLeft size={16} /> Cotizaciones</Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Parámetros del cotizador</h1>
          <p className="text-sm text-tinta-2">Sueldos por nivel, factor de venta, viáticos y distancias. {editor ? "Los cambios se guardan al momento." : "Solo lectura."}</p>
        </div>
        {editor && (
          <button type="button" onClick={() => { s.restaurarConfigCot(); aviso("Valores originales restaurados"); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-borde bg-superficie px-3 text-sm font-semibold"><RotateCcw size={15} /> Restaurar valores originales</button>
        )}
      </div>

      <section className="rounded-2xl border border-borde bg-superficie p-4">
        <h2 className="mb-1 font-semibold">Niveles de técnico y tarifas</h2>
        <p className="mb-3 text-sm text-tinta-2">Costo empresa = sueldo + IESS patronal + fondos de reserva + décimos + vacaciones, dividido para {costos.HPROD} h productivas. Tarifa = costo/hora × factor {costos.FACTOR}.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs text-tinta-2"><tr>{["Nivel", "Perfil", "Sueldo", "Costo/hora", "Tarifa de venta/hora"].map((h) => <th key={h} className="px-2 py-2 font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-borde">
              {costos.niveles.map((n) => {
                const c = nivelCosto(n, costos);
                return (
                  <tr key={n.cod}>
                    <td className="px-2 py-2 font-semibold">{n.cod}</td>
                    <td className="px-2 py-2"><span className="font-medium">{n.nombre}</span><span className="block text-xs text-tinta-3">{n.perfil}</span></td>
                    <td className="px-2 py-2">{editor ? <input type="number" value={n.sueldo} onChange={(e) => setSueldo(n.cod, e.target.value)} aria-label={`Sueldo ${n.cod}`} className="h-9 w-24 rounded-lg border border-borde px-2 text-right tabular" /> : usd(n.sueldo)}</td>
                    <td className="px-2 py-2 tabular">{usd(c.hora)}</td>
                    <td className="px-2 py-2 font-semibold tabular">{usd(c.tarifa)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 @xl:grid-cols-5">
          {([["SBU", "Salario básico (SBU)"], ["IESS_PAT", "IESS patronal"], ["FONDOS", "Fondos de reserva"], ["HPROD", "Horas productivas/mes"], ["FACTOR", "Factor de venta"]] as const).map(([k, l]) => (
            <label key={k} className="text-xs text-tinta-2">{l}
              <input type="number" step="any" disabled={!editor} value={costos[k]} onChange={(e) => setCosto(k, e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-borde px-2 text-sm tabular" />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-borde bg-superficie p-4">
        <h2 className="mb-3 font-semibold">Viaje, viáticos y documento</h2>
        <div className="grid grid-cols-1 gap-3 @xl:grid-cols-3">
          {CAMPOS.map(([k, l, u]) => (
            <label key={k} className="text-xs text-tinta-2">{l}{u && <span className="text-tinta-3"> · {u}</span>}
              <input type={typeof params[k] === "number" ? "number" : "text"} step="any" disabled={!editor} value={params[k]} onChange={(e) => setParam(k, e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-borde px-2 text-sm" />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
