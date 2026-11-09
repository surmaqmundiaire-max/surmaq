"use client";

// Tabla editable genérica del cotizador (equivalente a la grilla del cotizador original).
import { useState, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { cx } from "../ui";

export type Opcion = string | { v: string; l: string };
export interface Columna<T> {
  k?: keyof T & string;
  label: string;
  tipo?: "texto" | "num" | "select" | "bool" | "area";
  opciones?: Opcion[];
  step?: string;
  ancho?: string;
  num?: boolean;
  soloLectura?: boolean;
  fmt?: (v: unknown, fila: T) => ReactNode;
  fn?: (fila: T, i: number) => ReactNode;
}

const op = (o: Opcion) => (typeof o === "string" ? { v: o, l: o } : o);
const claseInput = "h-9 w-full min-w-0 rounded-lg border border-borde bg-superficie px-2 text-sm disabled:bg-fondo";

export function TablaEditable<T extends object>({ filas, cols, editable, onCambio, onQuitar, onAgregar, etiquetaAgregar = "Agregar fila", vacio = "Sin registros", clave }: {
  filas: T[];
  cols: Columna<T>[];
  editable?: boolean;
  onCambio?: (i: number, cambios: Partial<T>) => void;
  onQuitar?: (i: number) => void;
  onAgregar?: () => void;
  etiquetaAgregar?: string;
  vacio?: string;
  clave?: (fila: T, i: number) => string;
}) {
  const [confirmar, setConfirmar] = useState<number | null>(null);
  const celda = (f: T, c: Columna<T>, i: number) => {
    if (c.fn) return c.fn(f, i);
    const v = c.k ? (f[c.k] as unknown) : undefined;
    if (!editable || c.soloLectura || !c.k || !onCambio) {
      if (c.fmt) return c.fmt(v, f);
      if (c.tipo === "bool") return v ? "Sí" : "—";
      if (c.tipo === "select" && c.opciones) return c.opciones.map(op).find((o) => o.v === v)?.l ?? String(v ?? "");
      return String(v ?? "");
    }
    const k = c.k;
    const set = (nv: unknown) => onCambio(i, { [k]: nv } as Partial<T>);
    if (c.tipo === "bool") return <input type="checkbox" checked={!!v} onChange={(e) => set(e.target.checked)} aria-label={c.label} className="h-5 w-5 accent-marca-800" />;
    if (c.tipo === "select") return (
      <select value={String(v ?? "")} onChange={(e) => set(e.target.value)} aria-label={c.label} className={claseInput}>
        {(c.opciones ?? []).map(op).map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    );
    if (c.tipo === "num") return <input type="number" step={c.step ?? "any"} value={Number(v ?? 0)} onChange={(e) => set(Number(e.target.value) || 0)} aria-label={c.label} className={cx(claseInput, "text-right tabular")} />;
    if (c.tipo === "area") return <textarea value={String(v ?? "")} onChange={(e) => set(e.target.value)} aria-label={c.label} rows={2} className={cx(claseInput, "h-auto py-1")} />;
    return <input value={String(v ?? "")} onChange={(e) => set(e.target.value)} aria-label={c.label} className={claseInput} />;
  };

  return (
    <div>
      <div className="relative overflow-x-auto rounded-xl border border-borde">
        <table className="w-full text-sm">
          <thead className="bg-fondo text-left text-xs text-tinta-2">
            <tr>
              {cols.map((c, j) => <th key={j} className={cx("px-2 py-2 font-semibold whitespace-nowrap", c.num && "text-right")}>{c.label}</th>)}
              {editable && onQuitar && <th className="w-10"><span className="sr-only">Quitar</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {filas.length === 0 && <tr><td colSpan={cols.length + 1} className="px-3 py-6 text-center text-tinta-3">{vacio}</td></tr>}
            {filas.map((f, i) => (
              <tr key={clave ? clave(f, i) : i} className="align-top">
                {cols.map((c, j) => (
                  <td key={j} className={cx("px-2 py-1.5", c.num && "text-right tabular whitespace-nowrap")} style={c.ancho ? { minWidth: c.ancho } : undefined}>{celda(f, c, i)}</td>
                ))}
                {editable && onQuitar && (
                  <td className="px-1 py-1.5 whitespace-nowrap">
                    {confirmar === i ? (
                      <span className="flex items-center gap-1 text-xs">
                        <button type="button" onClick={() => { onQuitar(i); setConfirmar(null); }} className="rounded-md bg-critico px-2 py-1 font-semibold text-white">Quitar</button>
                        <button type="button" onClick={() => setConfirmar(null)} className="rounded-md border border-borde px-2 py-1">No</button>
                      </span>
                    ) : (
                      <button type="button" aria-label="Quitar fila" onClick={() => setConfirmar(i)} className="flex h-9 w-9 items-center justify-center rounded-lg text-tinta-3 hover:bg-critico-bg hover:text-critico"><Trash2 size={16} /></button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editable && onAgregar && (
        <button type="button" onClick={onAgregar} className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-dashed border-marca-700 px-3 text-sm font-semibold text-marca-800 hover:bg-marca-50"><Plus size={16} /> {etiquetaAgregar}</button>
      )}
    </div>
  );
}

/** Borrador local de una parte de la configuración: se edita y luego se guarda o descarta. */
export function useBorrador<T>(original: T) {
  const firma = JSON.stringify(original);
  const [b, setB] = useState<{ firma: string; valor: T }>({ firma, valor: original });
  // Si lo guardado cambia desde fuera (o se acaba de guardar), el borrador se reinicia
  if (b.firma !== firma) setB({ firma, valor: original });
  const actual = b.firma === firma ? b.valor : original;
  return {
    valor: actual,
    set: (v: T | ((x: T) => T)) => setB((x) => ({ firma: x.firma, valor: typeof v === "function" ? (v as (x: T) => T)(x.valor) : v })),
    sucio: JSON.stringify(actual) !== firma,
    descartar: () => setB({ firma, valor: original }),
  };
}

export function BarraCambios({ sucio, onGuardar, onDescartar, extra }: { sucio: boolean; onGuardar: () => void; onDescartar: () => void; extra?: ReactNode }) {
  return (
    <div className={cx("mt-4 flex flex-wrap items-center gap-2 rounded-2xl border p-3", sucio ? "sticky bottom-20 z-10 border-aviso/40 bg-aviso-bg shadow-md lg:bottom-3" : "border-borde bg-superficie")}>
      <span className={cx("mr-auto text-sm", sucio ? "font-semibold text-aviso" : "text-tinta-3")}>{sucio ? "Hay cambios sin guardar." : "Sin cambios pendientes."}</span>
      {extra}
      <button type="button" disabled={!sucio} onClick={onDescartar} className="min-h-10 rounded-xl border border-borde bg-superficie px-3 text-sm font-semibold disabled:opacity-50">Descartar</button>
      <button type="button" disabled={!sucio} onClick={onGuardar} className="min-h-10 rounded-xl bg-marca-800 px-4 text-sm font-semibold text-white disabled:opacity-50">Guardar cambios</button>
    </div>
  );
}

export const hrs = (n: number) => (Number(n) || 0).toLocaleString("es-EC", { maximumFractionDigits: 2 }) + " h";
