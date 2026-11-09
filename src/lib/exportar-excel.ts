// Exporta el reporte de horas a Excel (.xlsx) en el navegador.
import type { Agrupacion, RegistroHoras } from "./reporte-horas";
import { claveGrupo, clavesConDatos, etiquetaGrupo, textoJornada, totales } from "./reporte-horas";

const AZUL = "FF0B2A4A";
const EXTRA_FONDO = "FFFDF3E1";
const EXTRA_TEXTO = "FF9A5B00";

export async function exportarHorasExcel(opts: { regs: RegistroHoras[]; desde: string; hasta: string; por: Agrupacion; titulo: string }) {
  const { regs, desde, hasta, por, titulo } = opts;
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Optimum Service AI";
  wb.created = new Date();

  const encabezado = (ws: import("exceljs").Worksheet, fila: number) => {
    const r = ws.getRow(fila);
    r.font = { bold: true, color: { argb: "FFFFFFFF" } };
    r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL } };
    r.alignment = { vertical: "middle", wrapText: true };
    r.height = 30;
  };
  const resaltarExtra = (cell: import("exceljs").Cell) => {
    if (Number(cell.value) > 0) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: EXTRA_FONDO } };
      cell.font = { bold: true, color: { argb: EXTRA_TEXTO } };
    }
  };
  const titulo3 = (ws: import("exceljs").Worksheet, sub: string) => {
    ws.addRow([titulo]).font = { bold: true, size: 14 };
    ws.addRow([`Período: ${desde} a ${hasta} · ${sub}`]);
    ws.addRow([`Horas extra: todo lo trabajado fuera de ${textoJornada}.`]).font = { italic: true, color: { argb: EXTRA_TEXTO } };
    ws.addRow([]);
  };
  const H = "0.00"; // formato horas decimales
  const r2d = (x: number) => Math.round(x * 100) / 100;

  // 1. Resumen por técnico
  const r1 = wb.addWorksheet("Resumen");
  titulo3(r1, "resumen por técnico");
  r1.columns = [{ width: 26 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 10 }, { width: 14 }, { width: 16 }];
  r1.addRow(["Técnico", "Horas totales", "Horas normales", "Horas extra", "Tareas", "Días trabajados", "Promedio por día"]);
  encabezado(r1, 5);
  const porTec = [...new Set(regs.map((r) => r.tecnico))];
  for (const t of porTec) {
    const tt = totales(regs.filter((r) => r.tecnico === t));
    const row = r1.addRow([t, r2d(tt.horas), r2d(tt.normales), r2d(tt.extra), tt.tareas, tt.dias, tt.dias ? r2d(tt.horas / tt.dias) : 0]);
    [2, 3, 4, 7].forEach((c) => (row.getCell(c).numFmt = H));
    resaltarExtra(row.getCell(4));
  }
  const tg = totales(regs);
  const tot = r1.addRow(["TOTAL", r2d(tg.horas), r2d(tg.normales), r2d(tg.extra), tg.tareas, "", ""]);
  tot.font = { bold: true };
  [2, 3, 4].forEach((c) => (tot.getCell(c).numFmt = H));
  resaltarExtra(tot.getCell(4));

  // 2. Técnico × período
  const nombre = por === "dia" ? "Por día" : por === "semana" ? "Por semana" : "Por mes";
  const r2 = wb.addWorksheet(nombre);
  titulo3(r2, nombre.toLowerCase());
  const claves = clavesConDatos(desde, hasta, por, regs);
  r2.columns = [{ width: 26 }, { width: 10 }, ...claves.map(() => ({ width: 13 })), { width: 12 }];
  r2.addRow(["Técnico", "Tipo", ...claves.map((k) => etiquetaGrupo(k, por)), "Total"]);
  encabezado(r2, 5);
  for (const t of porTec) {
    const suyos = regs.filter((r) => r.tecnico === t);
    for (const [label, campo] of [["Total", "horas"], ["Normales", "normales"], ["Extra", "extra"]] as const) {
      const vals = claves.map((k) => r2d(suyos.filter((r) => claveGrupo(r.fecha, por) === k).reduce((a, r) => a + r[campo], 0)));
      const row = r2.addRow([label === "Total" ? t : "", label, ...vals, r2d(vals.reduce((a, b) => a + b, 0))]);
      for (let c = 3; c <= claves.length + 3; c++) row.getCell(c).numFmt = H;
      if (label === "Total") row.font = { bold: true };
      if (label === "Extra") for (let c = 3; c <= claves.length + 3; c++) resaltarExtra(row.getCell(c));
    }
  }

  // 3. Detalle
  const r3 = wb.addWorksheet("Detalle");
  titulo3(r3, "detalle de tareas");
  r3.columns = [
    { width: 12 }, { width: 8 }, { width: 24 }, { width: 13 }, { width: 8 }, { width: 8 }, { width: 10 }, { width: 10 }, { width: 10 },
    { width: 30 }, { width: 12 }, { width: 28 }, { width: 10 }, { width: 14 }, { width: 32 }, { width: 34 },
  ];
  r3.addRow(["Fecha", "Día", "Técnico", "Rol", "Entrada", "Salida", "Horas", "Normales", "Extra", "Cliente", "Ciudad", "Equipo", "Mant. Nº", "Tipo", "Tarea", "Observaciones"]);
  encabezado(r3, 5);
  const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  for (const r of regs) {
    const row = r3.addRow([
      new Date(r.fecha + "T00:00:00"), DIAS[new Date(r.fecha + "T00:00:00").getDay()], r.tecnico, r.rol,
      r.entrada.slice(11, 16), r.salida.slice(0, 10) !== r.fecha ? `${r.salida.slice(11, 16)} (+1)` : r.salida.slice(11, 16),
      r2d(r.horas), r2d(r.normales), r2d(r.extra), r.cliente, r.ciudad, r.equipo, r.mantenimiento, r.tipo, r.tarea, r.observaciones,
    ]);
    row.getCell(1).numFmt = "dd/mm/yyyy";
    [7, 8, 9].forEach((c) => (row.getCell(c).numFmt = H));
    resaltarExtra(row.getCell(9));
  }
  for (const ws of [r1, r2, r3]) ws.views = [{ state: "frozen", ySplit: 5, xSplit: 1 }];
  r3.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: 16 } };

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `horas-tecnicos_${desde}_a_${hasta}.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
