/**
 * Sueños Valenti – Práctica evaluable (DWEC)
 * Autor: Sergio López Casado · Prometeo FP · DAW 2024–2026
 * GitHub: https://github.com/Serlopcas · LinkedIn: https://www.linkedin.com/in/sergiolopezcasado/
 */
/**
 * Módulo de interfaz (UI)
 * ----------------------
 * Responsabilidades:
 * - Renderizar las distintas vistas (Home, Sesiones, Carrito, Preferencias) en un contenedor.
 * - Montar listeners de eventos de cada vista y delegarlos a callbacks externos (main).
 * - Mostrar feedback visual (toast, estados, errores de formulario).
 *
 * Convención:
 * - Cada `renderX` reemplaza el HTML del contenedor y monta listeners sobre el DOM recién creado.
 * - La navegación se delega mediante callbacks (onBack, onSesiones, etc.).
 */

import { validatePrefs } from "./prefs.js";

/**
 * Sustituye el contenido del contenedor por el HTML indicado.
 *
 * @param {HTMLElement} container
 * @param {string} html
 */
export function setView(container, html) {
    container.innerHTML = html;
}

/**
 * Crea un botón estándar y, si se proporciona, registra el handler de click.
 *
 * @param {string} text Texto visible del botón.
 * @param {Function} [onClick] Callback opcional para el evento click.
 * @returns {HTMLButtonElement}
 */
export function createButton(text, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = text;
    if (typeof onClick === "function") {
        btn.addEventListener("click", onClick);
    }
    return btn;
}

/**
 * Inserta un botón "Volver" en el contenedor indicado.
 *
 * @param {HTMLElement} container
 * @param {Function} onBack Callback de navegación hacia atrás.
 */
export function createBackButton(container, onBack) {
    const btn = createButton("Volver", onBack);
    container.appendChild(btn);
}

/**
 * Monta un footer fijo (sticky) con acciones mínimas de navegación.
 * Se utiliza como patrón consistente entre vistas.
 *
 * @param {HTMLElement} container
 * @param {Function} onBack Callback de navegación.
 */
function mountStickyFooter(container, onBack) {
    const footer = document.createElement("footer");
    footer.className = "sticky-footer";

    const inner = document.createElement("div");
    inner.className = "sticky-footer__inner";

    inner.appendChild(createButton("Volver", onBack));
    footer.appendChild(inner);

    container.appendChild(footer);
}

/**
 * Renderiza la vista de inicio.
 *
 * @param {HTMLElement} container
 * @param {{
 *   onSesiones: Function,
 *   onCarrito: Function,
 *   onPreferencias: Function,
 *   cartCount?: number
 * }} params
 */
export function renderHome(
    container,
    { onSesiones, onCarrito, onPreferencias, cartCount = 0 }
) {
    container.classList.remove("has-sticky-footer");

    // Badge condicional con el número de elementos del carrito.
    const badgeHtml =
        cartCount > 0
            ? `<span class="badge">${cartCount}</span>`
            : "";

    setView(
        container,
        `
        <section class="main-section">
            <p>
                Bienvenido/a a <strong>Sueños Valenti</strong>, el único portal donde tu <em>yo cuántico</em> hace check-in
                antes que tú. Aquí no vendemos humo: lo <strong>materializamos</strong>, lo bendecimos con
                <em>frecuencias</em> y lo guardamos en tu carrito espiritual.
            </p>
            <p>
                Elige una sesión, eleva tu vibración (o al menos tu presupuesto), y recuerda:
                si no te funciona… es que no estabas alineado con Mercurio retrógrado.
            </p>
            <div id="home-btns">
                <button id="btn-sesiones" type="button">Ver sesiones</button>

                <button id="btn-carrito" type="button">
                    Carrito ${badgeHtml}
                </button>

                <button id="btn-preferencias" type="button">Mis preferencias</button>
            </div>
        </section>
        `
    );

    // Vínculos a navegación.
    container.querySelector("#btn-sesiones")?.addEventListener("click", onSesiones);
    container.querySelector("#btn-carrito")?.addEventListener("click", onCarrito);
    container
        .querySelector("#btn-preferencias")
        ?.addEventListener("click", onPreferencias);
}

/**
 * Renderiza la vista de sesiones y gestiona:
 * - búsqueda por texto en cliente
 * - toast de feedback
 * - delegación de clicks (añadir al carrito / expandir tarjeta)
 *
 * @param {HTMLElement} container
 * @param {{
 *   onBack: Function,
 *   sesiones?: Array<{id:number, nombre:string, descripcion?:string, precio:number}>,
 *   onAddToCart: Function,
 *   cartCount?: number,
 *   getCartCount?: Function
 * }} params
 */
