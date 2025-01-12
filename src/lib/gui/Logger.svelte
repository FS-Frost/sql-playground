<script lang="ts">
    import LogEntry from "./LogEntry.svelte";
    import type { Log } from "./log";

    type Props = {
        onSetEditor?: (detail: string) => void;
    };

    let { onSetEditor = () => {} }: Props = $props();

    let logEntries = $state<Log[]>([]);
    let logsVisible = $state<boolean>(true);

    export function addLog(log: Log): void {
        logEntries = [...logEntries, log];
    }

    export function clear(): void {
        logEntries = [];
    }

    function closeAllOtherLogs(openedLogIndex: number): void {
        for (let i = 0; i < logEntries.length; i++) {
            logEntries[i].isOpen = openedLogIndex == i;
        }
    }
</script>

<div class="logger">
    <span
        class="label"
        role="button"
        tabindex="0"
        onkeydown={() => {}}
        onclick={() => (logsVisible = !logsVisible)}
    >
        {logsVisible ? "-" : "+"}
        Logs
    </span>

    {#if logsVisible}
        {#each logEntries as log, index (log.timestamp)}
            <LogEntry
                bind:log={logEntries[index]}
                onOpen={() => closeAllOtherLogs(index)}
                onSetEditor={(detail) => onSetEditor(detail)}
            />
        {/each}
    {/if}
</div>

<style>
    span {
        margin-top: 0.5rem;
        width: 100%;
        border-radius: 0.2rem;
        color: var(--color, black);
    }

    span:hover {
        background-color: var(
            --label-hover-background-color,
            rgb(211, 211, 211)
        );
        cursor: pointer;
    }
</style>
