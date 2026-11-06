"use client";

// Formularios para registrar cada nivel: Empresa → Equipo → Mantenimiento → Tarea.
// Pensados para el celular: se elige con toques y se escribe lo mínimo.
import { useMemo, useState } from "react";
import { Check, Crosshair, Loader2, Search, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { CHECKLISTS, LINEAS_PRODUCTO, TIPO_LABEL } from "@/lib/mock-data";
import { equipo as getEquipo, cliente as getCliente, perfil, tecnicosProgramables } from "@/lib/selectors";
import { Avatar } from "./ui";
import { fechaCorta, toLocalIso } from "@/lib/format";
import type { Equipo, LugarTrabajo, TipoTrabajo } from "@/lib/types";
import { LectorPlaca, SlotFoto, aplicarLectura, type LecturaPlaca } from "./fotos-equipo";
import { norm } from "./filtros";
import { cx } from "./ui";
import { useAviso } from "./aviso";
import { TIPO_VISUAL } from "./visual";

// ---------- piezas comunes ----------
export const claseCampo =
  "mt-1 min-h-12 w-full rounded-xl border border-borde bg-superficie px-3 text-[16px] outline-none focus:border-marca-600 focus:ring-2 focus:ring-marca-600/20";

export function Campo({ label, children, opcional }: { label: string; children: React.ReactNode; opcional?: boolean }) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-tinta-2">{label}{opcional && <span className="font-normal text-tinta-3"> (opcional)</span>}</span>
      {children}
    </label>
  );
}

export function Chips<T extends string>({ opciones, valor, onChange, etiqueta }: { opciones: [T, string][]; valor: T | ""; onChange: (v: T) => void; etiqueta: string }) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className="mt-1.5 flex flex-wrap gap-2">
      {opciones.map(([k, l]) => (
        <button
          key={k}
          type="button"
          role="radio"
          aria-checked={valor === k}
          onClick={() => onChange(k)}
          className={cx(
            "inline-flex min-h-11 items-center gap-1 rounded-full border px-4 text-sm font-medium transition-colors",
            valor === k ? "border-marca-800 bg-marca-800 text-white" : "border-borde bg-superficie hover:bg-fondo",
          )}
        >
          {valor === k && <Check size={15} />} {l}
        </button>
      ))}
    </div>
  );
}

export function BarraGuardar({ texto, onClick, deshabilitado, ayuda }: { texto: string; onClick: () => void; deshabilitado?: boolean; ayuda?: string }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-borde bg-superficie/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur sm:mx-0 sm:rounded-b-2xl">
      <button
        type="button"
        onClick={onClick}
        disabled={deshabilitado}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-marca-800 text-[17px] font-semibold text-white hover:bg-marca-900 disabled:bg-tinta-3/40"
      >
        <Check size={20} /> {texto}
      </button>
      {deshabilitado && ayuda && <p className="mt-2 text-center text-xs text-tinta-3">{ayuda}</p>}
    </div>
  );
}

/** Próximos días hábiles como opciones rápidas. */
function useDias() {
  const { ahora } = useStore();
  return useMemo(() => {
    const out: [string, string][] = [];
    const d = new Date(ahora.slice(0, 10) + "T00:00:00");
    while (out.length < 6) {
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        const iso = toLocalIso(d).slice(0, 10);
        out.push([iso, out.length === 0 && iso === ahora.slice(0, 10) ? "Hoy" : fechaCorta(iso)]);
      }
      d.setDate(d.getDate() + 1);
    }
    return out;
  }, [ahora]);
}

/** Propone el siguiente horario libre: la próxima hora en punto de hoy, o mañana a las 09:00 si ya es tarde. */
function useInicioSugerido(): [string, string] {
  const { ahora } = useStore();
  const dias = useDias();
  const h = Number(ahora.slice(11, 13)) + 1;
  if (dias[0][0] === ahora.slice(0, 10) && h <= 16) return [dias[0][0], `${String(h).padStart(2, "0")}:00`];
  return [dias.find(([d]) => d > ahora.slice(0, 10))![0], "09:00"];
}

const HORAS: [string, string][] = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map((h) => [h, h]);
const DURACIONES: [string, string][] = [["1", "1 h"], ["2", "2 h"], ["3", "3 h"], ["4", "4 h"], ["8", "Día completo"]];

