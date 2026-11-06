// Tipos alineados con supabase/migrations/0001_modelo_inicial.sql
// para que luego la maqueta se conecte a Supabase sin cambiar las pantallas.

export type Rol = "admin" | "tecnico" | "vendedor";
export type TipoTrabajo = "mantenimiento" | "revision" | "instalacion" | "arranque" | "ensamblaje";
export type LugarTrabajo = "en_cliente" | "en_oficina";
export type EstadoTrabajo = "abierto" | "en_progreso" | "cerrado" | "cancelado";
export type EstadoVisita = "programada" | "en_curso" | "finalizada" | "cancelada";

export interface Perfil {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  ciudad: string;
  area: string;
  telefono?: string;
}

export interface Cliente {
  id: string;
  razonSocial: string;
  ruc: string;
  direccion: string;
  sector?: string;
  ciudad: string;
  industria: string;
  lat: number;
  lng: number;
  responsableId: string;
  recurrente: boolean;
  contacto: { nombre: string; telefono: string; correo?: string };
}

export interface Equipo {
  id: string;
  clienteId: string;
  nombre: string;
  lineaProducto: string;
  marca: string;
  modelo: string;
  serie: string;
  anio?: number;
  codigoQr: string;
  fotoUrl?: string; // foto del equipo
  fotoPlacaUrl?: string; // foto de la placa de datos
  datosPlaca?: DatosPlaca; // datos técnicos leídos de la placa
  proximoMantenimiento?: string; // ISO date
  horasUso?: number;
  puestaEnMarcha?: { fecha: string; tecnicoId: string; presion: number; temperatura: number; voltaje: number };
}

export interface Trabajo {
  id: string;
  numero: number;
  equipoId: string;
  titulo: string;
  tipo: TipoTrabajo;
  lugar: LugarTrabajo;
  estado: EstadoTrabajo;
  asignadoId: string;
  fechaIngreso: string;
  fechaCierre?: string;
  estadoGeneralEquipo?: string;
}

export interface Visita {
  id: string;
  trabajoId: string;
  tecnicoId: string;
  descripcion: string;
  lugar: LugarTrabajo;
  programadaInicio: string;
  programadaFin: string;
  estado: EstadoVisita;
  checkinEn?: string;
  checkoutEn?: string;
  checkinDistanciaM?: number;
  autoEmpresa: boolean;
  acompanantes: string[];
  comentarios?: string;
  informe?: string;
  checklist: Record<string, boolean>;
  fotos: { url: string; momento: "antes" | "despues" }[];
  firmaCliente?: string; // data URL
  firmadoPor?: string;
  salidaCorregida?: boolean; // la salida se registró después, con hora indicada por el técnico
}

export interface Pendiente {
  id: string;
  trabajoId: string;
  visitaId?: string;
  descripcion: string;
  responsable: "cliente" | "surmaq";
  creadoEn: string;
  resueltoEn?: string;
}

export interface Permiso {
  id: string;
  perfilId: string;
  razon: "permiso" | "permiso_medico" | "vacaciones";
  desde: string;
  hasta: string;
  detalle: string;
  aprobado?: boolean;
}

/** Datos técnicos leídos de la placa (los que no se ven quedan vacíos). */
export interface DatosPlaca {
  potencia?: string;
  voltaje?: string;
  frecuencia?: string;
  corriente?: string;
  presionMax?: string;
  caudal?: string;
  otros?: { etiqueta: string; valor: string }[];
}
