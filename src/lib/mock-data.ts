// Datos de ejemplo para la maqueta. Los clientes son ficticios.
// Fecha de demostración fija para que la maqueta sea reproducible.
import type { Cliente, Equipo, Pendiente, Perfil, Permiso, Solicitud, Trabajo, TipoTrabajo, Visita } from "./types";

export const HOY = "2026-11-06";
export const AHORA_DEMO = "2026-11-06T15:10:00";

export const CHECKLISTS: Record<TipoTrabajo, string[]> = {
  mantenimiento: [
    "Cambio de aceite",
    "Cambio de filtro de aire",
    "Cambio de filtro de aceite",
    "Revisión de separador",
    "Limpieza de radiador",
    "Prueba de presión y fugas",
  ],
  revision: ["Inspección visual", "Lectura de horas y alarmas", "Medición de temperatura", "Detección de fugas"],
  instalacion: [
    "Ubicación y nivelación del equipo",
    "Conexión eléctrica verificada",
    "Conexión neumática",
    "Prueba de funcionamiento",
    "Capacitación al operador",
  ],
  arranque: ["Verificar voltaje y rotación", "Nivel de aceite", "Configuración de presiones", "Prueba en carga"],
  ensamblaje: ["Revisión de piezas", "Ensamble", "Torque de pernos", "Prueba final"],
};

export const LINEAS_PRODUCTO = [
  "Compresores de Tornillo",
  "Compresores de Pistón",
  "Tratamiento de Aire",
  "Tuberías de Aire",
  "Equipo pintura en polvo",
  "Equipo pintura líquido",
  "Automatización",
  "Instrumentación",
  "Otro",
];

export const TIPO_LABEL: Record<TipoTrabajo, string> = {
  mantenimiento: "Mantenimiento",
  revision: "Revisión",
  instalacion: "Instalación",
  arranque: "Arranque",
  ensamblaje: "Ensamblaje",
};

export const perfiles: Perfil[] = [
  { id: "u-admin", nombre: "Fernando McBride", email: "fmcbride@surmaq.com", rol: "admin", ciudad: "Guayaquil", area: "Administración" },
  // Nombres de ejemplo: se reemplazan por el personal real al cargar los usuarios
  { id: "u-jefe", nombre: "Roberto Salazar", email: "rsalazar@surmaq.com", rol: "jefe", ciudad: "Guayaquil", area: "Mantenimiento", telefono: "0990000010" },
  { id: "u-coord-gye", nombre: "Daniela Ortiz", email: "dortiz@surmaq.com", rol: "coordinador", ciudad: "Guayaquil", area: "Mantenimiento", telefono: "0990000011", ciudadesACargo: ["Guayaquil"] },
  { id: "u-vend-gye", nombre: "Andrea Molina", email: "amolina@surmaq.com", rol: "vendedor", ciudad: "Guayaquil", area: "Ventas", telefono: "0990000020" },
  { id: "u-vend-uio", nombre: "Luis Paredes", email: "lparedes@surmaq.com", rol: "vendedor", ciudad: "Quito", area: "Ventas", telefono: "0990000021" },
  { id: "u-coord-uio", nombre: "Mateo Villacís", email: "mvillacis@surmaq.com", rol: "coordinador", ciudad: "Quito", area: "Mantenimiento", telefono: "0990000012", ciudadesACargo: ["Quito"] },
  { id: "u-jalvear", nombre: "Jorge Alvear", email: "jalvear@surmaq.com", rol: "tecnico", ciudad: "Guayaquil", area: "Mantenimiento", telefono: "0990000001" },
  { id: "u-jmerchan", nombre: "Jairo Merchán", email: "jmerchan@surmaq.com", rol: "tecnico", ciudad: "Guayaquil", area: "Mantenimiento", telefono: "0990000002" },
  { id: "u-hchicazawa", nombre: "Hideki Chicazawa", email: "hchicazawa@surmaq.com", rol: "tecnico", ciudad: "Guayaquil", area: "Mantenimiento", telefono: "0990000003" },
  { id: "u-alopez", nombre: "Alejandro López", email: "alopez@surmaq.com", rol: "tecnico", ciudad: "Quito", area: "Mantenimiento", telefono: "0990000004" },
  { id: "u-aharo", nombre: "Anthony Haro", email: "aharo@surmaq.com", rol: "tecnico", ciudad: "Quito", area: "Mantenimiento", telefono: "0990000005" },
];

