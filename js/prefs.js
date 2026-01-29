const PREFS_KEY = "sv_prefs_v1";

export function getDefaultPrefs() {
    return {
        name: "",
        maxBudget: null,
        sortKey: "id",
        sortDir: "asc",
        filterUnderBudget: false
    };
}

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

export function savePrefs(prefs) {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function validatePrefs({ name, maxBudget, filterUnderBudget }) {
    const errors = {};

    const cleanName = String(name ?? "").trim();
    if (cleanName === "") {
    } else {
        if (cleanName.length < 3) errors.name = "Mínimo 3 caracteres.";
        if (cleanName.length > 16) errors.name = "Máximo 16 caracteres.";
    }

    if (maxBudget !== null) {
        if (!Number.isInteger(maxBudget) || maxBudget <= 0) {
            errors.maxBudget = "Debe ser un entero positivo.";
        }
    }

    if (filterUnderBudget) {
        if (maxBudget === null || !Number.isInteger(maxBudget) || maxBudget <= 0) {
            errors.filterUnderBudget = "Necesitas un presupuesto válido para activar el filtro.";
        }
    }

    return errors;
}
