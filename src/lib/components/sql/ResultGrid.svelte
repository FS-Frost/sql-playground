<script lang="ts">
  import type { QueryResultSet } from "$lib/types";
  import ContextMenu, { type MenuItem } from "$lib/components/ui/ContextMenu.svelte";
  import { uiSettings } from "$lib/stores/ui-settings.svelte";

  let {
    result,
    height,
  }: {
    result: QueryResultSet | null;
    height?: number;
  } = $props();

  function formatDuration(ms: number): string {
    if (ms < 1) return "<1 ms";
    if (ms < 1000) return `${Math.round(ms)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  }

  let rowMenu = $state<{ x: number; y: number; items: MenuItem[] } | null>(null);

  // ===== Ordenamiento client-side =====
  let sortColIdx = $state<number | null>(null);
  let sortDir = $state<"asc" | "desc">("asc");

  // ===== Filtros por columna =====
  const NULL_KEY = " NULL";
  const SELECT_MAX_DISTINCT = 30;
  let filters = $state<Map<string, string>>(new Map());

  // ===== Búsqueda global + ocultar columnas =====
  let searchTerm = $state("");
  let hiddenCols = $state<Set<string>>(new Set());
  let showColMenu = $state(false);

  const columns = $derived(result?.columns ?? []);

  // sql.js devuelve values[][]; convertimos a objetos por nombre de columna.
  const rows = $derived.by(() => {
    if (!result) return [] as Record<string, unknown>[];
    return result.values.map((vals) => {
      const o: Record<string, unknown> = {};
      result.columns.forEach((c, i) => {
        o[c] = vals[i];
      });
      return o;
    });
  });

  const visibleColumns = $derived(columns.filter((c) => !hiddenCols.has(c)));

  function toggleHiddenCol(col: string) {
    const next = new Set(hiddenCols);
    next.has(col) ? next.delete(col) : next.add(col);
    hiddenCols = next;
  }

  function normalize(s: string) {
    return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  }

  function displayNull(): string {
    return uiSettings.nullDisplayText;
  }

  function cellText(v: unknown): string {
    return v === null || v === undefined ? displayNull() : String(v);
  }

  function setFilter(col: string, val: string) {
    const next = new Map(filters);
    if (val === "") next.delete(col);
    else next.set(col, val);
    filters = next;
  }

  const colMeta = $derived.by(() => {
    const m = new Map<string, { mode: "select" | "text"; options: { value: string; label: string }[] }>();
    for (const col of columns) {
      const distinct = new Set<string>();
      let hasNull = false;
      for (const r of rows) {
        const v = r[col];
        if (v === null || v === undefined) {
          hasNull = true;
          continue;
        }
        distinct.add(String(v));
        if (distinct.size > SELECT_MAX_DISTINCT) break;
      }
      if (distinct.size > SELECT_MAX_DISTINCT) {
        m.set(col, { mode: "text", options: [] });
      } else {
        const sorted = [...distinct].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        const options: { value: string; label: string }[] = [{ value: "", label: "(Todos)" }];
        if (hasNull) options.push({ value: NULL_KEY, label: "(NULL)" });
        for (const v of sorted) options.push({ value: v, label: v });
        m.set(col, { mode: "select", options });
      }
    }
    return m;
  });

  // Reset al llegar un result nuevo.
  let lastResult: QueryResultSet | null = null;
  $effect(() => {
    if (result !== lastResult) {
      lastResult = result;
      sortColIdx = null;
      sortDir = "asc";
      filters = new Map();
      searchTerm = "";
      hiddenCols = new Set();
      showColMenu = false;
    }
  });

  function cycleSort(i: number) {
    if (sortColIdx !== i) {
      sortColIdx = i;
      sortDir = "asc";
    } else if (sortDir === "asc") {
      sortDir = "desc";
    } else {
      sortColIdx = null;
      sortDir = "asc";
    }
  }

  function inferNumeric(col: string): boolean {
    for (const r of rows) {
      const v = r[col];
      if (v === null || v === undefined) continue;
      return typeof v === "number";
    }
    return false;
  }

  const filteredRows = $derived.by(() => {
    let out = rows;
    if (filters.size > 0) {
      const active = [...filters.entries()].map(([col, f]) => {
        const mode = colMeta.get(col)?.mode ?? "text";
        return { col, f, nf: normalize(f), mode };
      });
      out = out.filter((r) =>
        active.every(({ col, f, nf, mode }) => {
          const v = r[col];
          if (mode === "select") return (v === null || v === undefined ? NULL_KEY : String(v)) === f;
          return normalize(v === null || v === undefined ? "" : String(v)).includes(nf);
        }),
      );
    }
    const term = searchTerm.trim();
    if (term) {
      const nTerm = normalize(term);
      const cols = visibleColumns;
      out = out.filter((r) =>
        cols.some((col) => normalize(r[col] === null || r[col] === undefined ? "" : String(r[col])).includes(nTerm)),
      );
    }
    return out;
  });

  const sortedRows = $derived.by(() => {
    if (sortColIdx === null) return filteredRows;
    const col = columns[sortColIdx];
    const numeric = inferNumeric(col);
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      const va = a[col],
        vb = b[col];
      const na = va === null || va === undefined ? 1 : 0;
      const nb = vb === null || vb === undefined ? 1 : 0;
      if (na || nb) return na - nb;
      const cmp = numeric
        ? Number(va) - Number(vb)
        : String(va).localeCompare(String(vb), undefined, { numeric: true });
      return dir * cmp;
    });
  });

  // ===== Copiar / exportar =====
  function copy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  function rowToTsv(row: Record<string, unknown>, cols: string[]) {
    return cols.map((c) => cellText(row[c])).join("\t");
  }

  function toCsv(data: Record<string, unknown>[], cols: string[]) {
    const delim = uiSettings.csvDelimiter || ",";
    const escape = (v: unknown) => {
      const s = v === null || v === undefined ? "" : String(v);
      return s.includes(delim) || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = cols.join(delim);
    const body = data.map((r) => cols.map((c) => escape(r[c])).join(delim));
    return [header, ...body].join("\n");
  }

  function rowToInsertSql(row: Record<string, unknown>, cols: string[], tableName = "table_name"): string {
    const colList = cols.map((c) => `"${c}"`).join(", ");
    const valList = cols
      .map((c) => {
        const v = row[c];
        if (v === null || v === undefined) return "NULL";
        if (typeof v === "number") return String(v);
        return `'${String(v).replace(/'/g, "''")}'`;
      })
      .join(", ");
    return `INSERT INTO "${tableName}" (${colList}) VALUES (${valList});`;
  }

  function download(text: string, filename: string, mime: string) {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    download(toCsv(sortedRows, visibleColumns), "resultado.csv", "text/csv");
  }
  function exportJson() {
    download(JSON.stringify(sortedRows, null, 2), "resultado.json", "application/json");
  }

  function showRowMenu(e: MouseEvent, row: Record<string, unknown>, clickedColIndex: number) {
    e.preventDefault();
    const cols = visibleColumns;
    const col = cols[clickedColIndex] ?? cols[0];
    const val = row[col];
    rowMenu = {
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: "Copiar valor", action: () => copy(cellText(val)) },
        { label: "Copiar fila como texto", action: () => copy(rowToTsv(row, cols)) },
        { label: "Copiar fila como JSON", action: () => copy(JSON.stringify(row)) },
        { label: "Copiar fila como INSERT SQL", action: () => copy(rowToInsertSql(row, cols)) },
        { divider: true, label: "" },
        {
          label: `Copiar columna "${col}"`,
          action: () => copy(sortedRows.map((r) => cellText(r[col])).join("\n")),
        },
        { divider: true, label: "" },
        { label: "Copiar todo como CSV", action: () => copy(toCsv(sortedRows, cols)) },
        { label: "Copiar todo como JSON", action: () => copy(JSON.stringify(sortedRows)) },
      ],
    };
  }

  function getColIndexFromEvent(e: MouseEvent): number {
    const td = (e.target as HTMLElement).closest("td");
    if (!td || !td.parentElement) return 0;
    return Array.from(td.parentElement.children).indexOf(td);
  }
