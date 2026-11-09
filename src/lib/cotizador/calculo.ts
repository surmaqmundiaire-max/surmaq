// Cálculo de la cotización (mismo método que el cotizador original de Maquinmotors).
import type { ConfigCot, Costos, Cotizacion, ItemCatalogo, NivelSueldo } from "./tipos";

export const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

/** Costo empresa mensual y por hora de un nivel, y tarifa de venta por hora. */
export function nivelCosto(n: NivelSueldo, c: Costos) {
  const s = +n.sueldo || 0;
  const mes = s + s * c.IESS_PAT + s * c.FONDOS + s / 12 + c.SBU / 12 + s / 24;
  const hora = mes / (c.HPROD || 160);
  return { mes, hora, tarifa: r2(hora * c.FACTOR) };
}
export const tarifas = (c: Costos) => c.niveles.map((n) => ({ cod: n.cod, nombre: n.nombre, tarifa: nivelCosto(n, c).tarifa, hora: nivelCosto(n, c).hora }));

const byName = <T extends { n: string }>(arr: T[], n: string): T => arr.find((x) => x.n === n) ?? arr[0];

export function crew(cfg: ConfigCot, cx: string) {
  const c = cfg.cuadrillas.find((x) => x.cx === cx);
  let pers = 0, rate = 0, cost = 0;
  const comp: Record<string, number> = {};
  for (const t of tarifas(cfg.costos)) {
    const k = c ? Number(c[t.cod as keyof typeof c]) || 0 : 0;
    if (k) { comp[t.cod] = k; pers += k; rate += k * t.tarifa; cost += k * t.hora; }
  }
  return { pers, rate, cost, comp };
}

export interface LineaCalculada {
  idx: number; it?: ItemCatalogo; escala: { n: string; f: number; cert?: boolean }; hor: { n: string; rec: number };
  cant: number; hU: number; h: number; mo: number; co: number; cr: ReturnType<typeof crew>;
}

export function calcular(q: Pick<Cotizacion, "lineas" | "ciudad" | "entorno" | "descuento"> & { kmOverride?: number }, cfg: ConfigCot) {
  const P = cfg.params;
  const ent = byName(cfg.entornos, q.entorno);
  const tar = tarifas(cfg.costos);
  const tarifa = (cod: string) => tar.find((x) => x.cod === cod)?.tarifa ?? 0;
  const costoHora = (cod: string) => tar.find((x) => x.cod === cod)?.hora ?? 0;
  const lines: LineaCalculada[] = [];
  const need: Record<string, number> = {};
  const eqH: Record<string, number> = {};
  let HT = 0, MO = 0, CMO = 0;
  q.lineas.forEach((l, idx) => {
    const it = cfg.catalogo.find((x) => x.cod === l.cod);
    const cr = crew(cfg, it?.cx ?? "");
    if (!it) { lines.push({ idx, escala: { n: "—", f: 1 }, hor: { n: "", rec: 0 }, cant: 0, hU: 0, h: 0, mo: 0, co: 0, cr }); return; }
    const escala = it.escala === "altura" ? byName(cfg.alturas, l.alt) : it.escala === "tamano" ? byName(cfg.tamanos, l.tam) : { n: "—", f: 1 };
    const hor = byName(cfg.horarios, l.hor);
    const cant = Math.max(0, +l.cant || 0);
    const hU = it.horas * (+escala.f || 1) * (+ent.f || 1);
    const h = hU * cant;
    const mo = h * cr.rate * (1 + (+hor.rec || 0));
    const co = h * cr.cost * (1 + (+hor.rec || 0));
    HT += h; MO += mo; CMO += co;
    for (const k in cr.comp) need[k] = Math.max(need[k] || 0, cr.comp[k]);
    if (it.escala === "altura") { const a = byName(cfg.alturas, l.alt); if (+a.costo > 0) eqH[a.n] = (eqH[a.n] || 0) + h; }
    lines.push({ idx, it, escala, hor, cant, hU, h, mo, co, cr });
  });
  let CR = 0, TC = 0, TCc = 0;
  for (const k in need) { CR += need[k]; TC += need[k] * tarifa(k); TCc += need[k] * costoHora(k); }
  const c = cfg.ciudades.find((x) => x.n === q.ciudad) ?? { km: 0, modo: "Terrestre", n: q.ciudad, prov: "", reg: "" };
  const aereo = c.modo === "Aéreo", km = q.kmOverride ?? (+c.km || 0);
  const ida = aereo ? P.T_AEREO : km / P.VEL, reg = aereo ? P.T_AEREO : km / P.VEL_REG;
  const DT = HT > 0 ? Math.ceil(HT / P.JORNADA - 1e-9) : 0;
  const PN = HT > 0 && (aereo || km >= P.D_PERN || (DT > 1 && km > P.D_REG));
  const VJ = HT === 0 ? 0 : PN ? 1 : DT;
  const TIR = VJ ? ida + reg : 0, HTR = VJ * TIR, TTS = HT + HTR;
  const VH = CR ? Math.ceil(CR / P.PAX_VEH) : 0;
  const KMR = aereo ? P.KM_LOCAL * DT : VJ * 2 * km * VH;
  const DV = HT === 0 ? 0 : !aereo && km <= P.R_URB ? 0 : PN ? Math.ceil((HT + TIR) / P.JORNADA_MAX - 1e-9) : DT;
  const NH = PN ? Math.max(1, DV - 1) : 0;
  const AJ = HT > 0 && HT < P.HMIN ? (P.HMIN - HT) * TC : 0;
  const CV = KMR * P.COSTO_KM, PA = aereo ? CR * P.PASAJE : 0, TR = HTR * TC * P.PCT_TRASLADO;
  const AL = DV * CR * P.ALIM, HO = NH * CR * P.HOSP;
  const eq: { n: string; dias: number; costo: number; total: number }[] = [];
  let EQ = 0;
  if (+P.COBRAR_EQ_ALTURA) for (const n in eqH) { const a = byName(cfg.alturas, n); const d = Math.ceil(eqH[n] / P.JORNADA - 1e-9); eq.push({ n: a.eq, dias: d, costo: a.costo, total: d * a.costo }); EQ += d * a.costo; }
  const S1 = MO + AJ, DES = S1 * (Math.min(30, Math.max(0, +q.descuento || 0)) / 100), S2 = CV + PA + TR + AL + HO + EQ;
  const ST = S1 - DES + S2, IV = ST * P.IVA, TT = ST + IV;
  const costoInt = CMO + HTR * TCc + CV + PA + AL + HO + EQ;
  return { lines, need, CR, TC, c, aereo, km, ida, reg, DT, PN, VJ, TIR, HTR, HT, TTS, VH, KMR, DV, NH, MO, AJ, CV, PA, TR, AL, HO, EQ, eq, S1, DES, S2, ST, IV, TT, costoInt, margen: ST - costoInt, ent };
}
export type Resultado = ReturnType<typeof calcular>;

export function zona(c: { modo: string; km: number } | undefined, P: ConfigCot["params"]) {
  if (!c) return "";
  if (c.modo === "Aéreo") return "Especial (aéreo)";
  const k = +c.km;
  if (k <= P.R_URB) return "Urbana";
  if (k <= P.D_REG) return "Zona 1 – Regional";
  if (k < P.D_PERN) return "Zona 2 – Media distancia";
  if (k <= 450) return "Zona 3 – Larga distancia";
  return "Zona 4 – Muy larga distancia";
}

export const CERTS: Record<string, string> = { electrica: "Instalaciones eléctricas", pintura: "Sistemas de pintura Gema / Binks" };
