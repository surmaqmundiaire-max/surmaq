"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { puede } from "@/lib/selectors";
import { zona } from "@/lib/cotizador/calculo";
import type { CiudadCot } from "@/lib/cotizador/tipos";
import { norm } from "../filtros";
import { useAviso } from "../aviso";
import type { Base } from "../migas";
import { useUsuarioCot } from "./editor";
import { BarraCambios, TablaEditable, hrs, useBorrador } from "./tabla-editable";

export function CiudadesCot({ base }: { base: Base }) {
  const s = useStore();
  const aviso = useAviso();
  const yo = useUsuarioCot(base);
  const editor = puede(yo.rol, "editar_cotizador");
  const P = s.configCot.params;
  const b = useBorrador(s.configCot.ciudades);
  const [q, setQ] = useState("");
  const idx = b.valor.map((c, i) => [c, i] as const).filter(([c]) => norm(`${c.n} ${c.prov} ${c.reg}`).includes(norm(q)));
  const ida = (r: CiudadCot) => (r.modo === "Aéreo" ? P.T_AEREO : r.km / P.VEL);
  const reg = (r: CiudadCot) => (r.modo === "Aéreo" ? P.T_AEREO : r.km / P.VEL_REG);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Ciudades y distancias</h1>
        <p className="text-sm text-tinta-2">Distancia por carretera desde {P.BASE}. El tiempo de ida usa {P.VEL} km/h y el de regreso {P.VEL_REG} km/h (se cambian en Configuración). Desde Quito la distancia se estima.</p>
      </div>
      <label className="relative block max-w-md">
        <span className="sr-only">Buscar ciudad</span>
        <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-tinta-3" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar ciudad, provincia o región" className="h-11 w-full rounded-xl border border-borde bg-superficie pr-3 pl-9 text-sm" />
      </label>
      <TablaEditable<CiudadCot>
        filas={idx.map(([c]) => c)}
        editable={editor}
        vacio="Ninguna ciudad coincide con la búsqueda."
        cols={[
          { k: "n", label: "Ciudad / lugar", ancho: "190px", fmt: (v) => <span className="font-medium">{String(v)}</span> },
          { k: "prov", label: "Provincia", ancho: "120px" },
          { k: "reg", label: "Región", tipo: "select", opciones: ["Costa", "Sierra", "Amazonía", "Insular"], ancho: "110px" },
          { k: "km", label: "Distancia (km)", tipo: "num", step: "1", num: true, ancho: "90px", fmt: (v) => Math.round(Number(v)).toLocaleString("es-EC") },
          { k: "modo", label: "Modo", tipo: "select", opciones: ["Terrestre", "Aéreo"], ancho: "110px" },
          { label: "Ida", num: true, fn: (r) => hrs(ida(r)) },
          { label: "Regreso", num: true, fn: (r) => hrs(reg(r)) },
          { label: "Ida + regreso", num: true, fn: (r) => hrs(ida(r) + reg(r)) },
          { label: "Zona", fn: (r) => <span className="whitespace-nowrap">{zona(r, P)}</span> },
          { label: "Pernocta", fn: (r) => <span className="whitespace-nowrap">{r.modo === "Aéreo" || r.km >= P.D_PERN ? "Sí" : "Si dura > 1 día"}</span> },
        ]}
        onCambio={(i, c) => b.set((t) => t.map((x, j) => (j === idx[i][1] ? { ...x, ...c } : x)))}
        onQuitar={(i) => b.set((t) => t.filter((_, j) => j !== idx[i][1]))}
        onAgregar={() => { b.set((t) => [...t, { n: "Nueva ciudad", prov: "", reg: "Costa", km: 0, modo: "Terrestre" }]); setQ(""); }}
        etiquetaAgregar="Agregar ciudad"
      />
      {editor && <BarraCambios sucio={b.sucio} onDescartar={b.descartar} onGuardar={() => { s.setConfigCot({ ciudades: b.valor }); aviso("Ciudades guardadas"); }} />}
    </div>
  );
}
