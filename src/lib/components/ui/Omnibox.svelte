<script lang="ts">
  import { schemaStore } from "$lib/stores/schema.svelte";
  import { tabsStore } from "$lib/stores/tabs.svelte";
  import { savedQueriesStore } from "$lib/stores/saved-queries.svelte";
  import { queryHistoryStore } from "$lib/stores/query-history.svelte";
  import { themeStore } from "$lib/stores/theme.svelte";

  let {
    onclose,
    onselecttable,
    onnewquery,
    onopenlogs,
    onopensettings,
    onopenhistory,
  }: {
    onclose: () => void;
    onselecttable: (name: string) => void;
    onnewquery: () => void;
    onopenlogs: () => void;
    onopensettings: () => void;
    onopenhistory: () => void;
  } = $props();

  interface Item {
    key: string;
    icon: string;
    label: string;
    hint?: string;
    run: () => void;
  }

  let query = $state("");
  let selectedIdx = $state(0);
  let inputEl = $state<HTMLInputElement>();

  $effect(() => {
    inputEl?.focus();
  });

  function fuzzy(text: string, term: string): boolean {
    if (!term) return true;
    text = text.toLowerCase();
    let i = 0;
    for (const ch of term) {
      i = text.indexOf(ch, i);
      if (i === -1) return false;
      i++;
    }
    return true;
  }

  function close() {
    onclose();
  }

  const actions = $derived<Item[]>([
    { key: "a-new", icon: "📝", label: "Nueva consulta", run: () => { onnewquery(); close(); } },
    { key: "a-logs", icon: "📄", label: "Abrir logs", run: () => { onopenlogs(); close(); } },
    { key: "a-history", icon: "🕘", label: "Abrir historial", run: () => { onopenhistory(); close(); } },
    { key: "a-settings", icon: "⚙️", label: "Abrir ajustes", run: () => { onopensettings(); close(); } },
    { key: "a-theme", icon: "🌓", label: "Cambiar tema (claro/oscuro)", run: () => { themeStore.toggle(); close(); } },
    { key: "a-clear-hist", icon: "🧹", label: "Limpiar historial", run: () => { queryHistoryStore.clear(); close(); } },
  ]);

  const items = $derived.by(() => {
    const raw = query.trim();
    if (raw.startsWith(">")) {
      const term = raw.slice(1).trim().toLowerCase();
      return actions.filter((a) => fuzzy(a.label, term));
    }
    const term = raw.toLowerCase();
    const out: Item[] = [];

    for (const t of schemaStore.tables) {
      if (fuzzy(t.name, term))
        out.push({
          key: `tbl-${t.name}`,
          icon: "🗂️",
          label: t.name,
          hint: "tabla · SELECT *",
          run: () => { onselecttable(t.name); close(); },
        });
    }
    for (const tab of tabsStore.tabs) {
      if (fuzzy(tab.title, term))
        out.push({
          key: `tab-${tab.id}`,
          icon: "📑",
          label: tab.title,
          hint: "pestaña",
          run: () => { tabsStore.activateTab(tab.id); close(); },
        });
    }
    for (const s of savedQueriesStore.items) {
      if (fuzzy(s.name, term) || fuzzy(s.sql, term))
        out.push({
          key: `sav-${s.id}`,
          icon: "★",
          label: s.name,
          hint: "guardada",
          run: () => { savedQueriesStore.loadInto(s); close(); },
        });
    }
    for (const h of queryHistoryStore.recentSuccessful(15)) {
      if (fuzzy(h.sql, term))
        out.push({
          key: `his-${h.id}`,
          icon: "🕘",
          label: h.sql.replace(/\s+/g, " ").slice(0, 60),
          hint: "reciente",
          run: () => { queryHistoryStore.loadInto(h); close(); },
        });
    }
    return out.slice(0, 60);
  });

  // Mantener selección dentro de rango cuando cambian los items.
  $effect(() => {
    if (selectedIdx >= items.length) selectedIdx = Math.max(0, items.length - 1);
  });

  function handleKey(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIdx = Math.min(items.length - 1, selectedIdx + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIdx = Math.max(0, selectedIdx - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[selectedIdx]?.run();
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay" onclick={close} role="presentation"></div>

<div class="omnibox" role="dialog" aria-modal="true">
  <input
    bind:this={inputEl}
    bind:value={query}
    class="omnibox__input"
    type="text"
    placeholder="Buscar tabla / pestaña / guardada… (usa > para acciones)"
    onkeydown={handleKey}
  />
  <div class="omnibox__list">
    {#if items.length === 0}
      <div class="omnibox__empty">Sin resultados</div>
    {/if}
    {#each items as item, i (item.key)}
      <!-- svelte-ignore a11y_mouse_events_have_key_events -->
      <button
        class="omnibox__item {i === selectedIdx ? 'selected' : ''}"
        onmousemove={() => (selectedIdx = i)}
        onclick={() => item.run()}
      >
        <span class="oi-icon">{item.icon}</span>
        <span class="oi-label truncate">{item.label}</span>
        {#if item.hint}<span class="oi-hint">{item.hint}</span>{/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .overlay { position: fixed; inset: 0; background: var(--overlay); z-index: 1200; }
  .omnibox {
    position: fixed;
    top: 15%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1201;
    width: 92vw;
    max-width: 560px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .omnibox__input {
    border: none;
    border-bottom: 1px solid var(--border);
    border-radius: 0;
    padding: 12px 16px;
    font-size: 14px;
    background: transparent;
  }
  .omnibox__input:focus { border-color: var(--border); }
  .omnibox__list { max-height: 420px; overflow-y: auto; padding: 6px; }
  .omnibox__empty { padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px; }
  .omnibox__item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 12px;
    text-align: left;
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: 13px;
  }
  .omnibox__item.selected { background: var(--accent-dim); }
  .oi-icon { flex-shrink: 0; }
  .oi-label { flex: 1; min-width: 0; }
  .oi-hint { flex-shrink: 0; font-size: 11px; color: var(--text-muted); }
</style>
