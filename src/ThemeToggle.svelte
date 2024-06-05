<script lang="ts">
    import { Theme } from "./theme";

    export let theme: Theme = Theme.Enum.Dark;

    $: isDark = theme == Theme.Enum.Dark;

    function toggleTheme(): void {
        theme = isDark ? Theme.Enum.Light : Theme.Enum.Dark;
    }
</script>

<div class="toggle">
    <button class="button is-info" on:click={() => toggleTheme()}>
        {isDark ? "Dark" : "Light"} mode
    </button>
</div>

<style>
    .toggle {
        position: relative;
        left: 5%;
        top: 10%;
    }
</style>
