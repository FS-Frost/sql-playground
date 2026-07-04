import type { QueryHistoryEntry } from "$lib/types";
import { getJSON, setJSON, randomUUID } from "$lib/storage";
import { tabsStore } from "./tabs.svelte";

const KEY = "sqlpg:history";
const MAX = 500;

function normalize(sql: string): string {
    return sql.replace(/\s+/g, " ").trim().toLowerCase();
}

function createQueryHistoryStore() {
    let _entries = $state<QueryHistoryEntry[]>(getJSON<QueryHistoryEntry[]>(KEY, []));

    function persist(): void {
        setJSON(KEY, _entries);
    }

    function append(entry: Omit<QueryHistoryEntry, "id">): void {
        const e: QueryHistoryEntry = { id: randomUUID(), ...entry };
        _entries = [..._entries, e].slice(-MAX);
        persist();
    }

    function clear(): void {
        _entries = [];
        persist();
    }

    // Abre una nueva tab SQL con el SQL de la entrada.
    function loadInto(entry: QueryHistoryEntry): string {
        return tabsStore.newSqlTab(entry.sql);
    }

    // Recientes exitosas, deduplicadas por SQL normalizado (para omnibox).
    function recentSuccessful(limit = 20): QueryHistoryEntry[] {
        const seen = new Set<string>();
        const out: QueryHistoryEntry[] = [];
        for (let i = _entries.length - 1; i >= 0; i--) {
            const e = _entries[i];
            if (!e.success) continue;
            const k = normalize(e.sql);
            if (seen.has(k)) continue;
            seen.add(k);
            out.push(e);
            if (out.length >= limit) break;
        }
        return out;
    }

    return {
        get entries() {
            return _entries;
        },
        // Más reciente primero.
        get reversed() {
            return [..._entries].reverse();
        },
        append,
        clear,
        loadInto,
        recentSuccessful,
    };
}

export const queryHistoryStore = createQueryHistoryStore();
