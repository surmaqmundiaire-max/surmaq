// Formularios de puesta en marcha definidos como datos (ex Cognito Forms).
// Agregar o cambiar una pregunta = editar esta lista; las pantallas se arman solas.

export type TipoCampo = "sino" | "sino_obs" | "texto" | "numero" | "opciones" | "fases";

export interface CampoPEM {
  id: string;
  label: string;
  tipo: TipoCampo;
  unidad?: string;
  opciones?: string[];
  obligatorio?: boolean;
  /** Se llena solo con datos del equipo o cliente */
  auto?: "empresa" | "direccion" | "contacto" | "telefono" | "correo" | "marca" | "modelo" | "serie" | "potencia" | "voltaje" | "frecuencia" | "tipoCompresor";
}

export interface SeccionPEM {
  id: string;
  titulo: string;
  campos: CampoPEM[];
}

export interface PlantillaPEM {
  id: string;
  titulo: string;
  borrador?: boolean; // pendiente de validar con Surmaq
  aplicaA: RegExp; // línea de producto
  secciones: SeccionPEM[];
}

const sn = (id: string, label: string): CampoPEM => ({ id, label, tipo: "sino" });
const tx = (id: string, label: string, unidad?: string): CampoPEM => ({ id, label, tipo: "texto", unidad });
const nu = (id: string, label: string, unidad?: string): CampoPEM => ({ id, label, tipo: "numero", unidad });
const fases = (id: string, label: string): CampoPEM => ({ id, label, tipo: "fases" });
const so = (id: string, label: string): CampoPEM => ({ id, label, tipo: "sino_obs" });

const DATOS_CLIENTE: SeccionPEM = {
  id: "cliente",
  titulo: "Datos del cliente",
  campos: [
    { id: "empresa", label: "Empresa", tipo: "texto", obligatorio: true, auto: "empresa" },
    { id: "direccion", label: "Dirección", tipo: "texto", obligatorio: true, auto: "direccion" },
    { id: "contacto", label: "Persona de contacto", tipo: "texto", auto: "contacto" },
    { id: "cargo", label: "Cargo", tipo: "texto", obligatorio: true },
    { id: "telefono", label: "Teléfono", tipo: "texto", auto: "telefono" },
    { id: "correo", label: "Correo del contacto", tipo: "texto", obligatorio: true, auto: "correo" },
  ],
};

const ENTREGA: SeccionPEM = {
  id: "entrega",
  titulo: "Entrega",
  campos: [
    so("ent1", "Instrucciones de funcionamiento"),
    so("ent2", "Instrucciones de verificación diaria / semanal / mensual"),
    so("ent3", "Instrucciones de mantenimiento"),
    so("ent4", "Instrucciones de seguridad"),
    so("ent5", "Manuales"),
    so("ent6", "Llaves"),
  ],
};

