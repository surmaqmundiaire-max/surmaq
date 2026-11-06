"use client";

import Link from "next/link";
import { ChevronRight, UserPlus } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Rol } from "@/lib/types";
import { Avatar, Badge, cx } from "@/components/ui";
import { ChipRol, ROL_VISUAL } from "@/components/visual";

const ORDEN: Rol[] = ["admin", "jefe", "coordinador", "vendedor", "tecnico"];
const PLURAL: Record<Rol, string> = { admin: "Administradores", jefe: "Jefes de mantenimiento", coordinador: "Coordinadores de mantenimiento", tecnico: "Técnicos", vendedor: "Vendedores" };

export default function Usuarios() {
  const { perfiles, visitas, ahora } = useStore();
  const hoy = ahora.slice(0, 10);
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-tinta-2">Cada persona entra con su perfil y ve lo que le corresponde.</p>
        </div>
        <Link href="/admin/usuarios/nuevo" className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-marca-800 px-4 text-sm font-semibold text-white hover:bg-marca-900"><UserPlus size={17} /> Nuevo usuario</Link>
      </div>
      {ORDEN.map((rol) => {
        const lista = perfiles.filter((p) => p.rol === rol);
        if (!lista.length) return null;
        const I = ROL_VISUAL[rol].icono;
        return (
          <section key={rol}>
            <h2 className="mb-2 flex items-center gap-2 font-semibold">
              <span className={cx("inline-flex h-7 w-7 items-center justify-center rounded-lg", ROL_VISUAL[rol].chip)}><I size={15} /></span>
              {PLURAL[rol]}
              <span className="font-normal text-tinta-3 tabular">({lista.length})</span>
            </h2>
            <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
              {lista.map((p) => {
                const proximas = visitas.filter((v) => v.tecnicoId === p.id && v.estado === "programada" && v.programadaInicio.slice(0, 10) >= hoy).length;
                return (
                  <li key={p.id}>
                    <Link href={`/admin/usuarios/${p.id}`} className={cx("flex items-center gap-3 px-4 py-3 hover:bg-fondo", p.activo === false && "opacity-60")}>
                      <Avatar nombre={p.nombre} size={40} />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2 font-semibold">{p.nombre} <ChipRol rol={p.rol} />{p.activo === false && <Badge>Inactivo</Badge>}</span>
                        <span className="block truncate text-sm text-tinta-2">
                          {p.email} · {p.ciudadesACargo?.length ? `coordina ${p.ciudadesACargo.join(" y ")}` : p.ciudad}
                          {rol === "tecnico" && ` · ${proximas} ${proximas === 1 ? "tarea próxima" : "tareas próximas"}`}
                        </span>
                      </span>
                      <ChevronRight size={18} className="text-tinta-3" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
