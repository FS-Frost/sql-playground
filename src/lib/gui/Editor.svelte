<script lang="ts">
    import { storeTheme } from "$lib/store";
    import loader from "@monaco-editor/loader";
    import type { Monaco } from "@monaco-editor/loader";
    import type { editor as MonacoEditor } from "monaco-editor";
    import { onMount } from "svelte";

    type Props = {
        lang: string;
        value: string;
        minimapEnabled: boolean;
        readonly: boolean;
        onChange?: (detail: string) => void;
    };

    let {
        lang,
        value = $bindable(),
        minimapEnabled,
        readonly,
        onChange = () => {},
    }: Props = $props();

    let divEditor = $state<HTMLElement>();
    let monaco = $state<Monaco>();
    let editor = $state<MonacoEditor.IStandaloneCodeEditor>();
    let theme = $state<"vs" | "vs-dark">("vs-dark");

    function getCurrentValue(): string {
        if (editor == null) {
            console.warn("sql editor not ready, can't get value");
            return "";
        }

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

    export async function init(): Promise<string> {
        if (divEditor == null) {
            return "editor element not found";
        }

        monaco = await loader.init();
        if (monaco == null) {
            return "failed to initialize SQL editor";
        }

        editor = monaco.editor.create(divEditor, {
            value: value,
            language: lang,
            theme: "vs-dark",
            readOnly: readonly,
            wordWrap: "on",
            minimap: {
                enabled: minimapEnabled,
            },
        });

        editor.onDidChangeModelContent(() => {
            value = getCurrentValue();
            onChange(value);
        });

        return "";
    }

    onMount(() => {
        storeTheme.subscribe((theme) => {
            if (monaco == null) {
                return;
            }

            monaco.editor.setTheme(theme == "Dark" ? "vs-dark" : "vs");
        });
    });
</script>

<div bind:this={divEditor} class="custom-editor"></div>

<style>
    .custom-editor {
        width: 100%;
        min-height: 300px;
        margin-bottom: 0.5rem;
        outline: 1px solid #b7b7b7;
    }
</style>
