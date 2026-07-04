<script lang="ts">
  import { tabsStore } from "$lib/stores/tabs.svelte";
  import type { Tab } from "$lib/types";

  let {
    onnewquery,
    onopenfile,
  }: {
    onnewquery?: () => void;
    onopenfile?: (content: string, filename: string) => void;
  } = $props();

  function closeTab(id: string) {
    tabsStore.closeTab(id);
  }

  let fileInput: HTMLInputElement | undefined = $state(undefined);

  function triggerFileOpen() {
    fileInput?.click();
  }

  function handleFileChange(e: Event) {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onopenfile?.(reader.result as string, file.name);
    };
    reader.readAsText(file);
    (e.currentTarget as HTMLInputElement).value = "";
  }

  const icons: Record<string, string> = {
    sql: "📝",
    logs: "📄",
  };

  let editingTabId = $state<string | null>(null);
  let editingValue = $state("");
  let editInput: HTMLInputElement | undefined = $state(undefined);

  function startRename(tab: Tab) {
    if (tab.type === "logs") return;
    editingTabId = tab.id;
    editingValue = tab.title;
    setTimeout(() => editInput?.select(), 0);
  }

  function commitRename() {
    if (editingTabId) tabsStore.renameTab(editingTabId, editingValue);
    editingTabId = null;
  }

  function cancelRename() {
    editingTabId = null;
  }

  function handleRenameKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitRename();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelRename();
    }
  }

  // Drag-and-drop reorder
  let draggedId = $state<string | null>(null);
  let dragOverId = $state<string | null>(null);

  function handleDragStart(e: DragEvent, tabId: string) {
    draggedId = tabId;
    e.dataTransfer!.effectAllowed = "move";
  }
  function handleDragOver(e: DragEvent, tabId: string) {
    e.preventDefault();
    if (draggedId && draggedId !== tabId) dragOverId = tabId;
  }
  function handleDrop(e: DragEvent, tabId: string) {
    e.preventDefault();
    if (draggedId && tabId !== draggedId) tabsStore.reorderTab(draggedId, tabId);
    draggedId = null;
    dragOverId = null;
  }
  function handleDragEnd() {
    draggedId = null;
    dragOverId = null;
  }

  // Historial de pestañas cerradas (reciente primero)
  let showHistory = $state(false);
  let historyWrap: HTMLDivElement | undefined = $state(undefined);
  const closedHistory = $derived([...tabsStore.closedHistory].reverse());

  function restoreFromHistory(id: string) {
    tabsStore.restoreTab(id);
    showHistory = false;
  }

  function formatClosedAt(ts: number): string {
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60000);
    if (min < 1) return "hace un momento";
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h} h`;
    return `hace ${Math.floor(h / 24)} d`;
  }

  function handleWindowClick(e: MouseEvent) {
    if (showHistory && historyWrap && !historyWrap.contains(e.target as Node)) showHistory = false;
  }
  function handleWindowKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && showHistory) showHistory = false;
  }
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<div class="tabbar" role="tablist">
  {#each tabsStore.tabs as tab (tab.id)}
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <div
      class="tab {tab.id === tabsStore.activeId ? 'tab--active' : ''} {tab.id === dragOverId && tab.id !== draggedId ? 'tab--drag-over' : ''}"
      role="tab"
      aria-selected={tab.id === tabsStore.activeId}
      draggable="true"
      onclick={() => tabsStore.activateTab(tab.id)}
      onauxclick={(e) => { if (e.button === 1) { e.preventDefault(); closeTab(tab.id); } }}
      onkeydown={(e) => e.key === "Enter" && tabsStore.activateTab(tab.id)}
      ondragstart={(e) => handleDragStart(e, tab.id)}
      ondragover={(e) => handleDragOver(e, tab.id)}
      ondrop={(e) => handleDrop(e, tab.id)}
      ondragend={handleDragEnd}
      title={tab.title}
    >
      <span class="tab__icon">{icons[tab.type] ?? "📄"}</span>
      <span class="tab__text">
        {#if editingTabId === tab.id}
          <input
            bind:this={editInput}
            bind:value={editingValue}
            class="tab__rename-input"
            onblur={commitRename}
            onkeydown={handleRenameKeydown}
            onclick={(e) => e.stopPropagation()}
          />
        {:else}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <span
            class="tab__title truncate"
            ondblclick={(e) => { e.stopPropagation(); startRename(tab); }}
            title={tab.type !== "logs" ? "Doble clic para renombrar" : tab.title}
          >{tab.title}</span>
        {/if}
      </span>
      <button
        class="tab__close btn-ghost"
        onclick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
        aria-label="Cerrar tab"
        title="Cerrar (Alt+W o clic central)"
      >×</button>
    </div>
  {/each}

  <button class="tab-new btn-ghost" onclick={onnewquery} title="Nueva consulta" aria-label="Nueva consulta">+</button>

  <button class="tab-new btn-ghost" onclick={triggerFileOpen} title="Abrir archivo .sql" aria-label="Abrir archivo .sql">📂</button>

  <input bind:this={fileInput} type="file" accept=".sql,.SQL" style="display:none" onchange={handleFileChange} />

  <div class="history-wrap" bind:this={historyWrap}>
    <button
      class="tab-new btn-ghost"
      onclick={(e) => { e.stopPropagation(); showHistory = !showHistory; }}
      disabled={closedHistory.length === 0}
      title="Pestañas cerradas recientemente (Ctrl+Shift+T restaura la última)"
      aria-label="Historial de pestañas cerradas"
    >🕘</button>

    {#if showHistory}
      <div class="history-menu" role="menu">
        <div class="history-header">
          <span>Pestañas cerradas</span>
          <button class="btn-ghost history-clear" onclick={() => tabsStore.clearClosedHistory()}>Limpiar</button>
        </div>
        {#if closedHistory.length === 0}
          <div class="history-empty">Sin pestañas cerradas</div>
        {:else}
          {#each closedHistory as entry (entry.tab.id + ":" + entry.closedAt)}
            <button class="history-item" role="menuitem" onclick={() => restoreFromHistory(entry.tab.id)}>
              <span class="history-icon">{icons[entry.tab.type] ?? "📄"}</span>
              <span class="history-text">
                <span class="history-title truncate">{entry.tab.title}</span>
              </span>
              <span class="history-time">{formatClosedAt(entry.closedAt)}</span>
            </button>
          {/each}
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .tabbar {
    height: var(--tabbar-height);
    background: var(--bg-base);
    border-bottom: 1px solid var(--border-strong);
    display: flex;
    align-items: stretch;
    overflow-x: auto;
    overflow-y: hidden;
    flex-shrink: 0;
    scrollbar-width: thin;
  }
  .tabbar::-webkit-scrollbar { height: 3px; }

  .tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 12px;
    border-right: 1px solid var(--border);
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    white-space: nowrap;
    min-width: 0;
    max-width: 200px;
    flex-shrink: 0;
    font-size: 12px;
    position: relative;
    user-select: none;
  }
  .tab:hover { background: var(--bg-hover); color: var(--text-primary); }
  .tab--drag-over { border-left: 2px solid var(--accent); }
  .tab--active {
    background: var(--bg-surface);
    color: var(--text-primary);
    border-bottom: 2px solid var(--accent);
  }

  .tab__icon { font-size: 12px; flex-shrink: 0; }
  .tab__text {
    flex: 1;
    min-width: 0;
    max-width: 140px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .tab__title { font-size: 12px; }

  .tab__rename-input {
    font-size: 12px;
    font-family: inherit;
    background: var(--bg-active);
    color: var(--text-primary);
    border: 1px solid var(--accent);
    border-radius: 3px;
    padding: 0 4px;
    width: 100%;
    height: 20px;
    outline: none;
  }

  .tab__close {
    padding: 0 2px;
    font-size: 15px;
    color: var(--text-muted);
    flex-shrink: 0;
    line-height: 1;
    border-radius: 3px;
    opacity: 0;
    transition: opacity 0.1s;
  }
  .tab:hover .tab__close,
  .tab--active .tab__close { opacity: 1; }
  .tab__close:hover { background: var(--bg-active); color: var(--text-primary); }

  .tab-new {
    padding: 0 12px;
    font-size: 18px;
    color: var(--text-muted);
    border-right: 1px solid var(--border);
    height: 100%;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    line-height: 1;
  }
  .tab-new:hover:not(:disabled) { background: var(--bg-hover); color: var(--text-primary); }
  .tab-new:disabled { opacity: 0.3; cursor: not-allowed; }

  .history-wrap { display: flex; align-items: stretch; flex-shrink: 0; }

  .history-menu {
    position: fixed;
    top: var(--tabbar-height);
    right: 4px;
    z-index: 100;
    width: 280px;
    max-height: 360px;
    overflow-y: auto;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    padding: 4px;
  }
  .history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 8px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
  }
  .history-clear {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 3px;
    text-transform: none;
    letter-spacing: 0;
  }
  .history-clear:hover { background: var(--bg-active); color: var(--text-primary); }
  .history-empty { padding: 12px 8px; font-size: 12px; color: var(--text-muted); text-align: center; }
  .history-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 8px;
    background: transparent;
    color: var(--text-secondary);
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    text-align: left;
    font-size: 12px;
  }
  .history-item:hover { background: var(--bg-hover); color: var(--text-primary); }
  .history-icon { flex-shrink: 0; font-size: 13px; }
  .history-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .history-title { font-size: 12px; }
  .history-time { flex-shrink: 0; font-size: 10px; color: var(--text-muted); white-space: nowrap; }
</style>
