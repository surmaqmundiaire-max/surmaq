// Tiempos de viaje por carretera entre ciudades (horas). Sirven para no programar
// a un técnico en dos lugares sin tiempo de movilización entre ellos.

const COORD: Record<string, [number, number]> = {
  Guayaquil: [-2.17, -79.92], "Durán": [-2.17, -79.83], Daule: [-1.86, -79.98], Milagro: [-2.13, -79.59],
  Babahoyo: [-1.8, -79.53], Machala: [-3.26, -79.96], Cuenca: [-2.9, -79.0], Loja: [-4.0, -79.2],
  Manta: [-0.95, -80.73], Portoviejo: [-1.05, -80.45], Quevedo: [-1.02, -79.46], "Santo Domingo": [-0.25, -79.17],
  Quito: [-0.18, -78.47], Cayambe: [0.04, -78.15], Ibarra: [0.35, -78.12], Latacunga: [-0.93, -78.62],
  Ambato: [-1.25, -78.62], Riobamba: [-1.67, -78.65],
};

// Tiempos conocidos (ajustables por Surmaq); el resto se estima por distancia.
const CONOCIDOS: Record<string, number> = {
  "Guayaquil|Cuenca": 3, "Guayaquil|Quito": 8, "Guayaquil|Machala": 3, "Guayaquil|Manta": 3.5, "Guayaquil|Durán": 0.5,
  "Guayaquil|Daule": 1, "Quito|Cayambe": 1.25, "Quito|Ambato": 2.5, "Quito|Cuenca": 8, "Quito|Santo Domingo": 3,
};

/** Movilización dentro de la misma ciudad entre dos clientes distintos. */
export const VIAJE_MISMA_CIUDAD = 0.5;

const norm = (c: string) => Object.keys(COORD).find((k) => k.toLowerCase() === c.trim().toLowerCase()) ?? c.trim();

export function horasViaje(origen: string, destino: string): number {
  const a = norm(origen);
  const b = norm(destino);
  if (!a || !b) return 0;
  if (a === b) return 0;
  const conocido = CONOCIDOS[`${a}|${b}`] ?? CONOCIDOS[`${b}|${a}`];
  if (conocido !== undefined) return conocido;
  const ca = COORD[a];
  const cb = COORD[b];
  if (!ca || !cb) return 1; // ciudad sin coordenadas: se asume 1 h
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const d = 2 * R * Math.asin(Math.sqrt(Math.sin(rad(cb[0] - ca[0]) / 2) ** 2 + Math.cos(rad(ca[0])) * Math.cos(rad(cb[0])) * Math.sin(rad(cb[1] - ca[1]) / 2) ** 2));
  // carretera ≈ 1,35 × línea recta, a ~55 km/h promedio; redondeado a 15 min
  return Math.max(0.5, Math.round(((d * 1.35) / 55) * 4) / 4);
}

/** Tiempo entre dos lugares de trabajo: 0 si es el mismo cliente, 30 min si es otro cliente en la misma ciudad. */
export function horasEntreLugares(ciudadA: string, clienteA: string, ciudadB: string, clienteB: string) {
  if (clienteA && clienteA === clienteB) return 0;
  const h = horasViaje(ciudadA, ciudadB);
  return h === 0 ? VIAJE_MISMA_CIUDAD : h;
}

export const textoHoras = (h: number) => {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return hh === 0 ? `${mm} min` : mm ? `${hh} h ${mm} min` : `${hh} h`;
};
