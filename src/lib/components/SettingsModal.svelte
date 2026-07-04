<script lang="ts">
  import { uiSettings } from "$lib/stores/ui-settings.svelte";
  import { themeStore } from "$lib/stores/theme.svelte";

  let { onclose }: { onclose: () => void } = $props();

  type SettingsTab = "apariencia" | "editor" | "formato" | "datos";
  let active = $state<SettingsTab>("apariencia");

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: "apariencia", label: "Apariencia" },
    { id: "editor", label: "Editor" },
    { id: "formato", label: "Formato" },
    { id: "datos", label: "Datos" },
  ];

  const fontFamilies = [
    "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
    "'Fira Code', monospace",
    "'Consolas', monospace",
    "'JetBrains Mono', monospace",
    "monospace",
  ];

  function handleKey(e: KeyboardEvent) {
    if (e.key === "Escape") onclose();
  }
</script>

<svelte:window onkeydown={handleKey} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay" onclick={onclose} role="presentation"></div>

<div class="modal" role="dialog" aria-modal="true">
  <div class="modal__header">
    <h2>Ajustes</h2>
    <button class="btn-ghost" onclick={onclose} aria-label="Cerrar">×</button>
  </div>

  <div class="modal__body">
    <nav class="settings-nav">
      {#each tabs as t}
        <button class="nav-item {active === t.id ? 'active' : ''}" onclick={() => (active = t.id)}>{t.label}</button>
      {/each}
    </nav>

    <div class="settings-panel">
      {#if active === "apariencia"}
        <div class="field">
          <span class="field-label">Tema</span>
          <div class="flex gap-2">
            <button class="chip {themeStore.theme === 'dark' ? 'chip-active' : ''}" onclick={() => themeStore.set("dark")}>Oscuro</button>
            <button class="chip {themeStore.theme === 'light' ? 'chip-active' : ''}" onclick={() => themeStore.set("light")}>Claro</button>
          </div>
        </div>
      {:else if active === "editor"}
        <label class="field">
          <span class="field-label">Tamaño de fuente</span>
          <input type="number" min="8" max="32" bind:value={uiSettings.editorFontSize} />
        </label>
        <label class="field">
          <span class="field-label">Familia de fuente</span>
          <select bind:value={uiSettings.editorFontFamily}>
            {#each fontFamilies as f}<option value={f}>{f}</option>{/each}
          </select>
        </label>
        <label class="field">
          <span class="field-label">Tamaño de tab</span>
          <input type="number" min="1" max="8" bind:value={uiSettings.editorTabSize} />
        </label>
        <label class="field checkbox">
          <input type="checkbox" bind:checked={uiSettings.editorWordWrap} />
          <span>Ajuste de línea (word wrap)</span>
        </label>
        <label class="field checkbox">
          <input type="checkbox" bind:checked={uiSettings.editorLineNumbers} />
          <span>Números de línea</span>
        </label>
        <label class="field checkbox">
          <input type="checkbox" bind:checked={uiSettings.editorMinimap} />
          <span>Minimapa</span>
        </label>
      {:else if active === "formato"}
        <label class="field">
          <span class="field-label">Mayúsculas de palabras clave</span>
          <select bind:value={uiSettings.formatKeywordCase}>
            <option value="upper">MAYÚSCULAS</option>
            <option value="lower">minúsculas</option>
            <option value="preserve">Preservar</option>
          </select>
        </label>
        <label class="field">
          <span class="field-label">Ancho de tab al formatear</span>
          <input type="number" min="1" max="8" bind:value={uiSettings.formatTabWidth} />
        </label>
      {:else if active === "datos"}
        <label class="field">
          <span class="field-label">Límite por defecto (SELECT *)</span>
          <input type="number" min="1" max="100000" bind:value={uiSettings.defaultQueryLimit} />
        </label>
        <label class="field">
          <span class="field-label">Densidad de tabla</span>
          <select bind:value={uiSettings.tableDensity}>
            <option value="compact">Compacta</option>
            <option value="normal">Normal</option>
            <option value="comfortable">Cómoda</option>
          </select>
        </label>
        <label class="field">
          <span class="field-label">Texto para NULL</span>
          <input type="text" bind:value={uiSettings.nullDisplayText} />
        </label>
        <label class="field">
          <span class="field-label">Ancho máximo de celda (px)</span>
          <input type="number" min="60" max="1200" bind:value={uiSettings.cellMaxWidth} />
        </label>
        <label class="field">
          <span class="field-label">Delimitador CSV</span>
          <input type="text" maxlength="1" bind:value={uiSettings.csvDelimiter} />
        </label>
      {/if}
    </div>
  </div>
</div>

<style>
  .overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 1100; }
  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1101;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    width: 92vw;
    max-width: 560px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }
  .modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }
  .modal__header h2 { font-size: 15px; color: var(--text-heading); }
  .modal__header .btn-ghost { font-size: 20px; line-height: 1; padding: 0 6px; }

  .modal__body { display: flex; min-height: 280px; }
  .settings-nav {
    width: 140px;
    border-right: 1px solid var(--border);
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex-shrink: 0;
  }
  .nav-item {
    text-align: left;
    padding: 6px 10px;
    color: var(--text-secondary);
    border-radius: var(--radius-sm);
    font-size: 12px;
  }
  .nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
  .nav-item.active { background: var(--accent-dim); color: var(--text-primary); }

  .settings-panel { flex: 1; padding: 16px 20px; overflow-y: auto; }
  .field { display: block; margin-bottom: 16px; }
  .field-label { display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; }
  .field input[type="number"], .field input[type="text"], .field select { width: 100%; }
  .field.checkbox { display: flex; align-items: center; gap: 8px; }
  .field.checkbox input { width: auto; }
  .field.checkbox span { font-size: 13px; color: var(--text-primary); }

  .chip {
    padding: 5px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text-secondary);
    font-size: 12px;
  }
  .chip:hover { background: var(--bg-hover); }
  .chip-active { background: var(--accent); color: #fff; border-color: var(--accent); }
</style>