export const clientes: Cliente[] = [
  { id: "c1", razonSocial: "Muebles Prosperina S.A.S.", ruc: "0990000000001", direccion: "Vía Daule km 8, Prosperina", ciudad: "Guayaquil", industria: "Muebles Madera", lat: -2.1409, lng: -79.9081, responsableId: "u-jalvear", recurrente: true, contacto: { nombre: "Julio Alay", telefono: "042000001" } },
  { id: "c2", razonSocial: "Plásticos del Pacífico S.A.", ruc: "0990000000002", direccion: "Km 10.5 vía a Daule", ciudad: "Guayaquil", industria: "Plásticos", lat: -2.1012, lng: -79.9452, responsableId: "u-jmerchan", recurrente: true, contacto: { nombre: "Ing. María Vera", telefono: "042000002", correo: "mvera@plasticospacifico.test" } },
  { id: "c3", razonSocial: "Alimentos La Costa Cía. Ltda.", ruc: "0990000000003", direccion: "Parque Industrial Pascuales", ciudad: "Guayaquil", industria: "Industria de Alimentos", lat: -2.0812, lng: -79.9701, responsableId: "u-hchicazawa", recurrente: false, contacto: { nombre: "Carlos Ponce", telefono: "042000003" } },
  { id: "c4", razonSocial: "Envases Andinos C.A.", ruc: "1790000000004", direccion: "Panamericana Norte km 12", ciudad: "Quito", industria: "Plásticos", lat: -0.1201, lng: -78.4802, responsableId: "u-alopez", recurrente: true, contacto: { nombre: "Fernanda Portilla", telefono: "022000004" } },
  { id: "c5", razonSocial: "Textiles Sierra Norte S.A.", ruc: "1790000000005", direccion: "Centro Industrial Cayambe", ciudad: "Cayambe", industria: "Textiles", lat: 0.0454, lng: -78.1847, responsableId: "u-aharo", recurrente: false, contacto: { nombre: "Geovanny Chicaiza", telefono: "022000005" } },
  { id: "c6", razonSocial: "Agroexportadora El Oro S.A.", ruc: "0790000000006", direccion: "Vía Machala - Pasaje km 3", ciudad: "Machala", industria: "Empacadora", lat: -3.2581, lng: -79.9554, responsableId: "u-jalvear", recurrente: true, contacto: { nombre: "Rodolfo Miranda", telefono: "072000006" } },
  { id: "c7", razonSocial: "Laboratorio Farmacéutico Norte", ruc: "1790000000007", direccion: "Av. Eloy Alfaro N45", ciudad: "Quito", industria: "Farmacéutica", lat: -0.1652, lng: -78.4721, responsableId: "u-alopez", recurrente: true, contacto: { nombre: "Dra. Jhoanna Ríos", telefono: "022000007" } },
  { id: "c8", razonSocial: "Talleres Durán Pintura Industrial", ruc: "0990000000008", direccion: "Km 4.5 vía Durán - Tambo", ciudad: "Durán", industria: "Servicio de Chapa y Pintura", lat: -2.1711, lng: -79.8302, responsableId: "u-jmerchan", recurrente: false, contacto: { nombre: "Edgar Tutillo", telefono: "042000008" } },
];

