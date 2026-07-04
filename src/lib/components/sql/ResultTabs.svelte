<script lang="ts">
  import type { QueryResultSet } from "$lib/types";
  import ResultGrid from "./ResultGrid.svelte";

  let {
    results,
    height,
  }: {
    results: QueryResultSet[];
    height?: number;
  } = $props();

  let activeIdx = $state(0);
  let lastResults: QueryResultSet[] | null = null;

  $effect(() => {
    if (results !== lastResults) {
      lastResults = results;
      activeIdx = Math.max(0, results.length - 1);
    }
  });

  function tabLabel(r: QueryResultSet, i: number): string {
    const preview = (r.sql ?? "").trim().replace(/\s+/g, " ");
    if (!preview) return `Resultado ${i + 1}`;
    return preview.length > 28 ? preview.slice(0, 28) + "..." : preview;
  }

  const activeResult = $derived(results[activeIdx] ?? null);
</script>

{#if results.length <= 1}
  <ResultGrid result={results[0] ?? null} {height} />
{:else}
  <div class="result-tabs" style={height ? `height: ${height}px` : ""}>
    <div class="result-tabs__strip">
      {#each results as r, i}
        <button
          class="result-tabs__tab {activeIdx === i ? 'active' : ''} {r.error ? 'has-error' : ''}"
          title={r.sql}
          onclick={() => (activeIdx = i)}
        >
          {#if r.error}<span class="tab-error-dot"></span>{/if}
          {tabLabel(r, i)}
        </button>
      {/each}
    </div>
    <div class="result-tabs__body">
      <ResultGrid result={activeResult} />
    </div>
  </div>
{/if}

<style>
  .result-tabs {
    display: flex;
    flex-direction: column;
    background: var(--bg-base);
    min-height: 80px;
    flex: 1;
    min-height: 0;
  }

  .result-tabs__strip {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px 6px 0;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border);
    overflow-x: auto;
    flex-shrink: 0;
  }

  .result-tabs__tab {
    padding: 5px 10px;
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--text-secondary);
    background: transparent;
    border: 1px solid var(--border);
    border-bottom: none;
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    cursor: pointer;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .result-tabs__tab:hover { color: var(--text-primary); background: var(--bg-hover); }
  .result-tabs__tab.active {
    color: var(--text-primary);
    background: var(--bg-base);
    border-color: var(--border-strong);
  }
  .result-tabs__tab.has-error { color: var(--error); }

  .tab-error-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--error);
    flex-shrink: 0;
  }

  .result-tabs__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
</style>
