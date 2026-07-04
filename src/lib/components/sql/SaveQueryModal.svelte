<script lang="ts">
  let {
    initialName = "",
    onsave,
    oncancel,
  }: {
    initialName?: string;
    onsave: (name: string) => void;
    oncancel: () => void;
  } = $props();

  let name = $state(initialName);
  let inputEl = $state<HTMLInputElement>();

  $effect(() => {
    inputEl?.focus();
    inputEl?.select();
  });

  function submit() {
    if (!name.trim()) return;
    onsave(name.trim());
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === "Escape") oncancel();
    if (e.key === "Enter") submit();
  }
</script>

<svelte:window onkeydown={handleKey} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay" onclick={oncancel} role="presentation"></div>

<div class="modal" role="dialog" aria-modal="true">
  <h2 class="modal__title">Guardar consulta</h2>
  <label for="save-name">Nombre</label>
  <input id="save-name" bind:this={inputEl} bind:value={name} type="text" placeholder="Mi consulta" />
  <div class="modal__actions">
    <button class="btn-ghost" onclick={oncancel}>Cancelar</button>
    <button class="btn-primary" onclick={submit} disabled={!name.trim()}>Guardar</button>
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
    padding: 24px;
    min-width: 340px;
    width: 90vw;
    max-width: 420px;
  }
  .modal__title { font-size: 15px; font-weight: 600; color: var(--text-heading); margin-bottom: 16px; }
  .modal input { width: 100%; margin-bottom: 4px; }
  .modal__actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
  .btn-primary { padding: 6px 14px; }
  .btn-ghost { padding: 6px 14px; }
</style>