/** Fecha, hora y duración de una tarea, con opciones rápidas y campo libre. */
function Programacion({ fecha, setFecha, horaIni, setHoraIni, dur, setDur }: { fecha: string; setFecha: (v: string) => void; horaIni: string; setHoraIni: (v: string) => void; dur: string; setDur: (v: string) => void }) {
  const dias = useDias();
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-tinta-2">Día</p>
        <Chips etiqueta="Día" opciones={dias} valor={dias.some(([k]) => k === fecha) ? fecha : ""} onChange={setFecha} />
        <input type="date" aria-label="Otra fecha" value={fecha} onChange={(e) => setFecha(e.target.value)} className={cx(claseCampo, "mt-2 max-w-56")} />
      </div>
      <div>
        <p className="text-sm font-medium text-tinta-2">Hora de inicio</p>
        <Chips etiqueta="Hora" opciones={HORAS} valor={HORAS.some(([k]) => k === horaIni) ? horaIni : ""} onChange={setHoraIni} />
        <input type="time" aria-label="Otra hora" value={horaIni} onChange={(e) => setHoraIni(e.target.value)} className={cx(claseCampo, "mt-2 max-w-40")} />
      </div>
      <div>
        <p className="text-sm font-medium text-tinta-2">Duración estimada</p>
        <Chips etiqueta="Duración" opciones={DURACIONES} valor={dur} onChange={setDur} />
      </div>
    </div>
  );
}

const finDe = (fecha: string, hora: string, horas: number) => {
  const d = new Date(`${fecha}T${hora}:00`);
  d.setMinutes(d.getMinutes() + horas * 60);
  return toLocalIso(d);
};

/** Usuario que está programando (panel o técnico) */
export function useProgramador(base: "admin" | "tecnico") {
  const s = useStore();
  return perfil(base === "tecnico" ? s.tecnicoActualId : s.usuarioActualId);
}

/** Elegir técnico con un toque. El técnico solo puede programarse a sí mismo. */
function SelectorTecnico({ base, valor, onChange }: { base: "admin" | "tecnico"; valor: string; onChange: (id: string) => void }) {
  const yo = useProgramador(base);
  const opciones = tecnicosProgramables(yo);
  if (base === "tecnico") {
    return (
      <div>
        <p className="text-sm font-medium text-tinta-2">Técnico</p>
        <p className="mt-1.5 flex min-h-12 items-center gap-2 rounded-xl bg-fondo px-3 text-sm"><Avatar nombre={yo.nombre} size={28} /> Para ti</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-sm font-medium text-tinta-2">Asignar a</p>
      <div role="radiogroup" aria-label="Técnico" className="mt-1.5 flex flex-wrap gap-2">
        {opciones.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={valor === t.id}
            onClick={() => onChange(t.id)}
            className={cx(
              "inline-flex min-h-12 items-center gap-2 rounded-full border py-1 pr-4 pl-1 text-sm font-medium transition-colors",
              valor === t.id ? "border-marca-800 bg-marca-800 text-white" : "border-borde bg-superficie hover:bg-fondo",
            )}
          >
            <Avatar nombre={t.nombre} size={34} />
            <span className="text-left leading-tight">{t.nombre}<span className={cx("block text-xs", valor === t.id ? "text-marca-100" : "text-tinta-3")}>{t.ciudad}</span></span>
          </button>
        ))}
      </div>
      {yo.ciudadesACargo?.length ? <p className="mt-1 text-xs text-tinta-3">Ves los técnicos de {yo.ciudadesACargo.join(", ")}.</p> : null}
    </div>
  );
}

