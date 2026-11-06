"use client";

import { useRouter } from "next/navigation";
import { EncabezadoTecnico } from "@/components/encabezado-tecnico";
import { FormCliente } from "@/components/formularios";

export default function NuevaEmpresaTecnico() {
  const router = useRouter();
  return (
    <div>
      <EncabezadoTecnico volver="/tecnico/clientes" titulo="Nueva empresa" sub="Después podrás agregarle sus equipos." />
      <div className="px-4 pt-5">
        <FormCliente onGuardado={(id) => router.push(`/tecnico/clientes/${id}`)} />
      </div>
    </div>
  );
}
