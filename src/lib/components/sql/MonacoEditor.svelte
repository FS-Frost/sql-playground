<script lang="ts">
    import loader from "@monaco-editor/loader";
    import type { Monaco } from "@monaco-editor/loader";
    import type { editor as MonacoEditor } from "monaco-editor";
    import { onMount, onDestroy } from "svelte";
    import { themeStore } from "$lib/stores/theme.svelte";
    import { uiSettings } from "$lib/stores/ui-settings.svelte";

    type Props = {
        value: string;
        onChange?: (value: string) => void;
        onRun?: (sql: string) => void;
        onRunAll?: () => void;
        onFormat?: () => void;
        onSave?: () => void;
        onReady?: () => void;
    };

    let {
        value = $bindable(),
        onChange = () => {},
        onRun = () => {},
        onRunAll = () => {},
        onFormat = () => {},
        onSave = () => {},
        onReady = () => {},
    }: Props = $props();

    let divEditor = $state<HTMLElement>();
    let monaco = $state<Monaco>();
    let editor = $state<MonacoEditor.IStandaloneCodeEditor>();
    let applyingExternal = false;

    export function setValue(v: string): void {
        if (editor == null) return;
        applyingExternal = true;
        editor.setValue(v);
        applyingExternal = false;
    }

    export function focus(): void {
        editor?.focus();
    }

    export function getSelectedOrAll(): string {
        if (editor == null) return value;
        const sel = editor.getSelection();
        if (sel && !sel.isEmpty()) {
            return editor.getModel()?.getValueInRange(sel) ?? value;
        }
        return editor.getValue({ lineEnding: "\n", preserveBOM: false });
    }

    onMount(async () => {
        if (divEditor == null) return;
        monaco = await loader.init();
        if (monaco == null) return;

        editor = monaco.editor.create(divEditor, {
            value,
            language: "sql",
            theme: themeStore.monacoTheme,
            readOnly: false,
            automaticLayout: true,
            fontSize: uiSettings.editorFontSize,
            fontFamily: uiSettings.editorFontFamily,
            tabSize: uiSettings.editorTabSize,
            wordWrap: uiSettings.editorWordWrap ? "on" : "off",
            lineNumbers: uiSettings.editorLineNumbers ? "on" : "off",
            minimap: { enabled: uiSettings.editorMinimap },
            scrollBeyondLastLine: false,
        });

        editor.onDidChangeModelContent(() => {
            if (applyingExternal) return;
            value = editor!.getValue({ lineEnding: "\n", preserveBOM: false });
            onChange(value);
        });

        const M = monaco;
        editor.addCommand(M.KeyMod.CtrlCmd | M.KeyCode.Enter, () => onRun(getSelectedOrAll()));
        editor.addCommand(M.KeyCode.F5, () => onRunAll());
        editor.addCommand(M.KeyMod.CtrlCmd | M.KeyMod.Shift | M.KeyCode.KeyF, () => onFormat());
        editor.addCommand(M.KeyMod.CtrlCmd | M.KeyCode.KeyS, () => onSave());

        onReady();
    });

    onDestroy(() => {
        editor?.dispose();
    });

    // Sync tema Monaco con el theme store.
    $effect(() => {
        const t = themeStore.monacoTheme;
        if (monaco && editor) monaco.editor.setTheme(t);
    });

    // Sync opciones del editor con ajustes.
    $effect(() => {
        editor?.updateOptions({
            fontSize: uiSettings.editorFontSize,
            fontFamily: uiSettings.editorFontFamily,
            tabSize: uiSettings.editorTabSize,
            wordWrap: uiSettings.editorWordWrap ? "on" : "off",
            lineNumbers: uiSettings.editorLineNumbers ? "on" : "off",
            minimap: { enabled: uiSettings.editorMinimap },
        });
    });
</script>

<div bind:this={divEditor} class="monaco-editor-host"></div>

<style>
    .monaco-editor-host {
        width: 100%;
        height: 100%;
        min-height: 120px;
    }
</style>
