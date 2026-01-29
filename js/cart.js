const CART_KEY = "sv_cart_ids";

export function getCartIds() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function setCartIds(ids) {
    localStorage.setItem(CART_KEY, JSON.stringify(ids));
}

export function addToCart(id) {
    const ids = getCartIds();
    ids.push(Number(id));
    setCartIds(ids);
}

export function removeOneFromCart(id) {
    const ids = getCartIds();
    const idx = ids.indexOf(Number(id));
    if (idx !== -1) {
        ids.splice(idx, 1);
        setCartIds(ids);
    }
}

export function clearCart() {
    setCartIds([]);
}

export function getCartCount() {
    return getCartIds().length;
}

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

export function calcCartTotal(items) {
    return items.reduce((acc, it) => acc + it.subtotal, 0);
}
