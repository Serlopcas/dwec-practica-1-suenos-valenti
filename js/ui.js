export function setView(container, html) {
    container.innerHTML = html;
}

export function createButton(text, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = text;
    if (typeof onClick === "function") {
        btn.addEventListener("click", onClick);
    }
    return btn;
}

export function createBackButton(container, onBack) {
    const btn = createButton("Volver", onBack);
    container.appendChild(btn);
}

export function renderHome(
    container,
    { onSesiones, onCarrito, onPreferencias, cartCount = 0 }
) {
    const badgeHtml =
        cartCount > 0
            ? `<span class="badge" aria-label="Elementos en carrito">${cartCount}</span>`
            : "";

    setView(
        container,
        `
    <section class="main-section">
      <h1>Sueños Valenti – Sesiones Interactivas</h1>
      <p>Explora sesiones grupales y gestiona tu carrito espiritual desde el navegador.</p>

      <div>
        <button id="btn-sesiones" type="button">Ver sesiones</button>

        <button id="btn-carrito" type="button">
          Carrito ${badgeHtml}
        </button>

        <button id="btn-preferencias" type="button">Preferencias</button>
      </div>
    </section>
  `
    );

    container.querySelector("#btn-sesiones")?.addEventListener("click", onSesiones);
    container.querySelector("#btn-carrito")?.addEventListener("click", onCarrito);
    container
        .querySelector("#btn-preferencias")
        ?.addEventListener("click", onPreferencias);
}

export function renderSesiones(
    container,
    { onBack, sesiones = [], onAddToCart, cartCount = 0, getCartCount }
) {
    setView(
        container,
        `
    <section class="main-section">
      <h2>Sesiones</h2>

      <p>
        <strong>Carrito:</strong>
        <span id="sesiones-cart-count">${cartCount}</span>
      </p>

      <p id="sesiones-feedback" class="feedback" aria-live="polite"></p>

      <div id="sesiones-list" class="sesiones-list"></div>

      <div id="botonera"></div>
    </section>
  `
    );

    const list = container.querySelector("#sesiones-list");
    const feedback = container.querySelector("#sesiones-feedback");
    const countEl = container.querySelector("#sesiones-cart-count");

    if (sesiones.length === 0) {
        list.innerHTML = `<p>No hay sesiones para mostrar.</p>`;
    } else {
        list.innerHTML = sesiones
            .map(
                (s) => `
        <article class="sesion-card">
          <h3>${s.nombre}</h3>
          <p>${s.descripcion ? s.descripcion : ""}</p>
          <p><strong>Precio:</strong> ${s.precio} €</p>
          <button type="button" data-id="${s.id}" class="btn-add">
            Añadir al carrito
          </button>
        </article>
      `
            )
            .join("");
    }

    list.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-add");
        if (!btn) return;

        const id = Number(btn.dataset.id);

        if (typeof onAddToCart === "function") onAddToCart(id);

        if (feedback) {
            feedback.textContent = `Añadida sesión con id ${id}`;
        }

        if (countEl) {
            if (typeof getCartCount === "function") {
                countEl.textContent = String(getCartCount());
            } else {
                const current = Number(countEl.textContent) || 0;
                countEl.textContent = String(current + 1);
            }
        }
    });

    const botonera = container.querySelector("#botonera");
    if (botonera) createBackButton(botonera, onBack);
}

export function renderCarrito(container, { onBack, items = [], total = 0, onRemoveOne, onClear }) {
    setView(
        container,
        `
    <section class="main-section">
      <h2>Carrito</h2>

      <div id="carrito-info"></div>
      <div id="carrito-list"></div>

      <div id="carrito-actions" style="margin-top: 12px;"></div>

      <div id="botonera" style="margin-top: 12px;"></div>
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

        list.addEventListener("click", (e) => {
            const btn = e.target.closest(".btn-remove");
            if (!btn) return;
            const id = Number(btn.dataset.id);
            if (typeof onRemoveOne === "function") onRemoveOne(id);
        });
    }

    if (items.length > 0) {
        const clearBtn = createButton("Vaciar carrito", onClear);
        actions.appendChild(clearBtn);
    }

    const botonera = container.querySelector("#botonera");
    if (botonera) createBackButton(botonera, onBack);
}


export function renderPreferencias(container, { onBack }) {
    setView(
        container,
        `
    <section class="main-section">
      <h2>Preferencias</h2>
      <p>(Placeholder) Aquí pondremos un formulario simple con validación y guardado en <code>localStorage</code>.</p>
      <div id="botonera"></div>
    </section>
  `
    );

    const botonera = container.querySelector("#botonera");
    if (botonera) createBackButton(botonera, onBack);
}