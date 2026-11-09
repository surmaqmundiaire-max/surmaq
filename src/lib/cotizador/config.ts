import type { ConfigCot } from "./tipos";
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
};

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
