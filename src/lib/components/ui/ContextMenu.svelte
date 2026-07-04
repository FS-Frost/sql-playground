<script module lang="ts">
  export interface MenuItem {
    label: string;
    action?: () => void;
    danger?: boolean;
    divider?: boolean;
    disabled?: boolean;
    children?: MenuItem[];
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte';

  let {
    items,
    x,
    y,
    onclose
  }: {
    items: MenuItem[];
    x: number;
    y: number;
    onclose: () => void;
  } = $props();

  let menuEl: HTMLElement;
  let pos = $state({ x, y });

  onMount(() => {
    const margin = 8;
    const rect = menuEl.getBoundingClientRect();
    pos = {
      x: Math.max(margin, Math.min(pos.x, window.innerWidth - rect.width - margin)),
      y: Math.max(margin, Math.min(pos.y, window.innerHeight - rect.height - margin))
    };
  });

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') onclose();
  }

  let submenuOpenIdx = $state<number | null>(null);
  let submenuTriggerRect: DOMRect | null = null;
  let submenuPos = $state({ x: 0, y: 0 });
  let submenuEl: HTMLElement | undefined = $state();
  let submenuTimer: ReturnType<typeof setTimeout> | null = null;

  function openSubmenu(e: MouseEvent, idx: number) {
    if (submenuTimer) clearTimeout(submenuTimer);
    submenuTriggerRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    submenuPos = { x: submenuTriggerRect.right + 2, y: submenuTriggerRect.top };
    submenuOpenIdx = idx;
  }

  function scheduleCloseSubmenu() {
    if (submenuTimer) clearTimeout(submenuTimer);
    submenuTimer = setTimeout(() => { submenuOpenIdx = null; }, 150);
  }

  function cancelCloseSubmenu() {
    if (submenuTimer) clearTimeout(submenuTimer);
  }

  $effect(() => {
    if (submenuOpenIdx === null || !submenuEl || !submenuTriggerRect) return;
    const margin = 8;
    const rect = submenuEl.getBoundingClientRect();
    let nx = submenuPos.x;
    let ny = submenuPos.y;
    if (rect.right > window.innerWidth - margin) {
      nx = submenuTriggerRect.left - rect.width - 2;
    }
    if (rect.bottom > window.innerHeight - margin) {
      ny = Math.max(margin, window.innerHeight - rect.height - margin);
    }
    if (nx !== submenuPos.x || ny !== submenuPos.y) {
      submenuPos = { x: nx, y: ny };
    }
  });
</script>

<svelte:window onkeydown={handleKey} />
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay" onclick={onclose} role="presentation"></div>
<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<menu bind:this={menuEl} class="context-menu" style="left: {pos.x}px; top: {pos.y}px" role="menu">
  {#each items as item, idx}
    {#if item.divider}
      <hr class="divider" />
    {:else if item.children}
      <li
        role="menuitem"
        onmouseenter={(e) => openSubmenu(e, idx)}
        onmouseleave={scheduleCloseSubmenu}
      >
        <button class="menu-item menu-item--parent" disabled={item.disabled}>
          {item.label}
          <span class="submenu-arrow">▸</span>
        </button>
      </li>
    {:else}
      <li role="menuitem">
        <button
          class="menu-item {item.danger ? 'menu-item--danger' : ''}"
          disabled={item.disabled}
          onclick={() => { if (item.disabled) return; item.action?.(); onclose(); }}
        >
          {item.label}
        </button>
      </li>
    {/if}
  {/each}
</menu>

{#if submenuOpenIdx !== null && items[submenuOpenIdx].children}
  <ul
    bind:this={submenuEl}
    class="context-menu submenu-flyout"
    style="left: {submenuPos.x}px; top: {submenuPos.y}px"
    role="menu"
    onmouseenter={cancelCloseSubmenu}
    onmouseleave={scheduleCloseSubmenu}
  >
    {#each items[submenuOpenIdx].children ?? [] as child}
      <li role="menuitem">
        <button
          class="menu-item {child.danger ? 'menu-item--danger' : ''}"
          disabled={child.disabled}
          onclick={() => { if (child.disabled) return; child.action?.(); onclose(); }}
        >
          {child.label}
        </button>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 999;
  }

  .context-menu {
    position: fixed;
    z-index: 1000;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    padding: 4px 0;
    min-width: 160px;
    list-style: none;
  }

  .menu-item {
    display: block;
    width: 100%;
    text-align: left;
    padding: 6px 14px;
    background: transparent;
    color: var(--text-primary);
    border-radius: 0;
  }

  .menu-item:hover:not(:disabled) { background: var(--bg-hover); }
  .menu-item--danger { color: var(--error); }
  .menu-item:disabled { opacity: 0.5; cursor: not-allowed; }

  .divider {
    border: none;
    border-top: 1px solid var(--border);
    margin: 4px 0;
  }

  .menu-item--parent {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .submenu-arrow {
    color: var(--text-muted);
    font-size: 11px;
  }
</style>
