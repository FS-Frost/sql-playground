<script lang="ts">
  import { queryHistoryStore } from "$lib/stores/query-history.svelte";
  import { savedQueriesStore } from "$lib/stores/saved-queries.svelte";
  import type { QueryHistoryEntry, SavedQuery } from "$lib/types";
  import ConfirmModal from "$lib/components/ui/ConfirmModal.svelte";

  let { onclose }: { onclose: () => void } = $props();

  let mode = $state<"history" | "saved">("history");
  let search = $state("");
  let confirmClear = $state(false);

  function normalize(s: string) {
    return s.toLowerCase();
  }

  const historyRows = $derived.by(() => {
    const term = normalize(search.trim());
    const rows = queryHistoryStore.reversed;
    if (!term) return rows;
    return rows.filter((r) => normalize(r.sql).includes(term));
  });

  const savedRows = $derived.by(() => {
    const term = normalize(search.trim());
    const rows = [...savedQueriesStore.items].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!term) return rows;
    return rows.filter((r) => normalize(r.name).includes(term) || normalize(r.sql).includes(term));
  });

  function fmtTime(ts: number): string {
    return new Date(ts).toLocaleString();
  }
  function fmtDur(ms: number): string {
    return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`;
  }

  function loadHistory(entry: QueryHistoryEntry) {
    queryHistoryStore.loadInto(entry);
    onclose();
  }
  function loadSaved(item: SavedQuery) {
    savedQueriesStore.loadInto(item);
    onclose();
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === "Escape") onclose();
  }
</script>

<svelte:window onkeydown={handleKey} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay" onclick={onclose} role="presentation"></div>

<aside class="drawer" role="dialog" aria-modal="true">
  <div class="drawer__header">
    <div class="drawer__tabs">
      <button class="dtab {mode === 'history' ? 'active' : ''}" onclick={() => (mode = "history")}>Historial</button>
      <button class="dtab {mode === 'saved' ? 'active' : ''}" onclick={() => (mode = "saved")}>Guardadas</button>
    </div>
    <button class="btn-ghost close-btn" onclick={onclose} aria-label="Cerrar">×</button>
  </div>

  <div class="drawer__search">
    <input type="text" placeholder={mode === "history" ? "Buscar en historial…" : "Buscar guardadas…"} bind:value={search} />
  </div>

  <div class="drawer__list">
    {#if mode === "history"}
      {#if historyRows.length === 0}
        <div class="empty">Sin historial.</div>
      {/if}
      {#each historyRows as entry (entry.id)}
        <button class="row" onclick={() => loadHistory(entry)}>
          <span class="row-icon {entry.success ? 'ok' : 'err'}">{entry.success ? "✓" : "✗"}</span>
          <span class="row-body">
            <span class="row-sql truncate">{entry.sql}</span>
            <span class="row-meta">
              {fmtTime(entry.timestamp)} · {fmtDur(entry.durationMs)}{#if entry.rowCount != null} · {entry.rowCount} filas{/if}
            </span>
          </span>
        </button>
      {/each}
    {:else}
      {#if savedRows.length === 0}
        <div class="empty">Sin consultas guardadas.</div>
      {/if}
      {#each savedRows as item (item.id)}
        <div class="row-wrap">
          <button class="row" onclick={() => loadSaved(item)}>
            <span class="row-icon saved">★</span>
            <span class="row-body">
              <span class="row-name truncate">{item.name}</span>
              <span class="row-sql truncate">{item.sql}</span>
            </span>
          </button>
          <button class="btn-danger row-del" title="Borrar" onclick={() => savedQueriesStore.remove(item.id)}>🗑</button>
        </div>
      {/each}
    {/if}
  </div>

  {#if mode === "history"}
    <div class="drawer__footer">
      <button class="btn-danger" onclick={() => (confirmClear = true)} disabled={queryHistoryStore.entries.length === 0}>
        Limpiar historial
      </button>
    </div>
  {/if}
</aside>

{#if confirmClear}
  <ConfirmModal
    message="¿Limpiar todo el historial?"
    detail="Se eliminarán todas las entradas del historial de consultas."
    confirmLabel="Limpiar"
    danger
    onconfirm={() => { queryHistoryStore.clear(); confirmClear = false; }}
    oncancel={() => (confirmClear = false)}
  />
{/if}

<style>
  .overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); z-index: 1090; }
  .drawer {
    position: fixed;
    top: 0;
    right: 0;
    height: 100%;
    width: 420px;
    max-width: 92vw;
    z-index: 1091;
    background: var(--bg-surface);
    border-left: 1px solid var(--border-strong);
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
    animation: slide-in 0.15s ease;
  }
  @keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }

  .drawer__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
  }
  .drawer__tabs { display: flex; gap: 4px; }
  .dtab {
    padding: 5px 12px;
    color: var(--text-secondary);
    border-radius: var(--radius-sm);
    font-size: 12px;
  }
  .dtab:hover { background: var(--bg-hover); }
  .dtab.active { background: var(--accent-dim); color: var(--text-primary); }
  .close-btn { font-size: 20px; line-height: 1; padding: 0 6px; }

  .drawer__search { padding: 8px 12px; }
  .drawer__search input { width: 100%; }

  .drawer__list { flex: 1; overflow: auto; padding: 4px 8px; }
  .empty { padding: 24px; text-align: center; color: var(--text-muted); font-size: 12px; }

  .row-wrap { display: flex; align-items: stretch; }
  .row {
    flex: 1;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    text-align: left;
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    min-width: 0;
  }
  .row:hover { background: var(--bg-hover); }
  .row-icon { flex-shrink: 0; font-size: 12px; margin-top: 2px; }
  .row-icon.ok { color: var(--success); }
  .row-icon.err { color: var(--error); }
  .row-icon.saved { color: var(--warning); }
  .row-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .row-name { font-size: 12px; font-weight: 600; }
  .row-sql { font-size: 11px; font-family: var(--font-mono); color: var(--text-secondary); }
  .row-meta { font-size: 10px; color: var(--text-muted); }
  .row-del { flex-shrink: 0; padding: 0 10px; }

  .drawer__footer { padding: 10px 12px; border-top: 1px solid var(--border); }
  .drawer__footer .btn-danger { width: 100%; padding: 6px; }
</style>
