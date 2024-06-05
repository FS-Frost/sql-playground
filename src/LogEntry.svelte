<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { Log } from "./log";

    export let log: Log;

    const dispatch = createEventDispatcher<{
        open: undefined;
        close: undefined;
        setEditor: string;
    }>();

    async function copy(): Promise<void> {
        await navigator.clipboard.writeText(log.text);
        alert("Copied!");
    }

    function insert(): void {
        dispatch("setEditor", log.text);
    }

    export function open(): void {
        log.isOpen = true;
        dispatch("open");
    }

    export function close(): void {
        log.isOpen = false;
        dispatch("close");
    }

    function toggleVisibility(): void {
        if (log.isOpen) {
            close();
            return;
        }

        open();
    }
</script>

<div class="log">
    <p
        class="log-title mb-2"
        on:keydown={() => {}}
        on:click={() => toggleVisibility()}
    >
        {(log.isOpen ? "- " : "+") + log.title}
    </p>

    {#if log.isOpen}
        <div class="buttons">
            <button class="button is-info" on:click={() => copy()}>
                Copy
            </button>

            <button class="button is-info" on:click={() => insert()}>
                Insert in editor
            </button>
        </div>

        <textarea value={log.text} readonly></textarea>
    {/if}
</div>

<style>
    .log {
        margin-left: 0.5rem;
    }

    .log-title {
        color: var(--color, black);
        font-size: large;
    }

    .log-title:hover {
        cursor: pointer;
        background-color: rgb(211, 211, 211);
        color: black;
    }

    textarea {
        width: 100%;
        height: 16rem;
    }
</style>
