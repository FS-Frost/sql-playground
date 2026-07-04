import { browser } from "$app/environment";

export function getStoredString(key: string, defaultVal: string): string {
    if (!browser) return defaultVal;
    return localStorage.getItem(key) ?? defaultVal;
}

export function getStoredBool(key: string, defaultVal: boolean): boolean {
    if (!browser) return defaultVal;
    const v = localStorage.getItem(key);
    return v === null ? defaultVal : v !== "false";
}

export function getStoredNumber(key: string, defaultVal: number): number {
    if (!browser) return defaultVal;
    const v = localStorage.getItem(key);
    if (v === null) return defaultVal;
    const n = Number(v);
    return isNaN(n) ? defaultVal : n;
}

export function getJSON<T>(key: string, defaultVal: T): T {
    if (!browser) return defaultVal;
    const v = localStorage.getItem(key);
    if (v === null) return defaultVal;
    try {
        return JSON.parse(v) as T;
    } catch {
        return defaultVal;
    }
}

export function setJSON(key: string, val: unknown): void {
    if (!browser) return;
    localStorage.setItem(key, JSON.stringify(val));
}

export function setString(key: string, val: string): void {
    if (!browser) return;
    localStorage.setItem(key, val);
}

export function removeKey(key: string): void {
    if (!browser) return;
    localStorage.removeItem(key);
}

export function hasKey(key: string): boolean {
    if (!browser) return false;
    return localStorage.getItem(key) !== null;
}

export function randomUUID(): string {
    if (browser && typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
