/**
 * Punto de entrada y coordinador de la SPA
 * ----------------------------------------
 * Responsabilidades:
 * - Orquestar la navegación entre vistas (Home, Sesiones, Carrito, Preferencias).
 * - Mantener una caché de sesiones para evitar recargas innecesarias.
 * - Aplicar preferencias (ordenación/filtro) a la vista de sesiones.
 * - Coordinar reglas de negocio simples (p. ej. presupuesto máximo antes de añadir al carrito).
 */

import {
    renderHome,
    renderSesiones,
    renderCarrito,
    renderPreferencias,
} from "./ui.js";

import { getSesiones } from "./api.js";

import {
    addToCart,
    getCartIds,
    removeOneFromCart,
    clearCart,
    buildCartItemsFromIds,
    calcCartTotal,
    getCartCount,
} from "./cart.js";

import { loadPrefs, savePrefs } from "./prefs.js";

/** Contenedor principal donde se renderiza cada vista. */
const app = document.querySelector("#app");

/** Elementos de UI globales presentes en el layout. */
const userBadge = document.querySelector("#user-badge");
const btnScrollUp = document.querySelector("#scroll-up");
const btnScrollDown = document.querySelector("#scroll-down");

/**
 * Caché en memoria para el catálogo de sesiones.
 * Se carga una vez (lazy) y se reutiliza en las vistas posteriores.
 * @type {Array<{id:number, nombre:string, descripcion?:string, precio:number}>|null}
 */
let sesionesCache = null;

/**
 * Inicialización principal:
 * - Actualiza el distintivo del usuario según preferencias.
 * - Vincula botones globales de scroll.
 * - Renderiza Home como vista inicial.
 */
document.addEventListener("DOMContentLoaded", () => {
    updateUserBadge();
    bindScrollControls();
    showHome();
});

/**
 * Actualiza el "badge" del usuario con el nombre guardado en preferencias.
 * Si no existe nombre, muestra un texto por defecto.
 */
function updateUserBadge() {
    if (!userBadge) return;

    const prefs = loadPrefs();
    const name = (prefs.name ?? "").trim();
    const label = name
        ? `🧘 Credencial cósmica: ${name}`
        : `🧘 Credencial cósmica: Pendiente de encarnar`;

    userBadge.textContent = label;
}

/**
 * Renderiza la vista Home.
 * Pasa a la UI:
 * - callbacks de navegación
 * - contador actual del carrito
 */
function showHome() {
    updateUserBadge();
    renderHome(app, {
        onSesiones: showSesiones,
        onCarrito: showCarrito,
        onPreferencias: showPreferencias,
        cartCount: getCartCount(),
    });
}

/**
 * Asegura que el catálogo de sesiones esté cargado.
 * Implementa caché en memoria: si ya existe, no vuelve a solicitarlo.
 *
 * @returns {Promise<Array<{id:number, nombre:string, descripcion?:string, precio:number}>>}
 */
async function ensureSesionesLoaded() {
    if (sesionesCache) return sesionesCache;
    sesionesCache = await getSesiones();
    return sesionesCache;
}

/**
 * Renderiza la vista de Sesiones:
 * - Muestra estado de carga
 * - Carga sesiones (con caché)
 * - Aplica preferencias (orden/filtro)
 * - Inyecta handler de "añadir al carrito" con control de presupuesto
 */
async function showSesiones() {
    app.innerHTML = `<section class="main-section"><p>Cargando sesiones…</p></section>`;

    try {
        const sesiones = await ensureSesionesLoaded();
        const prefs = loadPrefs();

        const sesionesVista = applyPrefsToSesiones(sesiones, prefs);

        renderSesiones(app, {
            onBack: showHome,
            sesiones: sesionesVista,
            cartCount: getCartCount(),
            getCartCount,
            /**
             * Intenta añadir una sesión al carrito.
             * Devuelve un objeto de resultado para que la UI pueda mostrar feedback.
             *
             * @param {number} id ID de la sesión.
             * @returns {{ok: boolean, message?: string}}
             */
            onAddToCart: (id) => {
                const sesion = sesiones.find((s) => s.id === id);
                if (!sesion) return { ok: false, message: "Sesión no encontrada." };

                // Regla de negocio: si hay presupuesto máximo válido, impedir superar el límite.
                if (Number.isInteger(prefs.maxBudget) && prefs.maxBudget > 0) {
                    const currentTotal = calcCartTotalNow(sesiones);
                    const newTotal = currentTotal + sesion.precio;

                    if (newTotal > prefs.maxBudget) {
                        return {
                            ok: false,
                            message: `No puedes añadir la sesión porque superarías tu presupuesto (${newTotal} € > ${prefs.maxBudget} €).`,
                        };
                    }
                }

                addToCart(id);
                return { ok: true };
            },
        });
    } catch (err) {
        // Fallback: renderiza la vista sin sesiones y deshabilita el añadido.
        renderSesiones(app, {
            onBack: showHome,
            sesiones: [],
            cartCount: getCartCount(),
            getCartCount,
            onAddToCart: () => ({ ok: false, message: "No se han podido cargar las sesiones. Inténtalo de nuevo más tarde." }),
        });

        // Añade un mensaje visible en la sección principal y registra el error en consola.
        const section = app.querySelector(".main-section");
        if (section) {
            section.insertAdjacentHTML(
                "beforeend",
                `<p class="feedback error"><strong>Error:</strong> ${err.message}</p>`
            );
        }
        console.error(err);
    }
}