export const equipos: Equipo[] = [
  { id: "e1", clienteId: "c1", nombre: "Secador refrigerativo OMI", lineaProducto: "Tratamiento de Aire", marca: "OMI", modelo: "ED 108", serie: "OMI-55821", anio: 2026, codigoQr: "OS-E1", proximoMantenimiento: "2027-05-06" },
  { id: "e2", clienteId: "c1", nombre: "Compresor de tornillo 20 HP", lineaProducto: "Compresores de Tornillo", marca: "ABAC", modelo: "Genesis 15.10-500", serie: "CAI-931967", anio: 2019, codigoQr: "OS-E2", proximoMantenimiento: "2026-11-02", horasUso: 18450 },
  { id: "e3", clienteId: "c2", nombre: "Compresor de tornillo 50 HP", lineaProducto: "Compresores de Tornillo", marca: "Kaeser", modelo: "SK 25", serie: "SW-837454", anio: 2018, codigoQr: "OS-E3", proximoMantenimiento: "2026-11-20", horasUso: 32110 },
  { id: "e4", clienteId: "c2", nombre: "Línea de aire comprimido", lineaProducto: "Tuberías de Aire", marca: "Mcair", modelo: "25 mm", serie: "—", anio: 2024, codigoQr: "OS-E4" },
  { id: "e5", clienteId: "c3", nombre: "Compresor de pistón 10 HP", lineaProducto: "Compresores de Pistón", marca: "ABAC", modelo: "B7000", serie: "ABC-22719", anio: 2021, codigoQr: "OS-E5", proximoMantenimiento: "2026-10-15", horasUso: 9200 },
  { id: "e6", clienteId: "c4", nombre: "Compresor de tornillo 30 HP", lineaProducto: "Compresores de Tornillo", marca: "Atlas Copco", modelo: "GA 22", serie: "AII-650113", anio: 2020, codigoQr: "OS-E6", proximoMantenimiento: "2026-11-12", horasUso: 21780 },
  { id: "e7", clienteId: "c5", nombre: "Equipo de pintura en polvo", lineaProducto: "Equipo pintura en polvo", marca: "Gema", modelo: "OptiFlex 2", serie: "GM-11872", anio: 2022, codigoQr: "OS-E7", proximoMantenimiento: "2026-12-01" },
  { id: "e8", clienteId: "c6", nombre: "Compresor de tornillo 40 HP", lineaProducto: "Compresores de Tornillo", marca: "Kaeser", modelo: "ASD 40", serie: "KS-77310", anio: 2017, codigoQr: "OS-E8", proximoMantenimiento: "2026-11-09", horasUso: 41020 },
  { id: "e9", clienteId: "c7", nombre: "Secador refrigerativo 200 CFM", lineaProducto: "Tratamiento de Aire", marca: "OMI", modelo: "ED 216", serie: "OMI-60122", anio: 2023, codigoQr: "OS-E9", proximoMantenimiento: "2026-10-28" },
  { id: "e10", clienteId: "c8", nombre: "Compresor de pistón 7.5 HP", lineaProducto: "Compresores de Pistón", marca: "ABAC", modelo: "B6000", serie: "ABC-19004", anio: 2016, codigoQr: "OS-E10", proximoMantenimiento: "2026-12-15", horasUso: 12010 },
];

const t = (d: string, h: string) => `${d}T${h}:00`;

