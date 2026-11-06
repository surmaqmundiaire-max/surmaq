import Link from "next/link";
import { LayoutDashboard, Smartphone, ArrowRight } from "lucide-react";

export default function Inicio() {
  return (
    <main className="min-h-dvh bg-marca-900 px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Optimum Service AI</h1>
        <p className="mt-3 max-w-xl text-marca-100/90">
          Maqueta navegable con datos de ejemplo. Elige con qué perfil quieres entrar.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/tecnico" className="group rounded-2xl bg-white p-6 text-tinta shadow-lg transition hover:-translate-y-0.5">
            <Smartphone className="text-marca-700" size={32} />
            <h2 className="mt-4 text-xl font-bold">Técnico</h2>
            <p className="mt-1 text-sm text-tinta-2">
              App de celular: visitas del día, iniciar y finalizar con GPS, checklist, fotos, pendientes y firma.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-marca-700">
              Entrar <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </span>
          </Link>
          <Link href="/admin" className="group rounded-2xl bg-white p-6 text-tinta shadow-lg transition hover:-translate-y-0.5">
            <LayoutDashboard className="text-marca-700" size={32} />
            <h2 className="mt-4 text-xl font-bold">Administración</h2>
            <p className="mt-1 text-sm text-tinta-2">
              Panel de control: alertas, técnicos en vivo, horas, trabajos, clientes, equipos y mantenimientos.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-marca-700">
              Entrar <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </span>
          </Link>
        </div>

        <p className="mt-8 text-xs text-marca-100/70">
          Los cambios que hagas como técnico se reflejan en el panel de administración (se guardan solo en este navegador).
        </p>
      </div>
    </main>
  );
}
