<script lang="ts">
    import loader from "@monaco-editor/loader";
    import type { editor, KeyCode } from "monaco-editor";
    import { onMount } from "svelte";

    export let value: string = "";

    let divEditor: HTMLElement;
    let editor: editor.IStandaloneCodeEditor;

    onMount(() => {
        if (divEditor == null) {
            console.error("editor not found");
            return;
        }

        loader.init().then((monaco) => {
            editor = monaco.editor.create(divEditor, {
                value: value,
                language: "sql",
                theme: "vs-dark",
            });

            editor.onDidChangeModelContent(() => {
                value = getCurrentValue();
            });
        });
    });

    function getCurrentValue(): string {
        const currentValue = editor.getValue({
            lineEnding: "\n",
            preserveBOM: false,
        });

        return currentValue;
    }

    export function setValue(value: string) {
        editor.setValue(value);
    }
</script>

<div bind:this={divEditor} class="custom-editor" />

<style>
    .custom-editor {
        width: 100%;
        min-height: 300px;
        margin-bottom: 0.5rem;
    }
</style>
