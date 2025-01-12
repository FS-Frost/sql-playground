<script lang="ts">
    import { onMount, tick } from "svelte";
    import { waitUntil } from "./utils";
    import type { Database, QueryExecResult } from "sql.js";
    import { format } from "sql-formatter";
    import ResultTable from "./ResultTable.svelte";
    import { z } from "zod";
    import Logger from "./Logger.svelte";
    import Editor from "./Editor.svelte";

    type Props = {
        style: string;
    };

    let { style }: Props = $props();

    const queryShowTables = "SELECT * FROM sqlite_master WHERE type='table';";

    let labelEditor = $state<HTMLSpanElement>();
    let labelResults = $state<HTMLSpanElement>();
    let logger = $state<Logger>();
    let db = $state<Database>();
    let results = $state<QueryExecResult[]>([]);
    let databaseError = $state<string>("");
    let editorError = $state<string>("");
    let editorLoaded = $state<boolean>(false);
    let editorVisible = $state<boolean>(true);
    let resultsVisible = $state<boolean>(true);
    let sqlEditor = $state<Editor>();

    let query = $state<string>(
        `SELECT * FROM todo ORDER BY userId, completed DESC, title;`,
    );

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
        if (query == null || query == "" || db == null) {
            return;
        }

        editorError = "";
        results = [];

        try {
            console.log(query);
            showLog(`Query: ${query.substring(0, 40)}`, query);
            results = db.exec(query);

            if (results.length > 0) {
                resultsVisible = true;
            }
        } catch (error) {
            console.error(error);
            editorError = `${error}`;
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

        const time = new Date().toLocaleTimeString();
        logger?.addLog({
            timestamp: Date.now() + Math.random(),
            title: `${time}: ${title}`,
            text: msg,
            isOpen: false,
        });
    }

    function showTables() {
        sqlEditor?.setValue(queryShowTables + "\n");
        formatEditor();
        executeQuery(queryShowTables);

        labelResults?.scrollIntoView({
            behavior: "smooth",
        });
    }

    function clearLog() {
        logger?.clear();
    }

    async function handleExecuteButton(): Promise<void> {
        executeQuery(query);
        await tick();
        labelResults?.scrollIntoView({
            behavior: "smooth",
        });
    }

    onMount(async () => {
        showLog("Waiting for database...", "Waiting for database...");
        const dbIsUp = await waitUntil(() => window.db != null, 100, 3 * 1000);
        if (!dbIsUp) {
            const title = "ERROR: failed to initialize database";
            databaseError = `${title}. Try reloading the page.`;
            showLog(title, databaseError);
            return;
        }

        db = window.db;
        showLog("Database found!", "Database found!");
        await tick();
        await seed();

        if (sqlEditor == null) {
            console.error("sql editor not ready");
            return;
        }

        const sqlEditorInitError = await sqlEditor.init();
        if (sqlEditorInitError.length > 0) {
            const title = `ERROR: ${sqlEditorInitError}`;
            editorError = `${title}. Try reloading the page.`;
            showLog(title, editorError);
            console.log("show log", title);
            return;
        }

        editorLoaded = true;
        formatEditor();
    });
</script>

<div class="editor" {style}>
    {#if db == null}
        <p>Waiting for database to load...</p>

        {#if databaseError.length > 0}
            <p class="editor-error mt-2">{databaseError}</p>
        {/if}
    {:else}
        <span
            class="label"
            role="button"
            tabindex="0"
            bind:this={labelEditor}
            onkeydown={() => {}}
            onclick={() => (editorVisible = !editorVisible)}
        >
            {editorVisible ? "-" : "+"}
            Editor
        </span>

        <div class={editorVisible ? "is-block" : "is-hidden"}>
            {#if !editorLoaded}
                <p>Waiting for editor to load...</p>
            {/if}

            <Editor
                bind:this={sqlEditor}
                bind:value={query}
                minimapEnabled={false}
                lang="sql"
                readonly={false}
            />

            {#if editorLoaded}
                <div class="buttons">
                    <button
                        class="button is-info"
                        onclick={() => handleExecuteButton()}>Execute</button
                    >

                    <button
                        class="button is-info"
                        onclick={() => formatEditor()}>Format</button
                    >

                    <button class="button is-info" onclick={() => showTables()}>
                        Show Tables
                    </button>

                    <button class="button is-info" onclick={() => clearLog()}>
                        Clear Log
                    </button>
                </div>
            {/if}
        </div>

        {#if editorError.length > 0}
            <p class="editor-error mt-2">{editorError}</p>
        {/if}

        {#if results.length > 0}
            <span
                class="label"
                role="button"
                tabindex="0"
                bind:this={labelResults}
                onkeydown={() => {}}
                onclick={() => (resultsVisible = !resultsVisible)}
            >
                {resultsVisible ? "-" : "+"}
                Results
            </span>

            {#if resultsVisible}
                {#each results as result, index}
                    <p>
                        {`#${index + 1}: ${result.columns.length} col${result.columns.length === 1 ? "" : "s"} x ${result.values.length} row${result.values.length === 1 ? "" : "s"}`}
                    </p>

                    <ResultTable {result} />
                {/each}
            {/if}
        {/if}
    {/if}

    <Logger
        bind:this={logger}
        onSetEditor={(detail) => {
            labelEditor?.scrollIntoView({
                behavior: "smooth",
            });

            sqlEditor?.setValue(detail);
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

    .editor-error {
        color: red;
        font-size: large;
    }
</style>
