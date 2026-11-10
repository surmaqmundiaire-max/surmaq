// Datos base del cotizador de servicio técnico Maquinmotors (catálogo, tarifas, factores y ciudades).
// Copiados del cotizador original; la empresa puede ajustarlos desde «Parámetros del cotizador».
import type { Altura, Costos, Cuadrilla, CiudadCot, Entorno, Escala, Factor, Familia, GrupoPotencia, Horario, ItemCatalogo, Parametros } from "./tipos";

type Fila = (string | number)[];

export const COSTOS_DEF: Costos = {
  SBU:482, IESS_PAT:0.1115, FONDOS:0.0833, HPROD:160, FACTOR:3.5,
  niveles:[
    {cod:"T1",nombre:"Ayudante técnico",perfil:"Apoyo en desmontaje, limpieza, traslado de herramientas y materiales.",sueldo:550},
    {cod:"T2",nombre:"Técnico mecánico / instalador",perfil:"Preventivos, filtros, aceite, bandas, válvulas; instalación de tubería.",sueldo:800},
    {cod:"T3",nombre:"Técnico electromecánico",perfil:"Mecánica y electricidad: motores, arrancadores, sensores, drenadores.",sueldo:950},
    {cod:"T4",nombre:"Técnico especialista (control / refrigeración / pintura)",perfil:"Controladores, VSD, PLC, refrigeración, sistemas de pintura Gema y Binks, diagnóstico avanzado.",sueldo:1200},
    {cod:"T5",nombre:"Ingeniero de servicio / supervisor",perfil:"Supervisión, overhaul, puesta en marcha, dirección de obra e informes.",sueldo:1600}
  ]
};
export const PARAMS_DEF: Parametros = {
  EMPRESA:"Máquinas y Motores S.A.", BASE:"Guayaquil – Av. Juan Tanca Marengo", VALIDEZ:15,
  VEL:60, VEL_REG:60, COSTO_KM:0.45, PAX_VEH:4, PCT_TRASLADO:0.5, ALIM:25, HOSP:45,
  R_URB:30, D_REG:100, D_PERN:200, JORNADA:8, JORNADA_MAX:10, HMIN:2,
  PASAJE:450, T_AEREO:5, KM_LOCAL:40, IVA:0.15, COBRAR_EQ_ALTURA:1
};
export const CUADRILLAS_DEF: Cuadrilla[] = [
  {cx:"Baja",criterio:"Rutina y servicio menor, sin desarmar componentes principales.",T1:0,T2:1,T3:0,T4:0,T5:0},
  {cx:"Media",criterio:"Desarme de válvulas, parte eléctrica o diagnóstico.",T1:1,T2:0,T3:1,T4:0,T5:0},
  {cx:"Alta",criterio:"Refrigeración, control/VSD, motores, componentes pesados.",T1:1,T2:0,T3:1,T4:1,T5:0},
  {cx:"Crítica",criterio:"Overhaul de elemento compresor, paletas, desecante en equipos grandes.",T1:1,T2:1,T3:0,T4:1,T5:1},
  {cx:"Instalación ligera",criterio:"Tubería hasta Ø40 mm, bajantes, FRL, filtros y accesorios menores.",T1:1,T2:1,T3:0,T4:0,T5:0},
  {cx:"Instalación",criterio:"Tubería Ø50–63 mm, conexión a sala de compresores, emplazamiento de equipos medianos.",T1:1,T2:1,T3:1,T4:0,T5:0},
  {cx:"Instalación pesada",criterio:"Tubería Ø80–110 mm, tanques y secadores grandes, izaje; con supervisor de obra.",T1:1,T2:1,T3:1,T4:0,T5:1},
  {cx:"Instalación eléctrica",criterio:"Acometidas, canalización, cableado y protecciones de compresores, secadores y drenadores.",T1:1,T2:0,T3:1,T4:0,T5:0},
  {cx:"Pintura – servicio",criterio:"Pistolas, equipos manuales, bombas, inyectores y cabinas pequeñas Gema / Binks.",T1:1,T2:0,T3:0,T4:1,T5:0},
  {cx:"Control / variadores",criterio:"Variadores de velocidad Parker: mantenimiento, migración, programación y puesta en marcha.",T1:0,T2:0,T3:1,T4:1,T5:0},
  {cx:"Pintura – línea automática",criterio:"Líneas automáticas, reciprocadores, cabinas de recuperación, esmalte cerámico; con ingeniero de servicio.",T1:1,T2:0,T3:1,T4:1,T5:1}
];
/** Franjas de potencia (valores de partida, por validar con el taller). La cuadrilla de la franja es la mínima:
 *  si el trabajo exige una cuadrilla mayor, se usa la del trabajo. */
