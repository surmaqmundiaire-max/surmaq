export type Nivel = "T1" | "T2" | "T3" | "T4" | "T5";
export type Escala = "tamano" | "altura" | "ninguna" | "potencia";
export type Familia = "mant" | "inst" | "pint";

export interface NivelSueldo { cod: string; nombre: string; perfil: string; sueldo: number }
export interface Costos { SBU: number; IESS_PAT: number; FONDOS: number; HPROD: number; FACTOR: number; niveles: NivelSueldo[] }
export interface Parametros {
  EMPRESA: string; BASE: string; VALIDEZ: number; VEL: number; VEL_REG: number; COSTO_KM: number; PAX_VEH: number; PCT_TRASLADO: number;
  ALIM: number; HOSP: number; R_URB: number; D_REG: number; D_PERN: number; JORNADA: number; JORNADA_MAX: number; HMIN: number;
  PASAJE: number; T_AEREO: number; KM_LOCAL: number; IVA: number; COBRAR_EQ_ALTURA: number;
}
export interface Cuadrilla { cx: string; criterio: string; T1: number; T2: number; T3: number; T4: number; T5: number }
export interface Factor { n: string; f: number; ref?: string }
export interface Horario { n: string; rec: number }
export interface Altura { n: string; f: number; eq: string; costo: number; cert: boolean }
export interface Entorno { n: string; f: number; nota: string }
export interface ItemCatalogo { cod: string; grupo: string; tipo: string; act: string; alcance: string; intervalo: string; unidad: string; horas: number; cx: string; escala: Escala; fam: Familia; cert: string; /** grupo de franjas de potencia (escala «potencia») */ pot?: string }
/** Franja de potencia: ajusta el tiempo y fija la cuadrilla mínima según los HP del equipo. */
export interface FranjaPotencia { n: string; hpMin: number; hpMax: number; f: number; cx: string }
export interface GrupoPotencia { k: string; n: string; franjas: FranjaPotencia[] }
export interface CiudadCot { n: string; prov: string; reg: string; km: number; modo: string }

export interface ConfigCot {
  costos: Costos;
  params: Parametros;
  cuadrillas: Cuadrilla[];
  tamanos: Factor[];
  horarios: Horario[];
  alturas: Altura[];
  entornos: Entorno[];
  catalogo: ItemCatalogo[];
  ciudades: CiudadCot[];
  potencias: GrupoPotencia[];
}

export type EstadoCot = "Borrador" | "Enviada" | "Aprobada" | "Rechazada" | "Ejecutada";
export const ESTADOS_COT: EstadoCot[] = ["Borrador", "Enviada", "Aprobada", "Rechazada", "Ejecutada"];

export interface LineaCot { cod: string; cant: number; tam: string; alt: string; hor: string; equipoId?: string; /** franja de potencia elegida */ pot?: string }

export interface Cotizacion {
  id: string;
  numero: string; // COT-0001
  fecha: string;
  clienteId?: string;
  equipoIds?: string[]; // equipos del cliente incluidos en la cotización
  /** @deprecated cotizaciones antiguas con un solo equipo; usar equiposCot() */
  equipoId?: string;
  solicitudId?: string;
  cliente: string;
  ruc: string;
  contacto: string;
  ciudad: string; // ciudad del cotizador (con distancia desde Guayaquil)
  base: "Guayaquil" | "Quito"; // desde dónde sale la cuadrilla
  lugar: string;
  entorno: string;
  fechaTrabajo: string;
  notas: string;
  lineas: LineaCot[];
  asig: Record<string, string>; // puesto (T3_0) → id de técnico
  descuento: number;
  estado: EstadoCot;
  total: number;
  horas: number;
  creadoPor: string;
  creadoEn: string;
  actualizado: string;
  trabajoIds?: string[]; // mantenimientos programados (uno por equipo)
  /** @deprecated usar trabajosCot() */
  trabajoId?: string;
}

/** Equipos de una cotización (compatible con las que tenían un solo equipo). */
export const equiposCot = (q: Pick<Cotizacion, "equipoIds" | "equipoId">): string[] => q.equipoIds ?? (q.equipoId ? [q.equipoId] : []);
/** Mantenimientos creados desde una cotización. */
export const trabajosCot = (q: Pick<Cotizacion, "trabajoIds" | "trabajoId">): string[] => q.trabajoIds ?? (q.trabajoId ? [q.trabajoId] : []);
