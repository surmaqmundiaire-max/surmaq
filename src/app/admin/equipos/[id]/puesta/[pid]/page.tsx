"use client";

import { use } from "react";
import { FormPuesta } from "@/components/puesta-en-marcha";
import { Migas } from "@/components/migas";

export default function PuestaAdmin({ params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id, pid } = use(params);
  return (
    <div className="mx-auto max-w-4xl space-y-3">
      <div className="print:hidden"><Migas base="admin" equipoId={id} /></div>
      <FormPuesta id={pid} base="admin" />
    </div>
  );
}
