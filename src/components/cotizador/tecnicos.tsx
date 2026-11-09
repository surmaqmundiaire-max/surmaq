"use client";

import { useStore } from "@/lib/store";
import { puede } from "@/lib/selectors";
import { crew, nivelCosto, tarifas } from "@/lib/cotizador/calculo";
import type { Cuadrilla, NivelSueldo } from "@/lib/cotizador/tipos";
import type { Perfil } from "@/lib/types";
import { useAviso } from "../aviso";
import type { Base } from "../migas";
import { usd, useUsuarioCot } from "./editor";
import { BarraCambios, TablaEditable, useBorrador } from "./tabla-editable";

const CIUDADES = ["Guayaquil", "Quito", "Cuenca", "Manta", "Machala", "Santo Domingo", "Ambato"];

export function TecnicosCot({ base }: { base: Base }) {
  const s = useStore();
  const aviso = useAviso();
  const yo = useUsuarioCot(base);
  const editor = puede(yo.rol, "editar_cotizador");
  const verCostos = puede(yo.rol, "ver_costos");
  const cfg = s.configCot;
  const tar = tarifas(cfg.costos);
  const nomina = s.perfiles.filter((p) => p.rol === "tecnico");
  const b = useBorrador(nomina);
  const niveles = cfg.costos.niveles.map((n) => ({ ...n, ...nivelCosto(n, cfg.costos) }));
  const cuadrillas = cfg.cuadrillas.map((c) => ({ ...c, ...crew(cfg, c.cx) }));

  const guardar = () => {
    for (const p of b.valor) {
      const antes = nomina.find((x) => x.id === p.id);
      if (!antes) s.agregarPerfil({ ...p, id: undefined } as unknown as Omit<Perfil, "id">);
      else if (JSON.stringify(antes) !== JSON.stringify(p)) s.actualizarPerfil(p.id, p);
    }
    aviso("Nómina de técnicos guardada");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Técnicos y cuadrillas</h1>
        <p className="text-sm text-tinta-2">Niveles de técnico, tarifa por hora, conformación de cuadrillas por complejidad y nómina de personal para asignar en las cotizaciones.</p>
      </div>

      <section className="rounded-2xl border border-borde bg-superficie p-4">
        <h2 className="mb-3 font-semibold">Niveles de técnico</h2>
        <TablaEditable<(typeof niveles)[number]>
          filas={niveles}
          clave={(n) => n.cod}
          cols={[
            { k: "cod", label: "Código" },
            { k: "nombre", label: "Nivel", ancho: "180px" },
            ...(verCostos ? [
              { k: "perfil" as const, label: "Funciones", ancho: "240px", fmt: (v: unknown) => <span className="text-xs text-tinta-2">{String(v)}</span> },
              { k: "sueldo" as const, label: "Sueldo", num: true, fmt: (v: unknown) => usd(Number(v)) },
              { k: "hora" as const, label: "Costo empresa / h", num: true, fmt: (v: unknown) => usd(Number(v)) },
            ] : []),
            { k: "tarifa", label: "Tarifa de venta / h", num: true, fmt: (v) => <b>{usd(Number(v))}</b> },
          ]}
        />
        {verCostos && <p className="mt-2 text-xs text-tinta-3">El costo empresa incluye aporte patronal IESS, fondos de reserva, décimo tercero, décimo cuarto y vacaciones. Los sueldos se editan en Configuración.</p>}
      </section>

      <section className="rounded-2xl border border-borde bg-superficie p-4">
        <h2 className="mb-3 font-semibold">Cuadrillas por complejidad</h2>
        <TablaEditable<Cuadrilla & ReturnType<typeof crew>>
          filas={cuadrillas}
          clave={(c) => c.cx}
          cols={[
            { k: "cx", label: "Complejidad", ancho: "150px", fmt: (v) => <span className="font-medium">{String(v)}</span> },
            { k: "criterio", label: "Criterio", ancho: "240px", fmt: (v) => <span className="text-xs text-tinta-2">{String(v)}</span> },
            ...tar.map((t) => ({ k: t.cod as keyof Cuadrilla & string, label: t.cod, num: true, fmt: (v: unknown) => (Number(v) ? String(v) : "—") })),
            { k: "pers", label: "Personas", num: true },
            { k: "rate", label: "Tarifa cuadrilla / h", num: true, fmt: (v) => usd(Number(v)) },
          ]}
        />
      </section>

      <section className="rounded-2xl border border-borde bg-superficie p-4">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Nómina de técnicos</h2>
          <span className="text-sm text-tinta-3">{b.valor.length} personas</span>
        </div>
        <p className="mb-3 text-sm text-tinta-2">Son los mismos usuarios técnicos de la app: cada uno ve en su celular los trabajos donde se le asigna. Marca las certificaciones vigentes: trabajo en altura, instalaciones eléctricas y sistemas de pintura Gema / Binks.</p>
        <TablaEditable<Perfil>
          filas={b.valor}
          clave={(p) => p.id}
          editable={editor}
          cols={[
            { k: "nombre", label: "Nombre", ancho: "180px" },
            { k: "nivel", label: "Nivel", tipo: "select", opciones: cfg.costos.niveles.map((n: NivelSueldo) => ({ v: n.cod, l: `${n.cod} · ${n.nombre}` })), ancho: "150px" },
            { k: "ciudad", label: "Ciudad base", tipo: "select", opciones: CIUDADES, ancho: "120px" },
            { k: "telefono", label: "Teléfono", ancho: "110px" },
            { k: "email", label: "Correo (usuario)", ancho: "190px" },
            { k: "certAltura", label: "Cert. altura", tipo: "bool" },
            { k: "certElectrica", label: "Cert. eléctrica", tipo: "bool" },
            { k: "certPintura", label: "Cert. pintura Gema/Binks", tipo: "bool" },
            { label: "Activo", fn: (p, i) => editor ? <input type="checkbox" aria-label="Activo" className="h-5 w-5 accent-marca-800" checked={p.activo !== false} onChange={(e) => b.set((t) => t.map((x, j) => (j === i ? { ...x, activo: e.target.checked } : x)))} /> : p.activo !== false ? "Sí" : "No" },
          ]}
          onCambio={(i, c) => b.set((t) => t.map((x, j) => (j === i ? { ...x, ...c } : x)))}
          onAgregar={() => b.set((t) => [...t, { id: `nuevo-${t.length}`, nombre: "", email: "", rol: "tecnico", ciudad: "Guayaquil", area: "Servicio técnico", nivel: "T2", activo: true }])}
          etiquetaAgregar="Agregar técnico"
        />
        {editor && <BarraCambios sucio={b.sucio} onDescartar={b.descartar} onGuardar={() => { if (b.valor.some((p) => !p.nombre.trim())) return aviso("Escribe el nombre de cada técnico"); guardar(); }} />}
      </section>
    </div>
  );
}
