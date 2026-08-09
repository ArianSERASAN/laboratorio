/* Descargar y compartir archivos generados por la app (.ics y copias .json). */

export function downloadText(name, text, mime = "text/plain") {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 1500);
    return true;
  } catch {
    return false;
  }
}

export function canShareFiles() {
  try {
    return Boolean(navigator.canShare?.({ files: [new File(["x"], "x.txt", { type: "text/plain" })] }));
  } catch {
    return false;
  }
}

/** Abre la hoja de compartir del móvil (Archivos, WhatsApp, Mail…). */
export async function shareText(name, text, mime = "text/plain") {
  const file = new File([text], name, { type: mime });
  if (!navigator.canShare?.({ files: [file] })) return false;
  try {
    await navigator.share({ files: [file], title: name });
    return true;
  } catch {
    return false; // el usuario ha cancelado
  }
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("No se ha podido leer el archivo"));
    reader.readAsText(file);
  });
}