export const POTENCIAS_DEF: GrupoPotencia[] = [
  { k: "piston", n: "Compresor de pistón", u: "HP", franjas: [
    { n: "1 – 3 HP", hpMin: 1, hpMax: 3, f: 0.8, cx: "Baja" },
    { n: "5 – 10 HP", hpMin: 5, hpMax: 10, f: 1.0, cx: "Baja" },
  ] },
  { k: "tornillo", n: "Compresor de tornillo", u: "HP", franjas: [
    { n: "5 – 15 HP", hpMin: 5, hpMax: 15, f: 1.0, cx: "Baja" },
    { n: "20 – 30 HP", hpMin: 20, hpMax: 30, f: 1.3, cx: "Baja" },
    { n: "50 – 60 HP", hpMin: 50, hpMax: 60, f: 1.6, cx: "Media" },
    { n: "75 – 100 HP", hpMin: 75, hpMax: 100, f: 1.8, cx: "Media" },
    { n: "110 – 150 HP", hpMin: 110, hpMax: 150, f: 2.1, cx: "Alta" },
    { n: "160 – 200 HP", hpMin: 160, hpMax: 200, f: 2.4, cx: "Alta" },
  ] },
  { k: "paletas", n: "Compresor de paletas", u: "HP", franjas: [
    { n: "5 – 15 HP", hpMin: 5, hpMax: 15, f: 1.0, cx: "Baja" },
    { n: "20 – 30 HP", hpMin: 20, hpMax: 30, f: 1.3, cx: "Baja" },
    { n: "50 – 60 HP", hpMin: 50, hpMax: 60, f: 1.6, cx: "Media" },
    { n: "75 – 100 HP", hpMin: 75, hpMax: 100, f: 1.8, cx: "Media" },
  ] },
  { k: "srf", n: "Secador refrigerativo", u: "cfm", franjas: [
    { n: "Hasta 100 cfm", hpMin: 0, hpMax: 100, f: 1.0, cx: "Baja" },
    { n: "100 – 300 cfm", hpMin: 100, hpMax: 300, f: 1.3, cx: "Baja" },
    { n: "300 – 700 cfm", hpMin: 300, hpMax: 700, f: 1.6, cx: "Media" },
    { n: "700 – 1 500 cfm", hpMin: 700, hpMax: 1500, f: 2.0, cx: "Media" },
    { n: "Más de 1 500 cfm", hpMin: 1500, hpMax: 99999, f: 2.5, cx: "Alta" },
  ] },
  { k: "srg", n: "Secador regenerativo (desecante)", u: "cfm", franjas: [
    { n: "Hasta 100 cfm", hpMin: 0, hpMax: 100, f: 1.0, cx: "Baja" },
    { n: "100 – 300 cfm", hpMin: 100, hpMax: 300, f: 1.3, cx: "Baja" },
    { n: "300 – 700 cfm", hpMin: 300, hpMax: 700, f: 1.6, cx: "Media" },
    { n: "700 – 1 500 cfm", hpMin: 700, hpMax: 1500, f: 2.0, cx: "Media" },
    { n: "Más de 1 500 cfm", hpMin: 1500, hpMax: 99999, f: 2.5, cx: "Alta" },
  ] },
  { k: "variador", n: "Variador de velocidad Parker", u: "HP", franjas: [
    { n: "5 – 15 HP", hpMin: 5, hpMax: 15, f: 1.0, cx: "Control / variadores" },
    { n: "20 – 30 HP", hpMin: 20, hpMax: 30, f: 1.1, cx: "Control / variadores" },
    { n: "50 – 60 HP", hpMin: 50, hpMax: 60, f: 1.25, cx: "Control / variadores" },
    { n: "75 – 100 HP", hpMin: 75, hpMax: 100, f: 1.4, cx: "Control / variadores" },
    { n: "110 – 150 HP", hpMin: 110, hpMax: 150, f: 1.6, cx: "Alta" },
    { n: "160 – 200 HP", hpMin: 160, hpMax: 200, f: 1.8, cx: "Alta" },
  ] },
];
export const TAMANOS_DEF: Factor[] = [
  {n:"Pequeño",f:1.0,ref:"Compresor ≤ 15 kW (≤ 20 HP) · Secador ≤ 100 cfm"},
  {n:"Mediano",f:1.3,ref:"Compresor 15–37 kW (20–50 HP) · Secador 100–300 cfm"},
  {n:"Grande",f:1.6,ref:"Compresor 37–90 kW (50–125 HP) · Secador 300–700 cfm"},
  {n:"Muy grande",f:2.0,ref:"Compresor 90–200 kW · Secador 700–1 500 cfm"},
  {n:"Industrial",f:2.5,ref:"Compresor > 200 kW · Secador > 1 500 cfm"}
];
export const HORARIOS_DEF: Horario[] = [
  {n:"Normal (lun–vie diurno)",rec:0},
  {n:"Nocturno (19:00–06:00)",rec:0.25},
  {n:"Suplementario (después de jornada)",rec:0.5},
  {n:"Fin de semana / feriado",rec:1.0}
];
export const ALTURAS_DEF: Altura[] = [
  {n:"Nivel de piso a 1,8 m",f:1.0,eq:"—",costo:0,cert:false},
  {n:"1,8 a 3 m (escalera)",f:1.1,eq:"Escalera tipo tijera / extensión",costo:0,cert:true},
  {n:"3 a 6 m (andamio)",f:1.3,eq:"Andamio certificado",costo:25,cert:true},
  {n:"6 a 9 m (plataforma de tijera)",f:1.6,eq:"Plataforma elevadora de tijera",costo:120,cert:true},
  {n:"9 a 12 m (brazo articulado)",f:2.0,eq:"Plataforma de brazo articulado",costo:220,cert:true}
];
export const ENTORNOS_DEF: Entorno[] = [
  {n:"Planta industrial",f:1.0,nota:"Condición estándar."},
  {n:"Concesionario / taller automotriz",f:1.1,nota:"Áreas con clientes, coordinación con la operación del taller."},
  {n:"Planta de alimentos / farmacéutica",f:1.2,nota:"BPM, inducciones, limpieza y restricciones de acceso."},
  {n:"Planta en operación 24 h / acceso restringido",f:1.15,nota:"Permisos diarios, ventanas de trabajo cortas."},
  {n:"Obra nueva (sin operación)",f:0.95,nota:"Acceso libre, sin interferencias."},
  {n:"Línea de pintura en operación",f:1.15,nota:"Paradas de línea programadas, limpieza de polvo y solventes, coordinación con producción."}
];
/** Franjas que usa cada mantenimiento según el prefijo de su código. */
const PREFIJO_POT: Record<string, string> = { PIS: "piston", TOR: "tornillo", PAL: "paletas", SRF: "srf", SRG: "srg" };
function potDeCodigo(cod: string): { escala: Escala; pot?: string } {
  const k = PREFIJO_POT[cod.slice(0, 3)];
  return k ? { escala: "potencia", pot: k } : { escala: "tamano" };
}
export const CATALOGO_DEF: ItemCatalogo[] = (() => {
  const P="Compresor de pistón",T="Compresor de tornillo",V="Compresor de paletas",R="Secador refrigerativo",D="Secador regenerativo (desecante)",G="General / sistema";
  const PM = "Preventivo", CM = "Correctivo";
  const m = ([
   ["PIS-P01",P,PM,"Inspección de rutina","Nivel de aceite, drenaje de tanque, limpieza filtro de aire, tensión de bandas, fugas, prueba válvula de seguridad.","500 h / mensual",1,"Baja"],
   ["PIS-P02",P,PM,"Servicio 1 000 h","Cambio de aceite y filtro de aire, revisión de bandas y poleas, limpieza de aletas, prueba de presostato.","1 000 h / trimestral",2,"Baja"],
   ["PIS-P03",P,PM,"Servicio 3 000 h","Servicio 1 000 h + platos de válvulas, empaques de culata, check y descarga, torque, mediciones eléctricas.","2 000–3 000 h / anual",4,"Media"],
   ["PIS-P04",P,PM,"Overhaul de cabezal","Anillos, cilindros, bielas, cojinetes, juego de válvulas y empaques; prueba de rendimiento.","6 000–10 000 h",12,"Alta"],
   ["PIS-C01",P,CM,"Diagnóstico de falla","Baja presión, ruido, consumo de aceite, sobretemperatura o disparo eléctrico; informe técnico.","Según evento",1.5,"Media"],
   ["PIS-C02",P,CM,"Cambio de kit de válvulas / plato","Desmontaje de culata, cambio de platos de válvulas y empaques.","Según evento",3,"Media"],
   ["PIS-C03",P,CM,"Cambio de válvula check o de descarga","Reemplazo de check, unloader o tubería de descarga.","Según evento",1.5,"Baja"],
   ["PIS-C04",P,CM,"Cambio de presostato / arrancador / guardamotor","Reemplazo y calibración de componentes de control eléctrico.","Según evento",2,"Media"],
   ["PIS-C05",P,CM,"Cambio de motor eléctrico","Desmontaje, montaje, alineación de poleas, conexión y prueba.","Según evento",3,"Media"],
   ["PIS-C06",P,CM,"Cambio de bandas y alineación de poleas","Reemplazo de bandas, alineación y tensado.","Según evento",1,"Baja"],
   ["TOR-P01",T,PM,"Inspección de rutina","Parámetros del controlador, purga de condensado, fugas, soplado de prefiltros y enfriadores.","500 h / mensual",1,"Baja"],
   ["TOR-P02",T,PM,"Servicio A – 2 000 h","Filtro de aire y filtro de aceite, nivel de aceite, limpieza de enfriadores, drenajes.","2 000 h",2.5,"Baja"],
   ["TOR-P03",T,PM,"Servicio B – 4 000 h","Servicio A + aceite y separador aire/aceite, válvula de presión mínima, admisión y termostática.","4 000 h / anual",4,"Media"],
   ["TOR-P04",T,PM,"Servicio C – 8 000 h","Servicio B + kits de admisión, presión mínima, termostática y solenoide; mangueras, rodamientos del motor, pruebas eléctricas.","8 000 h / bianual",8,"Alta"],
   ["TOR-P05",T,PM,"Mantenimiento motor principal","Rodamientos del motor, medición de aislamiento, alineación.","16 000–20 000 h",6,"Alta"],
   ["TOR-P06",T,PM,"Overhaul de elemento compresor (airend)","Rodamientos y sellos, verificación de holguras, montaje y arranque.","24 000–40 000 h",24,"Crítica"],
   ["TOR-C01",T,CM,"Diagnóstico de falla / alarma","Alarmas del controlador, mediciones eléctricas, presión y temperatura; informe técnico.","Según evento",2,"Media"],
   ["TOR-C02",T,CM,"Corrección de arrastre de aceite","Separador, línea de retorno (scavenge) y válvula de presión mínima.","Según evento",3,"Media"],
   ["TOR-C03",T,CM,"Corrección de alta temperatura","Limpieza química de enfriador, termostática, ventilador y nivel de aceite.","Según evento",4,"Media"],
   ["TOR-C04",T,CM,"Cambio de válvula de admisión (unloader)","Reemplazo o kit y prueba de carga/descarga.","Según evento",3,"Media"],
   ["TOR-C05",T,CM,"Cambio de válvula de presión mínima","Reemplazo o reparación con kit.","Según evento",2,"Media"],
   ["TOR-C06",T,CM,"Cambio de sensor / transductor","Transductor de presión o sensor de temperatura y calibración.","Según evento",1.5,"Media"],
   ["TOR-C07",T,CM,"Reparación de tablero eléctrico","Contactores estrella-triángulo, relés, temporizadores, fusibles, cableado.","Según evento",4,"Alta"],
   ["TOR-C08",T,CM,"Cambio de controlador y programación","Instalación, parametrización y pruebas del controlador.","Según evento",4,"Alta"],
   ["TOR-C09",T,CM,"Servicio a variador de frecuencia (VSD)","Diagnóstico, limpieza, ventiladores y parámetros del VSD.","Según evento",4,"Alta"],
   ["TOR-C10",T,CM,"Cambio de motor principal","Desmontaje, montaje, alineación de acople/bandas, conexión y pruebas.","Según evento",8,"Alta"],
   ["TOR-C11",T,CM,"Cambio de enfriador aire/aceite","Reemplazo del enfriador, mangueras y prueba de fugas.","Según evento",6,"Alta"],
   ["TOR-C12",T,CM,"Cambio de elemento compresor (airend)","Elemento completo, aceite y filtros, arranque.","Según evento",16,"Crítica"],
   ["PAL-P01",V,PM,"Inspección de rutina","Parámetros, nivel de aceite, purga, fugas, limpieza de enfriador.","500 h / mensual",1,"Baja"],
   ["PAL-P02",V,PM,"Servicio 2 000 h","Filtro de aire y filtro de aceite, limpieza de enfriador.","2 000 h",2.5,"Baja"],
   ["PAL-P03",V,PM,"Servicio 4 000–8 000 h","Aceite y separador, kits de presión mínima y admisión.","4 000–8 000 h",5,"Media"],
   ["PAL-P04",V,PM,"Inspección y medición de paletas","Desarme parcial del estator, desgaste de paletas y estado del rotor.","≈ 20 000–40 000 h",8,"Alta"],
   ["PAL-C01",V,CM,"Diagnóstico de falla","Presión, temperatura, ruido y consumo de aceite; informe.","Según evento",2,"Media"],
   ["PAL-C02",V,CM,"Cambio de juego de paletas","Desmontaje del grupo compresor, paletas, sellos y rodamientos.","Según evento",12,"Crítica"],
   ["PAL-C03",V,CM,"Cambio de sello mecánico / retenes de eje","Sello del eje y prueba de fugas.","Según evento",6,"Alta"],
   ["PAL-C04",V,CM,"Cambio de válvula de admisión / regulación","Reemplazo o kit y prueba de regulación.","Según evento",3,"Media"],
   ["PAL-C05",V,CM,"Cambio de motor eléctrico","Desmontaje, montaje, alineación y pruebas.","Según evento",6,"Alta"],
   ["SRF-P01",R,PM,"Inspección de rutina","Punto de rocío, prueba de drenaje, soplado de condensador.","Mensual",1,"Baja"],
   ["SRF-P02",R,PM,"Servicio semestral","Condensador, drenaje automático, presiones de refrigerante, consumo eléctrico, ventilador.","4 000 h / semestral",2,"Media"],
   ["SRF-P03",R,PM,"Servicio anual","Semestral + kit de drenaje, válvula de gas caliente, prueba de fugas de refrigerante, intercambiador.","8 000 h / anual",3,"Media"],
   ["SRF-C01",R,CM,"Diagnóstico de punto de rocío alto","Presión/temperatura del circuito frigorífico y flujo de aire; informe.","Según evento",2,"Media"],
   ["SRF-C02",R,CM,"Reparación de fuga de refrigerante y recarga","Detección de fuga, soldadura, vacío y carga.","Según evento",5,"Alta"],
   ["SRF-C03",R,CM,"Cambio de compresor frigorífico","Recuperación de gas, compresor y filtro deshidratador, vacío, carga y pruebas.","Según evento",8,"Alta"],
   ["SRF-C04",R,CM,"Cambio de válvula de gas caliente / expansión","Recuperación, soldadura, vacío, carga y ajuste.","Según evento",5,"Alta"],
   ["SRF-C05",R,CM,"Cambio de motoventilador del condensador","Motor/aspa y prueba.","Según evento",2,"Media"],
   ["SRF-C06",R,CM,"Cambio de tarjeta / sensor de punto de rocío","Controlador o sensor y verificación.","Según evento",2,"Media"],
   ["SRF-C07",R,CM,"Cambio de drenaje automático / temporizador","Purgador electrónico o temporizado.","Según evento",1,"Baja"],
   ["SRG-P01",D,PM,"Inspección de rutina","Punto de rocío, presiones de torres, ciclo de conmutación, silenciadores, drenajes.","Mensual",1,"Baja"],
   ["SRG-P02",D,PM,"Servicio semestral","Elementos de prefiltro y postfiltro, silenciadores, verificación de ciclo.","4 000 h / semestral",2.5,"Media"],
   ["SRG-P03",D,PM,"Servicio anual","Semestral + kits de check, purga y solenoides, silenciadores, calibración de sensor de punto de rocío.","8 000 h / anual",5,"Alta"],
   ["SRG-P04",D,PM,"Cambio de desecante","Vaciado de torres, alúmina activada / tamiz molecular, mallas y difusores, prueba.","3–5 años",10,"Alta"],
   ["SRG-P05",D,PM,"Mantenimiento de calentador y blower","Resistencias, blower, termostatos y aislamiento.","8 000 h / anual",4,"Alta"],
   ["SRG-C01",D,CM,"Diagnóstico de falla","Ciclos, válvulas, punto de rocío y controlador; informe.","Según evento",2,"Media"],
   ["SRG-C02",D,CM,"Cambio de válvulas de conmutación","Válvulas principales de conmutación / escape.","Según evento",4,"Alta"],
   ["SRG-C03",D,CM,"Cambio de electroválvulas piloto","Solenoides y prueba de secuencia.","Según evento",2,"Media"],
   ["SRG-C04",D,CM,"Cambio de controlador / PLC / sensor","Instalación, programación de ciclo y pruebas.","Según evento",3,"Alta"],
   ["SRG-C05",D,CM,"Cambio de resistencias o blower","Calentador o soplador y pruebas.","Según evento",5,"Alta"],
   ["GEN-01",G,CM,"Visita técnica de evaluación","Inspección del sistema de aire comprimido y recomendaciones.","Según solicitud",2,"Baja"],
   ["GEN-02",G,PM,"Detección de fugas con ultrasonido","Recorrido de red, etiquetado y reporte de fugas (por jornada).","Anual",8,"Media"],
   ["GEN-03",G,PM,"Puesta en marcha / comisionamiento","Verificación de instalación, arranque, parámetros y capacitación básica.","Equipo nuevo",4,"Media"]
  ] as Fila[]).map((r) => ({ cod: String(r[0]), grupo: String(r[1]), tipo: String(r[2]), act: String(r[3]), alcance: String(r[4]), intervalo: String(r[5]), unidad: "equipo", horas: Number(r[6]), cx: String(r[7]), ...potDeCodigo(String(r[0])), fam: "mant" as Familia, cert: "" }));
  const VP = "Variador de velocidad Parker", CV = "Control / variadores";
  const vfd: ItemCatalogo[] = ([
   ["VAR-P01",PM,"Mantenimiento preventivo de variador","Limpieza de disipador y ventiladores, reapriete de borneras, revisión de capacitores del bus DC, historial de fallas, respaldo de parámetros, mediciones de entrada y salida.","Semestral / anual",2,CV],
   ["VAR-P02",PM,"Puesta en marcha de variador","Verificación de instalación y puesta a tierra, parametrización, autoajuste del motor, lazo de presión, pruebas en carga y capacitación básica.","Equipo nuevo",4,CV],
   ["VAR-C01",CM,"Diagnóstico de falla de variador","Lectura de alarmas e historial, mediciones de potencia y control, prueba de módulos; informe técnico.","Según evento",2,CV],
   ["VAR-C02",CM,"Programación / parametrización de variador","Datos del motor, rampas, límites de frecuencia, lazo PID de presión, entradas/salidas y comunicación; pruebas con carga y respaldo de parámetros.","Según evento",3,CV],
   ["VAR-C03","Instalación","Migración de variador anterior a nuevo modelo Parker","Levantamiento de parámetros y planos del equipo anterior, desmontaje, montaje y cableado del nuevo variador, adaptación del control, parametrización, pruebas y respaldo.","Según proyecto",8,CV]
  ] as Fila[]).map((r) => ({ cod: String(r[0]), grupo: VP, tipo: String(r[1]), act: String(r[2]), alcance: String(r[3]), intervalo: String(r[4]), unidad: "equipo", horas: Number(r[5]), cx: String(r[6]), escala: "potencia" as Escala, fam: "vfd" as Familia, cert: "electrica", pot: "variador" }));
  const A="Red de tubería de aluminio",B="Accesorios y válvulas",C="Bajantes y conexiones",E="Emplazamiento de equipos",F="Tratamiento de aire y drenaje",H="Pruebas y obras complementarias";
  const L="Instalación ligera",I="Instalación",X="Instalación pesada";
  const ins = ([
   ["RED-T20",A,"Tubería de aluminio Ø20 mm","Tendido, corte, conectores rápidos y soportería cada 2–3 m con anclajes.","m",0.20,L],
   ["RED-T25",A,"Tubería de aluminio Ø25 mm","Tendido, corte, conectores rápidos y soportería cada 2–3 m con anclajes.","m",0.20,L],
   ["RED-T32",A,"Tubería de aluminio Ø32 mm","Tendido, corte, conectores rápidos y soportería cada 2–3 m con anclajes.","m",0.22,L],
   ["RED-T40",A,"Tubería de aluminio Ø40 mm","Tendido, corte, conectores rápidos y soportería cada 2–3 m con anclajes.","m",0.25,L],
   ["RED-T50",A,"Tubería de aluminio Ø50 mm","Tendido, corte, conectores y soportería reforzada cada 3 m.","m",0.25,I],
   ["RED-T63",A,"Tubería de aluminio Ø63 mm","Tendido, corte, conectores y soportería reforzada cada 3 m.","m",0.30,I],
   ["RED-T80",A,"Tubería de aluminio Ø80 mm","Tendido con apoyo de izaje manual, uniones bridadas/rápidas, soportería pesada.","m",0.35,X],
   ["RED-T110",A,"Tubería de aluminio Ø110 mm","Tendido con apoyo de izaje manual, uniones bridadas, soportería pesada.","m",0.45,X],
   ["RED-A01",B,"Accesorio Ø20–40 mm (codo, tee, reducción, unión)","Montaje y ajuste de accesorio en línea.","u",0.25,L],
   ["RED-A02",B,"Accesorio Ø50–63 mm (codo, tee, reducción, unión)","Montaje y ajuste de accesorio en línea.","u",0.35,I],
   ["RED-A03",B,"Accesorio Ø80–110 mm (codo, tee, reducción, brida)","Montaje y ajuste de accesorio en línea.","u",0.50,X],
   ["RED-V01",B,"Válvula de bola en línea Ø20–40 mm","Instalación de válvula de seccionamiento.","u",0.30,L],
   ["RED-V02",B,"Válvula de bola en línea Ø50–110 mm","Instalación de válvula de seccionamiento.","u",0.60,I],
   ["RED-V03",B,"Válvula de seguridad / manómetro","Instalación y verificación.","u",0.30,L],
   ["RED-B01",C,"Bajante / punto de consumo completo","Cuello de cisne, tubería de bajada, escuadra de pared, válvula y acople rápido.","u",0.80,L],
   ["RED-B02",C,"Toma de pared múltiple (2–3 salidas)","Bloque de distribución con válvulas y acoples.","u",0.50,L],
   ["RED-B03",C,"Conexión de compresor a la red","Manguera flexible antivibratoria, válvula y unión a la línea principal.","u",1.50,I],
   ["RED-B04",C,"Cabezal / manifold de sala de compresores","Colector de descarga, válvulas, by-pass y soportería.","u",4.00,I],
   ["RED-E01",E,"Emplazamiento de tanque pulmón hasta 500 L","Ubicación, nivelación, anclaje, conexiones, válvula de seguridad y drenaje.","u",3.0,I],
   ["RED-E02",E,"Emplazamiento de tanque pulmón 501–1 000 L","Ubicación con montacargas del cliente, nivelación, anclaje y conexiones.","u",4.0,X],
   ["RED-E03",E,"Emplazamiento de tanque pulmón 1 001–3 000 L","Maniobra de izaje, nivelación, anclaje y conexiones (grúa no incluida).","u",6.0,X],
   ["RED-E04",E,"Emplazamiento de tanque pulmón > 3 000 L","Maniobra de izaje, nivelación, anclaje y conexiones (grúa no incluida).","u",10.0,X],
   ["RED-E05",E,"Emplazamiento de secador refrigerativo hasta 300 cfm","Ubicación, conexiones de aire, by-pass, drenaje y conexión eléctrica en punto existente.","u",3.0,I],
   ["RED-E06",E,"Emplazamiento de secador refrigerativo > 300 cfm","Ubicación, conexiones, by-pass, drenaje y conexión eléctrica en punto existente.","u",5.0,X],
   ["RED-E07",E,"Emplazamiento de secador regenerativo hasta 300 cfm","Ubicación, conexiones, prefiltro/postfiltro, silenciadores y conexión eléctrica.","u",5.0,X],
   ["RED-E08",E,"Emplazamiento de secador regenerativo > 300 cfm","Ubicación con izaje, conexiones, filtros, silenciadores y conexión eléctrica.","u",8.0,X],
   ["RED-F01",F,"Filtro de línea (partículas / coalescente / carbón)","Instalación en línea con by-pass y drenaje.","u",0.75,L],
   ["RED-F02",F,"Tren de filtración (3 etapas)","Instalación en serie con soporte y drenajes.","u",1.50,L],
   ["RED-F03",F,"Unidad de mantenimiento FRL / filtro-regulador","Instalación en punto de uso con soporte y manómetro.","u",0.75,L],
   ["RED-F04",F,"Drenador automático electrónico","Montaje, conexión de condensado y cableado eléctrico hasta 5 m.","u",1.00,"Media"],
   ["RED-F05",F,"Drenador automático por flotador","Montaje y conexión de condensado.","u",0.50,L],
   ["RED-F06",F,"Separador agua-aceite de condensados","Emplazamiento, conexión de entradas y descarga.","u",2.00,I],
   ["RED-F07",F,"Tubería de drenaje de condensados","Tendido de manguera o tubería hasta desagüe.","m",0.12,L],
   ["RED-G01",H,"Prueba de hermeticidad y presión de la red","Presurización, verificación de fugas y acta de prueba.","global",2.0,I],
   ["RED-G02",H,"Señalización y etiquetado de tubería","Identificación por color, flechas de sentido de flujo.","m",0.03,L],
   ["RED-G03",H,"Levantamiento en sitio y planos as-built","Medición de recorridos, ubicación de equipos y planos finales.","global",4.0,L],
   ["RED-G04",H,"Desmontaje de tubería existente","Retiro de tubería y soportes antiguos.","m",0.10,I],
   ["RED-G05",H,"Recepción y movilización de materiales en obra","Descarga, almacenamiento y distribución de materiales.","global",2.0,L],
   ["RED-G06",H,"Soporte especial / estructura de anclaje","Fabricación o montaje de soporte en viga, columna o cercha.","u",0.40,L]
  ] as Fila[]).map((r) => ({ cod: String(r[0]), grupo: String(r[1]), tipo: "Instalación", act: String(r[2]), alcance: String(r[3]), intervalo: "—", unidad: String(r[4]), horas: Number(r[5]), cx: String(r[6]), escala: "altura" as Escala, fam: "inst" as Familia, cert: r[0] === "RED-F04" ? "electrica" : "" }));
  const EL="Instalación eléctrica de equipos", ET="Etiquetado y señalización (INEN 440 / ASME A13.1)", IE="Instalación eléctrica";
  const ins2 = ([
   ["ELE-01",EL,"Acometida eléctrica a compresor","Desde tablero existente: cable de potencia, canalización hasta 15 m, breaker o seccionador, conexión y verificación de rotación.","u",4.0,IE,"tamano","electrica"],
   ["ELE-02",EL,"Acometida eléctrica a secador (refrigerativo o regenerativo)","Cable, canalización hasta 15 m, protección y conexión.","u",2.5,IE,"tamano","electrica"],
   ["ELE-03",EL,"Alimentación eléctrica de drenador automático","Punto 110/220 V, cable, caja y conexión del drenador.","u",0.75,IE,"altura","electrica"],
   ["ELE-04",EL,"Canalización eléctrica (EMT o bandeja)","Tubería EMT o bandeja portacables con soportes y accesorios.","m",0.20,IE,"altura","electrica"],
   ["ELE-05",EL,"Tendido de cable de potencia","Tendido y peinado de conductores en canalización.","m",0.05,IE,"altura","electrica"],
   ["ELE-06",EL,"Tablero o caja de protección del equipo","Montaje con breaker termomagnético, seccionador y señalización.","u",2.5,IE,"ninguna","electrica"],
   ["ELE-07",EL,"Puesta a tierra del equipo","Conexión al sistema de tierra existente y medición de continuidad.","u",1.0,IE,"ninguna","electrica"],
   ["ELE-08",EL,"Instalación de arrancador, guardamotor o variador","Montaje, cableado de potencia y control, parametrización básica.","u",3.0,"Alta","tamano","electrica"],
   ["ELE-09",EL,"Cableado de control y alarmas","Señales de marcha, alarma remota, secuenciador o monitoreo.","m",0.08,IE,"altura","electrica"],
   ["ELE-10",EL,"Pruebas eléctricas y protocolo de arranque","Tensión, corriente, aislamiento (megger), rotación y registro.","u",1.0,IE,"ninguna","electrica"],
   ["ETQ-01",ET,"Etiqueta de identificación de tubería de aire comprimido","Leyenda «AIRE COMPRIMIDO» en color de contraste sobre azul, flecha de flujo y presión de trabajo. Se coloca en derivaciones, a ambos lados de válvulas y paredes, y a intervalos en tramos rectos.","punto",0.15,L,"altura",""],
   ["ETQ-02",ET,"Placas de identificación de equipos y válvulas","Placas o tags para compresores, secadores, tanques, filtros y válvulas de seccionamiento.","u",0.20,L,"ninguna",""],
   ["ETQ-03",ET,"Señalización de seguridad de sala de compresores","Rótulos de riesgo: presión, ruido, arranque automático y EPP obligatorio.","global",1.5,L,"ninguna",""],
   ["ETQ-04",ET,"Plano de red con códigos de etiquetado","Esquema de la red con ubicación y código de cada etiqueta, para entrega al cliente.","global",2.0,L,"ninguna",""]
  ] as Fila[]).map((r) => ({ cod: String(r[0]), grupo: String(r[1]), tipo: "Instalación", act: String(r[2]), alcance: String(r[3]), intervalo: "—", unidad: String(r[4]), horas: Number(r[5]), cx: String(r[6]), escala: String(r[7]) as Escala, fam: "inst" as Familia, cert: String(r[8]) }));
  const PG="Pintura en polvo (Gema)",PB="Pintura líquida (Binks)",PL="Líneas automáticas de pintura",PE="Esmalte cerámico (línea blanca)";
  const PS="Pintura – servicio",PA="Pintura – línea automática",IN="Instalación";
  const pint = ([
   ["PPV-P01",PG,PM,"Mantenimiento de pistola manual de polvo","Limpieza, boquilla, electrodo, cascada y mangueras; prueba de kV y µA.","Trimestral","u",1.0,PS],
   ["PPV-P02",PG,PM,"Mantenimiento de equipo manual completo","Unidad de control, inyector o bomba, fluidización, mangueras y pistola; calibración.","Semestral","u",2.0,PS],
   ["PPV-P03",PG,PM,"Mantenimiento de pistola automática de polvo","Desarme, limpieza, desgastables y prueba de alto voltaje.","Trimestral","u",1.25,PS],
   ["PPV-P04",PG,PM,"Mantenimiento de inyector o bomba de fase densa","Insertos, venturis o mangueras de bomba; prueba de caudal.","Trimestral","u",0.75,PS],
   ["PPV-P05",PG,PM,"Mantenimiento de centro de polvo","Tolva fluidizada, tamiz, sondas, transporte de polvo virgen y recuperado.","Semestral","u",4.0,PS],
   ["PPV-P06",PG,PM,"Mantenimiento de cabina de recuperación","Ciclón, filtros, limpieza por pulsos, ventilador, sellos y puesta a tierra.","Semestral","u",6.0,PA],
   ["PPV-P07",PG,PM,"Cambio de filtros de cartucho de cabina","Retiro, limpieza de cámara, montaje y prueba de pulsos.","Según presión diferencial","u",3.0,PS],
   ["PPV-C01",PG,CM,"Diagnóstico de falla en sistema de polvo","Baja transferencia, escupidas, falta de carga o falla de control; informe.","Según evento","u",2.0,PS],
   ["PPV-C02",PG,CM,"Cambio de cascada o módulo de alto voltaje","Reemplazo y verificación de kV y µA.","Según evento","u",1.5,PS],
   ["PPV-C03",PG,CM,"Ajuste de parámetros y prueba de espesor","kV, µA, aire de transporte y dosificación; medición de espesor y transferencia.","Según evento","global",2.0,PS],
   ["PLQ-P01",PB,PM,"Mantenimiento de pistola manual (convencional o HVLP)","Desarme, kit de reparación, prueba de abanico y atomización.","Trimestral","u",0.75,PS],
   ["PLQ-P02",PB,PM,"Mantenimiento de pistola automática líquida","Kit de aguja, boquilla y sellos; prueba de disparo.","Trimestral","u",1.25,PS],
   ["PLQ-P03",PB,PM,"Mantenimiento de bomba de pintura (pistón o diafragma)","Kit de sellos y válvulas, prueba de presión y caudal.","Semestral","u",3.0,PS],
   ["PLQ-P04",PB,PM,"Mantenimiento de tanque a presión","Regulador, agitador, válvula de seguridad y empaques.","Semestral","u",1.5,PS],
   ["PLQ-P05",PB,PM,"Mantenimiento de sistema de circulación de pintura","Bombas, reguladores de retorno, filtros y mangueras del circuito.","Semestral","global",4.0,PA],
   ["PLQ-P06",PB,PM,"Mantenimiento de cabina de pintura líquida","Filtros secos o cortina de agua, extractor, iluminación y puesta a tierra.","Semestral","u",5.0,PS],
   ["PLQ-C01",PB,CM,"Diagnóstico de defecto de aplicación","Atomización, abanico, presiones y viscosidad; informe.","Según evento","u",2.0,PS],
   ["LIN-P01",PL,PM,"Mantenimiento de reciprocador o eje vertical","Correa o cadena, guías, rodamientos, finales de carrera y variador.","Semestral","u",3.0,PA],
   ["LIN-P02",PL,PM,"Mantenimiento de control de línea automática","PLC, sincronización con transportador, detección de piezas y gatillado de pistolas.","Semestral","global",8.0,PA],
   ["LIN-P03",PL,PM,"Revisión de puesta a tierra de ganchos y transportador","Medición de resistencia a tierra y limpieza de ganchos (perfiles de aluminio, cilindros de acero).","Mensual","global",2.0,PS],
   ["LIN-I01",PL,IN,"Instalación de pistola automática en línea","Montaje en soporte o reciprocador, mangueras, cableado y prueba.","—","u",3.0,PA],
   ["LIN-I02",PL,IN,"Instalación de reciprocador","Montaje, nivelación, cableado y programación de carrera.","—","u",8.0,PA],
   ["LIN-I03",PL,IN,"Puesta en marcha de línea automática","Ajuste de pistolas, recetas y parámetros para perfiles de aluminio o cilindros de acero; capacitación.","—","global",16.0,PA],
   ["LIN-C01",PL,CM,"Diagnóstico de falla en línea automática","Gatillado, cobertura irregular, sincronización o comunicación; informe.","Según evento","global",4.0,PA],
   ["ESM-P01",PE,PM,"Mantenimiento de pistolas de esmalte cerámico en polvo","Mayor desgaste por abrasión: boquillas, deflectores, mangueras y electrodos.","Mensual a trimestral","u",1.5,PS],
   ["ESM-P02",PE,PM,"Mantenimiento de inyectores y transporte de esmalte en polvo","Insertos y mangueras con desgaste abrasivo.","Mensual a trimestral","u",1.0,PS],
   ["ESM-P03",PE,PM,"Mantenimiento de cabina de esmalte con recuperación","Ciclón, filtros, tamiz y retorno de esmalte recuperado.","Semestral","u",6.0,PA],
   ["ESM-P04",PE,PM,"Mantenimiento de sistema automático de esmalte líquido (cocinas)","Bombas, agitación, boquillas, recirculación y control de densidad de la barbotina.","Semestral","global",8.0,PA],
   ["ESM-C01",PE,CM,"Ajuste de espesor y uniformidad de esmalte","Prueba de aplicación, medición de espesor y ajuste de parámetros.","Según evento","global",3.0,PS]
  ] as Fila[]).map((r) => ({ cod: String(r[0]), grupo: String(r[1]), tipo: String(r[2]), act: String(r[3]), alcance: String(r[4]), intervalo: String(r[5]), unidad: String(r[6]), horas: Number(r[7]), cx: String(r[8]), escala: "ninguna" as Escala, fam: "pint" as Familia, cert: "pintura" }));
  return [...m, ...vfd, ...ins, ...ins2, ...pint];
})();
export const CIUDADES_DEF: CiudadCot[] = ([
 ["Guayaquil (urbano)","Guayas","Costa",15],["Durán","Guayas","Costa",18],["Samborondón / La Puntilla","Guayas","Costa",20],
 ["Vía a la Costa (Chongón)","Guayas","Costa",25],["Vía Daule / Pascuales","Guayas","Costa",25],["Nobol","Guayas","Costa",35],
 ["Daule","Guayas","Costa",45],["Milagro","Guayas","Costa",45],["Yaguachi","Guayas","Costa",35],
 ["El Triunfo","Guayas","Costa",70],["Pedro Carbo","Guayas","Costa",70],["Naranjal","Guayas","Costa",85],
 ["Playas (General Villamil)","Guayas","Costa",97],["Posorja","Guayas","Costa",115],["El Empalme","Guayas","Costa",175],
 ["Santa Elena","Santa Elena","Costa",135],["La Libertad","Santa Elena","Costa",140],["Salinas","Santa Elena","Costa",145],
 ["Babahoyo","Los Ríos","Costa",70],["Ventanas","Los Ríos","Costa",115],["Quevedo","Los Ríos","Costa",180],
 ["Machala","El Oro","Costa",190],["Pasaje","El Oro","Costa",175],["Santa Rosa","El Oro","Costa",210],
 ["Huaquillas","El Oro","Costa",255],["Jipijapa","Manabí","Costa",145],["Portoviejo","Manabí","Costa",185],
 ["Montecristi","Manabí","Costa",180],["Manta","Manabí","Costa",195],["Chone","Manabí","Costa",210],
 ["Bahía de Caráquez","Manabí","Costa",230],["Pedernales","Manabí","Costa",340],["Esmeraldas","Esmeraldas","Costa",470],
 ["Santo Domingo","Santo Domingo de los Tsáchilas","Costa",290],
 ["Cuenca","Azuay","Sierra",195],["Azogues","Cañar","Sierra",220],["La Troncal","Cañar","Costa",95],
 ["Guaranda","Bolívar","Sierra",210],["Riobamba","Chimborazo","Sierra",230],["Ambato","Tungurahua","Sierra",290],
 ["Latacunga","Cotopaxi","Sierra",310],["Quito","Pichincha","Sierra",420],["Sangolquí / Valle de los Chillos","Pichincha","Sierra",420],
 ["Otavalo","Imbabura","Sierra",510],["Ibarra","Imbabura","Sierra",535],["Tulcán","Carchi","Sierra",660],
 ["Loja","Loja","Sierra",410],["Zamora","Zamora Chinchipe","Amazonía",470],["Macas","Morona Santiago","Amazonía",410],
 ["Puyo","Pastaza","Amazonía",390],["Tena","Napo","Amazonía",470],["Nueva Loja (Lago Agrio)","Sucumbíos","Amazonía",680],
 ["Francisco de Orellana (Coca)","Orellana","Amazonía",720],
 ["Puerto Ayora (Santa Cruz)","Galápagos","Insular",0],["Puerto Baquerizo Moreno (San Cristóbal)","Galápagos","Insular",0]
] as Fila[]).map((c) => ({ n: String(c[0]), prov: String(c[1]), reg: String(c[2]), km: Number(c[3]), modo: c[2] === "Insular" ? "Aéreo" : "Terrestre" }));
