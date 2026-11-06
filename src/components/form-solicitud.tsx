"use client";

// Solicitud de visita técnica del vendedor (reemplaza el formulario de Cognito).
// Usa los clientes y equipos que ya existen en la app; si no están, se crean aquí mismo.
import Link from "next/link";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { EMPRESAS_FACTURA, TIPO_LABEL } from "@/lib/mock-data";
import { perfil } from "@/lib/selectors";
import type { TipoTrabajo } from "@/lib/types";
import { BarraGuardar, Campo, Chips, Programacion, claseCampo, useInicioSugerido } from "./formularios";
import { MiniaturaEquipo, TIPO_VISUAL } from "./visual";
import { norm } from "./filtros";
import { useAviso } from "./aviso";
import { cx } from "./ui";

export function FormSolicitud({ clienteInicial, equipoInicial, onGuardado }: { clienteInicial?: string; equipoInicial?: string; onGuardado: (id: string) => void }) {
  const s = useStore();
  const aviso = useAviso();
  const yo = perfil(s.usuarioActualId);
  const [clienteId, setClienteId] = useState(clienteInicial ?? (equipoInicial ? s.equipos.find((e) => e.id === equipoInicial)?.clienteId ?? "" : ""));
  const [qCli, setQCli] = useState("");
  const cliente = s.clientes.find((c) => c.id === clienteId);
  const [contacto, setContacto] = useState(cliente?.contacto.nombre ?? "");
  const [equipoId, setEquipoId] = useState(equipoInicial ?? "");
  const [tipo, setTipo] = useState<TipoTrabajo>("mantenimiento");
  const [descripcion, setDescripcion] = useState("");
  const [dpto, setDpto] = useState<"Guayaquil" | "Quito">(cliente?.ciudad === "Quito" || yo.ciudad === "Quito" ? "Quito" : "Guayaquil");
  const [fIni, hIni] = useInicioSugerido();
  const [fecha, setFecha] = useState(fIni);
  const [hora, setHora] = useState(hIni);
  const [dur, setDur] = useState("2");
  const [montoProducto, setMontoProducto] = useState("");
  const [montoManoObra, setMontoManoObra] = useState("");
  const [empresa, setEmpresa] = useState(EMPRESAS_FACTURA[0]);
  const [notificar, setNotificar] = useState("");

  const equiposCliente = s.equipos.filter((e) => e.clienteId === clienteId);
  const clientesFiltrados = s.clientes.filter((c) => norm(`${c.razonSocial} ${c.ruc}`).includes(norm(qCli))).slice(0, 6);
  const listo = !!clienteId && !!equipoId && contacto.trim() && descripcion.trim() && montoManoObra !== "";
  const ayuda = !clienteId ? "Elige el cliente" : !equipoId ? "Elige el equipo" : !contacto.trim() ? "Escribe el contacto" : !descripcion.trim() ? "Describe el trabajo" : "Indica el monto de mano de obra (0 si no se cobra)";

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="font-semibold">1. Cliente</h2>
        {cliente ? (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-marca-800 bg-marca-50 px-4 py-3">
            <span><span className="block font-semibold">{cliente.razonSocial}</span><span className="text-sm text-tinta-2">{cliente.ciudad}</span></span>
            <button type="button" className="min-h-11 text-sm font-semibold text-marca-700" onClick={() => { setClienteId(""); setEquipoId(""); }}>Cambiar</button>
          </div>
        ) : (
          <>
            <label className="relative block">
              <span className="sr-only">Buscar cliente</span>
              <Search size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-tinta-3" />
              <input value={qCli} onChange={(e) => setQCli(e.target.value)} placeholder="Buscar cliente por nombre o RUC" className={cx(claseCampo, "mt-0 pl-10")} />
            </label>
            <ul className="divide-y divide-borde overflow-hidden rounded-xl border border-borde bg-superficie">
              {clientesFiltrados.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => { setClienteId(c.id); setContacto(c.contacto.nombre === "—" ? "" : c.contacto.nombre); setDpto(c.ciudad === "Quito" ? "Quito" : "Guayaquil"); }} className="flex min-h-12 w-full items-center px-4 text-left hover:bg-fondo">
                    <span className="flex-1">{c.razonSocial}</span><span className="text-sm text-tinta-3">{c.ciudad}</span>
                  </button>
                </li>
              ))}
            </ul>
            <Link href="/admin/clientes/nuevo" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-marca-700"><Plus size={16} /> Cliente nuevo</Link>
          </>
        )}
        {cliente && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Contacto en el cliente"><input value={contacto} onChange={(e) => setContacto(e.target.value)} className={claseCampo} /></Campo>
            <div>
              <p className="text-sm font-medium text-tinta-2">Departamento de mantenimiento</p>
              <Chips etiqueta="Departamento" opciones={[["Guayaquil", "Mantenimiento Guayaquil"], ["Quito", "Mantenimiento Quito"]]} valor={dpto} onChange={setDpto} />
            </div>
          </div>
        )}
      </section>

      {cliente && (
        <section className="space-y-3">
          <h2 className="font-semibold">2. Equipo</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {equiposCliente.map((e) => (
              <button key={e.id} type="button" role="radio" aria-checked={equipoId === e.id} onClick={() => setEquipoId(e.id)}
                className={cx("flex items-center gap-3 rounded-xl border-2 p-2.5 text-left", equipoId === e.id ? "border-marca-800 bg-marca-50" : "border-borde bg-superficie hover:bg-fondo")}>
                <MiniaturaEquipo linea={e.lineaProducto} foto={e.fotoUrl} size={44} />
                <span className="min-w-0"><span className="block truncate font-semibold">{e.nombre}</span><span className="block truncate text-sm text-tinta-2">{e.marca} {e.modelo} · {e.serie}</span></span>
              </button>
            ))}
          </div>
          <Link href={`/admin/equipos/nuevo?cliente=${clienteId}`} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-marca-700"><Plus size={16} /> Equipo nuevo (con foto de placa)</Link>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-semibold">3. Trabajo</h2>
        <div role="radiogroup" aria-label="Tipo" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {(Object.keys(TIPO_LABEL) as TipoTrabajo[]).map((k) => {
            const V = TIPO_VISUAL[k];
            const I = V.icono;
            return (
              <button key={k} type="button" role="radio" aria-checked={tipo === k} onClick={() => setTipo(k)}
                className={cx("flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 text-sm font-semibold", tipo === k ? cx("border-transparent text-white", V.solido) : cx("border-borde bg-superficie", V.texto))}>
                <I size={22} /> {TIPO_LABEL[k]}
              </button>
            );
          })}
        </div>
        <Campo label="Descripción">
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} placeholder="Qué necesita el cliente" className={cx(claseCampo, "py-2")} />
        </Campo>
      </section>

      <section>
        <h2 className="font-semibold">4. ¿Cuándo lo necesita el cliente?</h2>
        <p className="text-sm text-tinta-2">El coordinador confirmará o ajustará la fecha y hora.</p>
        <div className="mt-3"><Programacion fecha={fecha} setFecha={setFecha} horaIni={hora} setHoraIni={setHora} dur={dur} setDur={setDur} /></div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">5. Valores</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo label="Monto producto (USD)"><input inputMode="decimal" value={montoProducto} onChange={(e) => setMontoProducto(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" className={claseCampo} /></Campo>
          <Campo label="Monto mano de obra (USD)"><input inputMode="decimal" value={montoManoObra} onChange={(e) => setMontoManoObra(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" className={claseCampo} /></Campo>
          <Campo label="Factura">
            <select value={empresa} onChange={(e) => setEmpresa(e.target.value)} className={claseCampo}>{EMPRESAS_FACTURA.map((x) => <option key={x}>{x}</option>)}</select>
          </Campo>
        </div>
        <Campo label="Notificar también a" opcional>
          <input value={notificar} onChange={(e) => setNotificar(e.target.value)} placeholder="correo1@cliente.com, correo2@…" className={claseCampo} />
        </Campo>
      </section>

      <BarraGuardar
        texto="Enviar solicitud"
        deshabilitado={!listo}
        ayuda={ayuda}
        onClick={() => {
          const id = s.crearSolicitud({
            vendedorId: yo.id,
            clienteId,
            contacto: contacto.trim(),
            equipoId,
            tipo,
            descripcion: descripcion.trim(),
            dpto,
            fechaRequerida: fecha,
            horaRequerida: hora,
            duracionH: Number(dur),
            montoProducto: Number(montoProducto) || 0,
            montoManoObra: Number(montoManoObra) || 0,
            empresaFactura: empresa,
            notificarA: notificar.split(/[,;\s]+/).filter((x) => x.includes("@")),
          });
          aviso(`Solicitud enviada a Mantenimiento ${dpto}`);
          onGuardado(id);
        }}
      />
    </div>
  );
}
