"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Car, CheckCircle2, Mail, Trash2, XCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { cliente as getCliente, equipo as getEquipo, perfil, puede, ROL_LABEL, tecnicosProgramables } from "@/lib/selectors";
import { fechaCorta, fechaLarga, hora } from "@/lib/format";
import { TIPO_LABEL, VEHICULOS } from "@/lib/mock-data";
import type { Solicitud, TipoTrabajo } from "@/lib/types";
import { Avatar, Vacio, cx } from "@/components/ui";
import { ChipTipo, IconoTipo, MiniaturaEquipo, TIPO_VISUAL } from "@/components/visual";
import { EstadoSolicitudBadge } from "@/components/solicitud-estado";
import { Campo, Chips, Programacion, SelectorTecnico, claseCampo } from "@/components/formularios";
import { useAviso } from "@/components/aviso";

export default function SolicitudDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const s = useStore();
  const router = useRouter();
  const aviso = useAviso();
  const sol = s.solicitudes.find((x) => x.id === id);
  if (!sol) return <Vacio>No se encontró la solicitud (puede haber sido eliminada).</Vacio>;
  const yo = perfil(s.usuarioActualId);
  const aprueba = puede(yo.rol, "aprobar_solicitudes");
  const c = getCliente(sol.clienteId);
  const e = getEquipo(sol.equipoId);
  const visita = sol.trabajoId ? s.visitas.find((v) => v.trabajoId === sol.trabajoId) : undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href="/admin/solicitudes" className="inline-flex items-center gap-1 text-sm font-semibold text-marca-700 hover:underline"><ArrowLeft size={16} /> Solicitudes</Link>

      <header className="flex flex-wrap items-start gap-3">
        <IconoTipo tipo={sol.tipo} size={48} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm text-tinta-2">Solicitud Nº {sol.numero} <EstadoSolicitudBadge estado={sol.estado} /> <ChipTipo tipo={sol.tipo} /></p>
          <h1 className="text-2xl font-bold">{c.razonSocial}</h1>
          <p className="text-tinta-2">{sol.descripcion}</p>
        </div>
      </header>

      <section className="grid gap-4 rounded-2xl border border-borde bg-superficie p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <Dato k="Pedida por" v={`${perfil(sol.vendedorId).nombre} · ${fechaCorta(sol.solicitadaEn)} ${hora(sol.solicitadaEn)}`} />
        <Dato k="Contacto" v={sol.contacto} />
        <Dato k="Departamento" v={`Mantenimiento ${sol.dpto}`} />
        <Dato k="Requerida para" v={`${fechaLarga(sol.fechaRequerida)} · ${sol.horaRequerida}`} />
        <Dato k="Monto producto" v={`USD ${(sol.montoProducto ?? 0).toLocaleString("es-EC")}`} />
        <Dato k="Monto mano de obra" v={`USD ${(sol.montoManoObra ?? 0).toLocaleString("es-EC")} · ${sol.empresaFactura ?? "—"}`} />
        <div className="sm:col-span-2 lg:col-span-3">
          <dt className="text-tinta-3">Equipo</dt>
          <dd className="mt-1 flex items-center gap-3">
            <MiniaturaEquipo linea={e.lineaProducto} foto={e.fotoUrl} size={44} />
            <Link href={`/admin/equipos/${e.id}`} className="font-semibold text-marca-700 hover:underline">{e.nombre}</Link>
            <span className="text-tinta-2">{e.marca} {e.modelo} · serie {e.serie}</span>
          </dd>
        </div>
        {sol.notificarA.length > 0 && <div className="sm:col-span-2 lg:col-span-3"><Dato k="Notificar a" v={sol.notificarA.join(", ")} /></div>}
      </section>

      {sol.estado === "programada" && visita && (
        <section className="rounded-2xl bg-ok-bg p-4">
          <p className="flex items-center gap-2 font-semibold text-ok"><CheckCircle2 size={20} /> Programada por {perfil(sol.revisadaPor ?? "").nombre}</p>
          <p className="mt-1 text-[15px]">
            <strong>{fechaLarga(visita.programadaInicio)}</strong>, llegada {hora(visita.programadaInicio)}{visita.salidaOficina ? ` (sale de oficina ${visita.salidaOficina})` : ""} · {perfil(visita.tecnicoId).nombre}
            {visita.acompanantes.length > 0 && ` con ${visita.acompanantes.map((a) => perfil(a).nombre.split(" ")[0]).join(", ")}`}
            {visita.vehiculo && ` · ${visita.vehiculo}`}
          </p>
          {sol.cambioHora && <p className="mt-1 text-sm text-info">Se programó en una fecha u hora distinta a la requerida ({fechaCorta(sol.fechaRequerida)} {sol.horaRequerida}).</p>}
          <Link href={`/admin/mantenimientos/${sol.trabajoId}`} className="mt-2 inline-block text-sm font-semibold text-marca-700 hover:underline">Ver mantenimiento →</Link>
        </section>
      )}

      {sol.estado === "rechazada" && (
        <section className="rounded-2xl bg-critico-bg p-4 text-critico">
          <p className="flex items-center gap-2 font-semibold"><XCircle size={20} /> Rechazada por {perfil(sol.revisadaPor ?? "").nombre}</p>
          <p className="mt-1 text-[15px] text-tinta">{sol.motivoRechazo}</p>
        </section>
      )}

      {sol.estado === "ingresada" && aprueba && <Revision sol={sol} onListo={(ruta) => router.push(ruta)} />}

      {sol.estado === "ingresada" && !aprueba && sol.vendedorId === yo.id && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-borde bg-superficie p-4">
          <p className="text-sm text-tinta-2">Esperando revisión de Mantenimiento {sol.dpto}. Te avisaremos cuando quede programada.</p>
          <button type="button" onClick={() => { s.eliminarSolicitud(sol.id); aviso("Solicitud anulada"); router.push("/admin/solicitudes"); }} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-critico hover:bg-critico-bg">
            <Trash2 size={16} /> Anular solicitud
          </button>
        </section>
      )}
    </div>
  );
}

