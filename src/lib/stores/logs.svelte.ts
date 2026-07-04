import { randomUUID } from "$lib/storage";

export interface LogEntry {
    id: string;
    timestamp: number;
    title: string;
    text: string;
}

const MAX = 300;

function createLogsStore() {
    let _entries = $state<LogEntry[]>([]);

    function add(title: string, text: string): void {
        if (!text) return;
        const time = new Date().toLocaleTimeString();
        _entries = [
            ...
            _entries,
            { id: randomUUID(), timestamp: Date.now(), title: `${time}: ${title}`, text },
        ].slice(-MAX);
    }

    function clear(): void {
        _entries = [];
    }

    return {
        get entries() {
            return _entries;
        },
        add,
        clear,
    };
}

export const logsStore = createLogsStore();