export const trabajos: Trabajo[] = [
  { id: "t2781", numero: 2781, equipoId: "e1", titulo: "Instalación de secador OMI", tipo: "instalacion", lugar: "en_cliente", estado: "en_progreso", asignadoId: "u-jalvear", fechaIngreso: t(HOY, "12:13") },
  { id: "t2779", numero: 2779, equipoId: "e3", titulo: "Mantenimiento 32.000 h compresor Kaeser", tipo: "mantenimiento", lugar: "en_cliente", estado: "en_progreso", asignadoId: "u-jmerchan", fechaIngreso: t("2026-11-04", "09:00") },
  { id: "t2780", numero: 2780, equipoId: "e5", titulo: "Revisión por ruido en cabezal", tipo: "revision", lugar: "en_cliente", estado: "abierto", asignadoId: "u-hchicazawa", fechaIngreso: t("2026-11-05", "16:20") },
  { id: "t2776", numero: 2776, equipoId: "e6", titulo: "Mantenimiento preventivo GA 22", tipo: "mantenimiento", lugar: "en_cliente", estado: "en_progreso", asignadoId: "u-alopez", fechaIngreso: t("2026-11-03", "08:30") },
  { id: "t2777", numero: 2777, equipoId: "e7", titulo: "Arranque equipo de pintura", tipo: "arranque", lugar: "en_cliente", estado: "abierto", asignadoId: "u-aharo", fechaIngreso: t("2026-11-05", "10:00") },
  { id: "t2774", numero: 2774, equipoId: "e8", titulo: "Mantenimiento 40.000 h", tipo: "mantenimiento", lugar: "en_cliente", estado: "cerrado", asignadoId: "u-jalvear", fechaIngreso: t("2026-10-28", "08:00"), fechaCierre: t("2026-10-29", "17:00"), estadoGeneralEquipo: "Bueno, se recomienda cambio de rodamientos en 2.000 h" },
  { id: "t2770", numero: 2770, equipoId: "e9", titulo: "Revisión de alarma de alta temperatura", tipo: "revision", lugar: "en_cliente", estado: "cerrado", asignadoId: "u-alopez", fechaIngreso: t("2026-10-21", "09:30"), fechaCierre: t("2026-10-21", "13:00"), estadoGeneralEquipo: "Condensador sucio, se limpió" },
  { id: "t2768", numero: 2768, equipoId: "e2", titulo: "Mantenimiento 18.000 h", tipo: "mantenimiento", lugar: "en_cliente", estado: "cerrado", asignadoId: "u-jalvear", fechaIngreso: t("2026-05-02", "08:00"), fechaCierre: t("2026-05-02", "14:00"), estadoGeneralEquipo: "Bueno" },
  { id: "t2778", numero: 2778, equipoId: "e4", titulo: "Ampliación de tubería zona de extrusión", tipo: "instalacion", lugar: "en_cliente", estado: "en_progreso", asignadoId: "u-jmerchan", fechaIngreso: t("2026-10-30", "08:00") },
  { id: "t2775", numero: 2775, equipoId: "e10", titulo: "Ensamblaje de cabezal nuevo", tipo: "ensamblaje", lugar: "en_oficina", estado: "abierto", asignadoId: "u-hchicazawa", fechaIngreso: t("2026-11-02", "11:00") },
];

const vacia = (tipo: TipoTrabajo, done = false) =>
  Object.fromEntries(CHECKLISTS[tipo].map((k) => [k, done])) as Record<string, boolean>;

const base = { autoEmpresa: true, acompanantes: [] as string[], fotos: [] as Visita["fotos"], lugar: "en_cliente" as const };

