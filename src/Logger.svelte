<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import LogEntry from "./LogEntry.svelte";
    import type { Log } from "./log";

    const dispatch = createEventDispatcher<{
        setEditor: string;
    }>();

    let logEntries: Log[] = [];
    let logsVisible: boolean = true;

    export function addLog(log: Log): void {
        logEntries = [...logEntries, log];
    }

    export function clear(): void {
        logEntries = [];
    }

    function setEditor(text: string): void {
        dispatch("setEditor", text);
    }

    function closeAllOtherLogs(openedLogIndex: number): void {
        for (let i = 0; i < logEntries.length; i++) {
            logEntries[i].isOpen = openedLogIndex == i;
        }
    }
</script>

<div class="logger">
    <label
        class="label"
        for=""
        on:keydown={() => {}}
        on:click={() => (logsVisible = !logsVisible)}
    >
        {logsVisible ? "-" : "+"}
        Logs
    </label>

    {#if logsVisible}
        {#each logEntries as log, index (log.timestamp)}
            <LogEntry
                {log}
                on:open={() => closeAllOtherLogs(index)}
                on:setEditor={(e) => setEditor(e.detail)}
            />
        {/each}
    {/if}
</div>

<style>
    label {
        margin-top: 0.5rem;
        width: 100%;
        border-radius: 0.2rem;
        color: var(--color, black);
    }

    label:hover {
        background-color: var(
            --label-hover-background-color,
            rgb(211, 211, 211)
        );
        cursor: pointer;
    }
</style>
