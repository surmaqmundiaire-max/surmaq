import type { ConfigCot, GrupoPotencia } from "./tipos";
import * as D from "./datos";

export const CONFIG_COT_DEF: ConfigCot = {
  costos: D.COSTOS_DEF,
  params: D.PARAMS_DEF,
  cuadrillas: D.CUADRILLAS_DEF,
  tamanos: D.TAMANOS_DEF,
  horarios: D.HORARIOS_DEF,
  alturas: D.ALTURAS_DEF,
  entornos: D.ENTORNOS_DEF,
  catalogo: D.CATALOGO_DEF,
  ciudades: D.CIUDADES_DEF,
  potencias: D.POTENCIAS_DEF,
};

/** Completa una configuración guardada con lo nuevo (franjas, variadores), sin perder los cambios del usuario. */
export function migrarConfigCot(cfg?: Partial<ConfigCot>): ConfigCot {
  if (!cfg) return CONFIG_COT_DEF;
  const c = { ...CONFIG_COT_DEF, ...cfg } as ConfigCot;
  const def = new Map(D.CATALOGO_DEF.map((x) => [x.cod, x]));
  const catalogo = c.catalogo.map((x) => {
    const d = def.get(x.cod);
    if (!d) return x;
    let y = x;
    if (d.escala === "potencia" && x.escala === "tamano") y = { ...y, escala: d.escala, pot: d.pot };
    if (d.fam !== x.fam && d.fam === "vfd") y = { ...y, fam: d.fam };
    return y;
  });
  const cods = new Set(catalogo.map((x) => x.cod));
  const nuevos = D.CATALOGO_DEF.filter((x) => !cods.has(x.cod));
  const cuadrillas = [...c.cuadrillas, ...D.CUADRILLAS_DEF.filter((d) => !c.cuadrillas.some((x) => x.cx === d.cx))];
  const previas = cfg.potencias ?? [];
  const potencias = [
    ...previas.map((g) => ({ ...g, u: g.u ?? D.POTENCIAS_DEF.find((d) => d.k === g.k)?.u ?? "HP" })),
    ...D.POTENCIAS_DEF.filter((d) => !previas.some((g) => g.k === d.k)),
  ].sort((a, b) => D.POTENCIAS_DEF.findIndex((d) => d.k === a.k) - D.POTENCIAS_DEF.findIndex((d) => d.k === b.k));
  return { ...c, catalogo: [...catalogo, ...nuevos], cuadrillas, potencias };
}

/** Caudal en cfm leído de un texto («250 cfm», «7 m³/min»). */
export function cfmDe(texto: string): number | undefined {
  const cfm = Number(texto.match(/([\d.,]+)\s*cfm/i)?.[1]?.replace(",", "."));
  if (cfm) return cfm;
  const m3 = Number(texto.match(/([\d.,]+)\s*m(?:3|³)\s*\/\s*min/i)?.[1]?.replace(",", "."));
  return m3 ? Math.round(m3 * 35.31) : undefined;
}

/** Potencia en HP leída de un texto («20 HP», «15 kW»). */
export function hpDe(texto: string): number | undefined {
  const hp = Number(texto.match(/([\d.,]+)\s*HP/i)?.[1]?.replace(",", "."));
  if (hp) return hp;
  const kw = Number(texto.match(/([\d.,]+)\s*kW/i)?.[1]?.replace(",", "."));
  return kw ? Math.round((kw / 0.746) * 10) / 10 : undefined;
}

/** Franja de potencia que corresponde a unos HP (los valores entre franjas suben a la siguiente). */
export function franjaSugerida(g: GrupoPotencia | undefined, hp?: number) {
  if (!g?.franjas.length) return undefined;
  if (!hp) return g.franjas[0].n;
  return (g.franjas.find((f) => hp <= f.hpMax) ?? g.franjas[g.franjas.length - 1]).n;
}

/** Ciudad del cotizador que corresponde a la ciudad del cliente («Guayaquil» → «Guayaquil (urbano)»). */
export function ciudadCotDe(ciudad: string, cfg: ConfigCot) {
  const n = ciudad.trim().toLowerCase();
  return (
    cfg.ciudades.find((c) => c.n.toLowerCase() === n) ??
    cfg.ciudades.find((c) => c.n.toLowerCase().startsWith(n)) ??
    cfg.ciudades.find((c) => c.n.toLowerCase().includes(n))
  )?.n;
}

/** Tamaño sugerido según la potencia del equipo (HP o kW de la placa o del nombre). */
export function tamanoSugerido(texto: string) {
  const hp = Number(texto.match(/([\d.,]+)\s*HP/i)?.[1]?.replace(",", "."));
  const kw = Number(texto.match(/([\d.,]+)\s*kW/i)?.[1]?.replace(",", ".")) || (hp ? hp * 0.746 : 0);
  if (!kw) return undefined;
  if (kw <= 15) return "Pequeño";
  if (kw <= 37) return "Mediano";
  if (kw <= 90) return "Grande";
  if (kw <= 200) return "Muy grande";
  return "Industrial";
}

import { ciudadConocida, horasViaje } from "../geografia";

/** Kilómetros desde la base de la cuadrilla. La tabla original mide desde Guayaquil; desde Quito se estima. */
export function kmDesdeBase(base: "Guayaquil" | "Quito", ciudad: string, cfg: ConfigCot): number | undefined {
  if (base === "Guayaquil") return undefined; // usa la tabla original
  const c = cfg.ciudades.find((x) => x.n === ciudad);
  if (!c || c.modo === "Aéreo") return undefined;
  const simple = c.n.split(" (")[0].split(" /")[0].trim();
  if (/^quito|sangolqu/i.test(simple)) return 15;
  if (ciudadConocida(simple)) return Math.round(horasViaje("Quito", simple) * cfg.params.VEL);
  // Sin coordenadas: se estima con la distancia Guayaquil–Quito (420 km) y la de la tabla
  return Math.max(60, Math.abs(420 - c.km));
}