export function renderSesiones(
    container,
    { onBack, sesiones = [], onAddToCart, cartCount = 0, getCartCount }
) {
    container.classList.add("has-sticky-footer");

    setView(
        container,
        `
        <section class="main-section">
            <h2>Sesiones disponibles</h2>

            <p>
                <strong>Carrito:</strong>
                <span id="sesiones-cart-count">${cartCount}</span>
            </p>

            <label for="sesiones-search"><strong>Buscar por título o descripción de la sesión</strong></label><br />
            <input id="sesiones-search" type="text" placeholder="Introduce texto para buscar"/>

            <div id="sesiones-toast" class="toast"></div>

            <div id="sesiones-list" class="sesiones-list"></div>
        </section>
        `
    );

    const searchInput = container.querySelector("#sesiones-search");
    const list = container.querySelector("#sesiones-list");
    const feedback = container.querySelector("#sesiones-feedback");
    const countEl = container.querySelector("#sesiones-cart-count");
    const toast = container.querySelector("#sesiones-toast");
    let toastTimer = null;

    /**
     * Muestra un toast temporal con estilo por tipo.
     *
     * @param {string} text
     * @param {"ok"|"error"} [type="ok"]
     * @param {number} [ms=2200]
     */
    function showToast(text, type = "ok", ms = 2200) {
        if (!toast) return;

        toast.dataset.type = type;

        toast.textContent = text;
        toast.classList.add("is-visible");

        if (toastTimer) clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            toast.classList.remove("is-visible");
            toast.textContent = "";
            toastTimer = null;
        }, ms);
    }

    /**
     * Renderiza la lista de tarjetas de sesión.
     *
     * @param {Array<{id:number, nombre:string, descripcion?:string, precio:number}>} data
     */
    function renderList(data) {
        if (!list) return;

        if (data.length === 0) {
            list.innerHTML = `<p>No hay sesiones que coincidan con tu búsqueda.</p>`;
            return;
        }

        list.innerHTML = data
            .map(
                (s) =>
                    `
                    <article class="sesion-card" data-id="${s.id}">
                    <h3>${s.nombre}</h3>
                    <span class="sesion-more">Ver más…</span>
                    <p class="sesion-desc" hidden>
                        ${s.descripcion ? s.descripcion : ""}
                    </p>
                    <p><strong>Precio:</strong> ${s.precio} €</p>
                    <button type="button" data-id="${s.id}" class="btn-add">
                        Añadir al carrito
                    </button>
                    </article>
                    `
            )
            .join("");
    }

    renderList(sesiones);

    // Filtro local por nombre o descripción.
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const q = searchInput.value.trim().toLowerCase();

            const filtered =
                q === ""
                    ? sesiones
                    : sesiones.filter((s) => {
                        const nombre = (s.nombre ?? "").toLowerCase();
                        const desc = (s.descripcion ?? "").toLowerCase();
                        return nombre.includes(q) || desc.includes(q);
                    });

            renderList(filtered);
        });
    }

    // Delegación de eventos:
    // - botón "Añadir al carrito"
    // - click sobre tarjeta para desplegar/plegar descripción
    list.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-add");
        if (btn) {
            const id = Number(btn.dataset.id);

            let result = { ok: true };
            if (typeof onAddToCart === "function") {
                result = onAddToCart(id) ?? { ok: true };
            }

            if (result.ok) {
                showToast(`Sesión añadida al carrito correctamente.`, "ok");

                // Actualización del contador de carrito.
                if (countEl) {
                    if (typeof getCartCount === "function") {
                        countEl.textContent = String(getCartCount());
                    } else {
                        const current = Number(countEl.textContent) || 0;
                        countEl.textContent = String(current + 1);
                    }
                }
            } else {
                showToast(
                    result.message || `No se ha podido añadir la sesión al carrito.`,
                    "error"
                );
            }

            return;
        }

        const card = e.target.closest(".sesion-card");
        if (!card) return;

        card.classList.toggle("highlighted");

        const desc = card.querySelector(".sesion-desc");
        if (desc) {
            desc.hidden = !card.classList.contains("highlighted");
        }
        const more = card.querySelector(".sesion-more");
        if (more) {
            more.textContent = card.classList.contains("highlighted")
                ? "Ver menos…"
                : "Ver más…";
        }
    });

    mountStickyFooter(container, onBack);
}

