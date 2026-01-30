export async function getSesiones() {
  const res = await fetch("./data/sesiones.json");

  if (!res.ok) {
    throw new Error(`No se han podido cargar las sesiones (${res.status} ${res.statusText}). Inténtalo de nuevo más tarde.`);
  }

  const data = await res.json();
  return data;
}