/** Revisión del coordinador / jefe / administrador: aprobar y programar, cambiar, rechazar o eliminar. */
function Revision({ sol, onListo }: { sol: Solicitud; onListo: (ruta: string) => void }) {
  const s = useStore();
  const aviso = useAviso();
  const yo = perfil(s.usuarioActualId);
  const programables = tecnicosProgramables(yo).filter((t) => t.ciudad === sol.dpto);
  const [tipo, setTipo] = useState<TipoTrabajo>(sol.tipo);
  const [descripcion, setDescripcion] = useState(sol.descripcion);
  const [fecha, setFecha] = useState(sol.fechaRequerida);
  const [llegada, setLlegada] = useState(sol.horaRequerida);
  const [dur, setDur] = useState(String(sol.duracionH ?? 2));
  const menosUnaHora = (h: string) => `${String(Math.max(6, Number(h.slice(0, 2)) - 1)).padStart(2, "0")}:${h.slice(3)}`;
  const [salida, setSalida] = useState(menosUnaHora(sol.horaRequerida));
  const [tecnico, setTecnico] = useState(programables[0]?.id ?? "");
  const [acomp, setAcomp] = useState<string[]>([]);
  const [vehiculo, setVehiculo] = useState(VEHICULOS.find((v) => v.includes(sol.dpto === "Quito" ? "UIO" : "GYE")) ?? VEHICULOS[0]);
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const cambio = fecha !== sol.fechaRequerida || llegada !== sol.horaRequerida;

  return (
    <section className="space-y-5 rounded-2xl border border-marca-600/30 bg-superficie p-4 sm:p-6" aria-label="Revisión">
      <div>
        <h2 className="text-lg font-semibold">Revisar y programar</h2>
        <p className="text-sm text-tinta-2">Como {ROL_LABEL[yo.rol].toLowerCase()}, puedes ajustar lo que pidió el vendedor antes de programar.</p>
      </div>

      <div>
        <p className="text-sm font-medium text-tinta-2">Tipo</p>
        <div role="radiogroup" aria-label="Tipo" className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {(Object.keys(TIPO_LABEL) as TipoTrabajo[]).map((k) => {
            const V = TIPO_VISUAL[k];
            const I = V.icono;
            return (
              <button key={k} type="button" role="radio" aria-checked={tipo === k} onClick={() => setTipo(k)}
                className={cx("flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 text-sm font-semibold", tipo === k ? cx("border-transparent text-white", V.solido) : cx("border-borde bg-superficie", V.texto))}>
                <I size={20} /> {TIPO_LABEL[k]}
              </button>
            );
          })}
        </div>
      </div>
      <Campo label="Descripción"><textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} className={cx(claseCampo, "py-2")} /></Campo>

      <div>
        <h3 className="font-semibold">Fecha y hora de llegada al cliente</h3>
        {cambio && <p className="text-sm text-info">Cambiaste la hora: el vendedor verá la nueva fecha.</p>}
        <div className="mt-2"><Programacion fecha={fecha} setFecha={setFecha} horaIni={llegada} setHoraIni={(h) => { setLlegada(h); setSalida(menosUnaHora(h)); }} dur={dur} setDur={setDur} /></div>
        <label className="mt-3 block max-w-56 text-sm">
          <span className="font-medium text-tinta-2">Salida de la oficina</span>
          <input type="time" value={salida} onChange={(e) => setSalida(e.target.value)} className={claseCampo} />
        </label>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Equipo de trabajo · Mantenimiento {sol.dpto}</h3>
        {programables.length === 0 ? (
          <p className="text-sm text-critico">No tienes técnicos de {sol.dpto} a tu cargo.</p>
        ) : (
          <SelectorTecnico base="admin" ciudad={sol.dpto} valor={tecnico} onChange={(t) => { setTecnico(t); setAcomp(acomp.filter((a) => a !== t)); }} />
        )}
        <div>
          <p className="text-sm font-medium text-tinta-2">Acompañantes</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {programables.filter((t) => t.id !== tecnico).map((t) => {
              const on = acomp.includes(t.id);
              return (
                <button key={t.id} type="button" aria-pressed={on} onClick={() => setAcomp(on ? acomp.filter((x) => x !== t.id) : [...acomp, t.id])}
                  className={cx("inline-flex min-h-11 items-center gap-2 rounded-full border py-1 pr-4 pl-1 text-sm font-medium", on ? "border-marca-800 bg-marca-800 text-white" : "border-borde bg-superficie")}>
                  <Avatar nombre={t.nombre} size={30} /> {t.nombre.split(" ")[0]}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-sm font-medium text-tinta-2"><Car size={16} /> Vehículo</p>
          <Chips etiqueta="Vehículo" opciones={VEHICULOS.map((v) => [v, v] as [string, string])} valor={vehiculo} onChange={setVehiculo} />
        </div>
      </div>

      {sol.notificarA.length > 0 && (
        <p className="flex items-center gap-1.5 text-sm text-tinta-2"><Mail size={15} /> Al programar se avisará a {perfil(sol.vendedorId).nombre} y a {sol.notificarA.join(", ")}.</p>
      )}

      {rechazando ? (
        <div className="space-y-2 rounded-xl bg-critico-bg p-4">
          <Campo label="Motivo del rechazo (lo verá el vendedor)"><textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} className={cx(claseCampo, "py-2")} autoFocus /></Campo>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setRechazando(false)} className="min-h-11 rounded-xl border border-borde bg-superficie px-4 font-semibold">Cancelar</button>
            <button type="button" disabled={!motivo.trim()} onClick={() => { s.rechazarSolicitud(sol.id, motivo.trim(), yo.id); aviso("Solicitud rechazada · se avisó al vendedor"); onListo("/admin/solicitudes"); }}
              className="min-h-11 rounded-xl bg-critico px-4 font-semibold text-white disabled:opacity-50">Rechazar solicitud</button>
          </div>
        </div>
      ) : eliminando ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-critico-bg p-4">
          <span className="flex-1 text-sm text-critico">¿Eliminar la solicitud Nº {sol.numero}? No se puede deshacer.</span>
          <button type="button" onClick={() => setEliminando(false)} className="min-h-11 rounded-xl border border-borde bg-superficie px-4 font-semibold">Cancelar</button>
          <button type="button" onClick={() => { s.eliminarSolicitud(sol.id); aviso("Solicitud eliminada"); onListo("/admin/solicitudes"); }} className="min-h-11 rounded-xl bg-critico px-4 font-semibold text-white">Eliminar</button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 border-t border-borde pt-4">
          <button
            type="button"
            disabled={!tecnico}
            onClick={() => {
              const trabajoId = s.aprobarSolicitud(sol.id, { por: yo.id, tecnicoId: tecnico, acompanantes: acomp, vehiculo, fecha, horaSalida: salida, horaLlegada: llegada, horas: Number(dur), tipo, descripcion: descripcion.trim() || sol.descripcion });
              aviso(`Programada para ${perfil(tecnico).nombre} · ${fechaCorta(fecha)} ${llegada}`);
              onListo(`/admin/mantenimientos/${trabajoId}`);
            }}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-marca-800 px-5 font-semibold text-white hover:bg-marca-900 disabled:bg-tinta-3/40 sm:flex-none"
          >
            <CheckCircle2 size={19} /> {cambio ? "Programar con la nueva hora" : "Aprobar y programar"}
          </button>
          <button type="button" onClick={() => setRechazando(true)} className="inline-flex min-h-12 items-center gap-1.5 rounded-xl border border-borde bg-superficie px-4 font-semibold text-critico hover:bg-critico-bg">
            <XCircle size={18} /> Rechazar
          </button>
          <button type="button" onClick={() => setEliminando(true)} className="inline-flex min-h-12 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-tinta-2 hover:bg-fondo">
            <Trash2 size={16} /> Eliminar
          </button>
        </div>
      )}
    </section>
  );
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-tinta-3">{k}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  );
}