/**
 * Renderiza la vista del carrito:
 * - resumen (unidades y total)
 * - listado de items
 * - eliminación de una unidad por item
 * - acción de vaciar carrito
 *
 * @param {HTMLElement} container
 * @param {{
 *   onBack: Function,
 *   items?: Array<{id:number, nombre:string, precio:number, qty:number, subtotal:number}>,
 *   total?: number,
 *   onRemoveOne: Function,
 *   onClear: Function
 * }} params
 */
export function renderCarrito(container, { onBack, items = [], total = 0, onRemoveOne, onClear }) {
    container.classList.add("has-sticky-footer");

    setView(
        container,
        `
        <section class="main-section">
        <h2>Mi carrito</h2>

        <div id="carrito-info"></div>
        <div id="carrito-list"></div>

        <div id="carrito-actions"></div>
        </section>
        `
    );

    const info = container.querySelector("#carrito-info");
    const list = container.querySelector("#carrito-list");
    const actions = container.querySelector("#carrito-actions");

    const count = items.reduce((acc, it) => acc + it.qty, 0);
    info.innerHTML = `<p><strong>Elementos:</strong> ${count} · <strong>Total:</strong> ${total} €</p>`;

    if (items.length === 0) {
        list.innerHTML = `<p>Tu carrito está vacío.</p>`;
    } else {
        list.innerHTML = items
            .map(
                (it) => `
                        <article class="sesion-card">
                        <h3>${it.nombre}</h3>
                        <p>
                            <strong>Precio:</strong> ${it.precio} € ·
                            <strong>Cantidad:</strong> ${it.qty} ·
                            <strong>Subtotal:</strong> ${it.subtotal} €
                        </p>
                        <button type="button" class="btn-remove" data-id="${it.id}">
                            Eliminar 1
                        </button>
                        </article>
                        `
            )
            .join("");

        // Delegación: eliminar una unidad del item seleccionado.
        list.addEventListener("click", (e) => {
            const btn = e.target.closest(".btn-remove");
            if (!btn) return;
            const id = Number(btn.dataset.id);
            if (typeof onRemoveOne === "function") onRemoveOne(id);
        });
    }

    // Acción de vaciado solo si hay contenido.
    if (items.length > 0) {
        const clearBtn = createButton("Vaciar carrito", onClear);
        actions.appendChild(clearBtn);
    }

    mountStickyFooter(container, onBack);
}

/**
 * Renderiza el formulario de preferencias y gestiona:
 * - precarga de valores
 * - validación en vivo
 * - control de estados (deshabilitar checkbox/guardar)
 * - envío (payload normalizado) y acciones auxiliares
 *
 * @param {HTMLElement} container
 * @param {{
 *   onBack: Function,
 *   prefs: {
 *     name?: string,
 *     maxBudget?: number|null,
 *     sortKey?: "id"|"nombre"|"precio",
 *     sortDir?: "asc"|"desc",
 *     filterUnderBudget?: boolean
 *   },
 *   onSubmitPrefs: Function,
 *   onRestorePrefs: Function
 * }} params
 */
