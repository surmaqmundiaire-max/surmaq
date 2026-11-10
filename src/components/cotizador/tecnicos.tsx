"use client";

import { useStore } from "@/lib/store";
import { puede } from "@/lib/selectors";
import { nivelCosto, tarifas } from "@/lib/cotizador/calculo";
import type { Cuadrilla, NivelSueldo } from "@/lib/cotizador/tipos";
import type { Perfil } from "@/lib/types";
import { useAviso } from "../aviso";
import type { Base } from "../migas";
import { usd, useUsuarioCot } from "./editor";
import { BarraCambios, TablaEditable, useBorrador } from "./tabla-editable";

const CIUDADES = ["Guayaquil", "Quito", "Cuenca", "Manta", "Machala", "Santo Domingo", "Ambato"];

export function TecnicosCot({ base }: { base: Base }) {
  const s = useStore();
  const aviso = useAviso();
  const yo = useUsuarioCot(base);
  const editor = puede(yo.rol, "editar_cotizador");
  const verCostos = puede(yo.rol, "ver_costos");
  const cfg = s.configCot;
  const nomina = s.perfiles.filter((p) => p.rol === "tecnico");
  const b = useBorrador(nomina);

  const guardar = () => {
    for (const p of b.valor) {
      const antes = nomina.find((x) => x.id === p.id);
      if (!antes) s.agregarPerfil({ ...p, id: undefined } as unknown as Omit<Perfil, "id">);
      else if (JSON.stringify(antes) !== JSON.stringify(p)) s.actualizarPerfil(p.id, p);
    }
    aviso("Nómina de técnicos guardada");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Técnicos y cuadrillas</h1>
        <p className="text-sm text-tinta-2">Niveles de técnico, tarifa por hora, conformación de cuadrillas por complejidad y nómina de personal para asignar en las cotizaciones.</p>
      </div>

      <NivelesCot editor={editor} verCostos={verCostos} />
      <CuadrillasCot editor={editor} />

      <section className="rounded-2xl border border-borde bg-superficie p-4">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Nómina de técnicos</h2>
          <span className="text-sm text-tinta-3">{b.valor.length} personas</span>
        </div>
        <p className="mb-3 text-sm text-tinta-2">Son los mismos usuarios técnicos de la app: cada uno ve en su celular los trabajos donde se le asigna. Marca las certificaciones vigentes: trabajo en altura, instalaciones eléctricas y sistemas de pintura Gema / Binks.</p>
        <TablaEditable<Perfil>
          filas={b.valor}
          clave={(p) => p.id}
          editable={editor}
          cols={[
            { k: "nombre", label: "Nombre", ancho: "180px" },
            { k: "nivel", label: "Nivel", tipo: "select", opciones: cfg.costos.niveles.map((n: NivelSueldo) => ({ v: n.cod, l: `${n.cod} · ${n.nombre}` })), ancho: "150px" },
            { k: "ciudad", label: "Ciudad base", tipo: "select", opciones: CIUDADES, ancho: "120px" },
            { k: "telefono", label: "Teléfono", ancho: "110px" },
            { k: "email", label: "Correo (usuario)", ancho: "190px" },
            { k: "certAltura", label: "Cert. altura", tipo: "bool" },
            { k: "certElectrica", label: "Cert. eléctrica", tipo: "bool" },
            { k: "certPintura", label: "Cert. pintura Gema/Binks", tipo: "bool" },
            { label: "Activo", fn: (p, i) => editor ? <input type="checkbox" aria-label="Activo" className="h-5 w-5 accent-marca-800" checked={p.activo !== false} onChange={(e) => b.set((t) => t.map((x, j) => (j === i ? { ...x, activo: e.target.checked } : x)))} /> : p.activo !== false ? "Sí" : "No" },
          ]}
          onCambio={(i, c) => b.set((t) => t.map((x, j) => (j === i ? { ...x, ...c } : x)))}
          onAgregar={() => b.set((t) => [...t, { id: `nuevo-${t.length}`, nombre: "", email: "", rol: "tecnico", ciudad: "Guayaquil", area: "Servicio técnico", nivel: "T2", activo: true }])}
          etiquetaAgregar="Agregar técnico"
        />
        {editor && <BarraCambios sucio={b.sucio} onDescartar={b.descartar} onGuardar={() => { if (b.valor.some((p) => !p.nombre.trim())) return aviso("Escribe el nombre de cada técnico"); guardar(); }} />}
      </section>
    </div>
  );
}

type NivelBorr = NivelSueldo & { _o?: string };

