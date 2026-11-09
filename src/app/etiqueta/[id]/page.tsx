"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { useStore } from "@/lib/store";
import { EtiquetaEquipo } from "@/components/qr";

/** Etiqueta imprimible del equipo (impresora de etiquetas o papel adhesivo A4). */
export default function EtiquetaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { equipos } = useStore();
  const router = useRouter();
  const e = equipos.find((x) => x.id === id);
  if (!e) return <p className="p-6">No se encontró el equipo.</p>;
  return (
    <main className="min-h-dvh bg-fondo px-4 py-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-xl space-y-4 print:hidden">
        <button type="button" onClick={() => router.back()} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-marca-700"><ArrowLeft size={16} /> Volver</button>
        <h1 className="text-2xl font-bold">Etiqueta QR del equipo</h1>
        <p className="text-sm text-tinta-2">Imprímela en papel adhesivo resistente (100 × 60 mm) y pégala en un lugar visible y limpio del equipo, lejos de calor directo. Al escanearla, el cliente puede pedir servicio técnico.</p>
        <button type="button" onClick={() => window.print()} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-marca-800 px-5 font-semibold text-white"><Printer size={18} /> Imprimir etiqueta</button>
      </div>
      <div className="mx-auto mt-6 flex max-w-xl justify-center overflow-x-auto print:mt-0 print:block">
        <EtiquetaEquipo equipo={e} />
      </div>
    </main>
  );
}
