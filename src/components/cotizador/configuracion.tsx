"use client";

import Link from "next/link";
import { useState } from "react";
import { Lock } from "lucide-react";
import { useStore } from "@/lib/store";
import { puede } from "@/lib/selectors";
import { nivelCosto, r2, tarifas } from "@/lib/cotizador/calculo";
import type { Altura, ConfigCot, FranjaPotencia, GrupoPotencia, Costos, Cuadrilla, Entorno, Factor, Horario, NivelSueldo, Parametros } from "@/lib/cotizador/tipos";
import { useAviso } from "../aviso";
import { cx } from "../ui";
import type { Base } from "../migas";
import { usd, useUsuarioCot } from "./editor";
import { BarraCambios, TablaEditable, useBorrador } from "./tabla-editable";

type Tipo = "text" | "num" | "pct";
const PARAM_DEF: [string, [keyof Parametros, string, Tipo][]][] = [
  ["Empresa", [["EMPRESA", "Razón social", "text"], ["BASE", "Base de operaciones", "text"], ["VALIDEZ", "Validez de la oferta (días)", "num"]]],
  ["Traslado", [["VEL", "Velocidad promedio de IDA (km/h)", "num"], ["VEL_REG", "Velocidad promedio de REGRESO (km/h)", "num"], ["COSTO_KM", "Costo por km del vehículo (USD)", "num"], ["PAX_VEH", "Personas por vehículo", "num"], ["PCT_TRASLADO", "Horas de traslado cobradas (% de la tarifa)", "pct"], ["T_AEREO", "Tiempo aéreo de ida o de regreso (h)", "num"], ["PASAJE", "Pasaje aéreo ida y vuelta por persona (USD)", "num"], ["KM_LOCAL", "Km locales por día en destino aéreo", "num"]]],
  ["Viáticos y distancias", [["ALIM", "Alimentación por persona por día (USD)", "num"], ["HOSP", "Hospedaje por persona por noche (USD)", "num"], ["R_URB", "Radio urbano sin viáticos (km)", "num"], ["D_REG", "Distancia regional (km)", "num"], ["D_PERN", "Distancia de pernocte obligatorio (km)", "num"]]],
  ["Jornada y cobro", [["JORNADA", "Jornada en sitio (h)", "num"], ["JORNADA_MAX", "Jornada máxima con viaje (h)", "num"], ["HMIN", "Horas mínimas por visita", "num"], ["IVA", "IVA (%)", "pct"], ["COBRAR_EQ_ALTURA", "Cobrar equipo de acceso en altura (1 = sí, 0 = no)", "num"]]],
];
const TABS = [["params", "Parámetros"], ["costos", "Sueldos y tarifa"], ["cuadrillas", "Cuadrillas"], ["alturas", "Alturas"], ["entornos", "Tipos de sitio"], ["potencias", "Franjas de potencia"], ["tamanos", "Tamaños"], ["horarios", "Horarios"]] as const;
type Tab = (typeof TABS)[number][0];
const campo = "mt-1 h-10 w-full rounded-lg border border-borde bg-superficie px-2 text-sm";

export function ConfiguracionCot({ base }: { base: Base }) {
  const s = useStore();
  const yo = useUsuarioCot(base);
  const [tab, setTab] = useState<Tab>("params");
  if (!puede(yo.rol, "editar_cotizador")) {
    return (
      <div className="mx-auto mt-6 max-w-md rounded-2xl border border-borde bg-superficie p-6 text-center">
        <Lock className="mx-auto text-tinta-3" size={32} />
        <p className="mt-2 font-semibold">Solo administración y jefatura cambian la configuración del cotizador.</p>
        <Link href={`/${base}/cotizaciones`} className="mt-3 inline-block font-semibold text-marca-700">Volver a cotizaciones</Link>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-sm text-tinta-2">Todos los supuestos del cálculo. Los cambios aplican a las cotizaciones nuevas y a las que se vuelvan a guardar.</p>
      </div>
      <div role="tablist" aria-label="Partes de la configuración" className="flex flex-wrap gap-1 rounded-xl bg-fondo p-1">
        {TABS.map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx("min-h-10 rounded-lg px-3 text-sm font-semibold", tab === k ? "bg-superficie text-marca-900 shadow-sm" : "text-tinta-2")}>{l}</button>
        ))}
      </div>
      <Parte key={tab} k={tab} cfg={s.configCot} />
    </div>
  );
}