export const PLANTILLAS: PlantillaPEM[] = [
  {
    id: "compresor",
    titulo: "Puesta en marcha de compresor",
    aplicaA: /compresor/i,
    secciones: [
      DATOS_CLIENTE,
      {
        id: "equipo",
        titulo: "Datos del equipo",
        campos: [
          { id: "tipoCompresor", label: "Tipo de compresor", tipo: "opciones", opciones: ["Tornillo", "Pistón", "Paletas"], obligatorio: true, auto: "tipoCompresor" },
          { id: "velocidad", label: "Velocidad", tipo: "opciones", opciones: ["Fija", "Variable"], obligatorio: true },
          { id: "marca", label: "Marca", tipo: "texto", obligatorio: true, auto: "marca" },
          { id: "serie", label: "Número de serie", tipo: "texto", obligatorio: true, auto: "serie" },
          { id: "modelo", label: "Modelo", tipo: "texto", obligatorio: true, auto: "modelo" },
          { id: "potencia", label: "Potencia", tipo: "texto", unidad: "HP", obligatorio: true, auto: "potencia" },
          { id: "frecuencia", label: "Frecuencia", tipo: "texto", unidad: "Hz", obligatorio: true, auto: "frecuencia" },
          { id: "voltaje", label: "Voltaje", tipo: "texto", unidad: "V", obligatorio: true, auto: "voltaje" },
          tx("variantePresion", "Variante de presión"),
        ],
      },
      {
        id: "preliminares",
        titulo: "Controles preliminares",
        campos: [
          sn("p1", "¿Cuenta con espacio suficiente?"),
          sn("p2", "¿Hay ventilación suficiente?"),
          sn("p3", "¿El piso es adecuado?"),
          sn("p4", "¿Existe una entrada de aire de succión adecuada?"),
          sn("p5", "¿Hay un cableado eléctrico adecuado?"),
          sn("p6", "¿Los fusibles y breakers son adecuados?"),
          sn("p7", "¿Hay otros compresores en el mismo espacio?"),
          sn("p8", "¿Hay secador instalado?"),
          sn("p9", "Ajustar cuadro eléctrico"),
          sn("p10", "Verificar ajuste térmico del motor y ventilador"),
          nu("p11", "Voltaje de entrada", "V"),
          tx("p12", "Calibre del cable de acometida", "AWG"),
          sn("p13", "¿Hay tanque de almacenamiento?"),
          tx("p14", "Capacidad del tanque", "litros"),
          tx("p15", "Diámetro y tipo de red instalada"),
          sn("p16", "¿Hay válvula antirretorno entre compresor y tanque?"),
          sn("p17", "¿Está bien conectado el drenaje de condensado?"),
          sn("p18", "Verificar libre giro del motor / tornillo a mano"),
          sn("p19", "Verificar tensión de correas (si aplica)"),
          sn("p20", "Verificar nivel de aceite"),
          tx("p21", "Tipo de aceite (horas)"),
          sn("p22", "¿Hay filtros instalados?"),
          sn("p23", "¿Existe conexión a tierra? (no neutro)"),
        ],
      },
      {
        id: "funcionamiento",
        titulo: "Funcionamiento",
        campos: [
          sn("f1", "Verificar giro del motor principal"),
          sn("f2", "Verificar giro y flujo del ventilador"),
          nu("f3", "Presión mínima", "bar"),
          nu("f4", "Presión máxima", "bar"),
          nu("f5", "Temperatura ambiente", "°C"),
          nu("f6", "Temperatura de aceite", "°C"),
          nu("f7", "Horas de funcionamiento total", "h"),
          nu("f8", "Horas de funcionamiento con carga", "h"),
          sn("f9", "Verificar botón de PARO DE EMERGENCIA"),
        ],
      },
      {
        id: "mediciones",
        titulo: "Mediciones eléctricas",
        campos: [fases("arranque", "Arranque"), fases("vacio", "Vacío"), fases("plenaCarga", "Plena carga")],
      },
      {
        id: "variador",
        titulo: "Variador de velocidad (si tiene)",
        campos: [
          { id: "v0", label: "Variador", tipo: "opciones", opciones: ["No tiene", "Parker", "Otra marca"] },
          tx("v1", "Modelo del variador"),
          nu("v2", "Potencia del variador", "HP"),
          tx("v3", "Versión de firmware"),
          nu("v4", "Frecuencia mínima", "Hz"),
          nu("v5", "Frecuencia máxima", "Hz"),
          nu("v6", "Presión de consigna (setpoint)", "bar"),
          sn("v7", "Autoajuste del motor realizado"),
          sn("v8", "Puesta a tierra y blindaje del cable verificados"),
          sn("v9", "Parámetros respaldados (copia entregada)"),
        ],
      },
      ENTREGA,
    ],
  },
  {
    id: "pintura",
    titulo: "Puesta en marcha de equipo de pintura",
    borrador: true,
    aplicaA: /pintura/i,
    secciones: [
      DATOS_CLIENTE,
      {
        id: "equipo",
        titulo: "Datos del equipo",
        campos: [
          { id: "tipoEquipo", label: "Tipo de equipo", tipo: "opciones", opciones: ["Pintura en polvo", "Pintura líquida"], obligatorio: true },
          { id: "marca", label: "Marca", tipo: "texto", obligatorio: true, auto: "marca" },
          { id: "modelo", label: "Modelo", tipo: "texto", obligatorio: true, auto: "modelo" },
          { id: "serie", label: "Número de serie", tipo: "texto", obligatorio: true, auto: "serie" },
          { id: "voltaje", label: "Voltaje", tipo: "texto", unidad: "V", auto: "voltaje" },
          nu("pistolas", "Cantidad de pistolas"),
        ],
      },
      {
        id: "preliminares",
        titulo: "Controles preliminares",
        campos: [
          sn("p1", "¿Cuenta con espacio y cabina adecuados?"),
          sn("p2", "¿Hay extracción / ventilación suficiente?"),
          sn("p3", "¿El aire comprimido llega seco y limpio?"),
          nu("p4", "Presión de aire disponible", "bar"),
          sn("p5", "¿Hay conexión a tierra de equipo, cabina y piezas?"),
          sn("p6", "¿Cableado eléctrico y protecciones adecuados?"),
          sn("p7", "¿Mangueras y conexiones en buen estado?"),
        ],
      },
      {
        id: "funcionamiento",
        titulo: "Funcionamiento",
        campos: [
          nu("f1", "Tensión de carga (kV)", "kV"),
          nu("f2", "Corriente (µA)", "µA"),
          nu("f3", "Presión de transporte de polvo / fluido", "bar"),
          sn("f4", "Patrón de aplicación uniforme"),
          sn("f5", "Verificar limpieza y purga de pistolas"),
          sn("f6", "Verificar paro de emergencia"),
        ],
      },
      ENTREGA,
    ],
  },
];

export const plantillaPara = (lineaProducto: string) => PLANTILLAS.find((p) => p.aplicaA.test(lineaProducto));

/** Valor de un campo de fases: voltaje y amperaje por fase R/S/T */
export type ValorFases = { vR?: string; vS?: string; vT?: string; aR?: string; aS?: string; aT?: string };
export type Valor = string | boolean | ValorFases | { si?: boolean; obs?: string } | undefined;

export const respondido = (c: CampoPEM, v: Valor) => {
  if (v === undefined || v === "") return false;
  if (c.tipo === "fases") return Object.values(v as ValorFases).some(Boolean);
  if (c.tipo === "sino_obs") return (v as { si?: boolean }).si !== undefined;
  return true;
};