/**
 * Vincula botones globales para subir/bajar suavemente por la página.
 * Son controles independientes de las vistas.
 */
function bindScrollControls() {
    if (btnScrollUp) {
        btnScrollUp.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    if (btnScrollDown) {
        btnScrollDown.addEventListener("click", () => {
            const max = document.documentElement.scrollHeight;
            window.scrollTo({ top: max, behavior: "smooth" });
        });
    }
}

// =====================
// Helpers de preferencias
// =====================

/**
 * Aplica a un catálogo de sesiones las preferencias del usuario:
 * - Filtro por presupuesto (opcional)
 * - Ordenación por clave y dirección
 *
 * @param {Array<{id:number, nombre:string, descripcion?:string, precio:number}>} sesiones
 * @param {{sortKey: "id"|"nombre"|"precio", sortDir: "asc"|"desc", maxBudget: number|null, filterUnderBudget: boolean, name?: string}} prefs
 * @returns {Array<{id:number, nombre:string, descripcion?:string, precio:number}>}
 */
function applyPrefsToSesiones(sesiones, prefs) {
    let out = [...sesiones];

    if (
        prefs.filterUnderBudget &&
        Number.isInteger(prefs.maxBudget) &&
        prefs.maxBudget > 0
    ) {
        out = out.filter((s) => s.precio <= prefs.maxBudget);
    }

    const dir = prefs.sortDir === "desc" ? -1 : 1;

    out.sort((a, b) => {
        let va, vb;

        switch (prefs.sortKey) {
            case "nombre":
                va = a.nombre.toLowerCase();
                vb = b.nombre.toLowerCase();
                return va.localeCompare(vb) * dir;

            case "precio":
                return (a.precio - b.precio) * dir;

            case "id":
            default:
                return (a.id - b.id) * dir;
        }
    });

    return out;
}

/**
 * Calcula el total actual del carrito a partir del catálogo de sesiones:
 * - Lee IDs persistidos
 * - Construye líneas con cantidades
 * - Reduce a total
 *
 * @param {Array<{id:number, nombre:string, descripcion?:string, precio:number}>} sesiones
 * @returns {number}
 */
function calcCartTotalNow(sesiones) {
    const ids = getCartIds();
    const items = buildCartItemsFromIds(ids, sesiones);
    return calcCartTotal(items);
}

/**
 * Renderiza la vista Carrito:
 * - Muestra estado de carga
 * - Construye líneas del carrito (cantidad/subtotal)
 * - Permite eliminar una unidad o vaciar
 */
async function showCarrito() {
    app.innerHTML = `<section class="main-section"><p>Cargando carrito…</p></section>`;

    try {
        const sesiones = await ensureSesionesLoaded();
        const ids = getCartIds();

        const items = buildCartItemsFromIds(ids, sesiones);
        const total = calcCartTotal(items);

        renderCarrito(app, {
            onBack: showHome,
            items,
            total,
            onRemoveOne: (id) => {
                removeOneFromCart(id);
                showCarrito();
            },
            onClear: () => {
                clearCart();
                showCarrito();
            },
        });
    } catch (err) {
        // Fallback: renderiza una vista vacía y bloquea acciones.
        renderCarrito(app, {
            onBack: showHome,
            items: [],
            total: 0,
            onRemoveOne: () => { },
            onClear: () => { },
        });

        const section = app.querySelector(".main-section");
        if (section) {
            section.insertAdjacentHTML(
                "beforeend",
                `<p class="feedback error"><strong>Error:</strong> ${err.message}</p>`
            );
        }

        console.error(err);
    }
}

/**
 * Renderiza la vista Preferencias:
 * - Carga preferencias actuales
 * - Permite guardar (persistir) y volver a Home
 * - Permite restaurar (re-render de la vista con defaults ya aplicados por loadPrefs si procede)
 */
function showPreferencias() {
    const prefs = loadPrefs();

    renderPreferencias(app, {
        onBack: showHome,
        prefs,
        onSubmitPrefs: (newPrefs) => {
            savePrefs(newPrefs);
            showHome();
        },
        onRestorePrefs: () => {
            showPreferencias();
        },
    });
}
