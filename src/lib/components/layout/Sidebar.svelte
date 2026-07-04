<script lang="ts">
  import { schemaStore } from "$lib/stores/schema.svelte";
  import { uiSettings } from "$lib/stores/ui-settings.svelte";
  import { getStoredNumber, setString } from "$lib/storage";

  let {
    collapsed = $bindable(false),
    oninsert,
  }: {
    collapsed?: boolean;
    oninsert: (sql: string) => void;
  } = $props();

  const WIDTH_KEY = "sqlpg:sidebarWidth";
  let width = $state(getStoredNumber(WIDTH_KEY, 260));
  let search = $state("");
  let expanded = $state<Set<string>>(new Set());

  const filtered = $derived(
    schemaStore.tables.filter((t) => t.name.toLowerCase().includes(search.trim().toLowerCase())),
  );

  function toggleTable(name: string) {
    const next = new Set(expanded);
    next.has(name) ? next.delete(name) : next.add(name);
    expanded = next;
  }

  function selectTable(name: string) {
    const q = `SELECT * FROM "${name}" LIMIT ${uiSettings.defaultQueryLimit};`;
    oninsert(q);
  }

  // Resize
  let resizing = false;
  function startResize(e: MouseEvent) {
    e.preventDefault();
    resizing = true;
    const startX = e.clientX;
    const startW = width;
    function onMove(ev: MouseEvent) {
      if (!resizing) return;
      width = Math.max(180, Math.min(480, startW + (ev.clientX - startX)));
    }
    function onUp() {
      resizing = false;
      setString(WIDTH_KEY, String(width));
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }
</script>

{#if collapsed}
  <div class="sidebar-rail">
    <button class="rail-btn btn-ghost" title="Mostrar esquema (Ctrl+B)" onclick={() => (collapsed = false)}>▸</button>
  </div>
{:else}
  <aside class="sidebar" style="width: {width}px">
    <div class="sidebar__header">
      <span class="sidebar__title">ESQUEMA</span>
      <div class="flex gap-1">
        <button class="btn-ghost icon-btn" title="Refrescar" onclick={() => schemaStore.refresh()}>⟳</button>
        <button class="btn-ghost icon-btn" title="Ocultar (Ctrl+B)" onclick={() => (collapsed = true)}>◂</button>
      </div>
    </div>

    <div class="sidebar__search">
      <input type="text" placeholder="Buscar tabla…" bind:value={search} />
    </div>

    <div class="sidebar__tree">
      {#if filtered.length === 0}
        <div class="tree-empty">Sin tablas</div>
      {/if}
      {#each filtered as table (table.name)}
        <div class="tree-node">
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="tree-table">
            <button class="tree-caret btn-ghost" onclick={() => toggleTable(table.name)} aria-label="Expandir">
              {expanded.has(table.name) ? "▾" : "▸"}
            </button>
            <button class="tree-table-name" ondblclick={() => selectTable(table.name)} onclick={() => toggleTable(table.name)} title="Doble clic: SELECT *">
              <span class="tree-icon">🗂️</span>
              <span class="truncate">{table.name}</span>
            </button>
            <button class="tree-run btn-ghost" title="SELECT * FROM {table.name}" onclick={() => selectTable(table.name)}>▷</button>
          </div>
          {#if expanded.has(table.name)}
            <div class="tree-columns">
              {#each table.columns as col (col.name)}
                <div class="tree-col" title="{col.type}{col.pk ? ' · PK' : ''}{col.notnull ? ' · NOT NULL' : ''}">
                  <span class="col-name truncate">{col.pk ? "🔑 " : ""}{col.name}</span>
                  <span class="col-type">{col.type}</span>
                </div>
              {/each}
              {#if table.columns.length === 0}
                <div class="tree-col"><span class="col-name text-muted">sin columnas</span></div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="sidebar__resize" onmousedown={startResize}></div>
  </aside>
{/if}

<style>
  .sidebar {
    position: relative;
    height: 100%;
    background: var(--bg-surface);
    border-right: 1px solid var(--border-strong);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .sidebar-rail {
    width: 28px;
    height: 100%;
    background: var(--bg-surface);
    border-right: 1px solid var(--border-strong);
    display: flex;
    justify-content: center;
    padding-top: 8px;
    flex-shrink: 0;
  }
  .rail-btn { font-size: 14px; color: var(--text-muted); }

  .sidebar__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border-bottom: 1px solid var(--border);
  }
  .sidebar__title {
    font-size: 11px;
    letter-spacing: 0.06em;
    color: var(--text-muted);
  }
  .icon-btn { font-size: 13px; padding: 2px 6px; color: var(--text-muted); }
  .icon-btn:hover { color: var(--text-primary); background: var(--bg-hover); }

  .sidebar__search { padding: 8px 10px; }
  .sidebar__search input { width: 100%; }

  .sidebar__tree { flex: 1; overflow: auto; padding: 4px 6px; }
  .tree-empty { padding: 12px; text-align: center; color: var(--text-muted); font-size: 12px; }

  .tree-table {
    display: flex;
    align-items: center;
    gap: 2px;
    border-radius: var(--radius-sm);
  }
  .tree-table:hover { background: var(--bg-hover); }
  .tree-caret { padding: 2px 4px; color: var(--text-muted); font-size: 10px; }
  .tree-table-name {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 4px;
    color: var(--text-primary);
    text-align: left;
    font-size: 12px;
    min-width: 0;
  }
  .tree-icon { flex-shrink: 0; }
  .tree-run { opacity: 0; padding: 2px 6px; color: var(--accent); font-size: 11px; }
  .tree-table:hover .tree-run { opacity: 1; }

  .tree-columns { padding: 2px 0 4px 22px; }
  .tree-col {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 2px 6px;
    font-size: 11px;
    font-family: var(--font-mono);
  }
  .col-name { color: var(--text-secondary); min-width: 0; }
  .col-type { color: var(--text-muted); font-size: 10px; flex-shrink: 0; }

  .sidebar__resize {
    position: absolute;
    top: 0;
    right: -3px;
    width: 6px;
    height: 100%;
    cursor: col-resize;
    z-index: 5;
  }
  .sidebar__resize:hover { background: var(--accent-dim); }
</style>
