"use client";

// Editor de cotización de servicio técnico (integrado del cotizador Maquinmotors).
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarPlus, Check, Copy, FileText, Plus, Save, Search, Trash2, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { perfil, puede, tecnicos } from "@/lib/selectors";
import { calcular, CERTS, tarifas, zona, type Resultado } from "@/lib/cotizador/calculo";
import { ciudadCotDe, franjaSugerida, hpDe, kmDesdeBase, tamanoSugerido } from "@/lib/cotizador/config";
import { ESTADOS_COT, equiposCot, trabajosCot, type Cotizacion, type Familia, type LineaCot } from "@/lib/cotizador/tipos";
import { CHECKLISTS } from "@/lib/mock-data";
import { toLocalIso } from "@/lib/format";
import type { Perfil, TipoTrabajo } from "@/lib/types";
import { claseCampo, Campo } from "../formularios";
import { norm } from "../filtros";
import { useAviso } from "../aviso";
import { Avatar, cx } from "../ui";
import { IconoTipo, MiniaturaEquipo } from "../visual";
import type { Base } from "../migas";

export const usd = (n: number) => "$ " + (Number(n) || 0).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const hrs = (n: number) => (Number(n) || 0).toLocaleString("es-EC", { maximumFractionDigits: 2 }) + " h";
const pct = (n: number) => (Number(n) * 100).toLocaleString("es-EC", { maximumFractionDigits: 1 }) + " %";
const ORDEN = ["T1", "T2", "T3", "T4", "T5"];

export const ESTILO_ESTADO: Record<string, string> = {
  Borrador: "bg-fondo text-tinta-2 ring-1 ring-borde",
  Enviada: "bg-info-bg text-info",
  Aprobada: "bg-ok-bg text-ok",
  Rechazada: "bg-critico-bg text-critico",
  Ejecutada: "bg-ok text-white",
};

type Borrador = Omit<Cotizacion, "id" | "numero" | "creadoEn" | "actualizado"> & { id?: string; numero?: string };

export function useUsuarioCot(base: Base): Perfil {
  const s = useStore();
  return perfil(base === "tecnico" ? s.tecnicoActualId : s.usuarioActualId);
}

