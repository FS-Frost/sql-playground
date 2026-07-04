<script lang="ts">
    import { onMount } from "svelte";
    import { themeStore } from "$lib/stores/theme.svelte";
    import { tabsStore } from "$lib/stores/tabs.svelte";
    import { schemaStore } from "$lib/stores/schema.svelte";
    import { savedQueriesStore } from "$lib/stores/saved-queries.svelte";
    import { logsStore } from "$lib/stores/logs.svelte";
    import { waitForDb, seed } from "$lib/db";
    import Toolbar from "$lib/components/layout/Toolbar.svelte";
    import Sidebar from "$lib/components/layout/Sidebar.svelte";
    import TabBar from "$lib/components/layout/TabBar.svelte";
    import SqlEditorTab from "$lib/components/sql/SqlEditorTab.svelte";
    import LogsView from "$lib/components/sql/LogsView.svelte";
    import QueryHistoryDrawer from "$lib/components/sql/QueryHistoryDrawer.svelte";
    import SaveQueryModal from "$lib/components/sql/SaveQueryModal.svelte";
    import SettingsModal from "$lib/components/SettingsModal.svelte";
    import Omnibox from "$lib/components/ui/Omnibox.svelte";
    import Toast from "$lib/components/ui/Toast.svelte";

    let dbReady = $state(false);
    let dbError = $state("");
    let sidebarCollapsed = $state(false);

    let showOmnibox = $state(false);
    let showSettings = $state(false);
    let showHistory = $state(false);
    let showHelp = $state(false);
    let saveSql = $state<string | null>(null);

    let editorTabRef = $state<SqlEditorTab>();
    let toastRef = $state<Toast>();

    const SHORTCUTS: { keys: string; desc: string }[] = [
        { keys: "Ctrl+Enter", desc: "Ejecutar selección o todo" },
        { keys: "F5", desc: "Ejecutar todo" },
        { keys: "Ctrl+Shift+F", desc: "Formatear SQL" },
        { keys: "Ctrl+S", desc: "Guardar consulta" },
        { keys: "Ctrl+K", desc: "Paleta de comandos" },
        { keys: "Ctrl+B", desc: "Mostrar/ocultar esquema" },
        { keys: "Ctrl+H", desc: "Historial / guardadas" },
        { keys: "Alt+W", desc: "Cerrar pestaña" },
        { keys: "Ctrl+Shift+T", desc: "Reabrir pestaña cerrada" },
        { keys: "F1", desc: "Esta ayuda" },
    ];

    onMount(async () => {
        themeStore.init();
        tabsStore.init();

        const ok = await waitForDb();
        if (!ok) {
            dbError = "No se pudo inicializar la base de datos. Recarga la página.";
            return;
        }
        dbReady = true;
        const seedErr = await seed();
        if (seedErr) logsStore.add("ERROR: seed", seedErr);
        schemaStore.refresh();
    });

    function insertSql(sql: string) {
        const t = tabsStore.activeTab;
        if (t?.type === "sql" && editorTabRef?.setSql) {
            editorTabRef.setSql(sql);
        } else {
            tabsStore.newSqlTab(sql);
        }
    }

    function openFile(content: string) {
        tabsStore.newSqlTab(content);
    }

    function doSave(name: string) {
        if (saveSql != null) {
            savedQueriesStore.add(name, saveSql);
            toastRef?.showToast(`Consulta "${name}" guardada`, "success");
        }
        saveSql = null;
    }

    function handleKeydown(e: KeyboardEvent) {
        const ctrl = e.ctrlKey || e.metaKey;
        if (ctrl && e.key.toLowerCase() === "k") {
            e.preventDefault();
            showOmnibox = true;
        } else if (ctrl && e.key.toLowerCase() === "b") {
            e.preventDefault();
            sidebarCollapsed = !sidebarCollapsed;
        } else if (ctrl && e.key.toLowerCase() === "h") {
            e.preventDefault();
            showHistory = true;
        } else if (e.altKey && e.key.toLowerCase() === "w") {
            e.preventDefault();
            if (tabsStore.activeId) tabsStore.closeTab(tabsStore.activeId);
        } else if (ctrl && e.shiftKey && e.key.toLowerCase() === "t") {
            e.preventDefault();
            tabsStore.restoreTab();
        } else if (e.key === "F1") {
            e.preventDefault();
            showHelp = !showHelp;
        }
    }

    const activeTab = $derived(tabsStore.activeTab);
