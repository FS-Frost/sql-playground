<script lang="ts">
    import { onMount } from "svelte";
    import { Theme } from "./theme";
    import { storeTheme } from "$lib/store";

    let theme = $state<Theme>(Theme.Enum.Dark);

    let isDark = $derived(theme == Theme.Enum.Dark);

    function toggleTheme(): void {
        storeTheme.set(isDark ? Theme.Enum.Light : Theme.Enum.Dark);
    }

    onMount(() => {
        storeTheme.subscribe((value) => (theme = value));
    });
</script>

<div class="toggle">
    <button class="button is-info" onclick={() => toggleTheme()}>
        {isDark ? "Light" : "Dark"} mode
    </button>
</div>

<style>
    .toggle {
        position: relative;
        left: 5%;
        top: 10%;
    }
</style>
