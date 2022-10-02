<script lang="ts">
    import { onMount } from "svelte";
    import Editor from "./Editor.svelte";

    interface BuildInfo {
        sha: string;
        ref: string;
        actor: string;
    }

    let buildInfo: BuildInfo | null = null;
    $: shortSha = buildInfo?.sha.substring(0, 7) ?? "";
    $: linkCommit = `https://github.com/FS-Frost/sql-playground/commit/${
        buildInfo?.sha ?? ""
    }`;
    $: linkBranch = `https://github.com/FS-Frost/sql-playground/tree/${
        buildInfo?.ref ?? ""
    }`;
    $: linkActor = `https://github.com/${buildInfo?.actor ?? ""}`;

    async function loadBuildInfo() {
        const url = "build-info.json";
        const response = await fetch(url);

        if (!response.ok) {
            console.info(`Could not fectch ${url}`);
            return;
        }

        const info: BuildInfo = await response.json();

        if (info == null) {
            console.error("Invalid build info");
        }

        buildInfo = info;
    }

    onMount(() => {
        loadBuildInfo();
    });
</script>

<main>
    <h1 class="title">SQL Playground</h1>

    <Editor />

    <div class="footer">
        <div class="container">
            {#if buildInfo != null}
                <p class="text-muted text-center">
                    Version <a href={linkBranch} target="_blank"
                        ><b>{buildInfo.ref}</b></a
                    >.<a href={linkCommit} target="_blank"
                        ><b title={buildInfo.sha}>{shortSha}</b></a
                    >, deployed by
                    <a href={linkActor} target="_blank"
                        ><b>{buildInfo.actor}</b></a
                    >
                </p>
            {/if}
        </div>
    </div>
</main>

<style>
    main {
        padding: 1em;
        margin: 0 auto;
    }

    .title {
        text-transform: uppercase;
        text-align: center;
    }

    @media (min-width: 640px) {
        main {
            max-width: none;
        }

        .title {
            font-size: 1.6em;
        }
    }

    .footer {
        background: white;
    }
</style>
