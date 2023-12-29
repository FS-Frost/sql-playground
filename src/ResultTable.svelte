<script lang="ts">
    import type { QueryExecResult } from "sql.js";
    export let result: QueryExecResult;
</script>

<div class="table-container">
    <table class="table is-fullwidth is-striped is-hoverable">
        <thead>
            <tr>
                {#each result.columns as column}
                    <th class="th">{column}</th>
                {/each}
            </tr>
        </thead>
        <tbody>
            {#each result.values as row, rowIndex}
                <tr>
                    {#each row as field, fieldIndex}
                        <td
                            title={`Row ${rowIndex + 1}, ${
                                result.columns[fieldIndex]
                            }`}>{field}</td
                        >
                    {/each}
                </tr>
            {/each}
        </tbody>
    </table>
</div>

<style>
    tr {
        width: 100%;
    }

    .table-container {
        width: 100%;
        max-height: 300px;
        overflow: auto;
    }

    .th,
    td {
        color: var(--color, black);
        background-color: var(--background-color, rgb(211, 211, 211));
    }
</style>
