<script lang="ts">
    import { onMount } from "svelte";
    import { waitUntil } from "./utils";
    import type { Database, QueryExecResult } from "sql.js";
    import { format } from "sql-formatter";
    import ResultTable from "./ResultTable.svelte";
    import SqlEditor from "./SqlEditor.svelte";
    import { z } from "zod";

    export let style: string;

    const queryShowTables = "SELECT * FROM sqlite_master WHERE type='table';";

    let db: Database;
    let query: string = `SELECT * FROM todo ORDER BY userId, completed DESC, title;`;
    let results: QueryExecResult[] = [];
    let logs: string[] = [];
    let editorIsVisible = true;
    let logIsVisible = true;
    let resultsAreVisible = true;
    let sqlEditor: SqlEditor;

    $: joinLogs = logs.reverse().join("\n");

    onMount(async () => {
        showLog("-- Waiting for database...");
        await waitUntil(() => window.db != null, 100, 3 * 1000);

        db = window.db;
        showLog("-- Database found!");
        await seed();
        await sqlEditor.init();
        formatEditor();
    });

    async function seed() {
        exec(`CREATE TABLE todo (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            title VARCHAR (255),
            completed INTEGER (1)
        )`);

        const todo = z.object({
            userId: z.number(),
            id: z.number(),
            title: z.string(),
            completed: z.boolean(),
        });

        const getTodosResponse = todo.array();

        const response = await fetch(
            "https://jsonplaceholder.typicode.com/todos",
        );
        const rawBody = await response.text();

        if (!response.ok) {
            showLog(
                `error seeding database, status ${response.status}: ${rawBody}`,
            );
            return;
        }

        const jsonBody = JSON.parse(rawBody);
        const parseResult = getTodosResponse.safeParse(jsonBody);

        if (!parseResult.success) {
            const parseError = parseResult.error.errors[0];
            const msg = `${parseError.path.join(".")}: ${parseError.message}; ${
                parseError.code
            }`;
            showLog(msg);
            return;
        }

        const todos = parseResult.data;
        let query = "";

        for (let i = 0; i < todos.length; i++) {
            const todo = todos[i];
            query += `
                INSERT INTO todo (ID, userId, title, completed)
                VALUES (${todo.id}, ${todo.userId}, '${todo.title}', ${
                    todo.completed ? 1 : 0
                });
            `;
        }

        exec(query);
    }

    function formatEditor() {
        try {
            query = format(query, {
                language: "sqlite",
                newlineBeforeSemicolon: true,
                tabWidth: 4,
                linesBetweenQueries: 1,
                keywordCase: "upper",
            });
        } catch (error) {
            showLog(`-- format error: ${error}`);
        }

        if (sqlEditor != null) {
            sqlEditor.setValue(query);
        }
    }

    function exec(query: string) {
        if (query == null || query == "") {
            return;
        }

        results = [];

        try {
            console.log(query);
            showLog(query);
            results = db.exec(query);

            if (results.length > 0) {
                resultsAreVisible = true;
            }
        } catch (error) {
            console.error(error);
            showLog(`-- ${error}`);
            return;
        }

        let msg = `Results: ${results.length}`;
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            msg += `\n  #${i + 1}. cols ${result.columns.length} x rows ${
                result.values.length
            }`;
        }

        showLog(msg);
    }

    function showLog(msg: string) {
        if (msg == "") {
            return;
        }

        let time = new Date().toLocaleString();
        time = `-- ${time}`;
        const separator = logs.length > 0 ? [""] : [];

        logs = [...logs, ...separator, msg, time];
    }

    function showTables() {
        sqlEditor.setValue(queryShowTables + "\n");
        formatEditor();
        exec(queryShowTables);
    }

    function clearLog() {
        logs = [];
    }
</script>

<div class="editor" {style}>
    {#if db == null}
        <p>Waiting for database to load...</p>
    {:else}
        <label
            class="label"
            for=""
            on:keydown={() => {}}
            on:click={() => (editorIsVisible = !editorIsVisible)}>Editor</label
        >

        <div class={editorIsVisible ? "is-block" : "is-hidden"}>
            <SqlEditor bind:this={sqlEditor} bind:value={query} {style} />

            <div class="buttons">
                <button class="button is-info" on:click={() => exec(query)}
                    >Execute</button
                >

                <button class="button is-info" on:click={() => formatEditor()}
                    >Format</button
                >

                <button class="button is-info" on:click={() => showTables()}
                    >Show Tables</button
                >

                <button class="button is-info" on:click={() => clearLog()}
                    >Clear Log</button
                >
            </div>
        </div>

        {#if results.length > 0}
            <label
                class="label"
                for=""
                on:keydown={() => {}}
                on:click={() => (resultsAreVisible = !resultsAreVisible)}
                >Results</label
            >

            {#if resultsAreVisible}
                {#each results as result, index}
                    <p>
                        #{index + 1}: {result.columns.length} cols x {result
                            .values.length} rows
                    </p>

                    <ResultTable {result} />
                {/each}
            {/if}
        {/if}

        <label
            class="label"
            for=""
            on:keydown={() => {}}
            on:click={() => (logIsVisible = !logIsVisible)}>Log</label
        >

        <div class={logIsVisible ? "is-block" : "is-hidden"}>
            <div class="control">
                <textarea class="sql-logs" value={joinLogs} rows="5" disabled />
            </div>
        </div>
    {/if}
</div>

<style>
    .editor {
        margin-top: 0;
        margin-bottom: 0;
        margin-left: 5%;
        margin-right: 5%;
    }

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

    textarea {
        color: var(--color, black);
        border: 1px solid #b7b7b7;
    }

    .sql-logs {
        width: 100%;
        height: 100%;
        resize: vertical;
        background-color: var(--background-color, rgb(211, 211, 211));
    }
</style>
