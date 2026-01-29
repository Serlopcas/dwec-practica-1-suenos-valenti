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

let sesionesCache = null;

document.addEventListener("DOMContentLoaded", () => {
    showHome();
});

function showHome() {
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

        renderSesiones(app, {
            onBack: showHome,
            sesiones,
            cartCount: getCartCount(),
            getCartCount,
            onAddToCart: (id) => {
                addToCart(id);
            },
        });
    } catch (err) {
        renderSesiones(app, {
            onBack: showHome,
            sesiones: [],
            cartCount: getCartCount(),
            getCartCount,
            onAddToCart: () => { },
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
