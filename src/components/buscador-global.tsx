"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { cliente as getCliente, equipo as getEquipo } from "@/lib/selectors";
import { norm } from "./filtros";
import { Ficha, IconoTipo, MiniaturaEquipo } from "./visual";
import { Building2 } from "lucide-react";

/** Buscador del panel: empresas, equipos (nombre, serie, QR) y mantenimientos (Nº o título). Atajo: tecla «/». */
export function BuscadorGlobal() {
  const { clientes, equipos, trabajos } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const n = norm(q.trim());
  const res =
    n.length < 2
      ? []
      : [
          ...trabajos
            .filter((t) => norm(`${t.numero} ${t.titulo}`).includes(n))
            .slice(0, 4)
            .map((t) => ({ href: `/admin/mantenimientos/${t.id}`, titulo: `Mant. Nº ${t.numero} · ${t.titulo}`, sub: getCliente(getEquipo(t.equipoId).clienteId).razonSocial, icono: <IconoTipo tipo={t.tipo} size={32} /> })),
          ...clientes
            .filter((c) => norm(`${c.razonSocial} ${c.ruc}`).includes(n))
            .slice(0, 4)
            .map((c) => ({ href: `/admin/clientes/${c.id}`, titulo: c.razonSocial, sub: `Empresa · ${c.ciudad}`, icono: <Ficha icono={Building2} size={32} /> })),
          ...equipos
            .filter((e) => norm(`${e.nombre} ${e.marca} ${e.modelo} ${e.serie} ${e.codigoQr}`).includes(n))
            .slice(0, 4)
            .map((e) => ({ href: `/admin/equipos/${e.id}`, titulo: e.nombre, sub: `${getCliente(e.clienteId).razonSocial} · serie ${e.serie}`, icono: <MiniaturaEquipo linea={e.lineaProducto} foto={e.fotoUrl} size={32} /> })),
        ];

  return (
    <div className="relative mb-3 w-full max-w-xl sm:mb-6 sm:flex-1">
      <label className="relative block">
        <span className="sr-only">Buscar en todo</span>
        <Search size={17} className="absolute top-1/2 left-3 -translate-y-1/2 text-tinta-3" />
        <input
          ref={ref}
          value={q}
          onChange={(e) => { setQ(e.target.value); setAbierto(true); }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && res[0]) { router.push(res[0].href); setQ(""); setAbierto(false); }
            if (e.key === "Escape") { setQ(""); ref.current?.blur(); }
          }}
          placeholder="Buscar empresa, equipo, serie o Nº de mantenimiento"
          className="h-11 w-full rounded-xl border border-borde bg-superficie pr-10 pl-9 text-sm outline-none focus:border-marca-600 focus:ring-2 focus:ring-marca-600/20"
        />
        <kbd className="absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-borde px-1.5 text-xs text-tinta-3 sm:block">/</kbd>
      </label>
      {abierto && n.length >= 2 && (
        <div className="absolute inset-x-0 top-12 z-40 overflow-hidden rounded-xl border border-borde bg-superficie shadow-[0_12px_32px_rgba(6,26,48,0.14)]">
          {res.length === 0 ? (
            <p className="px-4 py-3 text-sm text-tinta-3">Sin resultados para «{q}».</p>
          ) : (
            <ul className="max-h-96 divide-y divide-borde overflow-y-auto">
              {res.map((x) => (
                <li key={x.href}>
                  <Link href={x.href} onClick={() => { setQ(""); setAbierto(false); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-fondo">
                    {x.icono}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{x.titulo}</span>
                      <span className="block truncate text-xs text-tinta-2">{x.sub}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