// ---------- Empresa ----------
export function FormCliente({ onGuardado }: { onGuardado: (id: string) => void }) {
  const { agregarCliente, tecnicoActualId } = useStore();
  const aviso = useAviso();
  const [razon, setRazon] = useState("");
  const [ruc, setRuc] = useState("");
  const [ciudad, setCiudad] = useState("Guayaquil");
  const [direccion, setDireccion] = useState("");
  const [industria, setIndustria] = useState("");
  const [contacto, setContacto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ubic, setUbic] = useState<{ lat: number; lng: number } | null>(null);
  const [buscandoGps, setBuscandoGps] = useState(false);
  const rucOk = ruc === "" || /^\d{13}$/.test(ruc);
  const listo = razon.trim().length > 2 && rucOk;

  return (
    <div className="space-y-4">
      <Campo label="Razón social"><input value={razon} onChange={(e) => setRazon(e.target.value)} className={claseCampo} autoComplete="organization" /></Campo>
      <Campo label="RUC" opcional>
        <input value={ruc} onChange={(e) => setRuc(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={13} aria-invalid={!rucOk} aria-describedby="ruc-ayuda" className={claseCampo} />
        <span id="ruc-ayuda" className={cx("mt-1 block text-xs", rucOk ? "text-tinta-3" : "text-critico")}>{rucOk ? "13 dígitos" : `Faltan ${13 - ruc.length} dígitos`}</span>
      </Campo>
      <Campo label="Ciudad">
        <Chips etiqueta="Ciudad" opciones={[["Guayaquil", "Guayaquil"], ["Quito", "Quito"], ["Durán", "Durán"], ["Machala", "Machala"]]} valor={["Guayaquil", "Quito", "Durán", "Machala"].includes(ciudad) ? ciudad : ""} onChange={setCiudad} />
        <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} aria-label="Otra ciudad" className={cx(claseCampo, "mt-2")} />
      </Campo>
      <Campo label="Dirección"><input value={direccion} onChange={(e) => setDireccion(e.target.value)} className={claseCampo} /></Campo>
      <div>
        <button
          type="button"
          onClick={() => {
            setBuscandoGps(true);
            navigator.geolocation?.getCurrentPosition(
              (p) => { setUbic({ lat: p.coords.latitude, lng: p.coords.longitude }); setBuscandoGps(false); },
              () => setBuscandoGps(false),
              { enableHighAccuracy: true, timeout: 8000 },
            );
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-marca-100 px-4 text-sm font-semibold text-marca-900"
        >
          {buscandoGps ? <Loader2 size={16} className="animate-spin" /> : ubic ? <Check size={16} /> : <Crosshair size={16} />}
          {ubic ? "Ubicación guardada" : "Estoy en la empresa: guardar ubicación"}
        </button>
        <p className="mt-1 text-xs text-tinta-3">Sirve para verificar después que las entradas se marcan en el lugar correcto.</p>
      </div>
      <Campo label="Industria" opcional><input value={industria} onChange={(e) => setIndustria(e.target.value)} className={claseCampo} /></Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Persona de contacto" opcional><input value={contacto} onChange={(e) => setContacto(e.target.value)} className={claseCampo} /></Campo>
        <Campo label="Teléfono" opcional><input value={telefono} onChange={(e) => setTelefono(e.target.value)} inputMode="tel" className={claseCampo} /></Campo>
      </div>
      <BarraGuardar
        texto="Guardar empresa"
        deshabilitado={!listo}
        ayuda={!rucOk ? "Revisa el RUC" : "Escribe la razón social"}
        onClick={() => {
          aviso(`Empresa «${razon.trim()}» guardada`);
          onGuardado(
            agregarCliente({
              razonSocial: razon.trim(),
              ruc,
              direccion,
              ciudad,
              industria: industria || "—",
              lat: ubic?.lat ?? 0,
              lng: ubic?.lng ?? 0,
              responsableId: tecnicoActualId,
              recurrente: false,
              contacto: { nombre: contacto || "—", telefono },
            }),
          );
        }}
      />
    </div>
  );
}

// ---------- Equipo ----------
export function FormEquipo({ clienteInicial, onGuardado }: { clienteInicial?: string; onGuardado: (id: string) => void }) {
  const { agregarEquipo, clientes } = useStore();
  const aviso = useAviso();
  const [clienteId, setClienteId] = useState(clienteInicial ?? "");
  const [qCliente, setQCliente] = useState("");
  const [fotoPlaca, setFotoPlaca] = useState<string>();
  const [fotoEquipo, setFotoEquipo] = useState<string>();
  const [datos, setDatos] = useState<Partial<Equipo>>({});
  const [nombre, setNombre] = useState("");
  const [linea, setLinea] = useState(LINEAS_PRODUCTO[0]);
  const [leido, setLeido] = useState(false);
  const cliente = clientes.find((c) => c.id === clienteId);
  const sugeridos = clientes.filter((c) => norm(c.razonSocial).includes(norm(qCliente))).slice(0, 6);

  const aplicar = (l: LecturaPlaca) => {
    setDatos((d) => ({ ...d, ...aplicarLectura(l) }));
    if (!nombre && l.tipoEquipo) setNombre(`${l.tipoEquipo}${l.potencia ? ` ${l.potencia.split("/").pop()!.trim()}` : ""}`);
    const t = norm(l.tipoEquipo ?? "");
    if (t.includes("tornillo")) setLinea("Compresores de Tornillo");
    else if (t.includes("piston")) setLinea("Compresores de Pistón");
    else if (t.includes("secador") || t.includes("filtro")) setLinea("Tratamiento de Aire");
    setLeido(true);
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-semibold">1. Empresa</h2>
        {cliente ? (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-marca-800 bg-marca-50 px-4 py-3">
            <span className="font-semibold">{cliente.razonSocial}</span>
            {!clienteInicial && <button type="button" className="min-h-11 text-sm font-semibold text-marca-700" onClick={() => setClienteId("")}>Cambiar</button>}
          </div>
        ) : (
          <>
            <label className="relative mt-2 block">
              <span className="sr-only">Buscar empresa</span>
              <Search size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-tinta-3" />
              <input value={qCliente} onChange={(e) => setQCliente(e.target.value)} placeholder="Buscar empresa" className={cx(claseCampo, "mt-0 pl-10")} />
            </label>
            <ul className="mt-2 divide-y divide-borde overflow-hidden rounded-xl border border-borde bg-superficie">
              {sugeridos.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => setClienteId(c.id)} className="flex min-h-12 w-full items-center px-4 text-left hover:bg-fondo active:bg-marca-50">
                    <span className="flex-1">{c.razonSocial}</span>
                    <span className="text-sm text-tinta-3">{c.ciudad}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section>
        <h2 className="font-semibold">2. Foto de la placa</h2>
        <div className="mt-2 max-w-md">
          <SlotFoto titulo="Placa de datos" url={fotoPlaca} ayuda="De frente, cerca y sin reflejos" onFoto={(f) => { setFotoPlaca(f); setLeido(false); }} />
          <LectorPlaca key={fotoPlaca?.slice(-32)} foto={fotoPlaca} onAplicar={aplicar} />
          {leido && <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-ok"><Check size={16} /> Datos de la placa cargados</p>}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">3. Datos del equipo {leido && <span className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-marca-700"><Sparkles size={12} /> llenados por IA</span>}</h2>
        <Campo label="Nombre del equipo"><input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="p. ej. Compresor de tornillo 20 HP" className={claseCampo} /></Campo>
        <Campo label="Línea de producto">
          <select value={linea} onChange={(e) => setLinea(e.target.value)} className={claseCampo}>
            {LINEAS_PRODUCTO.map((l) => <option key={l}>{l}</option>)}
          </select>
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          {([["marca", "Marca"], ["modelo", "Modelo"], ["serie", "Serie"]] as const).map(([k, l]) => (
            <Campo key={k} label={l}><input value={(datos[k] as string) ?? ""} onChange={(e) => setDatos({ ...datos, [k]: e.target.value })} className={claseCampo} /></Campo>
          ))}
          <Campo label="Año"><input inputMode="numeric" value={datos.anio ?? ""} onChange={(e) => setDatos({ ...datos, anio: Number(e.target.value) || undefined })} className={claseCampo} /></Campo>
        </div>
      </section>

      <section>
        <h2 className="font-semibold">4. Foto del equipo</h2>
        <div className="mt-2 max-w-md"><SlotFoto titulo="Equipo completo" url={fotoEquipo} onFoto={setFotoEquipo} /></div>
      </section>

      <BarraGuardar
        texto="Guardar equipo"
        deshabilitado={!clienteId || !nombre.trim()}
        ayuda={!clienteId ? "Elige la empresa" : "Escribe el nombre del equipo o lee la placa"}
        onClick={() => {
          aviso(`Equipo «${nombre.trim()}» guardado`);
          onGuardado(
            agregarEquipo({
              clienteId,
              nombre: nombre.trim(),
              lineaProducto: linea,
              marca: datos.marca || "—",
              modelo: datos.modelo || "—",
              serie: datos.serie || "—",
              anio: datos.anio,
              datosPlaca: datos.datosPlaca,
              fotoUrl: fotoEquipo,
              fotoPlacaUrl: fotoPlaca,
            }),
          );
        }}
      />
    </div>
  );
}

// ---------- Mantenimiento ----------
export function FormMantenimiento({ equipoInicial, tecnicoInicial, base, onGuardado }: { equipoInicial?: string; tecnicoInicial?: string; base: "admin" | "tecnico"; onGuardado: (id: string) => void }) {
  const s = useStore();
  const aviso = useAviso();
  const [equipoId, setEquipoId] = useState(equipoInicial ?? "");
  const [qEq, setQEq] = useState("");
  const [tipo, setTipo] = useState<TipoTrabajo>("mantenimiento");
  const [titulo, setTitulo] = useState("");
  const e = equipoId ? getEquipo(equipoId) : undefined;
  const responsable = e ? getCliente(e.clienteId).responsableId : s.tecnicoActualId;
  const yo = useProgramador(base);
  const programables = tecnicosProgramables(yo);
  const [asignado, setAsignado] = useState(base === "tecnico" ? s.tecnicoActualId : tecnicoInicial ?? "");
  const [lugar, setLugar] = useState<LugarTrabajo>("en_cliente");
  const [fIni, hIni] = useInicioSugerido();
  const [fecha, setFecha] = useState(fIni);
  const [horaIni, setHoraIni] = useState(hIni);
  const [dur, setDur] = useState("2");
  const tecnicoFinal = asignado || (programables.some((t) => t.id === responsable) ? responsable : programables[0]?.id ?? responsable);
  const tituloFinal = titulo.trim() || (e ? `${TIPO_LABEL[tipo]} de ${e.nombre}` : "");
  const eqFiltrados = s.equipos.filter((x) => norm(`${x.nombre} ${x.marca} ${x.serie} ${getCliente(x.clienteId).razonSocial}`).includes(norm(qEq))).slice(0, 6);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-semibold">Equipo</h2>
        {e ? (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-marca-800 bg-marca-50 px-4 py-3">
            <span><span className="block font-semibold">{e.nombre}</span><span className="text-sm text-tinta-2">{getCliente(e.clienteId).razonSocial}</span></span>
            {!equipoInicial && <button type="button" className="min-h-11 text-sm font-semibold text-marca-700" onClick={() => setEquipoId("")}>Cambiar</button>}
          </div>
        ) : (
          <>
            <label className="relative mt-2 block">
              <span className="sr-only">Buscar equipo</span>
              <Search size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-tinta-3" />
              <input value={qEq} onChange={(ev) => setQEq(ev.target.value)} placeholder="Empresa, equipo o serie" className={cx(claseCampo, "mt-0 pl-10")} />
            </label>
            <ul className="mt-2 divide-y divide-borde overflow-hidden rounded-xl border border-borde bg-superficie">
              {eqFiltrados.map((x) => (
                <li key={x.id}>
                  <button type="button" onClick={() => setEquipoId(x.id)} className="flex min-h-12 w-full flex-col justify-center px-4 py-2 text-left hover:bg-fondo">
                    <span className="font-medium">{x.nombre}</span>
                    <span className="text-sm text-tinta-2">{getCliente(x.clienteId).razonSocial}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-medium text-tinta-2">Tipo</p>
          <div role="radiogroup" aria-label="Tipo" className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {(Object.keys(TIPO_LABEL) as TipoTrabajo[]).map((k) => {
              const V = TIPO_VISUAL[k];
              const I = V.icono;
              const activo = tipo === k;
              return (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={activo}
                  onClick={() => setTipo(k)}
                  className={cx("flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 text-sm font-semibold transition-colors", activo ? cx("border-transparent text-white", V.solido) : cx("border-borde bg-superficie", V.texto))}
                >
                  <I size={22} strokeWidth={2.2} /> {TIPO_LABEL[k]}
                </button>
              );
            })}
          </div>
        </div>
        <Campo label="Título">
          <input value={titulo} onChange={(ev) => setTitulo(ev.target.value)} placeholder={tituloFinal || "Describe el mantenimiento"} className={claseCampo} />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><SelectorTecnico base={base} valor={tecnicoFinal} onChange={setAsignado} /></div>
          <div>
            <p className="text-sm font-medium text-tinta-2">Lugar</p>
            <Chips etiqueta="Lugar" opciones={[["en_cliente", "En planta del cliente"], ["en_oficina", "En oficina / taller"]]} valor={lugar} onChange={setLugar} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-semibold">Primera tarea</h2>
        <p className="text-sm text-tinta-2">Después puedes agendar más tareas dentro de este mantenimiento.</p>
        <div className="mt-3"><Programacion fecha={fecha} setFecha={setFecha} horaIni={horaIni} setHoraIni={setHoraIni} dur={dur} setDur={setDur} /></div>
      </section>

      <BarraGuardar
        texto="Crear mantenimiento"
        deshabilitado={!e}
        ayuda="Elige el equipo"
        onClick={() => {
          const id = s.agregarTrabajo({ equipoId, titulo: tituloFinal, tipo, lugar, estado: "abierto", asignadoId: tecnicoFinal, fechaIngreso: s.ahora });
          s.agregarVisita({
            trabajoId: id,
            tecnicoId: tecnicoFinal,
            programadaPor: yo.id,
            vistaPorTecnico: yo.id === tecnicoFinal,
            descripcion: tituloFinal,
            lugar,
            programadaInicio: `${fecha}T${horaIni}:00`,
            programadaFin: finDe(fecha, horaIni, Number(dur)),
            estado: "programada",
            autoEmpresa: true,
            acompanantes: [],
            checklist: Object.fromEntries(CHECKLISTS[tipo].map((k) => [k, false])),
            fotos: [],
          });
          aviso(`Mantenimiento creado · primera tarea el ${fechaCorta(fecha)} a las ${horaIni}`);
          onGuardado(id);
        }}
      />
    </div>
  );
}

// ---------- Tarea ----------
export function FormTarea({ trabajoId, base, tecnicoInicial, onGuardado, onCancelar }: { trabajoId: string; base: "admin" | "tecnico"; tecnicoInicial?: string; onGuardado: (id: string) => void; onCancelar?: () => void }) {
  const s = useStore();
  const t = s.trabajos.find((x) => x.id === trabajoId)!;
  const aviso = useAviso();
  const [fIni, hIni] = useInicioSugerido();
  const [desc, setDesc] = useState("");
  const yo = useProgramador(base);
  const [tecnico, setTecnico] = useState(base === "tecnico" ? yo.id : tecnicoInicial ?? t.asignadoId);
  const [fecha, setFecha] = useState(fIni);
  const [horaIni, setHoraIni] = useState(hIni);
  const [dur, setDur] = useState("2");
  const rapidas: [string, string][] = [["Continuar trabajo", "Continuar trabajo"], ["Revisión final", "Revisión final"], ["Entrega y prueba", "Entrega y prueba"], ["Diagnóstico", "Diagnóstico"]];
  return (
    <div className="space-y-4">
      <Campo label="¿Qué se hará?">
        <Chips etiqueta="Tareas frecuentes" opciones={rapidas} valor={rapidas.some(([k]) => k === desc) ? desc : ""} onChange={setDesc} />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="O escribe la tarea" className={cx(claseCampo, "mt-2")} />
      </Campo>
      <SelectorTecnico base={base} valor={tecnico} onChange={setTecnico} />
      <Programacion fecha={fecha} setFecha={setFecha} horaIni={horaIni} setHoraIni={setHoraIni} dur={dur} setDur={setDur} />
      <div className="grid grid-cols-[auto_1fr] gap-2 pt-2">
        {onCancelar ? <button type="button" onClick={onCancelar} className="min-h-12 rounded-xl border border-borde bg-superficie px-4 font-semibold">Cancelar</button> : <span />}
        <button
          type="button"
          disabled={!desc.trim()}
          onClick={() => {
            aviso(tecnico === yo.id ? `Tarea agendada · ${fechaCorta(fecha)} a las ${horaIni}` : `Tarea programada para ${perfil(tecnico).nombre} · ${fechaCorta(fecha)} ${horaIni}`);
            onGuardado(
              s.agregarVisita({
                trabajoId,
                tecnicoId: tecnico,
                programadaPor: yo.id,
                vistaPorTecnico: yo.id === tecnico,
                descripcion: desc.trim(),
                lugar: t.lugar,
                programadaInicio: `${fecha}T${horaIni}:00`,
                programadaFin: finDe(fecha, horaIni, Number(dur)),
                estado: "programada",
                autoEmpresa: true,
                acompanantes: [],
                checklist: Object.fromEntries(CHECKLISTS[t.tipo].map((k) => [k, false])),
                fotos: [],
              }),
            );
          }}
          className="min-h-12 rounded-xl bg-marca-800 font-semibold text-white hover:bg-marca-900 disabled:bg-tinta-3/40"
        >
          Agendar tarea
        </button>
      </div>
    </div>
  );
}

