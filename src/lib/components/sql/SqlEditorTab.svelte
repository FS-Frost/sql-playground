<script lang="ts">
  import { format as formatSql } from "sql-formatter";
  import type { Tab, QueryResultSet } from "$lib/types";
  import { execute } from "$lib/db";
  import { tabsStore } from "$lib/stores/tabs.svelte";
  import { queryHistoryStore } from "$lib/stores/query-history.svelte";
  import { schemaStore } from "$lib/stores/schema.svelte";
  import { logsStore } from "$lib/stores/logs.svelte";
  import { uiSettings } from "$lib/stores/ui-settings.svelte";
  import { getStoredNumber, setString } from "$lib/storage";
  import MonacoEditor from "./MonacoEditor.svelte";
  import ResultTabs from "./ResultTabs.svelte";

  let { tab, onsave }: { tab: Tab; onsave: (sql: string) => void } = $props();

  let editorRef = $state<MonacoEditor>();
  let results = $state<QueryResultSet[]>(tabsStore.getQueryResult(tab.id) ?? []);
  let error = $state("");

  const RESULT_KEY = "sqlpg:resultHeight";
  let resultHeight = $state(getStoredNumber(RESULT_KEY, 280));

  function onEditorChange(v: string) {
    tabsStore.updateTab(tab.id, { sqlContent: v });
  }

  function run(sql: string) {
    const target = (sql ?? "").trim() ? sql : tab.sqlContent;
    if (!target || !target.trim()) return;

    logsStore.add("Query", target);
    const outcome = execute(target);

    if (outcome.error) {
      error = outcome.error;
      results = [];
      tabsStore.setQueryResult(tab.id, []);
      logsStore.add("ERROR: execute query", outcome.error);
      queryHistoryStore.append({
        sql: target,
        timestamp: Date.now(),
        success: false,
        durationMs: outcome.durationMs,
        error: outcome.error,
      });
      return;
    }

    error = "";
    results =
      outcome.results.length > 0
        ? outcome.results
        : [{ columns: [], values: [], rowCount: outcome.rowsModified, durationMs: outcome.durationMs, sql: target }];
    tabsStore.setQueryResult(tab.id, results);

    const totalRows = outcome.results.reduce((a, r) => a + r.rowCount, 0);
    logsStore.add("Query result", `${outcome.results.length} result set(s), ${totalRows} row(s)`);
    queryHistoryStore.append({
      sql: target,
      timestamp: Date.now(),
      success: true,
      rowCount: totalRows,
      durationMs: outcome.durationMs,
    });

    // Refrescar esquema por si hubo DDL.
    schemaStore.refresh();
  }

  function runAll() {
    run(tab.sqlContent);
  }

  export function runActive() {
    run(editorRef?.getSelectedOrAll() ?? tab.sqlContent);
  }

  export function setSql(sql: string) {
    editorRef?.setValue(sql);
    tabsStore.updateTab(tab.id, { sqlContent: sql });
  }

  function format() {
    try {
      const formatted = formatSql(tab.sqlContent, {
        language: "sqlite",
        tabWidth: uiSettings.formatTabWidth,
        keywordCase: uiSettings.formatKeywordCase,
        linesBetweenQueries: 1,
      });
      editorRef?.setValue(formatted);
      tabsStore.updateTab(tab.id, { sqlContent: formatted });
    } catch (e) {
      logsStore.add("ERROR: SQL format", `${e}`);
    }
  }

  function save() {
    onsave(tab.sqlContent);
  }

  // Split resize
  function startResize(e: MouseEvent) {
    e.preventDefault();
    const startY = e.clientY;
    const startH = resultHeight;
    function onMove(ev: MouseEvent) {
      resultHeight = Math.max(80, Math.min(600, startH + (startY - ev.clientY)));
    }
    function onUp() {
      setString(RESULT_KEY, String(resultHeight));
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }
</script>

<div class="editor-tab">
  <div class="editor-toolbar">
    <button class="btn-primary btn-sm" onclick={runAll} title="Ejecutar (Ctrl+Enter)">▶ Ejecutar</button>
    <button class="btn-ghost btn-sm" onclick={format} title="Formatear (Ctrl+Shift+F)">Formatear</button>
    <button class="btn-ghost btn-sm" onclick={save} title="Guardar consulta (Ctrl+S)">💾 Guardar</button>
  </div>

  <div class="editor-pane">
    <MonacoEditor
      bind:this={editorRef}
      value={tab.sqlContent}
      onChange={onEditorChange}
      onRun={(sql) => run(sql)}
      onRunAll={runAll}
      onFormat={format}
      onSave={save}
    />
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="result-resize-handle" onmousedown={startResize} title="Arrastrar para redimensionar"></div>

  <div class="result-pane" style="height: {resultHeight}px">
    {#if error}
      <div class="tab-error">✗ {error}</div>
    {/if}
    <ResultTabs {results} />
  </div>
</div>

<style>
  .editor-tab {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .editor-toolbar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .btn-sm { padding: 4px 12px; font-size: 12px; }

  .editor-pane {
    flex: 1;
    min-height: 80px;
    overflow: hidden;
  }

  .result-resize-handle {
    height: 6px;
    cursor: row-resize;
    background: var(--bg-surface);
    border-top: 1px solid var(--border-strong);
    flex-shrink: 0;
  }
  .result-resize-handle:hover { background: var(--accent-dim); }

  .result-pane {
    display: flex;
    flex-direction: column;
    min-height: 80px;
    flex-shrink: 0;
    overflow: hidden;
  }

  .tab-error {
    padding: 8px 12px;
    background: var(--error-dim);
    color: var(--error);
    font-family: var(--font-mono);
    font-size: 12px;
    flex-shrink: 0;
  }
</style>
