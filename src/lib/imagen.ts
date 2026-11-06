/** Reduce una foto del celular a un JPEG liviano (suficiente para leer una placa). */
export async function comprimirImagen(file: File, maxLado = 1600, calidad = 0.82): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, error) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = error;
      i.src = url;
    });
    const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * escala);
    canvas.height = Math.round(img.height * escala);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", calidad);
  } finally {
    URL.revokeObjectURL(url);
  }
}
