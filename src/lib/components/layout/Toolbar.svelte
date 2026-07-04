<script lang="ts">
  import { themeStore } from "$lib/stores/theme.svelte";

  let {
    onomnibox,
    onhistory,
    onsettings,
  }: {
    onomnibox: () => void;
    onhistory: () => void;
    onsettings: () => void;
  } = $props();
</script>

<header class="toolbar">
  <div class="toolbar__brand">
    <span class="brand-mark">▚</span>
    <span class="brand-name">SQL Playground</span>
  </div>

  <button class="omnibox-trigger" onclick={onomnibox} title="Buscar / comandos">
    <span>Buscar tablas, acciones…</span>
    <kbd>Ctrl K</kbd>
  </button>

  <div class="toolbar__actions">
    <button class="btn-ghost icon-btn" onclick={onhistory} title="Historial (Ctrl+H)" aria-label="Historial">🕘</button>
    <button class="btn-ghost icon-btn" onclick={onsettings} title="Ajustes" aria-label="Ajustes">⚙️</button>
    <button
      class="btn-ghost icon-btn"
      onclick={() => themeStore.toggle()}
      title="Cambiar tema"
      aria-label="Cambiar tema"
    >
      {#if themeStore.theme === "dark"}
        <!-- sol -->
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      {:else}
        <!-- luna -->
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      {/if}
    </button>
  </div>
</header>

<style>
  .toolbar {
    height: var(--toolbar-height);
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 0 12px;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border-strong);
    flex-shrink: 0;
  }

  .toolbar__brand {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .brand-mark { color: var(--accent); font-size: 16px; }
  .brand-name { font-weight: 600; color: var(--text-heading); font-size: 13px; }

  .omnibox-trigger {
    flex: 1;
    max-width: 440px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 5px 12px;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text-muted);
    font-size: 12px;
  }
  .omnibox-trigger:hover { border-color: var(--border-strong); background: var(--bg-hover); }
  .omnibox-trigger kbd {
    font-family: var(--font-mono);
    font-size: 10px;
    padding: 1px 6px;
    background: var(--bg-active);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
  }

  .toolbar__actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 28px;
    color: var(--text-secondary);
    font-size: 15px;
  }
  .icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
</style>
