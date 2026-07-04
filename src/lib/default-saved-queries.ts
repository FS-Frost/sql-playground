// Consultas de ejemplo precargadas para nuevos usuarios (progresión de dificultad).

export interface DefaultSavedQuery {
    name: string;
    sql: string;
}

export const DEFAULT_SAVED_QUERIES: DefaultSavedQuery[] = [
    {
        name: "1. Todas las categorías",
        sql: "SELECT * FROM categories;",
    },
    {
        name: "2. Productos con bajo stock",
        sql: `SELECT name, price, stock_quantity
FROM products
WHERE stock_quantity < 20
ORDER BY stock_quantity ASC, price DESC;`,
    },
    {
        name: "3. Pedidos con su cliente",
        sql: `SELECT o.id AS order_id, c.first_name || ' ' || c.last_name AS customer,
       o.order_date, o.status, o.total_amount
FROM orders o
JOIN customers c ON c.id = o.customer_id
ORDER BY o.order_date DESC
LIMIT 50;`,
    },
    {
        name: "4. Detalle de artículos por pedido",
        sql: `SELECT o.id AS order_id, c.first_name || ' ' || c.last_name AS customer,
       p.name AS product, oi.quantity, oi.unit_price,
       (oi.quantity * oi.unit_price) AS subtotal
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = oi.product_id
ORDER BY o.id;`,
    },
    {
        name: "5. Ingresos por categoría",
        sql: `SELECT cat.name AS category,
       COUNT(DISTINCT o.id) AS orders_count,
       SUM(oi.quantity) AS units_sold,
       ROUND(SUM(oi.quantity * oi.unit_price), 2) AS revenue
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN categories cat ON cat.id = p.category_id
JOIN orders o ON o.id = oi.order_id
GROUP BY cat.name
ORDER BY revenue DESC;`,
    },
    {
        name: "6. Clientes con gasto sobre el promedio",
        sql: `SELECT c.id, c.first_name, c.last_name, spend.total_spent
FROM customers c
JOIN (
    SELECT o.customer_id, SUM(oi.quantity * oi.unit_price) AS total_spent
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    GROUP BY o.customer_id
) spend ON spend.customer_id = c.id
WHERE spend.total_spent > (
    SELECT AVG(total_spent) FROM (
        SELECT SUM(oi2.quantity * oi2.unit_price) AS total_spent
        FROM orders o2
        JOIN order_items oi2 ON oi2.order_id = o2.id
        GROUP BY o2.customer_id
    )
)
ORDER BY spend.total_spent DESC;`,
    },
    {
        name: "7. Jerarquía de empleados (autounión)",
        sql: `SELECT e.first_name || ' ' || e.last_name AS employee,
       e.job_title,
       m.first_name || ' ' || m.last_name AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id
ORDER BY manager, employee;`,
    },
    {
        name: "8. Ranking de productos más vendidos por categoría",
        sql: `SELECT category, product, units_sold,
       RANK() OVER (PARTITION BY category ORDER BY units_sold DESC) AS rank_in_category
FROM (
    SELECT cat.name AS category, p.name AS product, SUM(oi.quantity) AS units_sold
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN categories cat ON cat.id = p.category_id
    GROUP BY cat.name, p.name
) sales
ORDER BY category, rank_in_category;`,
    },
];
