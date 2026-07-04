import { waitUntil } from "./gui/utils";
import type { QueryResultSet, SchemaColumn, SchemaTable } from "./types";
import { generateSeedData } from "./seed-data";

export interface ExecOutcome {
    results: QueryResultSet[];
    durationMs: number;
    rowsModified: number;
    error?: string;
}

export async function waitForDb(): Promise<boolean> {
    return waitUntil(() => window.db != null, 100, 5 * 1000);
}

export function isReady(): boolean {
    return window.db != null;
}

export function execute(sql: string): ExecOutcome {
    const db = window.db;
    if (db == null) {
        return { results: [], durationMs: 0, rowsModified: 0, error: "Database not ready" };
    }

    const start = performance.now();
    try {
        const raw = db.exec(sql);
        const durationMs = performance.now() - start;
        const results: QueryResultSet[] = raw.map((r) => ({
            columns: r.columns,
            values: r.values as unknown[][],
            rowCount: r.values.length,
            durationMs,
            sql,
        }));
        return { results, durationMs, rowsModified: db.getRowsModified() };
    } catch (error) {
        const durationMs = performance.now() - start;
        return { results: [], durationMs, rowsModified: 0, error: `${error}` };
    }
}

export function getSchema(): SchemaTable[] {
    const db = window.db;
    if (db == null) return [];

    const res = db.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;",
    );
    if (res.length === 0) return [];

    const names = res[0].values.map((r) => String(r[0]));
    return names.map((name) => {
        const info = db.exec(`PRAGMA table_info('${name.replace(/'/g, "''")}');`);
        const columns: SchemaColumn[] =
            info.length > 0
                ? info[0].values.map((row) => ({
                      name: String(row[1]),
                      type: String(row[2] ?? ""),
                      notnull: !!row[3],
                      pk: !!row[5],
                  }))
                : [];
        return { name, columns };
    });
}

const SCHEMA_SQL = `
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);
CREATE TABLE departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    budget REAL NOT NULL
);
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL CHECK (price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    created_at TEXT NOT NULL
);
CREATE TABLE employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    department_id INTEGER NOT NULL REFERENCES departments(id),
    manager_id INTEGER REFERENCES employees(id),
    job_title TEXT NOT NULL,
    hire_date TEXT NOT NULL,
    salary REAL NOT NULL CHECK (salary >= 0)
);
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    signup_date TEXT NOT NULL
);
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    employee_id INTEGER REFERENCES employees(id),
    order_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
    shipping_city TEXT,
    shipping_country TEXT,
    total_amount REAL NOT NULL DEFAULT 0 CHECK (total_amount >= 0)
);
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price REAL NOT NULL CHECK (unit_price >= 0)
);
CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title TEXT,
    body TEXT,
    created_at TEXT NOT NULL
);
`;

function sqlLiteral(v: unknown): string {
    if (v === null || v === undefined) return "NULL";
    if (typeof v === "number") return String(v);
    return `'${String(v).replace(/'/g, "''")}'`;
}

function buildInsertSql(
    table: string,
    columns: string[],
    rows: Record<string, unknown>[],
    chunkSize = 200,
): string {
    const stmts: string[] = [];
    for (let i = 0; i < rows.length; i += chunkSize) {
        const values = rows
            .slice(i, i + chunkSize)
            .map((r) => `(${columns.map((c) => sqlLiteral(r[c])).join(", ")})`)
            .join(",\n");
        stmts.push(`INSERT INTO ${table} (${columns.join(", ")}) VALUES\n${values};`);
    }
    return stmts.join("\n");
}

// Siembra una base de datos de ejemplo (e-commerce + RRHH) con datos pseudorealistas. Corre una vez al iniciar.
export function seed(): string | null {
    const db = window.db;
    if (db == null) return "Database not ready";

    // Evita re-sembrar si ya existe.
    const existing = db.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='categories';",
    );
    if (existing.length > 0 && existing[0].values.length > 0) return null;

    try {
        db.exec(SCHEMA_SQL);

        const data = generateSeedData();
        db.exec(buildInsertSql("categories", ["id", "name", "description"], data.categories));
        db.exec(buildInsertSql("departments", ["id", "name", "budget"], data.departments));
        db.exec(
            buildInsertSql(
                "products",
                ["id", "category_id", "sku", "name", "description", "price", "stock_quantity", "created_at"],
                data.products,
            ),
        );
        db.exec(
            buildInsertSql(
                "employees",
                ["id", "first_name", "last_name", "email", "department_id", "manager_id", "job_title", "hire_date", "salary"],
                data.employees,
            ),
        );
        db.exec(
            buildInsertSql(
                "customers",
                ["id", "first_name", "last_name", "email", "phone", "address", "city", "country", "signup_date"],
                data.customers,
            ),
        );
        db.exec(
            buildInsertSql(
                "orders",
                ["id", "customer_id", "employee_id", "order_date", "status", "shipping_city", "shipping_country", "total_amount"],
                data.orders,
            ),
        );
        db.exec(buildInsertSql("order_items", ["id", "order_id", "product_id", "quantity", "unit_price"], data.orderItems));
        db.exec(
            buildInsertSql(
                "reviews",
                ["id", "product_id", "customer_id", "rating", "title", "body", "created_at"],
                data.reviews,
            ),
        );
    } catch (error) {
        return `failed to seed database: ${error}`;
    }
    return null;
}
