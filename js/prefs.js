/**
 * Sueños Valenti – Práctica evaluable (DWEC)
 * Autor: Sergio López Casado · Prometeo FP · DAW 2024–2026
 * GitHub: https://github.com/Serlopcas · LinkedIn: https://www.linkedin.com/in/sergiolopezcasado/
 */
/**
 * Módulo de preferencias (persistencia + validación)
 * -------------------------------------------------
 * Gestiona la configuración del usuario mediante localStorage.
 *
 * Preferencias soportadas:
 * - name: nombre visible en la interfaz (opcional).
 * - maxBudget: presupuesto máximo (entero positivo) o null si no se usa.
 * - sortKey: clave de ordenación de sesiones ("id" | "nombre" | "precio").
 * - sortDir: dirección de ordenación ("asc" | "desc").
 * - filterUnderBudget: si está activo, filtra sesiones cuyo precio <= maxBudget.
 */

const PREFS_KEY = "sv_prefs_v1";

/**
 * Devuelve el objeto de preferencias por defecto.
 *
 * @returns {{
 *   name: string,
 *   maxBudget: number|null,
 *   sortKey: "id"|"nombre"|"precio",
 *   sortDir: "asc"|"desc",
 *   filterUnderBudget: boolean
 * }}
 */
export function getDefaultPrefs() {
    return {
        name: "",
        maxBudget: null,
        sortKey: "id",
        sortDir: "asc",
        filterUnderBudget: false
    };
}

/**
 * Carga las preferencias desde localStorage y aplica defaults/normalización.
 * Si no existen o están corruptas, devuelve defaults.
 *
 * Normalización aplicada:
 * - maxBudget se acepta solo si es número finito; si no, se restaura a default (null).
 * - filterUnderBudget se fuerza a boolean.
 *
 * @returns {{
 *   name: string,
 *   maxBudget: number|null,
 *   sortKey: "id"|"nombre"|"precio",
 *   sortDir: "asc"|"desc",
 *   filterUnderBudget: boolean
 * }}
 */
export function loadPrefs() {
    try {
        const raw = localStorage.getItem(PREFS_KEY);
        if (!raw) return getDefaultPrefs();

        const parsed = JSON.parse(raw);
        const def = getDefaultPrefs();

        return {
            ...def,
            ...parsed,
            maxBudget:
                typeof parsed.maxBudget === "number" && Number.isFinite(parsed.maxBudget)
                    ? parsed.maxBudget
                    : def.maxBudget,
            filterUnderBudget: Boolean(parsed.filterUnderBudget),
        };
    } catch {
        return getDefaultPrefs();
    }
}

/**
 * Guarda las preferencias en localStorage.
 *
 * @param {{
 *   name: string,
 *   maxBudget: number|null,
 *   sortKey: "id"|"nombre"|"precio",
 *   sortDir: "asc"|"desc",
 *   filterUnderBudget: boolean
 * }} prefs
 */
export function savePrefs(prefs) {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

/**
 * Valida un subconjunto de preferencias procedentes de un formulario.
 *
 * Reglas:
 * - name: opcional; si existe, 3..16 caracteres.
 * - maxBudget: si no es null, debe ser entero positivo.
 * - filterUnderBudget: si es true, exige maxBudget válido.
 *
 * @param {{name: any, maxBudget: any, filterUnderBudget: any}} param0
 * @returns {{
 *   name?: string,
 *   maxBudget?: string,
 *   filterUnderBudget?: string
 * }} Mapa de errores por campo (vacío si no hay errores).
 */
export function validatePrefs({ name, maxBudget, filterUnderBudget }) {
    const errors = {};

    const cleanName = String(name ?? "").trim();
    if (cleanName === "") {
    } else {
        if (cleanName.length < 3) errors.name = "El nombre debe tener al menos 3 caracteres.";
        if (cleanName.length > 16) errors.name = "El nombre no puede superar los 16 caracteres.";
    }

    if (maxBudget !== null) {
        if (!Number.isInteger(maxBudget) || maxBudget <= 0) {
            errors.maxBudget = "El presupuesto debe ser un número entero positivo.";
        }
    }

    if (filterUnderBudget) {
        if (maxBudget === null || !Number.isInteger(maxBudget) || maxBudget <= 0) {
            errors.filterUnderBudget = "Debes indicar un presupuesto válido para activar este filtro.";
        }
    }

    return errors;
}
