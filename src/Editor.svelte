<script lang="ts">
    import { onMount, tick } from "svelte";
    import { waitUntil } from "./utils";
    import type { Database, QueryExecResult } from "sql.js";
    import { format } from "sql-formatter";
    import ResultTable from "./ResultTable.svelte";
    import SqlEditor from "./SqlEditor.svelte";
    import { z } from "zod";
    import Logger from "./Logger.svelte";

    export let style: string;

    const queryShowTables = "SELECT * FROM sqlite_master WHERE type='table';";

    let logger: Logger;
    let db: Database;
    let query: string = `SELECT * FROM todo ORDER BY userId, completed DESC, title;`;
    let results: QueryExecResult[] = [];
    let logs: string[] = [];
    let editorLoaded: boolean = false;
    let editorVisible: boolean = true;
    let resultsAreVisible: boolean = true;
    let sqlEditor: SqlEditor;

    async function seed() {
        executeQuery(`CREATE TABLE todo (
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
            const title = `ERROR: failed to seed database, status ${response.status}`;
            showLog(title, `${title}:\n${rawBody}`);
            return;
        }

        const jsonBody = JSON.parse(rawBody);
        const parseResult = getTodosResponse.safeParse(jsonBody);

        if (!parseResult.success) {
            const parseError = parseResult.error.errors[0];
            const msg = `${parseError.path.join(".")}: ${parseError.message}; ${
                parseError.code
            }`;

            const title = `ERROR: failed to seed database, JSON error`;
            showLog(title, `${title}:\n${msg}`);
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

        executeQuery(query);
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
            const title = "ERROR: SQL format";
            showLog(title, `${title}:\n${error}`);
        }

        if (sqlEditor != null) {
            sqlEditor.setValue(query);
        }
    }

    function executeQuery(query: string) {
        if (query == null || query == "") {
            return;
        }

        results = [];

        try {
            console.log(query);
            showLog(`Query: ${query.substring(0, 10)}`, query);
            results = db.exec(query);

            if (results.length > 0) {
                resultsAreVisible = true;
            }
        } catch (error) {
            console.error(error);
            const title = "ERROR: execute query";
            showLog(title, `${title}:\n${error}`);
            return;
        }

        let msg = `Results: ${results.length}`;
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            msg += `\n  #${i + 1}. cols ${result.columns.length} x rows ${
                result.values.length
            }`;
        }

        showLog("Query result", JSON.stringify(results, null, 2));
    }

    function showLog(title: string, msg: string) {
        if (msg == "") {
            return;
        }

        let date = new Date().toLocaleString();
        date = `-- ${date}`;
        const separator = logs.length > 0 ? [""] : [];

        logs = [...logs, ...separator, msg, date];

        const time = new Date().toLocaleTimeString();
        logger.addLog({
            timestamp: Date.now() + Math.random(),
            title: `${time}: ${title}`,
            text: msg,
            isOpen: false,
        });
    }

    function showTables() {
        sqlEditor.setValue(queryShowTables + "\n");
        formatEditor();
        executeQuery(queryShowTables);
    }

    function clearLog() {
        logs = [];
        logger.clear();
    }

    onMount(async () => {
        showLog("Waiting for database...", "Waiting for database...");
        await waitUntil(() => window.db != null, 100, 3 * 1000);

        db = window.db;
        showLog("Database found!", "Database found!");
        await tick();
        await seed();
        await sqlEditor.init();
        editorLoaded = true;
        formatEditor();
    });
</script>

<div class="editor" {style}>
    {#if db == null}
        <p>Waiting for database to load...</p>
    {:else}
        <label
            class="label"
            for=""
            on:keydown={() => {}}
            on:click={() => (editorVisible = !editorVisible)}
        >
            {editorVisible ? "-" : "+"}
            Editor
        </label>

        <div class={editorVisible ? "is-block" : "is-hidden"}>
            {#if !editorLoaded}
                <p>Waiting for editor to load...</p>
            {/if}

            <SqlEditor bind:this={sqlEditor} bind:value={query} {style} />

            {#if editorLoaded}
                <div class="buttons">
                    <button
                        class="button is-info"
                        on:click={() => executeQuery(query)}>Execute</button
                    >

                    <button
                        class="button is-info"
                        on:click={() => formatEditor()}>Format</button
                    >

                    <button class="button is-info" on:click={() => showTables()}
                        >Show Tables</button
                    >

                    <button class="button is-info" on:click={() => clearLog()}
                        >Clear Log</button
                    >
                </div>
            {/if}
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
    {/if}

    <Logger
        bind:this={logger}
        on:setEditor={(e) => {
            sqlEditor.setValue(e.detail);
            formatEditor();
        }}
    />
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
</style>
