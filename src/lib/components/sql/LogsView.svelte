<script lang="ts">
  import { logsStore } from "$lib/stores/logs.svelte";

  let open = $state<Set<string>>(new Set());

  function toggle(id: string) {
    const next = new Set(open);
    next.has(id) ? next.delete(id) : next.add(id);
    open = next;
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
</script>

<div class="logs">
  <div class="logs__toolbar">
    <span class="text-muted">{logsStore.entries.length} entradas</span>
    <button class="btn-ghost btn-sm" onclick={() => logsStore.clear()}>Limpiar</button>
  </div>
  <div class="logs__list">
    {#if logsStore.entries.length === 0}
      <div class="logs__empty">Sin registros todavía.</div>
    {/if}
    {#each [...logsStore.entries].reverse() as entry (entry.id)}
      <div class="log-entry">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="log-head" onclick={() => toggle(entry.id)}>
          <span class="log-caret">{open.has(entry.id) ? "▾" : "▸"}</span>
          <span class="log-title truncate">{entry.title}</span>
          <button class="btn-ghost btn-xs" onclick={(e) => { e.stopPropagation(); copy(entry.text); }}>Copiar</button>
        </div>
        {#if open.has(entry.id)}
          <pre class="log-body">{entry.text}</pre>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .logs { display: flex; flex-direction: column; height: 100%; min-height: 0; }
  .logs__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-surface);
    font-size: 12px;
    flex-shrink: 0;
  }
  .btn-sm { padding: 4px 12px; font-size: 12px; }
  .btn-xs { padding: 2px 8px; font-size: 11px; }
  .logs__list { flex: 1; overflow: auto; padding: 6px 10px; }
  .logs__empty { padding: 20px; text-align: center; color: var(--text-muted); }
  .log-entry { border-bottom: 1px solid var(--border); }
  .log-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 4px;
    cursor: pointer;
    font-size: 12px;
    font-family: var(--font-mono);
  }
  .log-head:hover { background: var(--bg-hover); }
  .log-caret { color: var(--text-muted); font-size: 10px; }
  .log-title { flex: 1; color: var(--text-secondary); }
  .log-body {
    margin: 0 0 8px 20px;
    padding: 8px 10px;
    background: var(--bg-input);
    border-radius: var(--radius-sm);
    font-size: 11px;
    color: var(--text-primary);
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 300px;
    overflow: auto;
  }
</style>