/** Niveles de técnico: se pueden agregar, editar y eliminar (si ningún técnico lo tiene asignado). */
function NivelesCot({ editor, verCostos }: { editor: boolean; verCostos: boolean }) {
  const s = useStore();
  const aviso = useAviso();
  const cfg = s.configCot;
  const b = useBorrador<NivelBorr[]>(cfg.costos.niveles.map((n) => ({ ...n, _o: n.cod })));
  const enUso = (cod: string) => s.perfiles.filter((p) => p.rol === "tecnico" && p.nivel === cod).length;

  const quitar = (i: number) => {
    const n = b.valor[i];
    const usados = n._o ? enUso(n._o) : 0;
    if (usados) return aviso(`No se puede eliminar ${n._o}: ${usados} técnico(s) tienen ese nivel. Cámbialos primero en la nómina.`);
    if (b.valor.length <= 1) return aviso("Debe quedar al menos un nivel");
    b.set((t) => t.filter((_, j) => j !== i));
  };
  const agregar = () => b.set((t) => {
    let k = t.length + 1;
    while (t.some((x) => x.cod === `T${k}`)) k++;
    return [...t, { cod: `T${k}`, nombre: "Nuevo nivel", perfil: "", sueldo: cfg.costos.SBU }];
  });
  const guardar = () => {
    const cods = b.valor.map((n) => n.cod.trim().toUpperCase());
    if (cods.some((c) => !c)) return aviso("Escribe el código de cada nivel");
    if (new Set(cods).size !== cods.length) return aviso("Hay códigos de nivel repetidos");
    if (b.valor.some((n) => !n.nombre.trim())) return aviso("Escribe el nombre de cada nivel");
    const niveles: NivelSueldo[] = b.valor.map((n, i) => ({ cod: cods[i], nombre: n.nombre.trim(), perfil: n.perfil, sueldo: +n.sueldo || 0 }));
    // Las cuadrillas guardan cuántos técnicos de cada nivel llevan: se quitan los niveles eliminados y se agregan los nuevos en 0
    const cuadrillas = cfg.cuadrillas.map((c) => {
      const out: Cuadrilla = { cx: c.cx, criterio: c.criterio };
      for (const n of niveles) out[n.cod] = Number(c[n.cod]) || 0;
      return out;
    });
    s.setConfigCot({ costos: { ...cfg.costos, niveles }, cuadrillas });
    aviso("Niveles de técnico guardados");
  };

  return (
    <section className="rounded-2xl border border-borde bg-superficie p-4">
      <h2 className="mb-3 font-semibold">Niveles de técnico</h2>
      <TablaEditable<NivelBorr>
        filas={b.valor}
        clave={(_, i) => String(i)}
        editable={editor}
        cols={[
          { label: "Código", fn: (n, i) => editor && !n._o
            ? <input value={n.cod} aria-label="Código" onChange={(e) => b.set((t) => t.map((x, j) => (j === i ? { ...x, cod: e.target.value.toUpperCase() } : x)))} className="h-9 w-16 rounded-lg border border-borde bg-superficie px-2 text-sm" />
            : <span className="font-medium">{n.cod}</span> },
          { k: "nombre", label: "Nivel", ancho: "180px" },
          ...(verCostos ? [
            { k: "perfil" as const, label: "Funciones", tipo: "area" as const, ancho: "240px", fmt: (v: unknown) => <span className="text-xs text-tinta-2">{String(v)}</span> },
            { k: "sueldo" as const, label: "Sueldo", tipo: "num" as const, num: true, ancho: "100px", fmt: (v: unknown) => usd(Number(v)) },
            { label: "Costo empresa / h", num: true, fn: (n: NivelBorr) => usd(nivelCosto(n, cfg.costos).hora) },
          ] : []),
          { label: "Tarifa de venta / h", num: true, fn: (n) => <b>{usd(nivelCosto(n, cfg.costos).tarifa)}</b> },
          { label: "Técnicos", num: true, fn: (n) => (n._o ? enUso(n._o) : 0) },
        ]}
        onCambio={(i, c) => b.set((t) => t.map((x, j) => (j === i ? { ...x, ...c } : x)))}
        onQuitar={quitar}
        onAgregar={agregar}
        etiquetaAgregar="Agregar nivel"
      />
      {verCostos && <p className="mt-2 text-xs text-tinta-3">El costo empresa incluye aporte patronal IESS, fondos de reserva, décimo tercero, décimo cuarto y vacaciones. Un nivel nuevo aparece como columna en las cuadrillas para indicar cuántos técnicos de ese nivel lleva cada una.</p>}
      {editor && <BarraCambios sucio={b.sucio} onDescartar={b.descartar} onGuardar={guardar} />}
    </section>
  );
}

type CuadBorr = Cuadrilla & { _o?: string };

