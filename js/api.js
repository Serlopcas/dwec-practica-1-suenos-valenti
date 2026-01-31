/**
 * Módulo API (capa de acceso a datos)
 * ----------------------------------
 * Responsabilidad: obtener las sesiones desde un recurso JSON local (sin backend).
 */

const SESIONES_URL = "./data/sesiones.json";

/**
 * Carga el listado de sesiones desde el JSON local.
 *
 * @returns {Promise<Array<{id:number, nombre:string, descripcion?:string, precio:number}>>}
 *   Array con las sesiones disponibles.
 *
 * @throws {Error}
 *   Si la respuesta HTTP no es correcta (404, 500, etc.) o si el JSON es inválido.
 *
 * Decisión de diseño:
 * - Este módulo NO captura el error para “decorarlo” visualmente.
 *   Lanza el error y deja que el módulo coordinador (main) decida cómo mostrarlo
 *   (vista con mensaje, fallback, etc.).
 */
export async function getSesiones() {
  const res = await fetch(SESIONES_URL);

  // Si responde pero con código de error, informamos con detalle.
  if (!res.ok) {
    throw new Error(`No se han podido cargar las sesiones (${res.status} ${res.statusText}). Inténtalo de nuevo más tarde.`);
  }

  const data = await res.json();
  return data;
}
