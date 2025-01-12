<script lang="ts">
    import type { Log } from "./log";

    type Props = {
        log: Log;
        onOpen?: () => void;
        onClose?: () => void;
        onSetEditor?: (detail: string) => void;
    };

    let {
        log = $bindable(),
        onOpen = () => {},
        onClose = () => {},
        onSetEditor = () => {},
    }: Props = $props();

    let container = $state<HTMLDivElement>();

    async function copy(): Promise<void> {
        await navigator.clipboard.writeText(log.text);
        alert("Copied!");
    }

    function insert(): void {
        onSetEditor(log.text);
    }

    export function open(): void {
        container?.scrollIntoView({
            behavior: "smooth",
        });

        log.isOpen = true;
        onOpen();
    }

    export function close(): void {
        log.isOpen = false;
        onClose();
    }

    function toggleVisibility(): void {
        if (log.isOpen) {
            close();
            return;
        }

        open();
    }
</script>

<div class="log" bind:this={container}>
    <span
        role="button"
        tabindex="0"
        class="log-title mb-2"
        onkeydown={() => {}}
        onclick={() => toggleVisibility()}
    >
        {(log.isOpen ? "- " : "+") + log.title}
    </span>

    {#if log.isOpen}
        <div class="buttons">
            <button class="button is-info" onclick={() => copy()}>
                Copy
            </button>

            <button class="button is-info" onclick={() => insert()}>
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

    .buttons {
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
        margin: 0;
    }
</style>
