const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 10000;

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL manquante");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false
});

/* =========================
   DATABASE
========================= */

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products(
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      description TEXT,
      price NUMERIC DEFAULT 0,
      promo NUMERIC,
      stock INTEGER DEFAULT 0,
      variants JSONB DEFAULT '[]'::jsonb,
      status TEXT DEFAULT 'Actif'
    );

    CREATE TABLE IF NOT EXISTS orders(
      id SERIAL PRIMARY KEY,
      data JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS conversations(
      id SERIAL PRIMARY KEY,
      data JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  const count = await pool.query(
    "SELECT COUNT(*) FROM products"
  );

  if (Number(count.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO products
      (
        name,
        category,
        description,
        price,
        promo,
        stock,
        variants,
        status
      )
      VALUES
      (
        'Montre classique',
        'Montres',
        'Montre classique élégante',
        6000,
        NULL,
        10,
        '["Noir","Argent"]',
        'Actif'
      ),
      (
        'Sac à main',
        'Sacs',
        'Sac à main élégant',
        6000,
        NULL,
        15,
        '["Noir","Marron"]',
        'Actif'
      ),
      (
        'Portefeuille RFID',
        'Portefeuilles',
        'Portefeuille avec protection RFID',
        5000,
        NULL,
        20,
        '["Noir","Marron"]',
        'Actif'
      );
    `);
  }
}

function normalizeProduct(b) {
  return {
    name: String(b.name || ""),
    category: String(b.category || ""),
    description: String(b.description || ""),
    price: Number(b.price || 0),
    promo: b.promo == null ? null : Number(b.promo),
    stock: Number(b.stock || 0),
    variants: b.variants || [],
    status: String(b.status || "Actif")
  };
}

/* =========================
   HEALTH
========================= */

app.get("/api/health", async (_q, r) => {
  try {
    await pool.query("SELECT 1");

    r.json({
      ok: true,
      database: "connected"
    });
  } catch (e) {
    r.status(500).json({
      ok: false,
      database: "error",
      error: e.message
    });
  }
});

/* =========================
   CONFIG
========================= */

app.get("/api/config", (_q, r) => {
  r.json({
    businessName:
      process.env.BUSINESS_NAME || "IGOSA SERVICES",

    businessPhone:
      process.env.BUSINESS_PHONE || ""
  });
});

/* =========================
   DASHBOARD
========================= */

app.get("/api/dashboard", async (_q, r) => {
  try {
    const products = await pool.query(
      "SELECT COUNT(*) FROM products"
    );

    const orders = await pool.query(
      "SELECT COUNT(*) FROM orders"
    );

    const conversations = await pool.query(
      "SELECT COUNT(*) FROM conversations"
    );

    r.json({
      products: Number(products.rows[0].count),
      orders: Number(orders.rows[0].count),
      conversations: Number(conversations.rows[0].count),
      status: "ACTIF"
    });
  } catch (e) {
    r.status(500).json({
      error: e.message
    });
  }
});

/* =========================
   PRODUCTS
========================= */

app.get("/api/products", async (_q, r) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY id"
    );

    r.json(
      result.rows.map(normalizeProduct)
    );
  } catch (e) {
    r.status(500).json({
      error: e.message
    });
  }
});

app.post("/api/products", async (q, r) => {
  try {
    const p = normalizeProduct(q.body);

    const result = await pool.query(
      `
      INSERT INTO products
      (
        name,
        category,
        description,
        price,
        promo,
        stock,
        variants,
        status
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
      `,
      [
        p.name,
        p.category,
        p.description,
        p.price,
        p.promo,
        p.stock,
        JSON.stringify(p.variants),
        p.status
      ]
    );

    r.json(result.rows[0]);
  } catch (e) {
    r.status(500).json({
      error: e.message
    });
  }
});

app.put("/api/products/:id", async (q, r) => {
  try {
    const p = normalizeProduct(q.body);

    const result = await pool.query(
      `
      UPDATE products
      SET
        name=$1,
        category=$2,
        description=$3,
        price=$4,
        promo=$5,
        stock=$6,
        variants=$7,
        status=$8
      WHERE id=$9
      RETURNING *
      `,
      [
        p.name,
        p.category,
        p.description,
        p.price,
        p.promo,
        p.stock,
        JSON.stringify(p.variants),
        p.status,
        q.params.id
      ]
    );

    r.json(result.rows[0]);
  } catch (e) {
    r.status(500).json({
      error: e.message
    });
  }
});

app.delete("/api/products/:id", async (q, r) => {
  try {
    await pool.query(
      "DELETE FROM products WHERE id=$1",
      [q.params.id]
    );

    r.json({
      ok: true
    });
  } catch (e) {
    r.status(500).json({
      error: e.message
    });
  }
});

/* =========================
   ORDERS
========================= */

app.get("/api/orders", async (_q, r) => {
  try {
    const result = await pool.query(
      "SELECT * FROM orders ORDER BY id DESC"
    );

    r.json(result.rows);
  } catch (e) {
    r.status(500).json({
      error: e.message
    });
  }
});

app.post("/api/orders", async (q, r) => {
  try {
    const result = await pool.query(
      "INSERT INTO orders(data) VALUES($1) RETURNING *",
      [JSON.stringify(q.body)]
    );

    r.json(result.rows[0]);
  } catch (e) {
    r.status(500).json({
      error: e.message
    });
  }
});

app.put("/api/orders/:id", async (q, r) => {
  try {
    const result = await pool.query(
      "UPDATE orders SET data=$1 WHERE id=$2 RETURNING *",
      [
        JSON.stringify(q.body),
        q.params.id
      ]
    );

    r.json(result.rows[0]);
  } catch (e) {
    r.status(500).json({
      error: e.message
    });
  }
});

/* =========================
   CONVERSATIONS
========================= */

app.get("/api/conversations", async (_q, r) => {
  try {
    const result = await pool.query(
      "SELECT * FROM conversations ORDER BY id DESC"
    );

    r.json(result.rows);
  } catch (e) {
    r.status(500).json({
      error: e.message
    });
  }
});

/* =========================
   WHATSAPP WEBHOOK
   VERIFICATION SECURISEE
========================= */

app.get("/webhook/whatsapp", (q, r) => {
  const mode = String(
    q.query["hub.mode"] || ""
  ).trim();

  const token = String(
    q.query["hub.verify_token"] || ""
  ).trim();

  const challenge = String(
    q.query["hub.challenge"] || ""
  );

  const expected = String(
    process.env.WHATSAPP_VERIFY_TOKEN || ""
  ).trim();

  console.log("WEBHOOK VERIFICATION");
  console.log("Mode:", mode);
  console.log(
    "Token reçu:",
    token ? "OUI" : "NON"
  );
  console.log(
    "Token configuré:",
    expected ? "OUI" : "NON"
  );

  if (
    mode === "subscribe" &&
    token === expected
  ) {
    console.log(
      "WEBHOOK VERIFICATION OK"
    );

    return r
      .status(200)
      .send(challenge);
  }

  console.log(
    "WEBHOOK VERIFICATION REFUSÉE"
  );

  return r
    .status(403)
    .send("Forbidden");
});

/* =========================
   WHATSAPP WEBHOOK POST
========================= */

app.post("/webhook/whatsapp", (q, r) => {
  console.log(
    "WhatsApp webhook:",
    JSON.stringify(q.body)
  );

  return r.sendStatus(200);
});

/* =========================
   FRONTEND
========================= */

app.get("/{*splat}", (_q, r) => {
  r.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  );
});

/* =========================
   START SERVER
========================= */

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `SAN2LAURE IA COMMERCE running on port ${PORT}`
      );
    });
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