</script>

<div class="result-grid" style={height ? `height: ${height}px` : ""}>
  {#if !result}
    <div class="result-empty">Ejecuta una query con Ctrl+Enter</div>
  {:else if result.error}
    <div class="result-error">
      <span class="error-icon">✗</span>
      <span class="error-msg">{result.error}</span>
      <span class="result-time">{formatDuration(result.durationMs)}</span>
    </div>
  {:else}
    <div class="result-toolbar">
      <span class="result-meta">
        {#if columns.length > 0}
          {sortedRows.length}{sortedRows.length !== rows.length ? ` / ${rows.length}` : ""} filas
        {:else}
          OK
        {/if}
        · {formatDuration(result.durationMs)}
      </span>
      {#if columns.length > 0}
        <div class="flex gap-1 items-center">
          <input class="search-input" type="text" placeholder="Buscar en resultados…" bind:value={searchTerm} />
          <div class="col-menu-wrap">
            <button class="btn-ghost btn-xs" onclick={() => (showColMenu = !showColMenu)}>Columnas</button>
            {#if showColMenu}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div class="col-menu-backdrop" onclick={() => (showColMenu = false)}></div>
              <div class="col-menu">
                {#each columns as col}
                  <label class="col-menu-item">
                    <input type="checkbox" checked={!hiddenCols.has(col)} onchange={() => toggleHiddenCol(col)} />
                    {col}
                  </label>
                {/each}
              </div>
            {/if}
          </div>
          <button class="btn-ghost btn-xs" onclick={exportCsv}>CSV</button>
          <button class="btn-ghost btn-xs" onclick={exportJson}>JSON</button>
        </div>
      {/if}
    </div>

    {#if columns.length > 0}
      <div class="result-scroll">
        <table class="result-table density-{uiSettings.tableDensity}">
          <thead>
            <tr>
              {#each visibleColumns as col}
                {@const i = columns.indexOf(col)}
                {@const meta = colMeta.get(col)}
                <th class={sortColIdx === i ? "sorted" : ""}>
                  <!-- svelte-ignore a11y_click_events_have_key_events -->
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <div class="th-head" title="{col} — clic para ordenar" onclick={() => cycleSort(i)}>
                    <span class="th-label">{col}</span>
                    <span class="th-sort">{sortColIdx === i ? (sortDir === "asc" ? "↑" : "↓") : ""}</span>
                  </div>
                  <!-- svelte-ignore a11y_click_events_have_key_events -->
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <div class="th-filter" onclick={(e) => e.stopPropagation()}>
                    {#if meta?.mode === "select"}
                      <select
                        class="filter-input"
                        value={filters.get(col) ?? ""}
                        onchange={(e) => setFilter(col, (e.target as HTMLSelectElement).value)}
                      >
                        {#each meta.options as opt}
                          <option value={opt.value}>{opt.label}</option>
                        {/each}
                      </select>
                    {:else}
                      <input
                        class="filter-input"
                        type="text"
                        placeholder="contiene…"
                        value={filters.get(col) ?? ""}
                        oninput={(e) => setFilter(col, (e.target as HTMLInputElement).value)}
                      />
                    {/if}
                  </div>
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each sortedRows as row}
              <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
              <tr oncontextmenu={(e) => showRowMenu(e, row, getColIndexFromEvent(e))}>
                {#each visibleColumns as col}
                  {@const v = row[col]}
                  <td
                    class={v === null || v === undefined ? "null-cell" : typeof v === "number" ? "num-cell" : ""}
                    style="max-width: {uiSettings.cellMaxWidth}px"
                  >
                    {cellText(v)}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</div>

{#if rowMenu}
  <ContextMenu items={rowMenu.items} x={rowMenu.x} y={rowMenu.y} onclose={() => (rowMenu = null)} />
{/if}

<style>
  .result-grid {
    display: flex;
    flex-direction: column;
    background: var(--bg-base);
    min-height: 80px;
    flex: 1;
    min-height: 0;
  }

  .result-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-size: 13px;
  }

  .result-error {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: var(--error-dim);
    color: var(--error);
    font-size: 13px;
    font-family: var(--font-mono);
  }
  .error-icon { flex-shrink: 0; font-size: 16px; }
  .error-msg { flex: 1; }
  .result-time { color: var(--text-muted); font-size: 11px; flex-shrink: 0; }

  .result-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 10px;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border);
    font-size: 12px;
    flex-shrink: 0;
  }
  .result-meta { color: var(--text-secondary); }
  .btn-xs { padding: 2px 8px; font-size: 11px; }

  .search-input {
    width: 180px;
    padding: 3px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 11px;
    color: var(--text-primary);
    background: var(--bg-input);
  }
  .search-input:focus { outline: none; border-color: var(--border-focus); }

  .col-menu-wrap { position: relative; }
  .col-menu-backdrop { position: fixed; inset: 0; z-index: 29; }
  .col-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    z-index: 30;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 160px;
    max-height: 260px;
    overflow-y: auto;
    padding: 6px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
  }
  .col-menu-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 6px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    color: var(--text-primary);
    cursor: pointer;
    white-space: nowrap;
  }
  .col-menu-item:hover { background: var(--bg-hover); }

  .result-scroll { flex: 1; overflow: auto; }

  .result-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    font-family: var(--font-mono);
    white-space: nowrap;
  }
  .result-table th {
    position: sticky;
    top: 0;
    background: var(--bg-elevated);
    border-bottom: 2px solid var(--border);
    border-right: 1px solid var(--border);
    padding: 4px 10px;
    text-align: left;
    color: var(--text-secondary);
    font-size: 11px;
    vertical-align: top;
  }
  .th-head { display: flex; align-items: center; cursor: pointer; user-select: none; }
  .th-head:hover { color: var(--text-primary); }
  .result-table th.sorted { color: var(--text-primary); }
  .th-label { flex: 1; }
  .th-sort { display: inline-block; width: 0.9em; color: var(--accent); }
  .th-filter { margin-top: 4px; font-weight: 400; }
  .filter-input {
    width: 100%;
    box-sizing: border-box;
    padding: 2px 6px;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--text-primary);
    background: var(--bg-input);
  }
  .filter-input:focus { outline: none; border-color: var(--border-focus); }
  .result-table td {
    padding: 3px 10px;
    border-bottom: 1px solid var(--border);
    border-right: 1px solid var(--border);
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .density-compact td { padding: 1px 8px; }
  .density-comfortable td { padding: 6px 12px; }
  .result-table tr:hover td { background: var(--bg-hover); }
  .null-cell { color: var(--text-muted); font-style: italic; }
  .num-cell { color: var(--num); }
</style>
