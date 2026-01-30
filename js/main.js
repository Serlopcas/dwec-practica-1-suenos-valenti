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

const app = document.querySelector("#app");

const userBadge = document.querySelector("#user-badge");

let sesionesCache = null;

document.addEventListener("DOMContentLoaded", () => {
    showHome();
});

function updateUserBadge() {
    if (!userBadge) return;

    const prefs = loadPrefs();
    const name = (prefs.name ?? "").trim();

    if (name.length >= 3) {
        userBadge.textContent = name;
    } else {
        userBadge.textContent = "";
    }
}

function showHome() {
    updateUserBadge();
    renderHome(app, {
        onSesiones: showSesiones,
        onCarrito: showCarrito,
        onPreferencias: showPreferencias,
        cartCount: getCartCount(),
    });
}

async function ensureSesionesLoaded() {
    if (sesionesCache) return sesionesCache;
    sesionesCache = await getSesiones();
    return sesionesCache;
}

async function showSesiones() {
    app.innerHTML = `<section class="main-section"><p>Cargando sesiones...</p></section>`;

    try {
        const sesiones = await ensureSesionesLoaded();
        const prefs = loadPrefs();

        const sesionesVista = applyPrefsToSesiones(sesiones, prefs);

        renderSesiones(app, {
            onBack: showHome,
            sesiones: sesionesVista,
            cartCount: getCartCount(),
            getCartCount,
            onAddToCart: (id) => {
                const sesion = sesiones.find((s) => s.id === id);
                if (!sesion) return { ok: false, message: "Sesión no encontrada." };

                if (Number.isInteger(prefs.maxBudget) && prefs.maxBudget > 0) {
                    const currentTotal = calcCartTotalNow(sesiones);
                    const newTotal = currentTotal + sesion.precio;

                    if (newTotal > prefs.maxBudget) {
                        return {
                            ok: false,
                            message: `No puedes añadirla: te pasarías del presupuesto (${newTotal}€ > ${prefs.maxBudget}€).`,
                        };
                    }
                }

                addToCart(id);
                return { ok: true };
            },
        });
    } catch (err) {
        renderSesiones(app, {
            onBack: showHome,
            sesiones: [],
            cartCount: getCartCount(),
            getCartCount,
            onAddToCart: () => ({ ok: false, message: "Error cargando sesiones." }),
        });

        const section = app.querySelector(".main-section");
        if (section) {
            section.insertAdjacentHTML(
                "beforeend",
                `<p><strong>Error:</strong> ${err.message}</p>`
            );
        }
        console.error(err);
    }
}

// =====================
// Helpers de preferencias
// =====================

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

function calcCartTotalNow(sesiones) {
    const ids = getCartIds();
    const items = buildCartItemsFromIds(ids, sesiones);
    return calcCartTotal(items);
}

async function showCarrito() {
    app.innerHTML = `<section class="main-section"><p>Cargando carrito...</p></section>`;

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
                `<p><strong>Error:</strong> ${err.message}</p>`
            );
        }

        console.error(err);
    }
}

function showPreferencias() {
    const prefs = loadPrefs();

    renderPreferencias(app, {
        onBack: showHome,
        prefs,
        onSubmitPrefs: (newPrefs) => {
            savePrefs(newPrefs);
            showHome();
        },
    });
}
