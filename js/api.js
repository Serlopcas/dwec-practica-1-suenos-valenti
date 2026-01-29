export async function getSesiones() {
  const res = await fetch("./data/sesiones.json");

  if (!res.ok) {
    throw new Error(`Error al cargar sesiones: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data;
}