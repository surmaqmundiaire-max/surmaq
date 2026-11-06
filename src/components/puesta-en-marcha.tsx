"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, CheckCheck, ChevronLeft, ChevronRight, ClipboardCheck, FileCheck2, Plus, Printer, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { cliente as getCliente, equipo as getEquipo, perfil, tecnicos } from "@/lib/selectors";
import { fechaCorta, fechaLarga, hora } from "@/lib/format";
import { PLANTILLAS, plantillaPara, respondido, type CampoPEM, type SeccionPEM, type ValorFases } from "@/lib/puesta-en-marcha";
import type { Equipo, PuestaEnMarcha } from "@/lib/types";
import { comprimirImagen } from "@/lib/imagen";
import { Avatar, Badge, cx } from "./ui";
import { Firma } from "./firma";
import { claseCampo } from "./formularios";
import { useAviso } from "./aviso";
import type { Base } from "./migas";

/** Valores iniciales tomados del equipo, su placa y el cliente: el técnico no los vuelve a escribir. */
export function respuestasIniciales(e: Equipo): Record<string, unknown> {
  const c = getCliente(e.clienteId);
  const hp = e.datosPlaca?.potencia?.match(/([\d.,]+)\s*HP/i)?.[1] ?? e.nombre.match(/([\d.,]+)\s*HP/i)?.[1];
  return {
    empresa: c.razonSocial,
    direccion: [c.direccion, c.ciudad].filter(Boolean).join(", "),
    contacto: c.contacto.nombre !== "—" ? c.contacto.nombre : "",
    telefono: c.contacto.telefono,
    correo: c.contacto.correo ?? "",
    marca: e.marca !== "—" ? e.marca : "",
    modelo: e.modelo !== "—" ? e.modelo : "",
    serie: e.serie !== "—" ? e.serie : "",
    potencia: hp ?? "",
    voltaje: e.datosPlaca?.voltaje?.replace(/\s*V$/i, "") ?? "",
    frecuencia: e.datosPlaca?.frecuencia?.replace(/\s*Hz$/i, "") ?? "",
    tipoCompresor: /tornillo/i.test(e.lineaProducto) ? "Tornillo" : /pist/i.test(e.lineaProducto) ? "Pistón" : "",
    tipoEquipo: /polvo/i.test(e.lineaProducto) ? "Pintura en polvo" : /pintura/i.test(e.lineaProducto) ? "Pintura líquida" : "",
  };
}

