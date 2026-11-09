"use client";

// Sección «Cotizador»: menú propio, como en el cotizador original de Maquinmotors.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, FileStack, MapPinned, Settings2, Users, BookOpen } from "lucide-react";
import { puede } from "@/lib/selectors";
import { cx } from "../ui";
import type { Base } from "../migas";
import { useUsuarioCot } from "./editor";

export function SeccionCotizador({ base, children }: { base: Base; children: React.ReactNode }) {
  const path = usePathname();
  const yo = useUsuarioCot(base);
  const r = `/${base}/cotizaciones`;
  const tabs = [
    { href: `${r}/nueva`, label: "Cotizar", icono: Calculator, activo: path === `${r}/nueva` || /\/cotizaciones\/cot-/.test(path) },
    { href: r, label: "Cotizaciones", icono: FileStack, activo: path === r },
    { href: `${r}/catalogo`, label: "Catálogo de servicios", icono: BookOpen },
    { href: `${r}/tecnicos`, label: "Técnicos y cuadrillas", icono: Users },
    { href: `${r}/ciudades`, label: "Ciudades y distancias", icono: MapPinned },
    ...(puede(yo.rol, "editar_cotizador") ? [{ href: `${r}/configuracion`, label: "Configuración", icono: Settings2 }] : []),
  ];
  return (
    <div>
      <div className="mb-4 border-b border-borde">
        <p className="text-xs font-semibold tracking-wide text-tinta-3 uppercase">
          <span className="text-marca-900">MAQUIN</span><span className="text-critico">MOTORS</span> · Cotizador de servicio técnico
        </p>
        <nav aria-label="Secciones del cotizador" className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {tabs.map((t) => {
            const on = t.activo ?? path.startsWith(t.href);
            return (
              <Link key={t.href} href={t.href} aria-current={on ? "page" : undefined}
                className={cx("inline-flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm font-semibold whitespace-nowrap", on ? "border-marca-800 text-marca-900" : "border-transparent text-tinta-2 hover:text-tinta")}>
                <t.icono size={16} className="shrink-0" /> {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </div>
  );
}
