import type { SavedQuery } from "$lib/types";
import { getJSON, setJSON, hasKey, randomUUID } from "$lib/storage";
import { tabsStore } from "./tabs.svelte";
import { DEFAULT_SAVED_QUERIES } from "$lib/default-saved-queries";

const KEY = "sqlpg:saved";

function buildDefaults(): SavedQuery[] {
    const now = Date.now();
    return DEFAULT_SAVED_QUERIES.map((q, i) => ({
        id: randomUUID(),
        name: q.name,
        sql: q.sql,
        createdAt: now + i,
        updatedAt: now + i,
    }));
}

function createSavedQueriesStore() {
    const seedDefaults = !hasKey(KEY);
    let _items = $state<SavedQuery[]>(seedDefaults ? buildDefaults() : getJSON<SavedQuery[]>(KEY, []));

    function persist(): void {
        setJSON(KEY, _items);
    }

    if (seedDefaults) persist();

    function add(name: string, sql: string): string {
        const now = Date.now();
        const item: SavedQuery = {
            id: randomUUID(),
            name: name.trim() || "Sin nombre",
            sql,
            createdAt: now,
            updatedAt: now,
        };
        _items = [..._items, item];
        persist();
        return item.id;
    }

    function update(id: string, patch: Partial<Pick<SavedQuery, "name" | "sql">>): void {
        _items = _items.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: Date.now() } : i));
        persist();
    }

    function rename(id: string, name: string): void {
        const trimmed = name.trim();
        if (!trimmed) return;
        update(id, { name: trimmed });
    }

    function remove(id: string): void {
        _items = _items.filter((i) => i.id !== id);
        persist();
    }

    function loadInto(item: SavedQuery): string {
        return tabsStore.newSqlTab(item.sql);
    }

    return {
        get items() {
            return _items;
        },
        add,
        update,
        rename,
        remove,
        loadInto,
    };
}

export const savedQueriesStore = createSavedQueriesStore();