</script>

<svelte:head>
    <title>SQL Playground</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="ide">
    <Toolbar
        onomnibox={() => (showOmnibox = true)}
        onhistory={() => (showHistory = true)}
        onsettings={() => (showSettings = true)}
    />

    <div class="ide__body">
        <Sidebar bind:collapsed={sidebarCollapsed} oninsert={insertSql} />

        <main class="ide__main">
            <TabBar onnewquery={() => tabsStore.newSqlTab()} onopenfile={(c) => openFile(c)} />

            <div class="ide__content">
                {#if !dbReady && !dbError}
                    <div class="center-msg">Cargando base de datos…</div>
                {:else if dbError}
                    <div class="center-msg error">{dbError}</div>
                {:else if activeTab}
                    {#key activeTab.id}
                        {#if activeTab.type === "sql"}
                            <SqlEditorTab bind:this={editorTabRef} tab={activeTab} onsave={(sql) => (saveSql = sql)} />
                        {:else if activeTab.type === "logs"}
                            <LogsView />
                        {/if}
                    {/key}
                {:else}
                    <div class="center-msg">Sin pestañas abiertas.</div>
                {/if}
            </div>
        </main>
    </div>
</div>

{#if showOmnibox}
    <Omnibox
        onclose={() => (showOmnibox = false)}
        onselecttable={insertSql}
        onnewquery={() => tabsStore.newSqlTab()}
        onopenlogs={() => tabsStore.openLogsTab()}
        onopensettings={() => (showSettings = true)}
        onopenhistory={() => (showHistory = true)}
    />
{/if}

{#if showHistory}
    <QueryHistoryDrawer onclose={() => (showHistory = false)} />
{/if}

{#if showSettings}
    <SettingsModal onclose={() => (showSettings = false)} />
{/if}

{#if saveSql != null}
    <SaveQueryModal onsave={doSave} oncancel={() => (saveSql = null)} />
{/if}

{#if showHelp}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="overlay" onclick={() => (showHelp = false)} role="presentation"></div>
    <div class="help-modal" role="dialog" aria-modal="true">
        <h2>Atajos de teclado</h2>
        <ul>
            {#each SHORTCUTS as s}
                <li><kbd>{s.keys}</kbd><span>{s.desc}</span></li>
            {/each}
        </ul>
        <button class="btn-primary" onclick={() => (showHelp = false)}>Cerrar</button>
    </div>
{/if}

<Toast bind:this={toastRef} />

<style>
    .ide {
        height: 100vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    .ide__body {
        flex: 1;
        display: flex;
        overflow: hidden;
    }
    .ide__main {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
    }
    .ide__content {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        position: relative;
    }
    .center-msg {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-muted);
        font-size: 14px;
    }
    .center-msg.error { color: var(--error); }

    .overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 1100; }
    .help-modal {
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
        width: 90vw;
        max-width: 420px;
    }
    .help-modal h2 { font-size: 15px; color: var(--text-heading); margin-bottom: 16px; }
    .help-modal ul { list-style: none; margin-bottom: 16px; }
    .help-modal li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 5px 0;
        font-size: 13px;
    }
    .help-modal kbd {
        font-family: var(--font-mono);
        font-size: 11px;
        padding: 2px 8px;
        background: var(--bg-active);
        border-radius: var(--radius-sm);
        color: var(--text-secondary);
    }
    .help-modal span { color: var(--text-secondary); }
    .help-modal .btn-primary { width: 100%; padding: 8px; }
</style>
