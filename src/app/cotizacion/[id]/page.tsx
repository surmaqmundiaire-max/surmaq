"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Printer } from "lucide-react";
import { useAviso } from "@/components/aviso";
import { useStore } from "@/lib/store";
import { calcular } from "@/lib/cotizador/calculo";
import { kmDesdeBase } from "@/lib/cotizador/config";
import { usd } from "@/components/cotizador/editor";
import { equiposCot } from "@/lib/cotizador/tipos";

const hrs = (n: number) => (Number(n) || 0).toLocaleString("es-EC", { maximumFractionDigits: 2 }) + " h";

/** Documento de la cotización para el cliente (imprimible o guardable como PDF). */
export default function DocumentoCotizacion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const s = useStore();
  const router = useRouter();
  const aviso = useAviso();
  const q = s.cotizaciones.find((c) => c.id === id);
  if (!q) return <p className="p-6">No se encontró la cotización.</p>;
  const cfg = s.configCot;
  const P = cfg.params;
  const R = calcular({ ...q, kmOverride: kmDesdeBase(q.base, q.ciudad, cfg) }, cfg);
  const lineas = R.lines.filter((L) => L.it);
  const eqs = equiposCot(q).map((eid) => s.equipos.find((e) => e.id === eid)).filter((e) => !!e);
  const nombreEq = (eid?: string) => (eqs.length > 1 ? eqs.find((e) => e.id === eid)?.nombre : undefined);
  const copiar = async () => {
    const txt = [
      `${P.EMPRESA} – Cotización de servicio técnico ${q.numero}`,
      `Fecha: ${q.fecha}`,
      `Cliente: ${q.cliente}${q.ruc ? ` (RUC ${q.ruc})` : ""}`,
      `Lugar: ${q.ciudad}${q.lugar ? ` – ${q.lugar}` : ""}`,
      `Duración estimada: ${R.DT} día(s) de trabajo`,
      "",
      ...lineas.map((L) => `• ${L.it!.cod} ${L.it!.act}${nombreEq(q.lineas[L.idx].equipoId) ? ` (${nombreEq(q.lineas[L.idx].equipoId)})` : ""} — ${L.cant} ${L.it!.unidad} · ${hrs(L.h)} · ${usd(L.mo)}`),
      "",
      `Mano de obra: ${usd(R.S1 - R.DES)}`,
      `Movilización: ${usd(R.TR + R.CV + R.PA)}`,
      ...(R.AL + R.HO > 0 ? [`Viáticos: ${usd(R.AL + R.HO)}`] : []),
      ...R.eq.map((e) => `${e.n}: ${usd(e.total)}`),
      `Subtotal: ${usd(R.ST)}`,
      `IVA ${(P.IVA * 100).toFixed(0)} %: ${usd(R.IV)}`,
      `TOTAL: ${usd(R.TT)}`,
      ...(q.notas ? ["", `Notas: ${q.notas}`] : []),
      "",
      `Validez de la oferta: ${P.VALIDEZ} días.`,
    ].join("\n");
    try { await navigator.clipboard.writeText(txt); aviso("Texto copiado: pégalo en el correo o WhatsApp"); } catch { aviso("No se pudo copiar"); }
  };
  const altura = lineas.some((L) => L.it!.escala === "altura" && (L.escala as { cert?: boolean }).cert);

  return (
    <main className="min-h-dvh bg-fondo px-4 py-6 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-4xl flex-wrap gap-2 print:hidden">
        <button type="button" onClick={() => router.back()} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-borde bg-superficie px-3 text-sm font-semibold"><ArrowLeft size={16} /> Volver</button>
        <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-marca-800 px-4 text-sm font-semibold text-white"><Printer size={16} /> Imprimir / guardar PDF</button>
        <button type="button" onClick={copiar} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-borde bg-superficie px-3 text-sm font-semibold"><Copy size={16} /> Copiar texto</button>
      </div>
      <article className="mx-auto max-w-4xl rounded-2xl bg-white p-6 text-[13px] text-[#152033] shadow-sm sm:p-8 print:rounded-none print:p-0 print:shadow-none">
        <header className="flex flex-wrap justify-between gap-4 border-b-[3px] border-[#1F3864] pb-3">
          <div>
            <p className="text-2xl font-bold tracking-wide text-[#1F3864]">MAQUIN<span className="text-[#C00000]">MOTORS</span></p>
            <p>{P.EMPRESA}</p>
            <p className="text-[#5A6577]">{P.BASE}</p>
          </div>
          <div className="text-right">
            <h1 className="text-xl font-bold text-[#1F3864]">Cotización de servicio técnico</h1>
            <p className="font-mono">{q.numero}</p>
            <p>Fecha: {q.fecha}</p>
          </div>
        </header>
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-3">
          <div><b>Cliente:</b> {q.cliente}</div>
          <div><b>RUC:</b> {q.ruc || "—"}</div>
          <div><b>Contacto:</b> {q.contacto || "—"}</div>
          <div><b>Lugar:</b> {q.ciudad}{q.lugar ? ` – ${q.lugar}` : ""}</div>
          <div><b>Fecha tentativa:</b> {q.fechaTrabajo || "Por coordinar"}</div>
          <div><b>Duración estimada:</b> {R.DT} día(s) de trabajo</div>
        </dl>
        {eqs.length > 0 && (
          <div className="mt-3">
            <b>{eqs.length === 1 ? "Equipo:" : `Equipos (${eqs.length}):`}</b>
            <ul className="mt-1 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
              {eqs.map((e) => <li key={e.id}>• {e.nombre} — {e.marca} {e.modelo}{e.serie ? ` · Serie ${e.serie}` : ""}</li>)}
            </ul>
          </div>
        )}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="bg-[#1F3864] text-left text-[11.5px] text-white">
                <th className="px-2 py-1.5">Código</th><th className="px-2 py-1.5">Descripción</th><th className="px-2 py-1.5 text-right">Cant.</th><th className="px-2 py-1.5 text-right">Horas</th><th className="px-2 py-1.5 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="[&_td]:border-b [&_td]:border-[#D6DCE6] [&_td]:px-2 [&_td]:py-1.5 [&_td.tabular]:whitespace-nowrap">
              {lineas.map((L) => (
                <tr key={L.idx}>
                  <td className="font-mono whitespace-nowrap">{L.it!.cod}</td>
                  <td>{L.it!.act}{nombreEq(q.lineas[L.idx].equipoId) && <span className="font-semibold"> — {nombreEq(q.lineas[L.idx].equipoId)}</span>}<div className="text-[11.5px] text-[#5A6577]">{L.it!.alcance}{L.it!.escala === "altura" ? ` · Altura: ${L.escala.n}` : L.it!.escala === "tamano" ? ` · Tamaño: ${L.escala.n}` : L.it!.escala === "potencia" ? ` · Potencia: ${L.escala.n}` : ""}{L.hor.rec ? ` · ${L.hor.n}` : ""}</div></td>
                  <td className="text-right whitespace-nowrap tabular">{L.cant} {L.it!.unidad}</td>
                  <td className="text-right tabular">{hrs(L.h)}</td>
                  <td className="text-right tabular">{usd(L.mo)}</td>
                </tr>
              ))}
              <tr className="font-semibold"><td /><td>Mano de obra</td><td /><td className="text-right tabular">{hrs(R.HT)}</td><td className="text-right tabular">{usd(R.S1 - R.DES)}</td></tr>
              <tr><td /><td>Movilización: traslado ida ({hrs(R.ida)}) + regreso ({hrs(R.reg)}), vehículo{R.PA ? ", pasajes aéreos" : ""}</td><td /><td className="text-right tabular">{hrs(R.HTR)}</td><td className="text-right tabular">{usd(R.TR + R.CV + R.PA)}</td></tr>
              {R.AL + R.HO > 0 && <tr><td /><td>Viáticos: alimentación y hospedaje ({R.CR} pers., {R.DV} día(s))</td><td /><td /><td className="text-right tabular">{usd(R.AL + R.HO)}</td></tr>}
              {R.eq.map((e) => <tr key={e.n}><td /><td>{e.n} – {e.dias} día(s)</td><td /><td /><td className="text-right tabular">{usd(e.total)}</td></tr>)}
              <tr className="font-semibold"><td /><td>Subtotal</td><td /><td /><td className="text-right tabular">{usd(R.ST)}</td></tr>
              <tr><td /><td>IVA {(P.IVA * 100).toFixed(0)} %</td><td /><td /><td className="text-right tabular">{usd(R.IV)}</td></tr>
              <tr className="text-base font-bold text-[#C00000] [&_td]:border-b-0"><td /><td>TOTAL</td><td /><td /><td className="text-right tabular">{usd(R.TT)}</td></tr>
            </tbody>
          </table>
        </div>
        {q.notas && <p className="mt-3"><b>Notas:</b> {q.notas}</p>}
        <p className="mt-4 text-[11.5px] text-[#5A6577]">
          Valores de mano de obra. No incluyen tubería, cable, accesorios, repuestos, aceites, filtros, pintura ni insumos. {altura ? "Los trabajos en altura se ejecutan con permiso de trabajo y personal certificado. " : ""}
          Validez de la oferta: {P.VALIDEZ} días. Trabajos en el horario indicado; los cambios de horario se recalculan.
        </p>
      </article>
    </main>
  );
}