/** Cuadrillas por complejidad: se pueden agregar, editar, renombrar y eliminar (si no las usa el catálogo). */
function CuadrillasCot({ editor }: { editor: boolean }) {
  const s = useStore();
  const aviso = useAviso();
  const cfg = s.configCot;
  const tar = tarifas(cfg.costos);
  const b = useBorrador<CuadBorr[]>(cfg.cuadrillas.map((c) => ({ ...c, _o: c.cx })));
  const usos = (cx: string) => {
    const partidas = cfg.catalogo.filter((it) => it.cx === cx).length;
    const franjas = (cfg.potencias ?? []).reduce((a, g) => a + g.franjas.filter((f) => f.cx === cx).length, 0);
    return { partidas, franjas };
  };
  const calc = (c: Cuadrilla) => {
    let pers = 0, rate = 0;
    for (const t of tar) { const k = Number(c[t.cod]) || 0; pers += k; rate += k * t.tarifa; }
    return { pers, rate };
  };

  const quitar = (i: number) => {
    const c = b.valor[i];
    const u = c._o ? usos(c._o) : { partidas: 0, franjas: 0 };
    if (u.partidas || u.franjas) return aviso(`No se puede eliminar «${c._o}»: la usan ${u.partidas} partida(s) del catálogo y ${u.franjas} franja(s) de potencia. Cámbialas primero.`);
    if (b.valor.length <= 1) return aviso("Debe quedar al menos una cuadrilla");
    b.set((t) => t.filter((_, j) => j !== i));
  };
  const agregar = () => b.set((t) => {
    const c: CuadBorr = { cx: "Nueva complejidad", criterio: "" };
    for (const n of tar) c[n.cod] = 0;
    if (tar[1]) c[tar[1].cod] = 1; else if (tar[0]) c[tar[0].cod] = 1;
    return [...t, c];
  });
  const guardar = () => {
    const nombres = b.valor.map((c) => c.cx.trim());
    if (nombres.some((n) => !n)) return aviso("Escribe el nombre de cada complejidad");
    if (new Set(nombres).size !== nombres.length) return aviso("Hay complejidades con el mismo nombre");
    if (b.valor.some((c) => !calc(c).pers)) return aviso("Cada cuadrilla debe tener al menos un técnico");
    // Si se renombró una complejidad, se actualizan las partidas y franjas que la usaban
    const ren: Record<string, string> = {};
    b.valor.forEach((c, i) => { if (c._o && c._o !== nombres[i]) ren[c._o] = nombres[i]; });
    const cuadrillas: Cuadrilla[] = b.valor.map((c, i) => { const out: Cuadrilla = { cx: nombres[i], criterio: c.criterio }; for (const t of tar) out[t.cod] = Number(c[t.cod]) || 0; return out; });
    const catalogo = cfg.catalogo.map((it) => (ren[it.cx] ? { ...it, cx: ren[it.cx] } : it));
    const potencias = (cfg.potencias ?? []).map((g) => ({ ...g, franjas: g.franjas.map((f) => (ren[f.cx] ? { ...f, cx: ren[f.cx] } : f)) }));
    s.setConfigCot({ cuadrillas, catalogo, potencias });
    aviso("Cuadrillas guardadas");
  };

  return (
    <section className="rounded-2xl border border-borde bg-superficie p-4">
      <h2 className="mb-3 font-semibold">Cuadrillas por complejidad</h2>
      <TablaEditable<CuadBorr>
        filas={b.valor}
        clave={(_, i) => String(i)}
        editable={editor}
        cols={[
          { k: "cx", label: "Complejidad", ancho: "200px", fmt: (v) => <span className="font-medium">{String(v)}</span> },
          { k: "criterio", label: "Criterio", tipo: "area", ancho: "240px", fmt: (v) => <span className="text-xs text-tinta-2">{String(v)}</span> },
          ...tar.map((t) => ({ k: t.cod, label: t.cod, tipo: "num" as const, step: "1", num: true, ancho: "64px", fmt: (v: unknown) => (Number(v) ? String(v) : "—") })),
          { label: "Personas", num: true, fn: (c) => calc(c).pers },
          { label: "Tarifa cuadrilla / h", num: true, fn: (c) => usd(calc(c).rate) },
          { label: "En uso", num: true, fn: (c) => { if (!c._o) return "—"; const u = usos(c._o); return u.partidas + u.franjas || "—"; } },
        ]}
        onCambio={(i, c) => b.set((t) => t.map((x, j) => (j === i ? { ...x, ...c } as CuadBorr : x)))}
        onQuitar={quitar}
        onAgregar={agregar}
        etiquetaAgregar="Agregar cuadrilla"
      />
      <p className="mt-2 text-xs text-tinta-3">Cada columna T es la cantidad de técnicos de ese nivel en la cuadrilla. Una cuadrilla en uso por el catálogo o por las franjas de potencia no se puede eliminar; si la renombras, se actualiza en todas partes.</p>
      {editor && <BarraCambios sucio={b.sucio} onDescartar={b.descartar} onGuardar={guardar} />}
    </section>
  );
}
