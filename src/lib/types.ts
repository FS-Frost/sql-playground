// ===== Tabs =====

export type TabType = "sql" | "logs";

export interface Tab {
    id: string;
    type: TabType;
    title: string;
    sqlContent: string;
}

export interface ClosedTab {
    tab: Tab;
    result?: QueryResultSet[] | null; // solo en memoria; no se persiste
    closedAt: number;
}

export interface TabsData {
    tabs: Tab[];
    activeTabId: string | null;
    closedHistory: ClosedTab[];
}

// ===== Query history =====

export interface QueryHistoryEntry {
    id: string;
    sql: string;
    timestamp: number;
    success: boolean;
    rowCount?: number;
    durationMs: number;
    error?: string;
}

// ===== Saved queries =====

export interface SavedQuery {
    id: string;
    name: string;
    sql: string;
    createdAt: number;
    updatedAt: number;
}

// ===== Query results =====

// Adaptación del QueryExecResult de sql.js + metadatos de ejecución.
export interface QueryResultSet {
    columns: string[];
    values: unknown[][];
    rowCount: number;
    durationMs: number;
    sql: string;
    error?: string;
}

// ===== Schema (sidebar) =====

export interface SchemaColumn {
    name: string;
    type: string;
    notnull: boolean;
    pk: boolean;
}

export interface SchemaTable {
    name: string;
    columns: SchemaColumn[];
}