export function EditorCotizacion({ id, base, prefill }: { id?: string; base: Base; prefill?: { clienteId?: string; equipoId?: string; solicitudId?: string } }) {
  const s = useStore();
  const router = useRouter();
  const aviso = useAviso();
  const cfg = s.configCot;
  const yo = useUsuarioCot(base);
  const existente = id ? s.cotizaciones.find((x) => x.id === id) : undefined;

  const [q, setQ] = useState<Borrador>(() => {
    if (existente) {
      const eqs = equiposCot(existente);
      // Las cotizaciones antiguas de un solo equipo asocian todas sus partidas a ese equipo
      return { ...existente, equipoIds: eqs, equipoId: undefined, lineas: existente.lineas.map((l) => ({ ...l, equipoId: l.equipoId ?? (eqs.length === 1 ? eqs[0] : undefined) })), asig: { ...existente.asig } };
    }
    const sol = prefill?.solicitudId ? s.solicitudes.find((x) => x.id === prefill.solicitudId) : undefined;
    const eqId = prefill?.equipoId ?? sol?.equipoId;
    const eq = eqId ? s.equipos.find((x) => x.id === eqId) : undefined;
    const cliId = prefill?.clienteId ?? eq?.clienteId ?? sol?.clienteId;
    const c = cliId ? s.clientes.find((x) => x.id === cliId) : undefined;
    const dpto = sol?.dpto ?? (/quito|cayambe|ibarra|latacunga|ambato/i.test(c?.ciudad ?? "") ? "Quito" : yo.ciudad === "Quito" ? "Quito" : "Guayaquil");
    return {
      fecha: s.ahora.slice(0, 10),
      clienteId: c?.id,
      equipoIds: eq ? [eq.id] : [],
      solicitudId: sol?.id,
      cliente: c?.razonSocial ?? "",
      ruc: c?.ruc ?? "",
      contacto: sol?.contacto ?? (c && c.contacto.nombre !== "—" ? c.contacto.nombre : ""),
      ciudad: (c && ciudadCotDe(c.ciudad, cfg)) ?? "Guayaquil (urbano)",
      base: dpto as "Guayaquil" | "Quito",
      lugar: c?.direccion ?? "",
      entorno: cfg.entornos[0].n,
      fechaTrabajo: sol?.fechaRequerida ?? "",
      notas: sol ? `Solicitud Nº ${sol.numero}: ${sol.descripcion}` : "",
      lineas: [],
      asig: {},
      descuento: 0,
      estado: "Borrador",
      total: 0,
      horas: 0,
      creadoPor: yo.id,
    };
  });
  const [famSel, setFamSel] = useState<Familia>("mant");
  const [itemSel, setItemSel] = useState("");
  const [qCli, setQCli] = useState("");

  const km = kmDesdeBase(q.base, q.ciudad, cfg);
  const R = useMemo(() => calcular({ ...q, kmOverride: km }, cfg), [q, cfg, km]);
  const verCostos = puede(yo.rol, "ver_costos");
  const aprueba = puede(yo.rol, "aprobar_cotizaciones");
  const editable = !existente || q.estado === "Borrador" || aprueba;
  const eqIds = q.equipoIds ?? [];
  const eqsSel = eqIds.map((id) => s.equipos.find((e) => e.id === id)).filter((e) => !!e);
  const eqsCliente = q.clienteId ? s.equipos.filter((e) => e.clienteId === q.clienteId) : [];
  const nombreEq = (id?: string) => s.equipos.find((e) => e.id === id)?.nombre;
  const alternarEquipo = (id: string) =>
    setQ((x) => {
      const ids = x.equipoIds ?? [];
      if (ids.includes(id)) return { ...x, equipoIds: ids.filter((i) => i !== id), lineas: x.lineas.map((l) => (l.equipoId === id ? { ...l, equipoId: undefined } : l)) };
      return { ...x, equipoIds: [...ids, id] };
    });
  const set = <K extends keyof Borrador>(k: K, v: Borrador[K]) => setQ((x) => ({ ...x, [k]: v }));
  const setLinea = (i: number, c: Partial<LineaCot>) => setQ((x) => ({ ...x, lineas: x.lineas.map((l, j) => (j === i ? { ...l, ...c } : l)) }));
  const items = cfg.catalogo.filter((x) => x.fam === famSel);
  const grupos = [...new Set(items.map((x) => x.grupo))];
  const clientesFiltrados = s.clientes.filter((c) => norm(`${c.razonSocial} ${c.ruc}`).includes(norm(qCli))).slice(0, 5);

  const textoEq = (eq?: { nombre: string; datosPlaca?: { potencia?: string } }) => (eq ? `${eq.nombre} ${eq.datosPlaca?.potencia ?? ""}` : "");
  const potDe = (it: { pot?: string }, eq?: { nombre: string; datosPlaca?: { potencia?: string } }) =>
    franjaSugerida(cfg.potencias.find((g) => g.k === it.pot), hpDe(textoEq(eq)));

  const agregar = () => {
    const it = cfg.catalogo.find((x) => x.cod === (itemSel || items[0]?.cod));
    if (!it) return;
    const nueva = (eq?: (typeof eqsSel)[number]): LineaCot => ({
      cod: it.cod,
      cant: it.unidad === "m" ? 10 : 1,
      tam: (eq && tamanoSugerido(`${eq.nombre} ${eq.datosPlaca?.potencia ?? ""}`)) ?? cfg.tamanos[0].n,
      alt: cfg.alturas[0].n,
      hor: cfg.horarios[0].n,
      equipoId: eq?.id,
      ...(it.escala === "potencia" ? { pot: potDe(it, eq) } : {}),
    });
    // Con varios equipos elegidos, la partida se agrega una vez por equipo (cada uno con su tamaño)
    const nuevas = eqsSel.length ? eqsSel.map(nueva) : [nueva()];
    setQ((x) => ({ ...x, lineas: [...x.lineas, ...nuevas] }));
    if (nuevas.length > 1) aviso(`${it.act}: agregado para ${nuevas.length} equipos`);
  };

  const guardar = (cambios?: Partial<Borrador>) => {
    const final = { ...q, ...cambios };
    if (!final.cliente.trim()) return aviso("Escribe o elige el cliente antes de guardar");
    if (!final.lineas.length) return aviso("Agrega al menos un trabajo");
    const Rf = calcular({ ...final, kmOverride: kmDesdeBase(final.base, final.ciudad, cfg) }, cfg);
    const nuevoId = s.guardarCotizacion({ ...final, total: Math.round(Rf.TT * 100) / 100, horas: Math.round(Rf.TTS * 100) / 100 });
    setQ(final);
    aviso(existente ? "Cotización guardada" : "Cotización creada");
    if (!existente) router.replace(`/${base}/cotizaciones/${nuevoId}`);
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{existente ? existente.numero : "Nueva cotización"}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-tinta-2">
            {existente ? (
              <>
                <span className={cx("rounded-full px-2 py-0.5 text-xs font-semibold", ESTILO_ESTADO[q.estado])}>{q.estado}</span>
                creada por {perfil(existente.creadoPor).nombre}
              </>
            ) : (
              "Elige el cliente, agrega los trabajos y asigna la cuadrilla. El resumen se calcula al momento."
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {existente && <Link href={`/${base}/cotizaciones/nueva`} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-borde bg-superficie px-3 text-sm font-semibold hover:bg-fondo"><Plus size={16} /> Nueva</Link>}
          {existente && (
            <button type="button" onClick={() => { const nid = s.guardarCotizacion({ ...q, id: undefined, estado: "Borrador", trabajoId: undefined, trabajoIds: undefined, fecha: s.ahora.slice(0, 10), creadoPor: yo.id }); aviso("Copia creada"); router.push(`/${base}/cotizaciones/${nid}`); }}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-borde bg-superficie px-3 text-sm font-semibold hover:bg-fondo"><Copy size={16} /> Duplicar</button>
          )}
          {existente && (
            <a href={`/cotizacion/${existente.id}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-borde bg-superficie px-3 text-sm font-semibold hover:bg-fondo"><FileText size={16} /> Vista para el cliente</a>
          )}
          <button type="button" disabled={!editable} onClick={() => guardar()} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-marca-800 px-4 text-sm font-semibold text-white hover:bg-marca-900 disabled:opacity-50">
            <Save size={16} /> {existente ? "Guardar cambios" : "Guardar cotización"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 @4xl:grid-cols-[minmax(0,1fr)_320px] [&>*]:min-w-0">
        <div className="space-y-4">
          {/* Cliente y lugar */}
          <section className="rounded-2xl border border-borde bg-superficie p-4">
            <h2 className="mb-3 font-semibold">Cliente y lugar del trabajo</h2>
            {!q.clienteId && editable && (
              <div className="mb-3">
                <label className="relative block">
                  <span className="sr-only">Buscar cliente registrado</span>
                  <Search size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-tinta-3" />
                  <input value={qCli} onChange={(e) => setQCli(e.target.value)} placeholder="Buscar cliente registrado (o escríbelo abajo)" className={cx(claseCampo, "mt-0 pl-10")} />
                </label>
                {qCli && (
                  <ul className="mt-1 divide-y divide-borde overflow-hidden rounded-xl border border-borde">
                    {clientesFiltrados.map((c) => (
                      <li key={c.id}>
                        <button type="button" onClick={() => { setQ((x) => ({ ...x, clienteId: c.id, cliente: c.razonSocial, ruc: c.ruc, contacto: c.contacto.nombre !== "—" ? c.contacto.nombre : "", lugar: c.direccion, ciudad: ciudadCotDe(c.ciudad, cfg) ?? x.ciudad, base: /quito|cayambe|ibarra|latacunga|ambato/i.test(c.ciudad) ? "Quito" : x.base })); setQCli(""); }}
                          className="flex min-h-11 w-full items-center px-3 text-left text-sm hover:bg-fondo">{c.razonSocial} <span className="ml-auto text-tinta-3">{c.ciudad}</span></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <fieldset disabled={!editable} className="grid grid-cols-1 gap-3 @xl:grid-cols-2">
              <Campo label="Cliente">
                <input value={q.cliente} onChange={(e) => set("cliente", e.target.value)} className={claseCampo} />
                {q.clienteId && <button type="button" className="mt-1 text-xs font-semibold text-marca-700" onClick={() => setQ((x) => ({ ...x, clienteId: undefined, equipoIds: [], lineas: x.lineas.map((l) => ({ ...l, equipoId: undefined })) }))}>Cambiar cliente</button>}
              </Campo>
              <Campo label="RUC" opcional><input value={q.ruc} onChange={(e) => set("ruc", e.target.value)} inputMode="numeric" className={claseCampo} /></Campo>
              <Campo label="Contacto" opcional><input value={q.contacto} onChange={(e) => set("contacto", e.target.value)} className={claseCampo} /></Campo>
              <Campo label="Ciudad / lugar">
                <select value={q.ciudad} onChange={(e) => set("ciudad", e.target.value)} className={claseCampo}>
                  {["Costa", "Sierra", "Amazonía", "Insular"].map((reg) => (
                    <optgroup key={reg} label={reg}>{cfg.ciudades.filter((c) => c.reg === reg).map((c) => <option key={c.n}>{c.n}</option>)}</optgroup>
                  ))}
                </select>
              </Campo>
              <Campo label="Sale la cuadrilla de">
                <select value={q.base} onChange={(e) => set("base", e.target.value as "Guayaquil" | "Quito")} className={claseCampo}>
                  <option>Guayaquil</option>
                  <option>Quito</option>
                </select>
              </Campo>
              <Campo label="Planta / dirección" opcional><input value={q.lugar} onChange={(e) => set("lugar", e.target.value)} className={claseCampo} /></Campo>
              <Campo label="Tipo de sitio">
                <select value={q.entorno} onChange={(e) => set("entorno", e.target.value)} className={claseCampo}>{cfg.entornos.map((x) => <option key={x.n}>{x.n}</option>)}</select>
              </Campo>
              <Campo label="Fecha tentativa del trabajo" opcional><input type="date" value={q.fechaTrabajo} onChange={(e) => set("fechaTrabajo", e.target.value)} className={claseCampo} /></Campo>
            </fieldset>
            {q.clienteId && (
              <fieldset disabled={!editable} className="mt-4">
                <legend className="flex w-full flex-wrap items-baseline justify-between gap-2 text-sm font-medium">
                  <span>Equipos a cotizar <span className="font-normal text-tinta-3">(puedes elegir varios)</span></span>
                  {eqsCliente.length > 1 && editable && (
                    <button type="button" className="text-xs font-semibold text-marca-700" onClick={() => setQ((x) => ({ ...x, equipoIds: eqIds.length === eqsCliente.length ? [] : eqsCliente.map((e) => e.id), lineas: eqIds.length === eqsCliente.length ? x.lineas.map((l) => ({ ...l, equipoId: undefined })) : x.lineas }))}>
                      {eqIds.length === eqsCliente.length ? "Quitar todos" : "Elegir todos"}
                    </button>
                  )}
                </legend>
                {eqsCliente.length === 0 ? (
                  <p className="mt-2 rounded-xl border border-dashed border-borde px-3 py-3 text-sm text-tinta-3">Este cliente aún no tiene equipos registrados.</p>
                ) : (
                  <ul className="mt-2 grid grid-cols-1 gap-2 @xl:grid-cols-2">
                    {eqsCliente.map((e) => {
                      const on = eqIds.includes(e.id);
                      const n = q.lineas.filter((l) => l.equipoId === e.id).length;
                      return (
                        <li key={e.id}>
                          <button type="button" role="checkbox" aria-checked={on} onClick={() => alternarEquipo(e.id)}
                            className={cx("flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm", on ? "border-marca-700 bg-marca-50 ring-1 ring-marca-700" : "border-borde bg-superficie hover:bg-fondo")}>
                            <span className={cx("flex h-5 w-5 shrink-0 items-center justify-center rounded border", on ? "border-marca-800 bg-marca-800 text-white" : "border-tinta-3")}>{on && <Check size={14} strokeWidth={3} />}</span>
                            <MiniaturaEquipo linea={e.lineaProducto} foto={e.fotoUrl} size={36} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-semibold">{e.nombre}</span>
                              <span className="block truncate text-xs text-tinta-2">{e.marca} {e.modelo}{on && n ? ` · ${n} trabajo(s)` : ""}</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </fieldset>
            )}
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-tinta-2">
              <span>Distancia: <b className="tabular">{R.aereo ? "vía aérea" : `${Math.round(R.km)} km`}</b>{km !== undefined && " (estimada desde Quito)"}</span>
              <span>Ida: <b className="tabular">{hrs(R.ida)}</b></span>
              <span>Regreso: <b className="tabular">{hrs(R.reg)}</b></span>
              <span>{zona({ modo: R.c.modo, km: R.km }, cfg.params)}</span>
              {R.ent.f !== 1 && <span>Factor de sitio ×{R.ent.f}</span>}
            </p>
          </section>

          {/* Trabajos */}
          <section className="rounded-2xl border border-borde bg-superficie p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-semibold">Trabajos</h2>
              <span className="text-sm text-tinta-3">{q.lineas.length} partida(s)</span>
            </div>
            {editable && (
              <div className="mb-4 space-y-2 rounded-xl bg-fondo p-3">
                <div role="radiogroup" aria-label="Tipo de servicio" className="grid grid-cols-3 gap-1 rounded-lg bg-superficie p-1">
                  {([["mant", "Mantenimiento"], ["inst", "Instalación"], ["pint", "Pintura"]] as const).map(([k, l]) => (
                    <button key={k} type="button" role="radio" aria-checked={famSel === k} onClick={() => { setFamSel(k); setItemSel(""); }} className={cx("min-h-10 rounded-md px-1 text-sm font-semibold", famSel === k ? "bg-marca-800 text-white" : "text-tinta-2")}>
                      {k === "mant" ? <><span className="@sm:hidden">Mant.</span><span className="hidden @sm:inline">{l}</span></> : l}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-2 @xl:flex-row">
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">Servicio</span>
                    <select value={itemSel || items[0]?.cod} onChange={(e) => setItemSel(e.target.value)} className={cx(claseCampo, "mt-0")}>
                      {grupos.map((g) => <optgroup key={g} label={g}>{items.filter((x) => x.grupo === g).map((x) => <option key={x.cod} value={x.cod}>{x.cod} · {x.act}</option>)}</optgroup>)}
                    </select>
                  </label>
                  <button type="button" onClick={agregar} className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-marca-800 px-4 font-semibold text-white"><Plus size={18} /> Agregar{eqsSel.length > 1 ? ` a ${eqsSel.length} equipos` : ""}</button>
                </div>
              </div>
            )}
            {R.lines.length === 0 ? (
              <div className="rounded-xl border border-dashed border-borde px-4 py-6 text-center text-sm text-tinta-3">
                <p>Agrega mantenimientos, partidas de instalación o servicios de pintura con el selector de arriba.</p>
                {editable && !q.clienteId && (
                  <button type="button" className="mt-2 font-semibold text-marca-700 hover:underline" onClick={() => setQ((x) => ({ ...x, cliente: x.cliente || "Cliente de ejemplo S.A.", contacto: x.contacto || "Jefe de mantenimiento", ciudad: "Cuenca", lugar: "Planta industrial – Parque Industrial", lineas: [{ cod: "TOR-P03", cant: 2, tam: "Mediano", pot: "20 – 30 HP", alt: cfg.alturas[0].n, hor: cfg.horarios[0].n }, { cod: "SRF-P03", cant: 1, tam: "Mediano", alt: cfg.alturas[0].n, hor: cfg.horarios[0].n }] }))}>
                    Cargar el ejemplo de Cuenca (2 compresores + 1 secador)
                  </button>
                )}
              </div>
            ) : (
              <ul className="space-y-3">
                {R.lines.map((L) => {
                  const l = q.lineas[L.idx];
                  if (!L.it) return <li key={L.idx} className="rounded-xl bg-critico-bg p-3 text-sm text-critico">La partida {l.cod} ya no existe en el catálogo. <button type="button" className="font-semibold underline" onClick={() => set("lineas", q.lineas.filter((_, j) => j !== L.idx))}>Quitar</button></li>;
                  const it = L.it;
                  return (
                    <li key={L.idx} className="rounded-xl border border-borde p-3">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{it.act}</p>
                          <p className="mt-0.5 flex flex-wrap gap-1.5 text-xs text-tinta-2">
                            <span className="rounded bg-fondo px-1.5 py-0.5 font-mono">{it.cod}</span>
                            <span>{it.grupo}</span>
                            <span className={cx("rounded px-1.5 py-0.5", it.tipo === "Instalación" ? "bg-info-bg text-info" : "bg-fondo")}>{it.tipo}</span>
                            {it.cert && <span className="rounded bg-aviso-bg px-1.5 py-0.5 text-aviso">Cert. {it.cert === "electrica" ? "eléctrica" : it.cert}</span>}
                          </p>
                          <p className="mt-1 text-xs text-tinta-3">{it.alcance}</p>
                          {l.equipoId && eqsSel.length <= 1 && <p className="mt-1 inline-flex max-w-full items-center rounded-md bg-marca-50 px-1.5 py-0.5 text-xs font-semibold text-marca-800"><span className="truncate">{nombreEq(l.equipoId)}</span></p>}
                        </div>
                        {editable && <button type="button" aria-label={`Quitar ${it.act}`} onClick={() => set("lineas", q.lineas.filter((_, j) => j !== L.idx))} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-tinta-3 hover:bg-critico-bg hover:text-critico"><Trash2 size={17} /></button>}
                      </div>
                      <fieldset disabled={!editable} className="mt-2 grid grid-cols-2 gap-2 @xl:grid-cols-4">
                        {eqsSel.length > 1 && (
                          <label className="col-span-2 text-xs text-tinta-2 @xl:col-span-4">Equipo
                            <select value={l.equipoId ?? ""} onChange={(e) => {
                              const eq = eqsSel.find((x) => x.id === e.target.value);
                              const tam = eq && it.escala === "tamano" ? tamanoSugerido(textoEq(eq)) : undefined;
                              const pot = eq && it.escala === "potencia" && hpDe(textoEq(eq)) ? potDe(it, eq) : undefined;
                              setLinea(L.idx, { equipoId: e.target.value || undefined, ...(tam ? { tam } : {}), ...(pot ? { pot } : {}) });
                            }} className={cx(claseCampo, "min-h-10 text-sm")}>
                              <option value="">General (todos los equipos)</option>
                              {eqsSel.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                            </select>
                          </label>
                        )}
                        <label className="text-xs text-tinta-2">Cantidad ({it.unidad === "m" ? "metros" : it.unidad === "u" ? "unidades" : it.unidad === "equipo" ? "equipos" : it.unidad})
                          <input type="number" min={0} step={1} value={l.cant} onChange={(e) => setLinea(L.idx, { cant: Math.max(0, +e.target.value || 0) })} className={cx(claseCampo, "min-h-10 tabular")} />
                        </label>
                        {it.escala === "potencia" && (
                          <label className="text-xs text-tinta-2">Potencia
                            <select value={L.escala.n} onChange={(e) => setLinea(L.idx, { pot: e.target.value })} className={cx(claseCampo, "min-h-10 text-sm")}>
                              {(cfg.potencias.find((g) => g.k === it.pot)?.franjas ?? []).map((a) => <option key={a.n}>{a.n}</option>)}
                            </select>
                          </label>
                        )}
                        {(it.escala === "altura" || it.escala === "tamano") && (
                          <label className="text-xs text-tinta-2">{it.escala === "altura" ? "Altura" : "Tamaño del equipo"}
                            <select value={it.escala === "altura" ? l.alt : l.tam} onChange={(e) => setLinea(L.idx, it.escala === "altura" ? { alt: e.target.value } : { tam: e.target.value })} className={cx(claseCampo, "min-h-10 text-sm")}>
                              {(it.escala === "altura" ? cfg.alturas : cfg.tamanos).map((a) => <option key={a.n}>{a.n}</option>)}
                            </select>
                          </label>
                        )}
                        <label className="text-xs text-tinta-2">Horario
                          <select value={l.hor} onChange={(e) => setLinea(L.idx, { hor: e.target.value })} className={cx(claseCampo, "min-h-10 text-sm")}>{cfg.horarios.map((a) => <option key={a.n}>{a.n}</option>)}</select>
                        </label>
                        <div className="text-xs text-tinta-2">Cuadrilla
                          <p className="mt-1 text-sm text-tinta">{L.cx}{L.cx !== it.cx && <span className="ml-1 rounded bg-info-bg px-1 text-[11px] font-semibold text-info" title={`El trabajo pide «${it.cx}»; por la potencia se usa «${L.cx}»`}>por potencia</span>}<span className="block text-xs text-tinta-3">{L.cr.pers} pers. · {Object.entries(L.cr.comp).map(([k, v]) => `${v}×${k}`).join(" + ")}</span></p>
                        </div>
                      </fieldset>
                      <p className="mt-2 flex flex-wrap justify-end gap-x-4 text-sm tabular">
                        <span>{hrs(L.h)} <span className="text-tinta-3">({hrs(L.hU)} c/u)</span></span>
                        <span className="font-semibold">{usd(L.mo)}</span>
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <Cuadrilla q={q} R={R} editable={editable} setAsig={(k, v) => setQ((x) => ({ ...x, asig: { ...x.asig, [k]: v } }))} />

          <section className="rounded-2xl border border-borde bg-superficie p-4">
            <h2 className="mb-2 font-semibold">Notas para el cliente</h2>
            <textarea value={q.notas} onChange={(e) => set("notas", e.target.value)} disabled={!editable} rows={3} placeholder="Alcance, exclusiones, condiciones de acceso…" className={cx(claseCampo, "py-2")} />
            {existente && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-sm text-tinta-2">Estado:</span>
                {ESTADOS_COT.filter((e) => aprueba || e === "Borrador" || e === "Enviada").map((e) => (
                  <button key={e} type="button" onClick={() => guardar({ estado: e })} className={cx("min-h-10 rounded-full px-3 text-sm font-semibold", q.estado === e ? ESTILO_ESTADO[e] : "border border-borde bg-superficie hover:bg-fondo")}>{e}</button>
                ))}
              </div>
            )}
          </section>

          {existente && <Programar q={{ ...existente, ...q } as Cotizacion} R={R} base={base} />}
        </div>

        <aside className="rounded-2xl border border-borde bg-superficie p-4 @4xl:sticky @4xl:top-4 @4xl:self-start" aria-label="Resumen">
          <Resumen q={q} R={R} verCostos={verCostos} puedeDescuento={aprueba} onDescuento={(d) => set("descuento", d)} iva={cfg.params.IVA} />
        </aside>
      </div>
    </div>
  );
}

function Cuadrilla({ q, R, editable, setAsig }: { q: Borrador; R: Resultado; editable: boolean; setAsig: (k: string, v: string) => void }) {
  const tecs = tecnicos();
  const ks = ORDEN.filter((k) => R.need[k]);
  const asignados = Object.values(q.asig).filter(Boolean).map((id) => tecs.find((t) => t.id === id)).filter(Boolean) as Perfil[];
  const avisos: { tono: "aviso" | "critico" | "info"; texto: string }[] = [];
  const enAltura = R.lines.some((L) => L.it?.escala === "altura" && (L.escala as { cert?: boolean }).cert);
  if (enAltura) {
    avisos.push({ tono: "aviso", texto: "Trabajo en altura: permiso de trabajo, arnés de cuerpo entero, línea de vida y personal con certificación vigente." });
    const sin = asignados.filter((t) => !t.certAltura);
    if (sin.length) avisos.push({ tono: "critico", texto: `Sin certificación de altura: ${sin.map((t) => t.nombre).join(", ")}. Cambia la asignación antes de aprobar.` });
  }
  for (const ck of Object.keys(CERTS)) {
    const req = R.lines.filter((L) => L.it?.cert === ck);
    if (!req.length) continue;
    const campo = ck === "electrica" ? "certElectrica" : "certPintura";
    const ok = asignados.filter((t) => t[campo]);
    avisos.push(ok.length ? { tono: "info", texto: `${CERTS[ck]}: la cuadrilla tiene personal certificado (${ok.map((t) => t.nombre).join(", ")}).` } : { tono: asignados.length ? "critico" : "aviso", texto: `Requiere certificación – ${CERTS[ck]}: al menos un técnico certificado en la cuadrilla.` });
  }
  const ids = Object.values(q.asig).filter(Boolean);
  if (new Set(ids).size < ids.length) avisos.push({ tono: "critico", texto: "Técnico repetido en dos puestos de la cuadrilla." });
  const total = Object.values(R.need).reduce((a, b) => a + b, 0);
  const asn = ks.reduce((a, k) => a + Array.from({ length: R.need[k] }).filter((_, j) => q.asig[`${k}_${j}`]).length, 0);
  if (total && asn < total) avisos.push({ tono: "info", texto: `Asignados ${asn} de ${total} puestos.` });
  if (R.lines.some((L) => L.it && /izaje|grúa/i.test(L.it.alcance))) avisos.push({ tono: "info", texto: "Incluye maniobras de izaje: la grúa o el montacargas no están incluidos." });
  const nombreNivel = (k: string) => ({ T1: "Ayudante técnico", T2: "Técnico mecánico / instalador", T3: "Técnico electromecánico", T4: "Técnico especialista", T5: "Ingeniero de servicio" })[k];
  const certTxt = (t: Perfil) => [t.certAltura && "altura", t.certElectrica && "eléctrica", t.certPintura && "pintura"].filter(Boolean).join(", ");

  return (
    <section className="rounded-2xl border border-borde bg-superficie p-4">
      <h2 className="mb-1 flex items-center gap-2 font-semibold"><Users size={18} className="text-marca-700" /> Cuadrilla asignada</h2>
      <p className="mb-3 text-sm text-tinta-2">Según el nivel de técnico que exige cada trabajo.</p>
      {!ks.length ? (
        <p className="rounded-xl border border-dashed border-borde px-4 py-4 text-center text-sm text-tinta-3">La cuadrilla aparece cuando agregas trabajos.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 @xl:grid-cols-2">
          {ks.flatMap((k) =>
            Array.from({ length: R.need[k] }, (_, j) => {
              const key = `${k}_${j}`;
              const mismos = tecs.filter((t) => t.nivel === k);
              const superiores = tecs.filter((t) => t.nivel && ORDEN.indexOf(t.nivel) > ORDEN.indexOf(k));
              return (
                <label key={key} className="rounded-xl bg-fondo p-3 text-sm">
                  <span className="block text-xs font-semibold text-tinta-2">{k} · {nombreNivel(k)}</span>
                  <select disabled={!editable} value={q.asig[key] ?? ""} onChange={(e) => setAsig(key, e.target.value)} className={cx(claseCampo, "min-h-10 text-sm")}>
                    <option value="">— Sin asignar —</option>
                    {mismos.map((t) => <option key={t.id} value={t.id}>{t.nombre}{certTxt(t) ? ` · ${certTxt(t)}` : ""}</option>)}
                    {superiores.length > 0 && <optgroup label="Nivel superior">{superiores.map((t) => <option key={t.id} value={t.id}>{t.nombre} ({t.nivel})</option>)}</optgroup>}
                  </select>
                </label>
              );
            }),
          )}
        </div>
      )}
      {avisos.length > 0 && (
        <ul className="mt-3 space-y-2">
          {avisos.map((a, i) => (
            <li key={i} className={cx("flex gap-2 rounded-lg px-3 py-2 text-sm", a.tono === "critico" ? "bg-critico-bg text-critico" : a.tono === "aviso" ? "bg-aviso-bg text-aviso" : "bg-fondo text-tinta-2")}>
              {a.tono !== "info" && <AlertTriangle size={16} className="mt-0.5 shrink-0" />} <span>{a.texto}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Resumen({ q, R, verCostos, puedeDescuento, onDescuento, iva }: { q: Borrador; R: Resultado; verCostos: boolean; puedeDescuento: boolean; onDescuento: (d: number) => void; iva: number }) {
  const tot = R.TTS || 1;
  const kv = (k: string, v: string, fuerte?: boolean) => (
    <div className={cx("flex justify-between gap-3 py-0.5 text-sm", fuerte && "font-semibold")}><span className="text-tinta-2">{k}</span><span className="text-right tabular">{v}</span></div>
  );
  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-1 text-xs font-semibold tracking-wide text-tinta-3 uppercase">Tiempos</h2>
        {kv("Trabajo en sitio", hrs(R.HT))}
        {kv("Tiempo de ida", hrs(R.VJ ? R.ida : 0))}
        {kv("Tiempo de regreso", hrs(R.VJ ? R.reg : 0))}
        {kv(`Ida + regreso × ${R.VJ} viaje(s)`, hrs(R.HTR))}
        {kv("Tiempo total del servicio", hrs(R.TTS), true)}
        <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-fondo" aria-hidden>
          <span className="bg-marca-700" style={{ width: `${(R.HT / tot) * 100}%` }} />
          <span className="ml-px bg-[#d98c1a]" style={{ width: `${(R.HTR / tot) * 100}%` }} />
        </div>
        <p className="mt-1 flex gap-3 text-xs text-tinta-2"><span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded bg-marca-700" /> Trabajo</span><span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded bg-[#d98c1a]" /> Traslado</span></p>
      </div>
      <div className="border-t border-borde pt-3">
        <h2 className="mb-1 text-xs font-semibold tracking-wide text-tinta-3 uppercase">Logística</h2>
        {kv("Cuadrilla", `${R.CR} pers. · ${Object.entries(R.need).map(([k, v]) => `${v}×${k}`).join(" + ") || "—"}`)}
        {kv("Días de trabajo", String(R.DT))}
        {kv("Pernocta", R.PN ? "Sí" : "No")}
        {kv("Vehículos · km", `${R.VH} · ${Math.round(R.KMR)} km`)}
        {kv("Días de viático · noches", `${R.DV} · ${R.NH}`)}
      </div>
      <div className="border-t border-borde pt-3">
        <h2 className="mb-1 text-xs font-semibold tracking-wide text-tinta-3 uppercase">Valores (USD)</h2>
        {kv("Mano de obra en sitio", usd(R.MO))}
        {R.AJ > 0 && kv("Ajuste por mínimo de visita", usd(R.AJ))}
        {R.DES > 0 && kv(`Descuento ${q.descuento} %`, `− ${usd(R.DES)}`)}
        {kv("Horas de traslado ida + regreso", usd(R.TR))}
        {kv("Vehículo", usd(R.CV))}
        {R.PA > 0 && kv("Pasajes aéreos", usd(R.PA))}
        {kv("Alimentación", usd(R.AL))}
        {kv("Hospedaje", usd(R.HO))}
        {R.eq.map((e) => <div key={e.n}>{kv(`${e.n} (${e.dias} d)`, usd(e.total))}</div>)}
        <div className="mt-1 border-t border-borde pt-1">{kv("Subtotal", usd(R.ST), true)}</div>
        {kv(`IVA ${pct(iva)}`, usd(R.IV))}
        <div className="mt-1 flex justify-between gap-3 text-lg font-bold"><span>Total</span><span className="text-critico tabular">{usd(R.TT)}</span></div>
      </div>
      {puedeDescuento && (
        <label className="block border-t border-borde pt-3 text-sm">
          <span className="text-tinta-2">Descuento sobre mano de obra (%, máx. 30)</span>
          <input type="number" min={0} max={30} value={q.descuento} onChange={(e) => onDescuento(Math.min(30, Math.max(0, +e.target.value || 0)))} className={cx(claseCampo, "min-h-10 tabular")} />
        </label>
      )}
      {verCostos && (
        <div className="border-t border-borde pt-3">
          <h2 className="mb-1 text-xs font-semibold tracking-wide text-tinta-3 uppercase">Interno (no se muestra al cliente)</h2>
          {kv("Costo empresa", usd(R.costoInt))}
          {(() => {
            const mg = R.ST ? R.margen / R.ST : 0;
            return <div className="flex justify-between gap-3 py-0.5 text-sm font-semibold"><span className="text-tinta-2">Margen</span><span className={cx("tabular", mg < 0.25 ? "text-critico" : mg < 0.45 ? "text-aviso" : "text-ok")}>{usd(R.margen)} · {pct(mg)}</span></div>;
          })()}
        </div>
      )}
    </div>
  );
}

/** Convierte una cotización aprobada en mantenimientos (uno por equipo) + tareas para la cuadrilla. */
function Programar({ q, R, base }: { q: Cotizacion; R: Resultado; base: Base }) {
  const s = useStore();
  const aviso = useAviso();
  const router = useRouter();
  const yo = useUsuarioCot(base);
  const [fecha, setFecha] = useState(q.fechaTrabajo || "");
  const [hora, setHora] = useState("08:30");
  const ruta = (id: string) => `/${base}/mantenimientos/${id}`;
  const creados = trabajosCot(q).map((id) => s.trabajos.find((t) => t.id === id)).filter((t) => !!t);
  if (creados.length) {
    return (
      <section className="rounded-2xl bg-ok-bg p-4 text-sm">
        <p className="font-semibold text-ok">Programada como {creados.length === 1 ? "mantenimiento" : `${creados.length} mantenimientos`}</p>
        <ul className="mt-1 space-y-1">
          {creados.map((t) => (
            <li key={t.id}><Link href={ruta(t.id)} className="font-semibold text-marca-700 hover:underline">Nº {t.numero} · {s.equipos.find((e) => e.id === t.equipoId)?.nombre} →</Link></li>
          ))}
        </ul>
      </section>
    );
  }
  if (q.estado !== "Aprobada") return null;
  const puedeProgramar = puede(yo.rol, "programar_tareas") || yo.rol === "tecnico";
  const asignados = Object.values(q.asig).filter(Boolean).map((id) => perfil(id)).filter((p) => p.rol === "tecnico");
  const responsable = [...asignados].sort((a, b) => ORDEN.indexOf(b.nivel ?? "T1") - ORDEN.indexOf(a.nivel ?? "T1"))[0];
  const eqIds = equiposCot(q);
  const lineas = R.lines.filter((L) => L.it);
  // Horas de trabajo por equipo; las partidas generales se reparten en partes iguales
  const general = lineas.filter((L) => !eqIds.includes(q.lineas[L.idx].equipoId ?? "")).reduce((a, L) => a + L.h, 0);
  const grupos = eqIds.map((eid) => {
    const propias = lineas.filter((L) => q.lineas[L.idx].equipoId === eid);
    return { eid, lineas: propias.length ? propias : lineas.filter((L) => !q.lineas[L.idx].equipoId), horas: propias.reduce((a, L) => a + L.h, 0) + general / eqIds.length };
  }).filter((g) => g.horas > 0 || eqIds.length === 1);
  const listo = grupos.length > 0 && !!fecha && !!responsable;

  const programar = () => {
    const pendientes = grupos.map((g) => {
      const ls = g.lineas.length ? g.lineas : lineas;
      const tipo: TipoTrabajo = ls.some((L) => L.it!.cod === "GEN-03") ? "arranque" : ls.every((L) => L.it!.fam === "inst") ? "instalacion" : ls.some((L) => L.it!.tipo === "Correctivo") ? "revision" : "mantenimiento";
      const titulo = `${ls[0].it!.act}${ls.length > 1 ? ` y ${ls.length - 1} trabajo(s) más` : ""} · ${q.numero}`;
      const trabajoId = s.agregarTrabajo({ equipoId: g.eid, titulo, tipo, lugar: "en_cliente", estado: "abierto", asignadoId: responsable.id, fechaIngreso: s.ahora });
      return { ...g, tipo, titulo, trabajoId, restante: Math.max(g.horas, 0.5) };
    });
    // Los equipos se atienden uno tras otro, en jornadas de días hábiles seguidos:
    // cada tramo de un equipo dentro de un día es una tarea de su mantenimiento.
    const d = new Date(`${fecha}T00:00:00`);
    const J = s.configCot.params.JORNADA;
    let usado = 0;
    let dia = 0;
    for (const g of pendientes) {
      while (g.restante > 1e-6) {
        while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
        const horas = Math.min(J - usado, g.restante);
        const iso = toLocalIso(d).slice(0, 10);
        const ini = new Date(`${iso}T${hora}:00`);
        ini.setMinutes(ini.getMinutes() + Math.round(usado * 60));
        const fin = new Date(ini);
        fin.setMinutes(fin.getMinutes() + Math.round(horas * 60));
        s.agregarVisita({
          trabajoId: g.trabajoId,
          tecnicoId: responsable.id,
          descripcion: R.DT > 1 ? `${g.titulo} — día ${dia + 1} de ${R.DT}` : g.titulo,
          lugar: "en_cliente",
          programadaInicio: toLocalIso(ini),
          programadaFin: toLocalIso(fin),
          estado: "programada",
          autoEmpresa: true,
          acompanantes: asignados.filter((t) => t.id !== responsable.id).map((t) => t.id),
          checklist: Object.fromEntries(CHECKLISTS[g.tipo].map((k) => [k, false])),
          fotos: [],
          programadaPor: yo.id,
          vistaPorTecnico: yo.id === responsable.id,
        });
        g.restante -= horas;
        usado += horas;
        if (usado >= J - 1e-6) { usado = 0; dia++; d.setDate(d.getDate() + 1); }
      }
    }
    const ids = pendientes.map((g) => g.trabajoId);
    s.guardarCotizacion({ ...q, trabajoIds: ids, trabajoId: undefined });
    aviso(ids.length > 1 ? `${ids.length} mantenimientos programados desde ${fecha} ${hora}` : `Trabajo programado · ${R.DT > 1 ? `${R.DT} días desde` : ""} ${fecha} ${hora}`);
    if (ids.length === 1) router.push(ruta(ids[0]));
  };

  if (!puedeProgramar) return null;
  return (
    <section className="rounded-2xl border-2 border-ok/40 bg-superficie p-4">
      <h2 className="flex items-center gap-2 font-semibold"><CalendarPlus size={18} className="text-ok" /> Cotización aprobada · programar el trabajo</h2>
      <p className="mt-1 text-sm text-tinta-2">
        {grupos.length > 1
          ? `Se crea un mantenimiento por cada equipo (${grupos.length}), con sus tareas una tras otra durante ${Math.max(1, R.DT)} día(s).`
          : `Se crea el mantenimiento con ${Math.max(1, R.DT)} tarea(s) para la cuadrilla asignada.`}
      </p>
      {grupos.length > 1 && (
        <ul className="mt-2 space-y-1 text-sm">
          {grupos.map((g) => <li key={g.eid} className="flex justify-between gap-3 rounded-lg bg-fondo px-3 py-1.5"><span className="min-w-0 truncate">{s.equipos.find((e) => e.id === g.eid)?.nombre}</span><span className="shrink-0 tabular">{hrs(g.horas)}</span></li>)}
        </ul>
      )}
      <div className="mt-3 grid grid-cols-1 gap-3 @xl:grid-cols-3">
        <label className="text-sm"><span className="text-tinta-2">Fecha de inicio</span><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={claseCampo} /></label>
        <label className="text-sm"><span className="text-tinta-2">Hora de llegada</span><input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className={claseCampo} /></label>
        <div className="text-sm">
          <span className="text-tinta-2">Responsable</span>
          <p className="mt-1 flex min-h-12 items-center gap-2">{responsable ? <><Avatar nombre={responsable.nombre} size={28} /> {responsable.nombre}</> : <span className="text-critico">Asigna la cuadrilla primero</span>}</p>
        </div>
      </div>
      {!eqIds.length && <p className="mt-2 rounded-lg bg-aviso-bg px-3 py-2 text-sm text-aviso">Elige al menos un equipo del cliente{!q.clienteId && " (el cliente debe estar registrado en la app)"} y guarda la cotización para poder programar.</p>}
      <button type="button" disabled={!listo} onClick={programar} className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-xl bg-ok px-5 font-semibold text-white disabled:opacity-50">
        <IconoTipo tipo="mantenimiento" size={24} /> Programar {grupos.length > 1 ? `${grupos.length} mantenimientos` : "trabajo"}
      </button>
    </section>
  );
}

export { tarifas };
