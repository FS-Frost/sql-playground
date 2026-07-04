import { getSchema } from "$lib/db";
import type { SchemaTable } from "$lib/types";

function createSchemaStore() {
    let _tables = $state<SchemaTable[]>([]);

    function refresh(): void {
        _tables = getSchema();
    }

    return {
        get tables() {
            return _tables;
        },
        refresh,
    };
}

export const schemaStore = createSchemaStore();
