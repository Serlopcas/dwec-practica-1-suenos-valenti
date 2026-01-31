# Sueños Valenti – Portal de Sesiones Interactivas de Supra Consciencia

Aplicación 100% **frontend** (sin backend) que permite consultar, filtrar y seleccionar **sesiones espirituales** cargadas desde un JSON local mediante `fetch`, y gestionar un **carrito espiritual** persistente con `localStorage`.  
Proyecto desarrollado como práctica de **DWEC** con enfoque en **DOM**, **eventos**, **módulos ES6** y **persistencia en cliente**.

---

## Qué ofrece (y por qué mola)

- **SPA real sin recargas**: las vistas se renderizan dinámicamente en el contenedor principal usando JavaScript (Home / Sesiones / Carrito / Preferencias).
- **Catálogo cargado con `fetch` + JSON**: sesiones servidas desde un archivo local `data/sesiones.json`.
- **Buscador instantáneo**: filtrado por texto (título o descripción) en tiempo real.
- **Tarjetas interactivas**: “ver más / ver menos” para ampliar descripción y destacar selección.
- **Carrito persistente**:
  - Añadir sesiones
  - Eliminar una unidad
  - Vaciar carrito
  - Total y número de elementos
  - Persistencia entre recargas con `localStorage`
- **Preferencias del usuario**:
  - Nombre “espiritual” (badge visible)
  - Ordenación por `id / nombre / precio` (asc/desc)
  - Presupuesto máximo + filtro “solo sesiones ≤ presupuesto”
  - Validación de formulario con errores por campo
- **Regla extra de negocio**: si existe presupuesto máximo válido, se impide añadir al carrito si se supera el límite.
- **Feedback UX cuidado**:
  - Toast de confirmación/error al añadir
  - Badge con contador del carrito
  - Controles flotantes de scroll (▲/▼)
  - Sticky footer de “Volver” para navegación consistente

---

## Requisitos del enunciado cubiertos

El proyecto cumple los bloques exigidos en el enunciado:

1. **Interfaz inicial** con título, descripción y botones (Ver sesiones / Carrito / Preferencias), sin recargar página.
2. **Carga de sesiones** desde `data/sesiones.json` con `fetch` + render con DOM y botón “Añadir al carrito”.
3. **Carrito con localStorage**: añadir, eliminar, vaciar, persistir, y mostrar total + número de elementos.
4. **Módulos ES6 (import/export)** con `main.js` como coordinador y al menos 3 módulos.
5. **Eventos + DOM avanzado**: clicks, input, submit, renderizado dinámico.

---

## Estructura del proyecto

- `index.html` – Entrada y layout base. Carga `main.js` como módulo.
- `css/styles.css` – Estilos principales de la aplicación.
- `js/main.js` – Coordinador: navegación SPA, caché de sesiones, reglas y callbacks.
- `js/api.js` – Acceso a datos: `fetch` de sesiones.
- `js/ui.js` – Renderizado de vistas + eventos de interfaz.
- `js/cart.js` – Lógica de carrito + persistencia en `localStorage`.
- `js/prefs.js` – Preferencias + validación + persistencia.
- `data/sesiones.json` – Catálogo de sesiones (id, nombre, descripción, precio).

---

## Puesta en marcha

### Requisito importante

Para que `fetch("./data/sesiones.json")` funcione correctamente, hay que servir el proyecto con un **servidor local** (no abrir el HTML con `file://`).

### Opción A: VS Code + Live Server

1. Abrir la carpeta del proyecto en VS Code.
2. Botón derecho en `index.html` → **Open with Live Server**.

### Opción B: servidor simple (si se dispone de Node)

- Usar cualquier servidor estático (por ejemplo `npx serve` o similar) y abrir la URL que indique.

---

## Acciones e interacciones disponibles

### Navegación
- Desde **Home** puedes ir a **Sesiones**, **Carrito** o **Preferencias** sin recargar la página.
- En todas las vistas tienes un botón de **Volver** (sticky footer) para mantener una navegación consistente.

### Sesiones
- **Buscar sesiones**: escribe en el campo de búsqueda y se filtran al instante por **título o descripción**.
- **Ampliar una sesión**: puedes **clicar en una tarjeta** para desplegar la descripción (ver más / ver menos).
- **Añadir al carrito**: pulsa **“Añadir al carrito”** en una sesión:
  - Aparece un **toast** confirmando si se ha añadido o si ha habido un error.
  - Se actualiza el **contador del carrito** en la propia vista de sesiones.

### Carrito
- **Ver resumen del carrito**: se muestra el número de elementos y el **total**.
- **Eliminar una unidad**: en cada sesión del carrito puedes pulsar **“Eliminar 1”** para restar una unidad.
- **Vaciar carrito**: botón para eliminar todos los elementos de una sola vez.
- **Persistencia**: el carrito se conserva aunque recargues la página (usa `localStorage`).

### Preferencias
- **Nombre “espiritual”**: si lo cambias y guardas, se actualiza el **badge** visible en la interfaz.
- **Ordenación**:
  - Elegir por qué ordenar (`id`, `nombre`, `precio`).
  - Elegir orden ascendente/descendente.
- **Presupuesto máximo**:
  - Puedes indicar un **presupuesto máximo** en euros.
  - Si activas “Mostrar solo sesiones ≤ presupuesto máximo”, la lista de sesiones se filtra automáticamente.
  - Si tienes un presupuesto válido configurado, al intentar añadir una sesión al carrito:
    - **No permite** añadirla si al hacerlo **superas el presupuesto**.
- **Validación del formulario**:
  - Los errores se muestran por campo (por ejemplo, nombre demasiado corto o presupuesto inválido).
  - Algunas opciones se habilitan/deshabilitan según la validez del presupuesto.
- **Limpiar / Restablecer**:
  - “Limpiar” vacía el formulario (sin necesidad de recargar la app).
  - “Restablecer” vuelve a las preferencias por defecto.

### Extras de experiencia de uso
- **Botones flotantes de scroll** (▲/▼) para subir o bajar rápidamente en la página.

---