function Parte({ k, cfg }: { k: Tab; cfg: ConfigCot }) {
  const s = useStore();
  const aviso = useAviso();
  const b = useBorrador(cfg[k]);
  const [confirmar, setConfirmar] = useState(false);
  const set = b.set as (v: unknown) => void;
  const lista = <T,>(i: number, c: Partial<T>) => b.set((t) => (t as T[]).map((x, j) => (j === i ? { ...x, ...c } : x)) as typeof t);
  const quitar = (i: number) => b.set((t) => (t as unknown[]).filter((_, j) => j !== i) as typeof t);
  const agregar = (n: unknown) => b.set((t) => [...(t as unknown[]), n] as typeof t);
  const niveles = tarifas(cfg.costos);

  let cuerpo: React.ReactNode = null;
  if (k === "params") {
    const p = b.valor as Parametros;
    cuerpo = PARAM_DEF.map(([g, fs]) => (
      <fieldset key={g} className="mb-4">
        <legend className="mb-2 font-semibold">{g}</legend>
        <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
          {fs.map(([id, l, t]) => (
            <label key={id} className="text-sm text-tinta-2">{l}
              <input type={t === "text" ? "text" : "number"} step="any" value={t === "pct" ? r2(Number(p[id]) * 100) : String(p[id])}
                onChange={(e) => set({ ...p, [id]: t === "text" ? e.target.value : t === "pct" ? (+e.target.value || 0) / 100 : +e.target.value || 0 })} className={cx(campo, t !== "text" && "tabular")} />
            </label>
          ))}
        </div>
      </fieldset>
    ));
  } else if (k === "costos") {
    const c = b.valor as Costos;
    cuerpo = (
      <>
        <div className="mb-4 grid grid-cols-1 gap-3 @xl:grid-cols-3 @4xl:grid-cols-5">
          {([["SBU", "Salario básico unificado (USD)", "num"], ["IESS_PAT", "Aporte patronal IESS (%)", "pct"], ["FONDOS", "Fondos de reserva (%)", "pct"], ["HPROD", "Horas productivas por mes", "num"], ["FACTOR", "Factor de tarifa (gastos generales + utilidad)", "num"]] as const).map(([id, l, t]) => (
            <label key={id} className="text-sm text-tinta-2">{l}
              <input type="number" step="any" value={t === "pct" ? r2(c[id] * 100) : c[id]} onChange={(e) => set({ ...c, [id]: t === "pct" ? (+e.target.value || 0) / 100 : +e.target.value || 0 })} className={cx(campo, "tabular")} />
            </label>
          ))}
        </div>
        <TablaEditable<NivelSueldo>
          filas={c.niveles}
          editable
          clave={(n) => n.cod}
          cols={[
            { k: "cod", label: "Código", soloLectura: true },
            { k: "nombre", label: "Nivel", ancho: "180px" },
            { k: "perfil", label: "Funciones", ancho: "240px" },
            { k: "sueldo", label: "Sueldo mensual", tipo: "num", num: true, ancho: "100px" },
            { label: "Costo empresa / mes", num: true, fn: (r) => usd(nivelCosto(r, c).mes) },
            { label: "Costo / h", num: true, fn: (r) => usd(nivelCosto(r, c).hora) },
            { label: "Tarifa venta / h", num: true, fn: (r) => <b>{usd(nivelCosto(r, c).tarifa)}</b> },
          ]}
          onCambio={(i, ch) => set({ ...c, niveles: c.niveles.map((x, j) => (j === i ? { ...x, ...ch } : x)) })}
        />
      </>
    );
  } else if (k === "cuadrillas") {
    cuerpo = (
      <>
        <TablaEditable<Cuadrilla>
          filas={b.valor as Cuadrilla[]}
          editable
          cols={[
            { k: "cx", label: "Complejidad", ancho: "150px" },
            { k: "criterio", label: "Criterio", ancho: "260px" },
            ...niveles.map((n) => ({ k: n.cod as keyof Cuadrilla & string, label: n.cod, tipo: "num" as const, step: "1", num: true, ancho: "64px" })),
            { label: "Personas", num: true, fn: (r) => niveles.reduce((a, n) => a + (Number(r[n.cod as keyof Cuadrilla]) || 0), 0) },
            { label: "Tarifa / h", num: true, fn: (r) => usd(niveles.reduce((a, n) => a + (Number(r[n.cod as keyof Cuadrilla]) || 0) * n.tarifa, 0)) },
          ]}
          onCambio={lista<Cuadrilla>}
          onQuitar={quitar}
          onAgregar={() => agregar({ cx: "Nueva complejidad", criterio: "", T1: 0, T2: 1, T3: 0, T4: 0, T5: 0 })}
          etiquetaAgregar="Agregar complejidad"
        />
        <p className="mt-2 text-xs text-tinta-3">Si cambias el nombre de una complejidad, actualiza también las partidas del catálogo que la usan.</p>
      </>
    );
  } else if (k === "alturas") {
    cuerpo = <TablaEditable<Altura> filas={b.valor as Altura[]} editable onCambio={lista<Altura>} onQuitar={quitar} etiquetaAgregar="Agregar rango"
      onAgregar={() => agregar({ n: "Nuevo rango", f: 1, eq: "", costo: 0, cert: true })}
      cols={[{ k: "n", label: "Rango de altura", ancho: "180px" }, { k: "f", label: "Factor de tiempo", tipo: "num", step: "0.05", num: true, ancho: "80px" }, { k: "eq", label: "Equipo de acceso", ancho: "200px" }, { k: "costo", label: "Costo equipo / día (USD)", tipo: "num", num: true, ancho: "90px" }, { k: "cert", label: "Requiere certificación", tipo: "bool" }]} />;
  } else if (k === "entornos") {
    cuerpo = <TablaEditable<Entorno> filas={b.valor as Entorno[]} editable onCambio={lista<Entorno>} onQuitar={quitar} etiquetaAgregar="Agregar tipo de sitio"
      onAgregar={() => agregar({ n: "Nuevo tipo de sitio", f: 1, nota: "" })}
      cols={[{ k: "n", label: "Tipo de sitio", ancho: "220px" }, { k: "f", label: "Factor de tiempo", tipo: "num", step: "0.05", num: true, ancho: "80px" }, { k: "nota", label: "Motivo", ancho: "280px" }]} />;
  } else if (k === "potencias") {
    const gs = b.valor as GrupoPotencia[];
    const setG = (gi: number, franjas: FranjaPotencia[]) => set(gs.map((g, j) => (j === gi ? { ...g, franjas } : g)));
    cuerpo = (
      <div className="space-y-5">
        <p className="text-sm text-tinta-2">Cada franja multiplica las horas del trabajo y fija la cuadrilla mínima. Un equipo con una potencia entre dos franjas se cotiza con la franja siguiente.</p>
        {gs.map((g, gi) => (
          <div key={g.k}>
            <h3 className="mb-2 font-semibold">{g.n}</h3>
            <TablaEditable<FranjaPotencia>
              filas={g.franjas}
              editable
              cols={[
                { k: "n", label: "Franja", ancho: "130px" },
                { k: "hpMin", label: "Desde (HP)", tipo: "num", num: true, ancho: "80px" },
                { k: "hpMax", label: "Hasta (HP)", tipo: "num", num: true, ancho: "80px" },
                { k: "f", label: "Factor de tiempo", tipo: "num", step: "0.05", num: true, ancho: "80px" },
                { k: "cx", label: "Cuadrilla mínima", tipo: "select", opciones: cfg.cuadrillas.map((c) => c.cx), ancho: "170px" },
              ]}
              onCambio={(i, c) => setG(gi, g.franjas.map((x, j) => (j === i ? { ...x, ...c } : x)))}
              onQuitar={(i) => setG(gi, g.franjas.filter((_, j) => j !== i))}
              onAgregar={() => setG(gi, [...g.franjas, { n: "Nueva franja", hpMin: 0, hpMax: 0, f: 1, cx: "Baja" }])}
              etiquetaAgregar="Agregar franja"
            />
          </div>
        ))}
      </div>
    );
  } else if (k === "tamanos") {
    cuerpo = <TablaEditable<Factor> filas={b.valor as Factor[]} editable onCambio={lista<Factor>} onQuitar={quitar} etiquetaAgregar="Agregar tamaño"
      onAgregar={() => agregar({ n: "Nuevo", f: 1, ref: "" })}
      cols={[{ k: "n", label: "Tamaño", ancho: "120px" }, { k: "f", label: "Factor de tiempo", tipo: "num", step: "0.05", num: true, ancho: "80px" }, { k: "ref", label: "Referencia", ancho: "300px" }]} />;
  } else if (k === "horarios") {
    cuerpo = <TablaEditable<Horario> filas={b.valor as Horario[]} editable onCambio={lista<Horario>} onQuitar={quitar} etiquetaAgregar="Agregar horario"
      onAgregar={() => agregar({ n: "Nuevo horario", rec: 0 })}
      cols={[{ k: "n", label: "Horario", ancho: "220px" }, { k: "rec", label: "Recargo (0,25 = 25 %)", tipo: "num", step: "0.05", num: true, ancho: "90px" }]} />;
  }

  return (
    <section className="rounded-2xl border border-borde bg-superficie p-4">
      {cuerpo}
      <BarraCambios
        sucio={b.sucio}
        onDescartar={b.descartar}
        onGuardar={() => { s.setConfigCot({ [k]: b.valor } as Partial<ConfigCot>); aviso("Configuración guardada"); }}
        extra={confirmar ? (
          <span className="flex flex-wrap items-center gap-1 text-sm">
            Se restablecen todos los valores del cotizador. ¿Seguir?
            <button type="button" onClick={() => { s.restaurarConfigCot(); setConfirmar(false); aviso("Valores originales restablecidos"); }} className="min-h-10 rounded-xl bg-critico px-3 font-semibold text-white">Sí, restablecer</button>
            <button type="button" onClick={() => setConfirmar(false)} className="min-h-10 rounded-xl border border-borde bg-superficie px-3">No</button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirmar(true)} className="min-h-10 rounded-xl px-3 text-sm font-semibold text-critico hover:bg-critico-bg">Restablecer valores originales</button>
        )}
      />
    </section>
  );
}
