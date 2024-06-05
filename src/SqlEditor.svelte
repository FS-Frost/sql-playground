<script lang="ts">
    import loader from "@monaco-editor/loader";
    import type { editor } from "monaco-editor";
    // import * as monaco from "monaco-editor";
    import { onMount } from "svelte";
    import { waitUntil } from "./utils";

    type Monaco =
        typeof import("../node_modules/monaco-editor/esm/vs/editor/editor.api");

    export let style: string;
    export let value: string = "";

    $: style, toggleTheme();

    let divEditor: HTMLElement;
    let monaco: Monaco | null;
    let editor: editor.IStandaloneCodeEditor;
    let theme: "vs" | "vs-dark" = "vs-dark";

    function toggleTheme(): void {
        if (monaco == null) {
            return;
        }

        theme = theme == "vs" ? "vs-dark" : "vs";
        monaco.editor.setTheme(theme);
    }

    function getCurrentValue(): string {
        const currentValue = editor.getValue({
            lineEnding: "\n",
            preserveBOM: false,
        });

        return currentValue;
    }

    export function setValue(value: string): void {
        if (editor == null) {
            console.warn("sql editor not ready, can't set value", { value });
            return;
        }

        editor.setValue(value);
    }

    export async function init(): Promise<void> {
        if (divEditor == null) {
            console.error("editor not found");
            return;
        }

        loader.init().then((monacoInstance: Monaco) => {
            monaco = monacoInstance;
            editor = monaco.editor.create(divEditor, {
                value: value,
                language: "sql",
                theme: "vs-dark",
            });

            editor.onDidChangeModelContent(() => {
                value = getCurrentValue();
            });
        });

        const editorIsReady = await waitUntil(
            () => editor != null,
            100,
            30_000,
        );

        if (!editorIsReady) {
            alert(
                "Error: failed to initialize SQL editor. Try reloading the page.",
            );
        }
    }
</script>

<div bind:this={divEditor} class="custom-editor" />

<style>
    .custom-editor {
        width: 100%;
        min-height: 300px;
        margin-bottom: 0.5rem;
        outline: 1px solid #b7b7b7;
    }
</style>