export function renderPreferencias(
    container,
    { onBack, prefs, onSubmitPrefs, onRestorePrefs }
) {
    container.classList.add("has-sticky-footer");

    setView(
        container,
        `
        <section class="main-section">
            <h2>Mis preferencias</h2>

            <form id="prefs-form" novalidate>
                <div>
                    <label for="pref-name"><strong>Nombre espiritual</strong></label><br />
                    <input id="pref-name" name="name" type="text" placeholder="Introduce tu nombre espiritual (3-16 caracteres)"/>
                    <div id="err-name" class="field-error"></div>
                </div>

                <div>
                    <label for="pref-budget"><strong>Presupuesto máximo (€)</strong></label><br />
                    <input id="pref-budget" name="maxBudget" type="number" inputmode="numeric" step="10" placeholder="Ejemplo: 100"/>
                    </br>
                    <small class="input-help">Solo se podrán añadir sesiones si no superas este importe.</small>
                    <div id="err-budget" class="field-error"></div>
                </div>

                <div>
                    <label><strong>Ordenar por</strong></label><br />

                    <select id="pref-sortkey" name="sortKey">
                        <option value="id">Id</option>
                        <option value="nombre">Título (alfabético)</option>
                        <option value="precio">Precio</option>
                    </select>

                    <select id="pref-sortdir" name="sortDir">
                        <option value="asc">Ascendente</option>
                        <option value="desc">Descendente</option>
                    </select>
                </div>

                <div>
                    <label>
                        <input id="pref-filter" name="filterUnderBudget" type="checkbox" />
                        Mostrar solo sesiones ≤ presupuesto máximo
                    </label>

                    <div id="err-filter" class="field-error"></div>
                </div>

                <button id="prefs-save" type="submit">Guardar preferencias</button>
                
                <button id="prefs-clear" type="button">Limpiar</button>
                
                <button id="prefs-restore" type="button">Restablecer</button>
                
                <span id="prefs-status" class="status-text"></span>
            </form>
        </section>
        `
    );

    const form = container.querySelector("#prefs-form");
    const nameInput = container.querySelector("#pref-name");
    const budgetInput = container.querySelector("#pref-budget");
    const sortKeySelect = container.querySelector("#pref-sortkey");
    const sortDirSelect = container.querySelector("#pref-sortdir");
    const filterCheckbox = container.querySelector("#pref-filter");
    const saveBtn = container.querySelector("#prefs-save");
    const clearBtn = container.querySelector("#prefs-clear");
    const restoreBtn = container.querySelector("#prefs-restore");
    const status = container.querySelector("#prefs-status");

    const errName = container.querySelector("#err-name");
    const errBudget = container.querySelector("#err-budget");
    const errFilter = container.querySelector("#err-filter");

    // Precarga de valores.
    nameInput.value = prefs.name ?? "";
    sortKeySelect.value = prefs.sortKey ?? "id";
    sortDirSelect.value = prefs.sortDir ?? "asc";
    budgetInput.value = prefs.maxBudget ?? "";
    filterCheckbox.checked = Boolean(prefs.filterUnderBudget);

    /**
     * Convierte el valor del input de presupuesto a:
     * - null si está vacío
     * - NaN si no es numérico
     * - number finito en caso válido
     *
     * @param {any} value
     * @returns {number|null}
     */
    function parseBudget(value) {
        const trimmed = String(value ?? "").trim();
        if (trimmed === "") return null;
        const n = Number(trimmed);
        if (!Number.isFinite(n)) return NaN;
        return n;
    }

    /**
     * Valida el formulario y sincroniza:
     * - errores por campo
     * - habilitación de checkbox (depende de presupuesto válido)
     * - habilitación del botón de guardar
     *
     * @returns {{name: string, maxBudget: number|null}}
     */
    function validateLive() {
        errName.textContent = "";
        errBudget.textContent = "";
        errFilter.textContent = "";
        status.textContent = "";

        const name = nameInput.value.trim();
        const budgetRaw = parseBudget(budgetInput.value);
        const filterUnderBudget = filterCheckbox.checked;

        const errors = validatePrefs({
            name,
            maxBudget: budgetRaw,
            filterUnderBudget
        });

        if (errors.name) errName.textContent = errors.name;
        if (errors.maxBudget) errBudget.textContent = errors.maxBudget;
        if (errors.filterUnderBudget) errFilter.textContent = errors.filterUnderBudget;

        // El filtro depende de un presupuesto entero positivo.
        const budgetOk = budgetRaw !== null && Number.isInteger(budgetRaw) && budgetRaw > 0;
        filterCheckbox.disabled = !budgetOk;
        if (!budgetOk) {
            filterCheckbox.checked = false;
        }

        const hasErrors = Boolean(errName.textContent || errBudget.textContent || errFilter.textContent);
        saveBtn.disabled = hasErrors;

        return { name, maxBudget: budgetOk ? budgetRaw : null };
    }

    validateLive();

    // Validación reactiva.
    nameInput.addEventListener("input", validateLive);
    budgetInput.addEventListener("input", validateLive);
    sortKeySelect.addEventListener("change", () => {
        status.textContent = "";
    });
    sortDirSelect.addEventListener("change", () => {
        status.textContent = "";
    });
    filterCheckbox.addEventListener("change", validateLive);

    // Limpia el formulario sin persistir, manteniendo feedback y revalidación.
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            form.reset();
            errName.textContent = "";
            errBudget.textContent = "";
            errFilter.textContent = "";
            status.textContent = "Formulario limpiado";
            validateLive();
        });
    }

    // Restaura preferencias mediante callback externo (coordinador).
    if (restoreBtn) {
        restoreBtn.addEventListener("click", () => {
            if (typeof onRestorePrefs === "function") {
                onRestorePrefs();
            } else {
                status.textContent = "No se pudo restaurar (callback no disponible)";
            }
        });
    }

    // Envío del formulario: construye payload normalizado y delega guardado.
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const { name, maxBudget } = validateLive();
        const payload = {
            name,
            maxBudget,
            sortKey: sortKeySelect.value,
            sortDir: sortDirSelect.value,
            filterUnderBudget: filterCheckbox.checked,
        };

        if (typeof onSubmitPrefs === "function") {
            onSubmitPrefs(payload);
        }
    });

    mountStickyFooter(container, onBack);
}