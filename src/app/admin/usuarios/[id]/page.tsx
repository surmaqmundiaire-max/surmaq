"use client";

import Link from "next/link";
import { use, useState } from "react";
import { ArrowLeft, CalendarPlus, Mail, Pencil, Phone } from "lucide-react";
import { useStore } from "@/lib/store";
import { contexto, horasVisita, perfil, puede } from "@/lib/selectors";
import { duracion, fechaCorta, hora, toLocalIso } from "@/lib/format";
import { Avatar, EstadoVisitaBadge, Vacio, cx } from "@/components/ui";
import { ChipRol, IconoTipo } from "@/components/visual";
import { FormUsuario } from "@/components/form-usuario";
import { useAviso } from "@/components/aviso";

export default function PerfilUsuario({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const s = useStore();
  const aviso = useAviso();
  const [editando, setEditando] = useState(false);
  const u = s.perfiles.find((p) => p.id === id);
  if (!u) return <Vacio>No se encontró el usuario.</Vacio>;
  const yo = perfil(s.usuarioActualId);
  const hoy = s.ahora.slice(0, 10);
  const hace7 = new Date(hoy + "T00:00:00");
  hace7.setDate(hace7.getDate() - 7);
  const desde = toLocalIso(hace7).slice(0, 10);
  const esTecnico = u.rol === "tecnico";
  const proximas = s.visitas.filter((v) => v.tecnicoId === id && v.estado !== "finalizada" && v.estado !== "cancelada").sort((a, b) => a.programadaInicio.localeCompare(b.programadaInicio));
  const horas7 = s.visitas.filter((v) => v.tecnicoId === id && v.checkinEn && v.checkinEn.slice(0, 10) >= desde).reduce((a, v) => a + horasVisita(v, s.ahora), 0);
  const programadas = s.visitas.filter((v) => v.programadaPor === id).sort((a, b) => b.programadaInicio.localeCompare(a.programadaInicio));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/admin/usuarios" className="inline-flex items-center gap-1 text-sm font-semibold text-marca-700 hover:underline"><ArrowLeft size={16} /> Usuarios</Link>

      <header className="flex flex-wrap items-center gap-4 rounded-2xl border border-borde bg-superficie p-4 sm:p-5">
        <Avatar nombre={u.nombre} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{u.nombre}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-tinta-2"><ChipRol rol={u.rol} /> {u.ciudadesACargo?.length ? `Coordina ${u.ciudadesACargo.join(" y ")}` : u.ciudad}</p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <a href={`mailto:${u.email}`} className="inline-flex items-center gap-1 text-marca-700 hover:underline"><Mail size={14} /> {u.email}</a>
            {u.telefono && <a href={`tel:${u.telefono}`} className="inline-flex items-center gap-1 text-marca-700 hover:underline"><Phone size={14} /> {u.telefono}</a>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {esTecnico && puede(yo.rol, "programar_tareas") && (
            <Link href={`/admin/programar?tecnico=${u.id}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-marca-800 px-4 text-sm font-semibold text-white hover:bg-marca-900"><CalendarPlus size={17} /> Programar tarea</Link>
          )}
          {puede(yo.rol, "gestionar_usuarios") && !editando && (
            <button type="button" onClick={() => setEditando(true)} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-borde bg-superficie px-4 text-sm font-semibold hover:bg-fondo"><Pencil size={16} /> Editar</button>
          )}
        </div>
      </header>

      {editando && (
        <section className="rounded-2xl border border-marca-600/30 bg-superficie p-4 sm:p-6">
          <h2 className="mb-4 font-semibold">Editar perfil</h2>
          <FormUsuario inicial={u} onGuardado={() => setEditando(false)} />
          <div className="mt-4 flex items-center justify-between border-t border-borde pt-4 text-sm">
            <span className="text-tinta-2">{u.activo === false ? "Este usuario no puede entrar." : "Este usuario puede entrar a la app."}</span>
            {u.id !== yo.id && (
              <button
                type="button"
                onClick={() => { s.actualizarPerfil(u.id, { activo: u.activo === false }); aviso(u.activo === false ? "Usuario activado" : "Usuario desactivado"); }}
                className={cx("min-h-10 rounded-lg px-3 font-semibold", u.activo === false ? "text-ok" : "text-critico")}
              >
                {u.activo === false ? "Activar usuario" : "Desactivar usuario"}
              </button>
            )}
          </div>
        </section>
      )}

      {esTecnico ? (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Cifra k="Horas últimos 7 días" v={duracion(horas7)} />
            <Cifra k="Tareas por hacer" v={String(proximas.length)} />
            <Cifra k="Ciudad" v={u.ciudad} />
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold">Tareas por hacer</h2>
            {proximas.length === 0 ? (
              <Vacio>No tiene tareas pendientes. Usa «Programar tarea» para asignarle una.</Vacio>
            ) : (
              <ListaTareas ids={proximas.map((v) => v.id)} />
            )}
          </section>
        </>
      ) : (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Tareas que programó <span className="font-normal text-tinta-3 tabular">({programadas.length})</span></h2>
          {programadas.length === 0 ? <Vacio>Todavía no ha programado tareas.</Vacio> : <ListaTareas ids={programadas.slice(0, 15).map((v) => v.id)} conTecnico />}
        </section>
      )}
    </div>
  );

  function ListaTareas({ ids, conTecnico }: { ids: string[]; conTecnico?: boolean }) {
    return (
      <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
        {ids.map((vid) => {
          const v = s.visitas.find((x) => x.id === vid)!;
          const { cliente, trabajo } = contexto(s.trabajos, v.trabajoId);
          return (
            <li key={vid}>
              <Link href={`/admin/mantenimientos/${trabajo.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-fondo">
                <IconoTipo tipo={trabajo.tipo} size={36} />
                <span className="w-24 shrink-0 text-sm tabular"><span className="block font-semibold">{fechaCorta(v.programadaInicio)}</span>{hora(v.programadaInicio)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{cliente.razonSocial}</span>
                  <span className="block truncate text-sm text-tinta-2">{v.descripcion}{conTecnico ? ` · ${perfil(v.tecnicoId).nombre}` : ""}</span>
                </span>
                <EstadoVisitaBadge estado={v.estado} />
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }
}

function Cifra({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-2xl border border-borde bg-superficie p-4">
      <p className="text-xs text-tinta-2">{k}</p>
      <p className="text-lg font-semibold tabular">{v}</p>
    </div>
  );
}
