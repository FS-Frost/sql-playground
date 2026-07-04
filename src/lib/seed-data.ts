// Datos pseudorealistas deterministas para la base de datos de ejemplo (e-commerce + RRHH).
// La semilla es fija: window.db se reconstruye desde cero en cada carga (no se persiste),
// así que el dataset debe ser idéntico siempre para que las consultas guardadas sean estables.

const SEED = 240915;

function mulberry32(seed: number): () => number {
    let s = seed | 0;
    return function () {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

type Rng = () => number;

function randInt(rng: Rng, min: number, max: number): number {
    return Math.floor(rng() * (max - min + 1)) + min;
}

function randFloat(rng: Rng, min: number, max: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round((rng() * (max - min) + min) * factor) / factor;
}

function pick<T>(rng: Rng, arr: readonly T[]): T {
    return arr[Math.floor(rng() * arr.length)];
}

function pickWeighted<T>(rng: Rng, items: readonly (readonly [T, number])[]): T {
    const total = items.reduce((a, [, w]) => a + w, 0);
    let r = rng() * total;
    for (const [item, weight] of items) {
        if (r < weight) return item;
        r -= weight;
    }
    return items[items.length - 1][0];
}

function sample<T>(rng: Rng, arr: readonly T[], n: number): T[] {
    const pool = [...arr];
    const out: T[] = [];
    const count = Math.min(n, pool.length);
    for (let i = 0; i < count; i++) {
        const idx = Math.floor(rng() * pool.length);
        out.push(pool[idx]);
        pool.splice(idx, 1);
    }
    return out;
}

function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

function addDays(iso: string, days: number): string {
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

function daysBetween(startIso: string, endIso: string): number {
    const start = new Date(`${startIso}T00:00:00Z`).getTime();
    const end = new Date(`${endIso}T00:00:00Z`).getTime();
    return Math.round((end - start) / 86400000);
}

function randDateBetween(rng: Rng, startIso: string, endIso: string): string {
    const span = Math.max(0, daysBetween(startIso, endIso));
    return addDays(startIso, randInt(rng, 0, span));
}

function laterOf(a: string, b: string): string {
    return a > b ? a : b;
}

function stripAccents(s: string): string {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function slug(s: string): string {
    return stripAccents(s).toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 4);
}

function emailFor(first: string, last: string, id: number): string {
    const f = stripAccents(first).toLowerCase().replace(/[^a-z]/g, "");
    const l = stripAccents(last).toLowerCase().replace(/[^a-z]/g, "");
    return `${f}.${l}${id}@example.com`;
}

function phoneFor(rng: Rng): string {
    const cc = pick(rng, [34, 52, 54, 57, 51, 56, 598]);
    const number = String(randInt(rng, 100000000, 999999999));
    return `+${cc} ${number}`;
}

// ===== Data pools =====

const FIRST_NAMES = [
    "Sofía", "Mateo", "Valentina", "Santiago", "Camila", "Sebastián", "Isabella", "Lucas", "Emma", "Daniel",
    "Mariana", "Diego", "Valeria", "Alejandro", "Regina", "Emiliano", "Ximena", "Gabriel", "Renata", "Leonardo",
    "Fernanda", "Joaquín", "Paula", "Nicolás", "Daniela", "Andrés", "Antonella", "Miguel", "Julieta", "David",
    "Carolina", "Rafael", "Natalia", "Iván", "Gabriela", "Adrián", "Victoria", "Tomás", "Luciana", "Emilio",
];

const LAST_NAMES = [
    "García", "Rodríguez", "González", "Fernández", "López", "Martínez", "Sánchez", "Pérez", "Gómez", "Martín",
    "Jiménez", "Ruiz", "Hernández", "Díaz", "Moreno", "Álvarez", "Romero", "Alonso", "Gutiérrez", "Navarro",
    "Torres", "Domínguez", "Vázquez", "Ramos", "Gil", "Ramírez", "Serrano", "Blanco", "Suárez", "Molina",
];

const CITIES: { city: string; country: string }[] = [
    { city: "Madrid", country: "España" },
    { city: "Barcelona", country: "España" },
    { city: "Valencia", country: "España" },
    { city: "Ciudad de México", country: "México" },
    { city: "Guadalajara", country: "México" },
    { city: "Monterrey", country: "México" },
    { city: "Buenos Aires", country: "Argentina" },
    { city: "Córdoba", country: "Argentina" },
    { city: "Bogotá", country: "Colombia" },
    { city: "Medellín", country: "Colombia" },
    { city: "Lima", country: "Perú" },
    { city: "Santiago", country: "Chile" },
    { city: "Montevideo", country: "Uruguay" },
    { city: "Quito", country: "Ecuador" },
    { city: "Caracas", country: "Venezuela" },
    { city: "Ciudad de Panamá", country: "Panamá" },
    { city: "San José", country: "Costa Rica" },
    { city: "Lisboa", country: "Portugal" },
    { city: "Miami", country: "Estados Unidos" },
    { city: "Toronto", country: "Canadá" },
];

const STREET_NAMES = [
    "Avenida Principal", "Calle Mayor", "Calle del Sol", "Avenida Libertad", "Calle Real",
    "Paseo de la Reforma", "Calle Independencia", "Avenida Siempre Viva", "Calle San Martín",
    "Avenida Constitución", "Calle Bolívar", "Avenida Colón", "Calle Las Flores", "Avenida del Parque",
    "Calle Norte",
];

const CATEGORY_DEFS: { name: string; description: string }[] = [
    { name: "Electrónica", description: "Dispositivos y accesorios electrónicos para el hogar y el trabajo." },
    { name: "Ropa y Moda", description: "Prendas de vestir y accesorios de moda." },
    { name: "Hogar y Cocina", description: "Artículos para el hogar y la cocina." },
    { name: "Libros", description: "Libros de ficción, no ficción y técnicos." },
    { name: "Deportes y Aire Libre", description: "Equipamiento deportivo y para actividades al aire libre." },
    { name: "Juguetes y Juegos", description: "Juguetes, juegos de mesa y entretenimiento infantil." },
    { name: "Belleza y Cuidado Personal", description: "Productos de belleza y cuidado personal." },
    { name: "Alimentos y Bebidas", description: "Alimentos, snacks y bebidas." },
    { name: "Automotriz", description: "Repuestos y accesorios para vehículos." },
    { name: "Oficina y Papelería", description: "Artículos de oficina y papelería." },
];

const PRODUCT_NOUNS: Record<string, string[]> = {
    "Electrónica": ["Auriculares", "Teclado", "Monitor", "Altavoz Bluetooth", "Cámara Digital", "Router WiFi", "Tablet", "Smartwatch"],
    "Ropa y Moda": ["Camiseta", "Chaqueta", "Pantalón", "Vestido", "Zapatillas", "Bufanda", "Gorra", "Cinturón"],
    "Hogar y Cocina": ["Sartén", "Licuadora", "Juego de Sábanas", "Cafetera", "Set de Cuchillos", "Lámpara de Mesa", "Organizador", "Olla"],
    "Libros": ["Novela", "Libro de Cocina", "Manual Técnico", "Biografía", "Cuento Infantil", "Libro de Poesía", "Ensayo", "Cómic"],
    "Deportes y Aire Libre": ["Balón de Fútbol", "Bicicleta", "Tienda de Campaña", "Mancuernas", "Colchoneta de Yoga", "Mochila de Senderismo", "Casco", "Cantimplora"],
    "Juguetes y Juegos": ["Rompecabezas", "Juego de Mesa", "Muñeca", "Auto a Control Remoto", "Set de Bloques", "Peluche", "Kit de Ciencia", "Consola Portátil"],
    "Belleza y Cuidado Personal": ["Crema Facial", "Champú", "Perfume", "Set de Maquillaje", "Secador de Pelo", "Cepillo Eléctrico", "Protector Solar", "Kit de Manicura"],
    "Alimentos y Bebidas": ["Café en Grano", "Té Orgánico", "Chocolate Artesanal", "Aceite de Oliva", "Snack Mix", "Miel Natural", "Pasta Integral", "Jugo Natural"],
    "Automotriz": ["Aceite de Motor", "Limpiaparabrisas", "Cargador USB para Auto", "Funda para Asiento", "Kit de Herramientas", "Cubre Volante", "Ambientador", "Batería para Auto"],
    "Oficina y Papelería": ["Cuaderno", "Bolígrafo", "Organizador de Escritorio", "Grapadora", "Carpeta", "Calculadora", "Pizarra Blanca", "Set de Marcadores"],
};

const PRODUCT_QUALIFIERS = [
    "Pro", "Plus", "Max", "Mini", "Lite", "Deluxe", "Clásico", "Eco", "Premium", "Ultra",
    "Compacto", "2024", "Edición Especial", "Portátil", "Estándar",
];

const PRICE_RANGES: Record<string, [number, number]> = {
    "Electrónica": [15, 899],
    "Ropa y Moda": [8, 120],
    "Hogar y Cocina": [6, 250],
    "Libros": [6, 45],
    "Deportes y Aire Libre": [10, 400],
    "Juguetes y Juegos": [5, 150],
    "Belleza y Cuidado Personal": [4, 80],
    "Alimentos y Bebidas": [2, 40],
    "Automotriz": [5, 300],
    "Oficina y Papelería": [1, 60],
};

const DEPARTMENT_DEFS: { name: string; budget: number }[] = [
    { name: "Ventas", budget: 250000 },
    { name: "Ingeniería", budget: 500000 },
    { name: "Marketing", budget: 180000 },
    { name: "Atención al Cliente", budget: 150000 },
    { name: "Recursos Humanos", budget: 120000 },
    { name: "Finanzas", budget: 200000 },
];

const JOB_TITLES_BY_DEPT: Record<string, string[]> = {
    "Ventas": ["Representante de Ventas", "Ejecutivo de Cuentas", "Gerente de Ventas", "Coordinador de Ventas"],
    "Ingeniería": ["Desarrollador Backend", "Desarrollador Frontend", "Ingeniero QA", "Arquitecto de Software", "Líder Técnico"],
    "Marketing": ["Especialista en Marketing Digital", "Diseñador Gráfico", "Gerente de Marketing", "Analista de Contenido"],
    "Atención al Cliente": ["Agente de Soporte", "Supervisor de Soporte", "Especialista en Atención al Cliente"],
    "Recursos Humanos": ["Analista de RRHH", "Reclutador", "Gerente de Recursos Humanos"],
    "Finanzas": ["Contador", "Analista Financiero", "Gerente de Finanzas"],
};

const ORDER_STATUS_WEIGHTS: [string, number][] = [
    ["delivered", 50],
    ["shipped", 15],
    ["processing", 10],
    ["pending", 10],
    ["cancelled", 15],
];

const RATING_WEIGHTS: [number, number][] = [
    [5, 35],
    [4, 30],
    [3, 20],
    [2, 10],
    [1, 5],
];

const POSITIVE_REVIEWS = [
    { title: "Excelente compra", body: "Superó mis expectativas, la calidad es muy buena y llegó a tiempo." },
    { title: "Muy recomendado", body: "Funciona perfecto y el precio es justo para lo que ofrece." },
    { title: "Encantado con el producto", body: "Es justo lo que necesitaba, buena calidad de materiales." },
    { title: "Gran relación calidad-precio", body: "No esperaba tanto por este precio, muy satisfecho." },
    { title: "Volveré a comprar", body: "El envío fue rápido y el producto llegó en perfectas condiciones." },
    { title: "Justo lo que buscaba", body: "Cumple con todo lo prometido en la descripción." },
];

const NEUTRAL_REVIEWS = [
    { title: "Cumple lo básico", body: "Es correcto, aunque esperaba un poco más de calidad." },
    { title: "Ni bueno ni malo", body: "Hace su función pero no destaca en nada en particular." },
    { title: "Aceptable", body: "El producto está bien pero el empaque llegó algo dañado." },
    { title: "Podría mejorar", body: "Funciona, aunque el material se siente algo frágil." },
];

const NEGATIVE_REVIEWS = [
    { title: "No cumplió expectativas", body: "La calidad es inferior a la que esperaba por el precio." },
    { title: "Llegó dañado", body: "El producto tenía un defecto de fábrica visible al abrirlo." },
    { title: "No lo recomiendo", body: "Dejó de funcionar a los pocos días de uso." },
    { title: "Decepcionante", body: "No se parece a las fotos del anuncio." },
    { title: "Mala experiencia", body: "El envío tardó mucho más de lo indicado y llegó incompleto." },
];

const PRODUCT_COUNT = 90;
const EMPLOYEE_COUNT = 24;
const CUSTOMER_COUNT = 60;
const ORDER_COUNT = 140;
const REVIEW_COUNT = 100;

// ===== Row types =====

export interface CategoryRow {
    [key: string]: unknown;
    id: number;
    name: string;
    description: string;
}

export interface DepartmentRow {
    [key: string]: unknown;
    id: number;
    name: string;
    budget: number;
}

export interface ProductRow {
    [key: string]: unknown;
    id: number;
    category_id: number;
    sku: string;
    name: string;
    description: string;
    price: number;
    stock_quantity: number;
    created_at: string;
}

export interface EmployeeRow {
    [key: string]: unknown;
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    department_id: number;
    manager_id: number | null;
    job_title: string;
    hire_date: string;
    salary: number;
}

export interface CustomerRow {
    [key: string]: unknown;
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    signup_date: string;
}

export interface OrderRow {
    [key: string]: unknown;
    id: number;
    customer_id: number;
    employee_id: number | null;
    order_date: string;
    status: string;
    shipping_city: string;
    shipping_country: string;
    total_amount: number;
}

export interface OrderItemRow {
    [key: string]: unknown;
    id: number;
    order_id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
}

export interface ReviewRow {
    [key: string]: unknown;
    id: number;
    product_id: number;
    customer_id: number;
    rating: number;
    title: string;
    body: string;
    created_at: string;
}

export interface SeedData {
    categories: CategoryRow[];
    departments: DepartmentRow[];
    products: ProductRow[];
    employees: EmployeeRow[];
    customers: CustomerRow[];
    orders: OrderRow[];
    orderItems: OrderItemRow[];
    reviews: ReviewRow[];
}

export function generateSeedData(): SeedData {
    const rng = mulberry32(SEED);

    const categories: CategoryRow[] = CATEGORY_DEFS.map((c, i) => ({ id: i + 1, ...c }));
    const departments: DepartmentRow[] = DEPARTMENT_DEFS.map((d, i) => ({ id: i + 1, ...d }));

    const products: ProductRow[] = [];
    const usedProductNames = new Set<string>();
    for (let i = 0; i < PRODUCT_COUNT; i++) {
        const category = categories[i % categories.length];
        const nouns = PRODUCT_NOUNS[category.name];
        let name = "";
        for (let attempt = 0; attempt < 20; attempt++) {
            const candidate = `${pick(rng, nouns)} ${pick(rng, PRODUCT_QUALIFIERS)}`;
            const key = `${category.id}:${candidate}`;
            if (!usedProductNames.has(key)) {
                usedProductNames.add(key);
                name = candidate;
                break;
            }
        }
        if (!name) name = `${pick(rng, nouns)} ${pick(rng, PRODUCT_QUALIFIERS)} ${i}`;
        const [min, max] = PRICE_RANGES[category.name];
        products.push({
            id: i + 1,
            category_id: category.id,
            sku: `SKU-${slug(category.name)}-${String(i + 1).padStart(5, "0")}`,
            name,
            description: `${name}, disponible en la categoría ${category.name}.`,
            price: randFloat(rng, min, max, 2),
            stock_quantity: randInt(rng, 0, 500),
            created_at: randDateBetween(rng, "2021-01-01", "2024-06-01"),
        });
    }

    const employees: EmployeeRow[] = [];
    const deptHires: Record<number, number[]> = {};
    for (let i = 0; i < EMPLOYEE_COUNT; i++) {
        const dept = departments[i % departments.length];
        const prior = deptHires[dept.id] ?? [];
        const managerId = prior.length > 0 && rng() < 0.85 ? pick(rng, prior) : null;
        const first = pick(rng, FIRST_NAMES);
        const last = pick(rng, LAST_NAMES);
        const id = i + 1;
        const jobTitle = pick(rng, JOB_TITLES_BY_DEPT[dept.name]);
        const isLead = /Gerente|Líder|Arquitecto/.test(jobTitle);
        employees.push({
            id,
            first_name: first,
            last_name: last,
            email: emailFor(first, last, id),
            department_id: dept.id,
            manager_id: managerId,
            job_title: jobTitle,
            hire_date: randDateBetween(rng, "2015-01-01", "2024-06-01"),
            salary: randInt(rng, 32000, 60000) + (isLead ? randInt(rng, 20000, 45000) : 0),
        });
        deptHires[dept.id] = [...prior, id];
    }

    const customers: CustomerRow[] = [];
    for (let i = 0; i < CUSTOMER_COUNT; i++) {
        const first = pick(rng, FIRST_NAMES);
        const last = pick(rng, LAST_NAMES);
        const id = i + 1;
        const place = pick(rng, CITIES);
        customers.push({
            id,
            first_name: first,
            last_name: last,
            email: emailFor(first, last, id),
            phone: phoneFor(rng),
            address: `${randInt(rng, 10, 9999)} ${pick(rng, STREET_NAMES)}`,
            city: place.city,
            country: place.country,
            signup_date: randDateBetween(rng, "2020-01-01", "2025-01-01"),
        });
    }

    const orders: OrderRow[] = [];
    for (let i = 0; i < ORDER_COUNT; i++) {
        const customer = pick(rng, customers);
        const employee = rng() < 0.75 ? pick(rng, employees) : null;
        const sameAddress = rng() < 0.9;
        const ship = sameAddress ? { city: customer.city, country: customer.country } : pick(rng, CITIES);
        const startBound = laterOf(customer.signup_date, "2022-01-01");
        orders.push({
            id: i + 1,
            customer_id: customer.id,
            employee_id: employee ? employee.id : null,
            order_date: randDateBetween(rng, startBound, "2025-06-30"),
            status: pickWeighted(rng, ORDER_STATUS_WEIGHTS),
            shipping_city: ship.city,
            shipping_country: ship.country,
            total_amount: 0,
        });
    }

    const orderItems: OrderItemRow[] = [];
    let itemId = 1;
    const purchased = new Map<string, { customerId: number; productId: number; orderDate: string }>();
    for (const order of orders) {
        let total = 0;
        for (const product of sample(rng, products, randInt(rng, 1, 5))) {
            const quantity = randInt(rng, 1, 4);
            orderItems.push({
                id: itemId++,
                order_id: order.id,
                product_id: product.id,
                quantity,
                unit_price: product.price,
            });
            total += quantity * product.price;
            purchased.set(`${order.customer_id}:${product.id}`, {
                customerId: order.customer_id,
                productId: product.id,
                orderDate: order.order_date,
            });
        }
        order.total_amount = Math.round(total * 100) / 100;
    }

    const reviews: ReviewRow[] = [];
    const pool = shuffle(rng, [...purchased.values()]);
    const reviewCount = Math.min(REVIEW_COUNT, pool.length);
    for (let i = 0; i < reviewCount; i++) {
        const p = pool[i];
        const rating = pickWeighted(rng, RATING_WEIGHTS);
        const text = rating >= 4 ? pick(rng, POSITIVE_REVIEWS) : rating === 3 ? pick(rng, NEUTRAL_REVIEWS) : pick(rng, NEGATIVE_REVIEWS);
        reviews.push({
            id: i + 1,
            product_id: p.productId,
            customer_id: p.customerId,
            rating,
            title: text.title,
            body: text.body,
            created_at: addDays(p.orderDate, randInt(rng, 3, 45)),
        });
    }

    return { categories, departments, products, employees, customers, orders, orderItems, reviews };
}