/** Sección dentro de la ficha del equipo: lista de puestas en marcha y botón para crear una. */
export function SeccionPuestas({ equipoId, base }: { equipoId: string; base: Base }) {
  const s = useStore();
  const aviso = useAviso();
  const router = useRouter();
  const e = getEquipo(equipoId);
  const plantilla = plantillaPara(e.lineaProducto);
  if (!plantilla) return null;
  const lista = s.puestas.filter((p) => p.equipoId === equipoId).sort((a, b) => b.creadaEn.localeCompare(a.creadaEn));
  const yo = base === "tecnico" ? s.tecnicoActualId : s.usuarioActualId;
  const crear = () => {
    const id = s.crearPuesta({
      equipoId,
      plantillaId: plantilla.id,
      respuestas: respuestasIniciales(e),
      tecnicos: perfil(yo).rol === "tecnico" ? [yo] : [],
      responsableId: perfil(yo).rol === "tecnico" ? yo : "",
      recibe: { nombre: getCliente(e.clienteId).contacto.nombre !== "—" ? getCliente(e.clienteId).contacto.nombre : "", cedula: "" },
      trabajoId: s.trabajos.find((t) => t.equipoId === equipoId && (t.tipo === "arranque" || t.tipo === "instalacion") && t.estado !== "cerrado")?.id,
    });
    aviso("Puesta en marcha creada · los datos del equipo ya están cargados");
    router.push(`/${base}/equipos/${equipoId}/puesta/${id}`);
  };
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><ClipboardCheck size={20} className="text-marca-700" /> Puesta en marcha</h2>
        <button type="button" onClick={crear} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-marca-800 px-4 text-sm font-semibold text-marca-800 hover:bg-marca-50">
          <Plus size={17} /> Crear
        </button>
      </div>
      {lista.length === 0 ? (
        <p className="rounded-xl border border-dashed border-borde px-4 py-4 text-sm text-tinta-3">Aún no tiene puesta en marcha. Créala al arrancar el equipo: los datos del cliente y de la placa se llenan solos.</p>
      ) : (
        <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
          {lista.map((p) => (
            <li key={p.id}>
              <Link href={`/${base}/equipos/${equipoId}/puesta/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-fondo active:bg-marca-50">
                <span className={cx("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", p.estado === "completada" ? "bg-ok-bg text-ok" : "bg-aviso-bg text-aviso")}>
                  {p.estado === "completada" ? <FileCheck2 size={20} /> : <ClipboardCheck size={20} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">Puesta en marcha Nº {p.numero}</span>
                  <span className="block text-sm text-tinta-2">
                    {p.estado === "completada" ? `Completada ${fechaCorta(p.completadaEn)}` : `Borrador · ${progreso(p).hechos} de ${progreso(p).total} respuestas`}
                    {p.responsableId && ` · ${perfil(p.responsableId).nombre}`}
                  </span>
                </span>
                {p.estado === "completada" ? <Badge tono="ok">Completada</Badge> : <Badge tono="aviso">Continuar</Badge>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const plantillaDe = (p: PuestaEnMarcha) => PLANTILLAS.find((x) => x.id === p.plantillaId)!;
const progresoSeccion = (sec: SeccionPEM, r: Record<string, unknown>) => ({
  hechos: sec.campos.filter((c) => respondido(c, r[c.id] as never)).length,
  total: sec.campos.length,
});
function progreso(p: PuestaEnMarcha) {
  const secs = plantillaDe(p).secciones.map((sec) => progresoSeccion(sec, p.respuestas));
  return { hechos: secs.reduce((a, x) => a + x.hechos, 0), total: secs.reduce((a, x) => a + x.total, 0) };
}

/** Formulario de puesta en marcha por secciones (en el celular, una sección a la vez). */
export function FormPuesta({ id, base }: { id: string; base: Base }) {
  const s = useStore();
  const aviso = useAviso();
  const p = s.puestas.find((x) => x.id === id);
  const [paso, setPaso] = useState(0);
  if (!p) return <p className="text-tinta-2">No se encontró la puesta en marcha.</p>;
  const pl = plantillaDe(p);
  const e = getEquipo(p.equipoId);
  if (p.estado === "completada") return <VistaPuesta p={p} base={base} />;

  const pasos = [{ id: "tecnicos", titulo: "Equipo técnico" }, ...pl.secciones.map((x) => ({ id: x.id, titulo: x.titulo })), { id: "cierre", titulo: "Fotos y firmas" }];
  const seccion = pl.secciones[paso - 1];
  const faltantes = pl.secciones.flatMap((sec) => sec.campos.filter((c) => c.obligatorio && !respondido(c, p.respuestas[c.id] as never)).map((c) => ({ sec, c })));
  const responder = (campo: string, v: unknown) => s.responderPuesta(id, campo, v);
  const listoParaFinalizar = faltantes.length === 0 && p.tecnicos.length > 0 && !!p.responsableId && !!p.firmaTecnico;

  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm text-tinta-2">Nº {p.numero} · {e.nombre} · {getCliente(e.clienteId).razonSocial}</p>
        <h1 className="text-xl font-bold sm:text-2xl">{pl.titulo}</h1>
        {pl.borrador && <p className="mt-1 rounded-lg bg-aviso-bg px-3 py-2 text-sm text-aviso">Formulario de ejemplo: falta validar las preguntas con Surmaq.</p>}
        <p className="mt-1 text-xs text-tinta-3">Se guarda solo mientras llenas.</p>
      </header>

      {/* Pasos */}
      <nav aria-label="Secciones" className="-mx-4 overflow-x-auto px-4">
        <ol className="flex gap-2">
          {pasos.map((x, i) => {
            const sec = pl.secciones[i - 1];
            const pr = sec ? progresoSeccion(sec, p.respuestas) : null;
            const completo = i === 0 ? p.tecnicos.length > 0 && !!p.responsableId : pr ? pr.hechos === pr.total : !!p.firmaTecnico;
            return (
              <li key={x.id}>
                <button type="button" onClick={() => setPaso(i)} aria-current={paso === i ? "step" : undefined}
                  className={cx("flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap", paso === i ? "border-marca-800 bg-marca-800 text-white" : completo ? "border-ok/30 bg-ok-bg text-ok" : "border-borde bg-superficie text-tinta-2")}>
                  {completo && paso !== i && <Check size={14} strokeWidth={3} />}
                  {x.titulo}
                  {pr && <span className="text-xs font-medium tabular opacity-80">{pr.hechos}/{pr.total}</span>}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <section className="rounded-2xl border border-borde bg-superficie p-4 sm:p-5">
        {paso === 0 && <PasoTecnicos p={p} />}
        {seccion && (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{seccion.titulo}</h2>
              {seccion.campos.some((c) => c.tipo === "sino") && (
                <button type="button" onClick={() => { seccion.campos.filter((c) => c.tipo === "sino" && p.respuestas[c.id] === undefined).forEach((c) => responder(c.id, true)); aviso("Marcadas como Sí las que faltaban · revisa las excepciones"); }}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-ok-bg px-3 text-sm font-semibold text-ok">
                  <CheckCheck size={16} /> Todo lo demás Sí
                </button>
              )}
            </div>
            <div className="divide-y divide-borde">
              {seccion.campos.map((c) => <CampoInput key={c.id} c={c} valor={p.respuestas[c.id]} onChange={(v) => responder(c.id, v)} />)}
            </div>
          </>
        )}
        {paso === pasos.length - 1 && <PasoCierre p={p} faltantes={faltantes.map(({ sec, c }) => `${sec.titulo}: ${c.label}`)} irA={(secId) => setPaso(pasos.findIndex((x) => x.id === secId))} />}
      </section>

      <div className="sticky bottom-0 z-10 -mx-4 grid grid-cols-[auto_1fr] gap-2 border-t border-borde bg-superficie/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <button type="button" disabled={paso === 0} onClick={() => setPaso(paso - 1)} className="flex min-h-14 items-center gap-1 rounded-2xl border border-borde px-4 font-semibold disabled:opacity-40"><ChevronLeft size={18} /> Anterior</button>
        {paso < pasos.length - 1 ? (
          <button type="button" onClick={() => { setPaso(paso + 1); window.scrollTo({ top: 0 }); }} className="flex min-h-14 items-center justify-center gap-1 rounded-2xl bg-marca-800 font-semibold text-white">
            {pasos[paso + 1].titulo} <ChevronRight size={18} />
          </button>
        ) : (
          <button type="button" disabled={!listoParaFinalizar} onClick={() => { s.completarPuesta(id); aviso(`Puesta en marcha Nº ${p.numero} completada y guardada en el equipo`); }}
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-marca-800 font-semibold text-white disabled:bg-tinta-3/40">
            <FileCheck2 size={19} /> Finalizar puesta en marcha
          </button>
        )}
      </div>
    </div>
  );
}

function PasoTecnicos({ p }: { p: PuestaEnMarcha }) {
  const s = useStore();
  const lista = tecnicos();
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Equipo técnico</h2>
      <div>
        <p className="text-sm font-medium text-tinta-2">¿Quiénes participaron?</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {lista.map((t) => {
            const on = p.tecnicos.includes(t.id);
            return (
              <button key={t.id} type="button" aria-pressed={on}
                onClick={() => s.actualizarPuesta(p.id, (x) => {
                  const nuevos = on ? x.tecnicos.filter((y) => y !== t.id) : [...x.tecnicos, t.id];
                  return { tecnicos: nuevos, responsableId: nuevos.includes(x.responsableId) ? x.responsableId : nuevos[0] ?? "" };
                })}
                className={cx("inline-flex min-h-12 items-center gap-2 rounded-full border py-1 pr-4 pl-1 text-sm font-medium", on ? "border-marca-800 bg-marca-800 text-white" : "border-borde bg-superficie")}>
                <Avatar nombre={t.nombre} size={34} /> {t.nombre}
              </button>
            );
          })}
        </div>
      </div>
      {p.tecnicos.length > 1 && (
        <div>
          <p className="text-sm font-medium text-tinta-2">Técnico responsable (firma el documento)</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {p.tecnicos.map((tid) => (
              <button key={tid} type="button" role="radio" aria-checked={p.responsableId === tid} onClick={() => s.actualizarPuesta(p.id, { responsableId: tid })}
                className={cx("min-h-11 rounded-full border px-4 text-sm font-medium", p.responsableId === tid ? "border-marca-800 bg-marca-50 font-semibold text-marca-900" : "border-borde")}>
                {perfil(tid).nombre}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="text-sm text-tinta-2">Fecha: {fechaLarga(p.creadaEn)}</p>
    </div>
  );
}

function CampoInput({ c, valor, onChange }: { c: CampoPEM; valor: unknown; onChange: (v: unknown) => void }) {
  const etiqueta = (
    <span className="text-[15px] font-medium">
      {c.label}{c.obligatorio && <span className="text-critico"> *</span>}
      {c.auto && valor ? <span className="ml-2 text-xs font-normal text-marca-700">del equipo</span> : null}
    </span>
  );
  if (c.tipo === "sino" || c.tipo === "sino_obs") {
    const v = c.tipo === "sino" ? (valor as boolean | undefined) : (valor as { si?: boolean; obs?: string } | undefined)?.si;
    const set = (si: boolean) => onChange(c.tipo === "sino" ? si : { ...(valor as object), si });
    return (
      <div className="py-3">
        <div className="flex items-center justify-between gap-3">
          {etiqueta}
          <div role="radiogroup" aria-label={c.label} className="grid shrink-0 grid-cols-2 gap-1 rounded-xl bg-fondo p-1">
            <button type="button" role="radio" aria-checked={v === false} onClick={() => set(false)} className={cx("min-h-11 min-w-14 rounded-lg px-3 text-sm font-bold", v === false ? "bg-critico text-white" : "text-tinta-2")}>No</button>
            <button type="button" role="radio" aria-checked={v === true} onClick={() => set(true)} className={cx("min-h-11 min-w-14 rounded-lg px-3 text-sm font-bold", v === true ? "bg-ok text-white" : "text-tinta-2")}>Sí</button>
          </div>
        </div>
        {c.tipo === "sino_obs" && (
          <input value={(valor as { obs?: string } | undefined)?.obs ?? ""} onChange={(ev) => onChange({ ...(valor as object), obs: ev.target.value })} placeholder="Observaciones (opcional)" aria-label={`Observaciones: ${c.label}`} className={cx(claseCampo, "min-h-10 text-sm")} />
        )}
      </div>
    );
  }
  if (c.tipo === "opciones") {
    return (
      <div className="py-3">
        {etiqueta}
        <div className="mt-1.5 flex flex-wrap gap-2">
          {c.opciones!.map((o) => (
            <button key={o} type="button" role="radio" aria-checked={valor === o} onClick={() => onChange(o)}
              className={cx("inline-flex min-h-11 items-center gap-1 rounded-full border px-4 text-sm font-medium", valor === o ? "border-marca-800 bg-marca-800 text-white" : "border-borde bg-superficie")}>
              {valor === o && <Check size={15} />} {o}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (c.tipo === "fases") {
    const v = (valor as ValorFases) ?? {};
    const celda = (k: keyof ValorFases, etiquetaCelda: string) => (
      <input inputMode="decimal" aria-label={`${c.label} ${etiquetaCelda}`} value={v[k] ?? ""} onChange={(ev) => onChange({ ...v, [k]: ev.target.value.replace(/[^\d.,]/g, "") })} className={cx(claseCampo, "mt-0 text-center tabular")} />
    );
    return (
      <div className="py-3">
        {etiqueta}
        <div className="mt-2 grid grid-cols-[auto_1fr_1fr] items-center gap-2 text-sm">
          <span />
          <span className="text-center font-semibold text-tinta-2">Voltaje (V)</span>
          <span className="text-center font-semibold text-tinta-2">Amperaje (A)</span>
          {(["R", "S", "T"] as const).map((f, i) => (
            <span key={f} className="contents">
              <span className="font-semibold text-tinta-2">{f} · fase {i + 1}</span>
              {celda(`v${f}` as keyof ValorFases, `voltaje fase ${f}`)}
              {celda(`a${f}` as keyof ValorFases, `amperaje fase ${f}`)}
            </span>
          ))}
        </div>
      </div>
    );
  }
  return (
    <label className="block py-3">
      {etiqueta}
      <span className="relative mt-1 block">
        <input value={(valor as string) ?? ""} inputMode={c.tipo === "numero" ? "decimal" : undefined} onChange={(ev) => onChange(c.tipo === "numero" ? ev.target.value.replace(/[^\d.,-]/g, "") : ev.target.value)}
          className={cx(claseCampo, "mt-0", c.unidad && "pr-16")} />
        {c.unidad && <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-tinta-3">{c.unidad}</span>}
      </span>
    </label>
  );
}

function PasoCierre({ p, faltantes, irA }: { p: PuestaEnMarcha; faltantes: string[]; irA: (sec: string) => void }) {
  const s = useStore();
  const e = getEquipo(p.equipoId);
  const c = getCliente(e.clienteId);
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">Fotos y firmas</h2>
      <div>
        <p className="text-sm font-medium text-tinta-2">Fotos de respaldo</p>
        <div className="mt-1.5 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {p.fotos.map((f, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-fondo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f} alt={`Foto de respaldo ${i + 1}`} className="h-full w-full object-cover" />
              <button type="button" aria-label="Quitar foto" onClick={() => s.actualizarPuesta(p.id, (x) => ({ fotos: x.fotos.filter((_, j) => j !== i) }))} className="absolute top-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"><X size={16} /></button>
            </div>
          ))}
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-marca-600/40 bg-marca-50 text-sm font-semibold text-marca-800">
            <Camera size={24} /> Foto
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={async (ev) => {
              const f = ev.target.files?.[0];
              ev.target.value = "";
              if (f) { const url = await comprimirImagen(f, 1280, 0.75); s.actualizarPuesta(p.id, (x) => ({ fotos: [...x.fotos, url] })); }
            }} />
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-tinta-2">Firma del técnico {p.responsableId && `· ${perfil(p.responsableId).nombre}`}</p>
          <div className="mt-1.5"><Firma valor={p.firmaTecnico} onChange={(f) => s.actualizarPuesta(p.id, { firmaTecnico: f })} /></div>
        </div>
        <div>
          <p className="text-sm font-medium text-tinta-2">Recibí conforme · encargado de {c.razonSocial}</p>
          <div className="mt-1.5 grid grid-cols-[1fr_9rem] gap-2">
            <input value={p.recibe?.nombre ?? ""} onChange={(ev) => s.actualizarPuesta(p.id, (x) => ({ recibe: { nombre: ev.target.value, cedula: x.recibe?.cedula ?? "" } }))} placeholder="Nombre" aria-label="Nombre del encargado" className={cx(claseCampo, "mt-0")} />
            <input value={p.recibe?.cedula ?? ""} inputMode="numeric" onChange={(ev) => s.actualizarPuesta(p.id, (x) => ({ recibe: { nombre: x.recibe?.nombre ?? c.contacto.nombre, cedula: ev.target.value.replace(/\D/g, "") } }))} placeholder="Cédula" aria-label="Cédula del encargado" maxLength={10} className={cx(claseCampo, "mt-0 tabular")} />
          </div>
          <div className="mt-2"><Firma valor={p.firmaCliente} onChange={(f) => s.actualizarPuesta(p.id, { firmaCliente: f })} /></div>
        </div>
      </div>

      {(faltantes.length > 0 || !p.tecnicos.length || !p.firmaTecnico) && (
        <div className="rounded-xl bg-aviso-bg p-4 text-sm text-aviso" role="status">
          <p className="font-semibold">Para finalizar falta:</p>
          <ul className="mt-1 list-disc pl-5">
            {!p.tecnicos.length && <li><button type="button" className="underline" onClick={() => irA("tecnicos")}>Elegir el equipo técnico</button></li>}
            {faltantes.slice(0, 6).map((f) => <li key={f}><button type="button" className="text-left underline" onClick={() => irA(PLANTILLAS.find((x) => x.id === p.plantillaId)!.secciones.find((sec) => f.startsWith(sec.titulo))!.id)}>{f}</button></li>)}
            {faltantes.length > 6 && <li>y {faltantes.length - 6} más</li>}
            {!p.firmaTecnico && <li>La firma del técnico</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Puesta en marcha completada: documento de solo lectura, imprimible. */
function VistaPuesta({ p, base }: { p: PuestaEnMarcha; base: Base }) {
  const pl = plantillaDe(p);
  const e = getEquipo(p.equipoId);
  const fmt = (c: CampoPEM, v: unknown) => {
    if (!respondido(c, v as never)) return <span className="text-tinta-3">—</span>;
    if (c.tipo === "sino") return v ? <Badge tono="ok">Sí</Badge> : <Badge tono="critico">No</Badge>;
    if (c.tipo === "sino_obs") { const x = v as { si?: boolean; obs?: string }; return <span>{x.si ? <Badge tono="ok">Sí</Badge> : <Badge tono="critico">No</Badge>} {x.obs}</span>; }
    if (c.tipo === "fases") { const f = v as ValorFases; return <span className="tabular">V: {f.vR || "—"} / {f.vS || "—"} / {f.vT || "—"} · A: {f.aR || "—"} / {f.aS || "—"} / {f.aT || "—"}</span>; }
    return <span>{String(v)}{c.unidad ? ` ${c.unidad}` : ""}</span>;
  };
  return (
    <article className="space-y-4 print:text-[12px]">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-tinta-2">Nº {p.numero} · completada {fechaLarga(p.completadaEn)} {hora(p.completadaEn)}</p>
          <h1 className="text-2xl font-bold">{pl.titulo}</h1>
          <p className="text-tinta-2">{e.nombre} · {getCliente(e.clienteId).razonSocial}</p>
          <p className="text-sm text-tinta-2">Técnicos: {p.tecnicos.map((t) => perfil(t).nombre).join(", ")} · responsable {perfil(p.responsableId).nombre}</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Link href={`/${base}/equipos/${e.id}`} className="inline-flex min-h-11 items-center rounded-xl border border-borde px-4 text-sm font-semibold">Volver al equipo</Link>
          <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-marca-800 px-4 text-sm font-semibold text-white"><Printer size={16} /> Imprimir / PDF</button>
        </div>
      </header>
      {pl.secciones.map((sec) => (
        <section key={sec.id} className="rounded-2xl border border-borde bg-superficie p-4 break-inside-avoid">
          <h2 className="mb-2 font-semibold">{sec.titulo}</h2>
          <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {sec.campos.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-3 border-b border-borde/60 py-1">
                <dt className="text-tinta-2">{c.label}</dt>
                <dd className="text-right font-medium">{fmt(c, p.respuestas[c.id])}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      {p.fotos.length > 0 && (
        <section className="flex flex-wrap gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.fotos.map((f, i) => <img key={i} src={f} alt={`Foto ${i + 1}`} className="h-28 w-28 rounded-lg object-cover" />)}
        </section>
      )}
      <section className="grid gap-4 sm:grid-cols-2">
        {[["Técnico", perfil(p.responsableId).nombre, p.firmaTecnico], ["Recibí conforme", `${p.recibe?.nombre ?? ""}${p.recibe?.cedula ? ` · C.I. ${p.recibe.cedula}` : ""}`, p.firmaCliente]].map(([k, n, f]) => (
          <div key={k} className="rounded-2xl border border-borde bg-superficie p-4 text-sm">
            <p className="text-tinta-2">{k}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {f ? <img src={f} alt={`Firma ${k}`} className="h-24 w-full object-contain" /> : <p className="py-6 text-tinta-3">Sin firma</p>}
            <p className="border-t border-borde pt-1 font-semibold">{n || "—"}</p>
          </div>
        ))}
      </section>
    </article>
  );
}
