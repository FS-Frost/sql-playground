<script lang="ts">
  let {
    message,
    detail = '',
    confirmLabel = 'Confirmar',
    danger = false,
    onconfirm,
    oncancel
  }: {
    message: string;
    detail?: string;
    confirmLabel?: string;
    danger?: boolean;
    onconfirm: () => void;
    oncancel: () => void;
  } = $props();

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') oncancel();
    if (e.key === 'Enter') onconfirm();
  }
</script>

<svelte:window onkeydown={handleKey} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay" onclick={oncancel} role="presentation"></div>

<div class="modal" role="dialog" aria-modal="true">
  <div class="modal__header">
    {#if danger}
      <span class="modal__icon">⚠️</span>
    {/if}
    <h2 class="modal__title">{message}</h2>
  </div>
  {#if detail}
    <p class="modal__detail">{detail}</p>
  {/if}
  <div class="modal__actions">
    <button class="btn-ghost" onclick={oncancel}>Cancelar</button>
    <button
      class="{danger ? 'btn-danger-solid' : 'btn-primary'}"
      onclick={onconfirm}
    >{confirmLabel}</button>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1100;
  }

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
    min-width: 320px;
    max-width: 480px;
    width: 90vw;
  }

  .modal__header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .modal__icon { font-size: 20px; flex-shrink: 0; }

  .modal__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-heading);
    margin: 0;
  }

  .modal__detail {
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 20px;
    line-height: 1.5;
  }

  .modal__actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 20px;
  }

  .btn-danger-solid {
    background: var(--error);
    color: #fff;
    border: none;
    padding: 6px 14px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 13px;
  }
  .btn-danger-solid:hover { opacity: 0.85; }
</style>
