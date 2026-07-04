<script module lang="ts">
  export type ToastType = 'success' | 'error' | 'info' | 'warning';
  export interface ToastItem {
    id: string;
    type: ToastType;
    message: string;
  }
</script>

<script lang="ts">
  let toasts = $state<ToastItem[]>([]);
  let counter = 0;

  export function showToast(message: string, type: ToastType = 'info') {
    const id = `${Date.now()}-${counter++}`;
    toasts = [...toasts, { id, type, message }];
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
    }, 4000);
  }
</script>

<div class="toast-container" role="region" aria-label="Notificaciones">
  {#each toasts as toast (toast.id)}
    <div class="toast toast--{toast.type}" role="alert">
      <span>{toast.message}</span>
      <button class="toast__close btn-ghost" onclick={() => (toasts = toasts.filter((t) => t.id !== toast.id))} aria-label="Cerrar">×</button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 1000;
    max-width: 400px;
  }

  .toast {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    border-radius: var(--radius);
    border-left: 3px solid;
    background: var(--bg-elevated);
    box-shadow: var(--shadow);
    animation: slide-in 0.2s ease;
    font-size: 13px;
  }

  .toast--success { border-color: var(--success); }
  .toast--error   { border-color: var(--error); }
  .toast--warning { border-color: var(--warning); }
  .toast--info    { border-color: var(--accent); }

  .toast__close {
    padding: 0 4px;
    font-size: 16px;
    line-height: 1;
    flex-shrink: 0;
  }

  @keyframes slide-in {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
</style>
