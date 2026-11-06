// Fechas: se manejan como ISO local sin zona ("2026-11-06T08:30:00")
// para que servidor y navegador muestren lo mismo.

export const toLocalIso = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

export const hora = (iso?: string) => (iso ? iso.slice(11, 16) : "—");

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

export const fechaCorta = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
};

export const fechaLarga = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  const dia = DIAS[d.getDay()];
  return `${dia[0].toUpperCase()}${dia.slice(1)} ${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
};

export const diaSemana = (iso: string) => DIAS[new Date(iso.slice(0, 10) + "T00:00:00").getDay()];

export const horasEntre = (a?: string, b?: string) =>
  a && b ? (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000 : 0;

/** 2.25 → "2 h 15 min" */
export const duracion = (h: number) => {
  if (!isFinite(h) || h <= 0) return "0 min";
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  if (hh === 0) return `${mm} min`;
  return mm ? `${hh} h ${mm} min` : `${hh} h`;
};

export const diasEntre = (a: string, b: string) =>
  Math.round((new Date(b.slice(0, 10) + "T00:00:00").getTime() - new Date(a.slice(0, 10) + "T00:00:00").getTime()) / 86_400_000);

export const metros = (m?: number) => (m == null ? "—" : m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`);

export const iniciales = (n: string) =>
  n.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