// Visitas de HOY
const visitasHoy: Visita[] = [
  { ...base, id: "v-hoy-1", trabajoId: "t2781", tecnicoId: "u-jalvear", descripcion: "Instalación de secador OMI", programadaInicio: t(HOY, "12:00"), programadaFin: t(HOY, "14:00"), estado: "finalizada", checkinEn: t(HOY, "12:16"), checkoutEn: t(HOY, "14:31"), checkinDistanciaM: 35, comentarios: "Falta el punto de 220 V del secador", checklist: { ...vacia("instalacion", true), "Conexión eléctrica verificada": false }, firmadoPor: "Julio Alay" },
  { ...base, id: "v-hoy-2", trabajoId: "t2781", tecnicoId: "u-jalvear", programadaPor: "u-jefe", descripcion: "Conexión eléctrica secador (próximo chequeo)", programadaInicio: t("2026-11-09", "09:00"), programadaFin: t("2026-11-09", "11:00"), estado: "programada", checklist: vacia("instalacion") },
  { ...base, id: "v-hoy-3", trabajoId: "t2779", tecnicoId: "u-jmerchan", descripcion: "Cambio de separador y aceite", programadaInicio: t(HOY, "08:30"), programadaFin: t(HOY, "12:30"), estado: "finalizada", checkinEn: t(HOY, "08:41"), checkoutEn: t(HOY, "12:55"), checkinDistanciaM: 60, acompanantes: ["u-hchicazawa"], checklist: vacia("mantenimiento", true) },
  { ...base, id: "v-hoy-4", trabajoId: "t2778", tecnicoId: "u-jmerchan", descripcion: "Tendido de tubería zona extrusión", programadaInicio: t(HOY, "14:00"), programadaFin: t(HOY, "17:30"), estado: "en_curso", checkinEn: t(HOY, "14:07"), checkinDistanciaM: 80, checklist: vacia("instalacion") },
  { ...base, id: "v-hoy-5", trabajoId: "t2780", tecnicoId: "u-hchicazawa", programadaPor: "u-coord-gye", descripcion: "Diagnóstico de ruido en cabezal", programadaInicio: t(HOY, "15:30"), programadaFin: t(HOY, "17:00"), estado: "programada", checklist: vacia("revision") },
  { ...base, id: "v-hoy-6", trabajoId: "t2776", tecnicoId: "u-alopez", descripcion: "Mantenimiento preventivo — día 2", programadaInicio: t(HOY, "08:00"), programadaFin: t(HOY, "13:00"), estado: "en_curso", checkinEn: t(HOY, "08:05"), checkinDistanciaM: 2300, checklist: { ...vacia("mantenimiento"), "Cambio de aceite": true, "Cambio de filtro de aire": true } },
  { ...base, id: "v-hoy-7", trabajoId: "t2777", tecnicoId: "u-aharo", programadaPor: "u-coord-uio", vistaPorTecnico: true, descripcion: "Arranque y configuración de pistolas", programadaInicio: t(HOY, "10:00"), programadaFin: t(HOY, "13:00"), estado: "programada", checklist: vacia("arranque") },
  { ...base, id: "v-hoy-8", trabajoId: "t2775", tecnicoId: "u-hchicazawa", descripcion: "Ensamble de cabezal en taller", lugar: "en_oficina", autoEmpresa: false, programadaInicio: t(HOY, "09:00"), programadaFin: t(HOY, "12:00"), estado: "finalizada", checkinEn: t(HOY, "09:10"), checkoutEn: t(HOY, "11:48"), checklist: { ...vacia("ensamblaje", true), "Prueba final": false } },
];

// Visita olvidada sin cerrar (ayer) — caso típico detectado en el Excel
const visitaOlvidada: Visita = { ...base, id: "v-olv-1", trabajoId: "t2776", tecnicoId: "u-alopez", descripcion: "Mantenimiento preventivo — día 1", programadaInicio: t("2026-11-05", "08:00"), programadaFin: t("2026-11-05", "16:00"), estado: "en_curso", checkinEn: t("2026-11-05", "08:12"), checkinDistanciaM: 40, checklist: vacia("mantenimiento") };

// Historial de las últimas semanas (generado de forma determinista)
function rng(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}
const tecnicos = perfiles.filter((p) => p.rol === "tecnico");
const historial: Visita[] = [];
{
  const r = rng(42);
  const trabajosCerrados = ["t2774", "t2770", "t2768", "t2779", "t2778", "t2776"];
  for (let d = 1; d <= 28; d++) {
    const fecha = new Date(2026, 10, 6 - d);
    const dow = fecha.getDay();
    if (dow === 0 || dow === 6) continue;
    const ds = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
    for (const tec of tecnicos) {
      const n = 1 + Math.floor(r() * 2.4);
      let hora = 8 + Math.floor(r() * 2);
      for (let i = 0; i < n; i++) {
        const dur = 1.5 + r() * 3;
        const ini = `${String(hora).padStart(2, "0")}:${String(Math.floor(r() * 50)).padStart(2, "0")}`;
        const finH = hora + dur;
        const fin = `${String(Math.floor(finH)).padStart(2, "0")}:${String(Math.floor((finH % 1) * 60)).padStart(2, "0")}`;
        historial.push({
          ...base,
          id: `v-h-${ds}-${tec.id}-${i}`,
          trabajoId: trabajosCerrados[Math.floor(r() * trabajosCerrados.length)],
          tecnicoId: tec.id,
          descripcion: "Visita técnica",
          programadaInicio: t(ds, ini),
          programadaFin: t(ds, fin),
          estado: "finalizada",
          checkinEn: t(ds, ini),
          checkoutEn: t(ds, fin),
          checkinDistanciaM: Math.floor(r() * 150),
          checklist: {},
        });
        hora = Math.ceil(finH) + 1;
        if (hora > 15) break;
      }
    }
  }
}

