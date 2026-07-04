import type { Tab, TabsData, ClosedTab, QueryResultSet } from "$lib/types";
import { browser } from "$app/environment";
import { randomUUID, getJSON, setJSON } from "$lib/storage";

const KEY = "sqlpg:tabs";
const MAX_CLOSED = 30;

const DEFAULT_SQL = "SELECT * FROM products ORDER BY category_id, price DESC;";

function createTabsStore() {
    let _tabs = $state<Tab[]>([]);
    let _activeTabId = $state<string | null>(null);
    let _closedHistory = $state<ClosedTab[]>([]);
    let _ready = $state(false);
    let _saveTimer: ReturnType<typeof setTimeout> | null = null;
    // Resultados por tab: solo en memoria, no se persisten.
    const _queryResults = new Map<string, QueryResultSet[]>();

    function serialize(): TabsData {
        return {
            tabs: _tabs,
            activeTabId: _activeTabId,
            closedHistory: _closedHistory.map((c) => ({ ...c, result: undefined })),
        };
    }

    function scheduleSave(): void {
        if (!browser) return;
        if (_saveTimer) clearTimeout(_saveTimer);
        _saveTimer = setTimeout(() => setJSON(KEY, serialize()), 400);
    }

    $effect.root(() => {
        $effect(() => {
            if (!_ready) return;
            void _tabs;
            void _activeTabId;
            void _closedHistory;
            scheduleSave();
        });
    });

    function init(): void {
        if (!browser) return;
        const data = getJSON<TabsData | null>(KEY, null);
        if (data) {
            _tabs = data.tabs ?? [];
            _activeTabId = data.activeTabId ?? null;
            _closedHistory = data.closedHistory ?? [];
        }
        if (_tabs.length === 0) {
            const id = randomUUID();
            _tabs = [{ id, type: "sql", title: "Consulta 1", sqlContent: DEFAULT_SQL }];
            _activeTabId = id;
        }
        if (!_activeTabId || !_tabs.find((t) => t.id === _activeTabId)) {
            _activeTabId = _tabs[0]?.id ?? null;
        }
        _ready = true;
    }

    function nextQueryTitle(): string {
        const used = new Set(
            _tabs
                .map((t) => t.title.match(/^Consulta (\d+)$/))
                .filter(Boolean)
                .map((m) => parseInt(m![1])),
        );
        let n = 1;
        while (used.has(n)) n++;
        return `Consulta ${n}`;
    }

    function newSqlTab(sqlContent = ""): string {
        const id = randomUUID();
        _tabs = [..._tabs, { id, type: "sql", title: nextQueryTitle(), sqlContent }];
        _activeTabId = id;
        return id;
    }

    function openLogsTab(): string {
        const existing = _tabs.find((t) => t.type === "logs");
        if (existing) {
            _activeTabId = existing.id;
            return existing.id;
        }
        const id = randomUUID();
        _tabs = [..._tabs, { id, type: "logs", title: "Logs", sqlContent: "" }];
        _activeTabId = id;
        return id;
    }

    function closeTab(id: string): void {
        const idx = _tabs.findIndex((t) => t.id === id);
        if (idx === -1) return;
        const tab = _tabs[idx];
        const result = _queryResults.get(id) ?? null;
        _tabs = _tabs.filter((t) => t.id !== id);
        _closedHistory = [..._closedHistory, { tab, result, closedAt: Date.now() }].slice(-MAX_CLOSED);
        if (_activeTabId === id) {
            _activeTabId = _tabs[Math.max(0, idx - 1)]?.id ?? null;
        }
        _queryResults.delete(id);
        if (_tabs.length === 0) newSqlTab(DEFAULT_SQL);
    }

    // Sin id: restaura la última cerrada (Ctrl+Shift+T).
    function restoreTab(id?: string): void {
        if (_closedHistory.length === 0) return;
        const entry = id
            ? _closedHistory.find((c) => c.tab.id === id)
            : _closedHistory[_closedHistory.length - 1];
        if (!entry) return;
        _closedHistory = _closedHistory.filter((c) => c !== entry);
        let tab = entry.tab;
        if (_tabs.find((t) => t.id === tab.id)) tab = { ...tab, id: randomUUID() };
        _tabs = [..._tabs, tab];
        _activeTabId = tab.id;
        if (entry.result) _queryResults.set(tab.id, entry.result);
    }

    function clearClosedHistory(): void {
        _closedHistory = [];
    }

    function activateTab(id: string): void {
        _activeTabId = id;
    }

    function renameTab(id: string, title: string): void {
        const trimmed = title.trim();
        if (!trimmed) return;
        _tabs = _tabs.map((t) => (t.id === id ? { ...t, title: trimmed } : t));
    }

    function updateTab(id: string, patch: Partial<Tab>): void {
        _tabs = _tabs.map((t) => (t.id === id ? { ...t, ...patch } : t));
    }

    function reorderTab(fromId: string, toId: string): void {
        const from = _tabs.findIndex((t) => t.id === fromId);
        const to = _tabs.findIndex((t) => t.id === toId);
        if (from === -1 || to === -1 || from === to) return;
        const tabs = [..._tabs];
        const [moved] = tabs.splice(from, 1);
        tabs.splice(to, 0, moved);
        _tabs = tabs;
    }

    return {
        get tabs() {
            return _tabs;
        },
        get activeId() {
            return _activeTabId;
        },
        get activeTab() {
            return _tabs.find((t) => t.id === _activeTabId) ?? null;
        },
        get closedHistory() {
            return _closedHistory;
        },
        getQueryResult: (id: string) => _queryResults.get(id) ?? null,
        setQueryResult: (id: string, result: QueryResultSet[] | null) => {
            if (result === null) _queryResults.delete(id);
            else _queryResults.set(id, result);
        },
        init,
        nextQueryTitle,
        newSqlTab,
        openLogsTab,
        closeTab,
        restoreTab,
        clearClosedHistory,
        activateTab,
        renameTab,
        updateTab,
        reorderTab,
    };
}

export const tabsStore = createTabsStore();
