/**
 * Módulo de carrito (persistencia + utilidades)
 * ---------------------------------------------
 * Gestiona el carrito mediante localStorage.
 *
 * Modelo de datos:
 * - Se guarda un array de IDs de sesión. Si un ID aparece varias veces, implica cantidad > 1.
 *   Ejemplo: [2, 2, 5] => sesión 2 x2, sesión 5 x1
 */

const CART_KEY = "sv_cart_ids";

/**
 * Lee el carrito desde localStorage y devuelve una lista de IDs.
 * Si el contenido está corrupto o no es un array, devuelve [].
 *
 * @returns {number[]} Array de IDs de sesión.
 */
export function getCartIds() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * Persiste el array de IDs en localStorage.
 *
 * @param {unknown[]} ids
 */
function setCartIds(ids) {
    localStorage.setItem(CART_KEY, JSON.stringify(ids));
}

/**
 * Añade una unidad de una sesión al carrito.
 *
 * @param {number|string} id ID de la sesión.
 */
export function addToCart(id) {
    const ids = getCartIds();
    ids.push(Number(id));
    setCartIds(ids);
}

/**
 * Elimina una unidad de una sesión del carrito (solo la primera coincidencia).
 *
 * @param {number|string} id ID de la sesión.
 */
export function removeOneFromCart(id) {
    const ids = getCartIds();
    const idx = ids.indexOf(Number(id));
    if (idx !== -1) {
        ids.splice(idx, 1);
        setCartIds(ids);
    }
}

/**
 * Vacía completamente el carrito.
 */
export function clearCart() {
    setCartIds([]);
}

/**
 * Devuelve el número total de unidades del carrito.
 *
 * @returns {number}
 */
export function getCartCount() {
    return getCartIds().length;
}

/**
 * Convierte una lista de IDs (con repetidos) en una lista de líneas de carrito.
 *
 * @param {Array<number|string>} ids IDs del carrito (con repetidos).
 * @param {Array<{id:number, nombre:string, precio:number}>} sesiones Catálogo de sesiones.
 * @returns {Array<{id:number, nombre:string, precio:number, qty:number, subtotal:number}>}
 */
export function buildCartItemsFromIds(ids, sesiones) {
    const map = new Map();

    for (const id of ids) {
        map.set(id, (map.get(id) || 0) + 1);
    }

    const items = [];
    for (const [id, qty] of map.entries()) {
        const sesion = sesiones.find((s) => s.id === id);
        if (!sesion) continue;

        const subtotal = sesion.precio * qty;
        items.push({
            id: sesion.id,
            nombre: sesion.nombre,
            precio: sesion.precio,
            qty,
            subtotal,
        });
    }

    items.sort((a, b) => a.id - b.id);
    return items;
}

/**
 * Calcula el total del carrito a partir de sus líneas.
 *
 * @param {Array<{subtotal:number}>} items Líneas del carrito.
 * @returns {number} Total en euros.
 */
export function calcCartTotal(items) {
    return items.reduce((acc, it) => acc + it.subtotal, 0);
}