export const visitas: Visita[] = [...visitasHoy, visitaOlvidada, ...historial];

export const pendientes: Pendiente[] = [
  { id: "p1", trabajoId: "t2781", visitaId: "v-hoy-1", descripcion: "Falta el punto de 220 V del secador", responsable: "cliente", creadoEn: t(HOY, "14:31") },
  { id: "p2", trabajoId: "t2779", descripcion: "Cotizar kit de rodamientos para próximo servicio", responsable: "surmaq", creadoEn: t("2026-11-04", "12:00") },
  { id: "p3", trabajoId: "t2776", descripcion: "Cliente debe instalar válvula de drenaje automática", responsable: "cliente", creadoEn: t("2026-11-03", "15:00") },
  { id: "p4", trabajoId: "t2774", descripcion: "Enviar informe de vibraciones", responsable: "surmaq", creadoEn: t("2026-10-29", "17:00"), resueltoEn: t("2026-10-31", "10:00") },
];

export const permisos: Permiso[] = [
  { id: "pe1", perfilId: "u-aharo", razon: "permiso_medico", desde: t("2026-11-10", "08:00"), hasta: t("2026-11-10", "17:00"), detalle: "Cita médica control" },
  { id: "pe2", perfilId: "u-jmerchan", razon: "vacaciones", desde: t("2026-12-22", "08:00"), hasta: t("2026-12-31", "17:00"), detalle: "Vacaciones de fin de año", aprobado: true },
];

/** Vehículos de la empresa (placas de ejemplo). */
export const VEHICULOS = ["Camioneta GYE · GSB-1234", "Furgoneta GYE · GSC-5678", "Camioneta UIO · PCD-9012", "Vehículo particular"];

/** Empresas que facturan (pendiente de confirmar los nombres reales). */
export const EMPRESAS_FACTURA = ["Surmaq", "Otra empresa del grupo"];

export const solicitudes: Solicitud[] = [
  { id: "s1", numero: 101, vendedorId: "u-vend-gye", clienteId: "c2", contacto: "Ing. María Vera", equipoId: "e3", tipo: "revision", descripcion: "Cliente reporta caída de presión en horas pico", dpto: "Guayaquil", solicitadaEn: t("2026-11-06", "10:20"), fechaRequerida: "2026-11-10", horaRequerida: "09:00", montoProducto: 0, montoManoObra: 180, empresaFactura: "Surmaq", notificarA: ["mvera@plasticospacifico.test"], estado: "ingresada" },
  { id: "s2", numero: 102, vendedorId: "u-vend-uio", clienteId: "c7", contacto: "Dra. Jhoanna Ríos", equipoId: "e9", tipo: "mantenimiento", descripcion: "Mantenimiento preventivo anual del secador", dpto: "Quito", solicitadaEn: t("2026-11-05", "16:45"), fechaRequerida: "2026-11-11", horaRequerida: "10:00", montoProducto: 320, montoManoObra: 150, empresaFactura: "Surmaq", notificarA: [], estado: "ingresada" },
  { id: "s3", numero: 100, vendedorId: "u-vend-gye", clienteId: "c1", contacto: "Julio Alay", equipoId: "e1", tipo: "instalacion", descripcion: "Instalación de secador OMI vendido", dpto: "Guayaquil", solicitadaEn: t("2026-11-03", "11:00"), fechaRequerida: "2026-11-06", horaRequerida: "11:00", montoProducto: 2400, montoManoObra: 250, empresaFactura: "Surmaq", notificarA: [], estado: "programada", revisadaPor: "u-coord-gye", revisadaEn: t("2026-11-03", "15:00"), trabajoId: "t2781", cambioHora: true },
];
