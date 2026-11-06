"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Check, Search, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { clientes, LINEAS_PRODUCTO } from "@/lib/mock-data";
import { LectorPlaca, SlotFoto, aplicarLectura, type LecturaPlaca } from "@/components/fotos-equipo";
import { norm } from "@/components/filtros";
import { cx } from "@/components/ui";
import type { Equipo } from "@/lib/types";

/** Alta de equipo: la foto de la placa va primero y la IA llena el formulario. */
export default function NuevoEquipo() {
  const { agregarEquipo } = useStore();
  const router = useRouter();
  const [clienteId, setClienteId] = useState("");
  const [qCliente, setQCliente] = useState("");
  const [fotoPlaca, setFotoPlaca] = useState<string>();
  const [fotoEquipo, setFotoEquipo] = useState<string>();
  const [datos, setDatos] = useState<Partial<Equipo>>({});
  const [nombre, setNombre] = useState("");
  const [linea, setLinea] = useState(LINEAS_PRODUCTO[0]);
  const [leido, setLeido] = useState(false);

  const cliente = clientes.find((c) => c.id === clienteId);
  const sugeridos = clientes.filter((c) => norm(c.razonSocial).includes(norm(qCliente))).slice(0, 5);
  const listo = !!clienteId && !!nombre.trim();

  const aplicar = (l: LecturaPlaca) => {
    setDatos((d) => ({ ...d, ...aplicarLectura(l) }));
    if (!nombre && l.tipoEquipo) setNombre(`${l.tipoEquipo}${l.potencia ? ` ${l.potencia.split("/").pop()!.trim()}` : ""}`);
    const t = norm(`${l.tipoEquipo ?? ""}`);
    if (t.includes("tornillo")) setLinea("Compresores de Tornillo");
    else if (t.includes("piston")) setLinea("Compresores de Pistón");
    else if (t.includes("secador") || t.includes("filtro")) setLinea("Tratamiento de Aire");
    setLeido(true);
  };

  const guardar = () => {
    const id = agregarEquipo({
      clienteId,
      nombre: nombre.trim(),
      lineaProducto: linea,
      marca: datos.marca ?? "—",
      modelo: datos.modelo ?? "—",
      serie: datos.serie ?? "—",
      anio: datos.anio,
      datosPlaca: datos.datosPlaca,
      fotoUrl: fotoEquipo,
      fotoPlacaUrl: fotoPlaca,
    });
    router.push(`/tecnico/equipos/${id}`);
  };

  const campo = "mt-1 min-h-12 w-full rounded-xl border border-borde bg-superficie px-3 text-[16px] outline-none focus:border-marca-600 focus:ring-2 focus:ring-marca-600/20";

  return (
    <div className="flex min-h-[calc(100dvh-28px)] flex-col">
      <header className="bg-marca-900 px-2 pt-2 pb-4 text-white">
        <Link href="/tecnico/equipos" aria-label="Volver a Equipos" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="px-2 text-2xl font-bold">Agregar equipo</h1>
        <p className="px-2 text-sm text-marca-100">Toma la foto de la placa y la IA llena los datos.</p>
      </header>

      <div className="flex-1 space-y-6 px-4 py-5">
        <section>
          <h2 className="font-semibold">1. Cliente</h2>
          {cliente ? (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-marca-800 bg-marca-50 px-4 py-3">
              <span className="font-semibold">{cliente.razonSocial}</span>
              <button type="button" className="min-h-11 text-sm font-semibold text-marca-700" onClick={() => setClienteId("")}>Cambiar</button>
            </div>
          ) : (
            <>
              <label className="relative mt-2 block">
                <span className="sr-only">Buscar cliente</span>
                <Search size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-tinta-3" />
                <input value={qCliente} onChange={(e) => setQCliente(e.target.value)} placeholder="Buscar cliente" className={cx(campo, "mt-0 pl-10")} />
              </label>
              <ul className="mt-2 divide-y divide-borde overflow-hidden rounded-xl border border-borde bg-superficie">
                {sugeridos.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => setClienteId(c.id)} className="flex min-h-12 w-full items-center px-4 text-left active:bg-marca-50">
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
          <div className="mt-2">
            <SlotFoto titulo="Placa de datos" url={fotoPlaca} ayuda="De frente, cerca y sin reflejos" onFoto={(f) => { setFotoPlaca(f); setLeido(false); }} />
            <LectorPlaca key={fotoPlaca?.slice(-32)} foto={fotoPlaca} onAplicar={aplicar} />
            {leido && <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-ok"><Check size={16} /> Datos de la placa cargados</p>}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">3. Datos del equipo {leido && <span className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-marca-700"><Sparkles size={12} /> llenados por IA</span>}</h2>
          <label className="block text-sm">
            <span className="text-tinta-2">Nombre del equipo</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="p. ej. Compresor de tornillo 20 HP" className={campo} />
          </label>
          <label className="block text-sm">
            <span className="text-tinta-2">Línea de producto</span>
            <select value={linea} onChange={(e) => setLinea(e.target.value)} className={campo}>
              {LINEAS_PRODUCTO.map((l) => <option key={l}>{l}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(["marca", "modelo", "serie"] as const).map((k) => (
              <label key={k} className="block text-sm capitalize">
                <span className="text-tinta-2">{k}</span>
                <input value={datos[k] ?? ""} onChange={(e) => setDatos({ ...datos, [k]: e.target.value })} className={campo} />
              </label>
            ))}
            <label className="block text-sm">
              <span className="text-tinta-2">Año</span>
              <input inputMode="numeric" value={datos.anio ?? ""} onChange={(e) => setDatos({ ...datos, anio: Number(e.target.value) || undefined })} className={campo} />
            </label>
          </div>
        </section>

        <section>
          <h2 className="font-semibold">4. Foto del equipo</h2>
          <div className="mt-2">
            <SlotFoto titulo="Equipo completo" url={fotoEquipo} onFoto={setFotoEquipo} />
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 border-t border-borde bg-superficie/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur">
        <button
          type="button"
          onClick={guardar}
          disabled={!listo}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-marca-800 text-[17px] font-semibold text-white hover:bg-marca-900 disabled:bg-tinta-3/40"
        >
          <Check size={20} /> Guardar equipo
        </button>
        {!listo && <p className="mt-2 text-center text-xs text-tinta-3">{!clienteId ? "Elige el cliente" : "Escribe el nombre del equipo o lee la placa"}</p>}
      </div>
    </div>
  );
}
