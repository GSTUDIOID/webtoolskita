// =====================================================
// WEBTOOLSKITA SERVER
// Backend + Frontend + Firebase Admin + SQLite
// =====================================================

require("dotenv").config();

const express = require("express");
const crypto = require("crypto");
const path = require("path");
const Database = require("better-sqlite3");
const fs = require("fs");
const dns = require("dns").promises;
const http = require("http");
const https = require("https");
const tls = require("tls");
const net = require("net");
const os = require("os");
const git = require("./git");

const {
    initializeApp,
    cert,
 getApps,
    getApp
} = require("firebase-admin/app");

const {
    getAuth
} = require("firebase-admin/auth");

//=====================================================
// CONFIG
// =====================================================

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "ganreffafk@gmail.com").toLowerCase().trim();
const PORT = Number(process.env.PORT || 3000);
const APP_URL = String(process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, "");
const IPAYMU_ENV = String(process.env.IPAYMU_ENV || "sandbox").toLowerCase() === "production" ? "production" : "sandbox";
const IPAYMU_BASE_URL = IPAYMU_ENV === "production" ? "https://my.ipaymu.com" : "https://sandbox.ipaymu.com";
const IPAYMU_VA = String(process.env.IPAYMU_VA || "").trim();
const IPAYMU_API_KEY = String(process.env.IPAYMU_API_KEY || "").trim();

const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT
    ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT)
    : path.join(__dirname, "webtoolskita-firebase-adminsdk-fbsvc-6e2aa7d0e8.json");

// =====================================================
// FIREBASE ADMIN
// =====================================================

function getFirebaseCredential() {

    // Vercel / production:
    // gunakan credential JSON dari Environment Variable.
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {

        try {

            const serviceAccount =
                JSON.parse(
                    process.env.FIREBASE_SERVICE_ACCOUNT_JSON
                );

            return cert(serviceAccount);

        } catch (error) {

            console.error(
                "Firebase: FIREBASE_SERVICE_ACCOUNT_JSON tidak valid."
            );

            throw error;
        }
    }


    // Local development:
    // gunakan file credential Firebase lokal.
    const serviceAccountPath =
        process.env.FIREBASE_SERVICE_ACCOUNT
            ? path.resolve(
                process.env.FIREBASE_SERVICE_ACCOUNT
            )
            : path.join(
                __dirname,
                "webtoolskita-firebase-adminsdk-fbsvc-6e2aa7d0e8.json"
            );


    if (!fs.existsSync(serviceAccountPath)) {

        throw new Error(
            "Firebase service account tidak ditemukan."
        );
    }


    return cert(
        require(serviceAccountPath)
    );
}

let firebaseApp;

try {

    if (getApps().length > 0) {

        firebaseApp = getApp();

        console.log(
            "Firebase Admin: existing app reused successfully."
        );

    } else {

        firebaseApp =
            initializeApp({
                credential:
                    getFirebaseCredential()
            });

        console.log(
            "Firebase Admin: initialized successfully."
        );
    }

} catch (error) {

    console.error(
        "Firebase Admin initialization failed:",
        error.message
    );

    throw error;
}

const firebaseAuth =
    getAuth(firebaseApp);

// =====================================================
// CODEGUARD
// =====================================================

const {
    createCodeGuardRouter
} = require("./codeguard-router");


// =====================================================
// EXPRESS
// =====================================================

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);

app.use(express.json({ limit: process.env.JSON_LIMIT || "1mb" }));

app.use(express.urlencoded({
    extended: true,
    limit: process.env.FORM_LIMIT || "1mb"
}));

// Basic security headers without adding another runtime dependency.
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
});

// =====================================================
// PUBLIC ACCESS / MAINTENANCE GATE
// =====================================================

app.use((req, res, next) => {

    if (getServerMode() !== "off") {
        return next();
    }

    const p = req.path || "/";

    // Area administrator tetap bisa digunakan
    const adminArea =
        p.startsWith("/api/admin/");

    const authArea =
        p.startsWith("/api/auth/");

    const adminPage =
        p === "/index62.html" ||
        p === "/index18.html" ||
        p === "/index2.html" ||
        p === "/maintenance.html";

    if (
        adminArea ||
        authArea ||
        adminPage
    ) {
        return next();
    }

    // API publik
    if (p.startsWith("/api/")) {
        return res.status(503).json({
            success: false,
            maintenance: true,
            serverMode: "off",
            message:
                "WebToolsKita sedang dalam perbaikan."
        });
    }

    // Website publik
    return res
        .status(503)
        .sendFile(
            path.join(
                __dirname,
                "maintenance.html"
            )
        );
});


// =====================================================
// FRONTEND STATIC
// =====================================================

app.get("/sitemap.xml", (req, res) => {
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://webtoolskita.vercel.app/</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index1.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index3.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index4.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index5.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index6.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index7.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index8.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index9.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index10.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index13.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index15.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index16.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index17.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index27.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index28.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index29.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index35.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index36.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index37.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index39.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index41.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index46.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index50.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index52.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index53.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index54.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index55.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index56.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index57.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index58.html</loc></url>
  <url><loc>https://webtoolskita.vercel.app/index59.html</loc></url>
</urlset>`);
});
app.use(express.static(__dirname));


// =====================================================
// DATABASE
// =====================================================

const databaseFolder =
    process.env.VERCEL
        ? path.join("/tmp", "database")
        : path.join(__dirname, "database");

const dbPath = path.join(
    databaseFolder,
    "webtoolskita.db"
);

if (!fs.existsSync(databaseFolder)) {
    fs.mkdirSync(
        databaseFolder,
        {
            recursive: true
        }
    );
}

const db = new Database(dbPath);


// =====================================================
// DATABASE SETTINGS
// =====================================================

db.pragma("journal_mode = WAL");

db.pragma("foreign_keys = ON");


// =====================================================
// USERS TABLE
// =====================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS users (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        google_uid TEXT UNIQUE NOT NULL,

        name TEXT,

        email TEXT,

        photo_url TEXT,

        vip_status TEXT DEFAULT 'free',

        vip_start DATETIME,

        vip_expired DATETIME,

        payment_status TEXT DEFAULT 'none',

        payment_id TEXT,

        last_seen DATETIME,

	banned INTEGER DEFAULT 0,

	ban_reason TEXT,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// =====================================================
// ADVERTISING SYSTEM
// WebToolsKita - Iklan Browsing
// =====================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS ads (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        campaign_name TEXT NOT NULL,

        title TEXT NOT NULL,

        description TEXT DEFAULT '',

        image_url TEXT DEFAULT '',

        button_text TEXT DEFAULT 'Lihat Sekarang',

        target_url TEXT NOT NULL,

        format TEXT DEFAULT 'banner',

        background_color TEXT DEFAULT '#ffffff',

        button_color TEXT DEFAULT '#247bb6',

        label TEXT DEFAULT 'ADVERTISEMENT',

        status TEXT DEFAULT 'draft',

        impressions INTEGER DEFAULT 0,

        clicks INTEGER DEFAULT 0,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP

    )
`);

// =====================================================
// DATABASE MIGRATION
// =====================================================

function addColumnIfMissing(
    column,
    definition
) {

    const columns = db
        .prepare(
            "PRAGMA table_info(users)"
        )
        .all();

    const exists = columns.some(
        item => item.name === column
    );

    if (!exists) {

        db.exec(
            `ALTER TABLE users ADD COLUMN ${column} ${definition}`
        );

        console.log(
            `Database: kolom ${column} ditambahkan`
        );
    }
}


addColumnIfMissing(
    "vip_status",
    "TEXT DEFAULT 'free'"
);

addColumnIfMissing(
    "vip_start",
    "DATETIME"
);

addColumnIfMissing(
    "vip_expired",
    "DATETIME"
);

addColumnIfMissing(
    "payment_status",
    "TEXT DEFAULT 'none'"
);

addColumnIfMissing(
    "payment_id",
    "TEXT"
);

addColumnIfMissing(
    "last_seen",
    "DATETIME"
);


addColumnIfMissing(
    "banned",
    "INTEGER DEFAULT 0"
);

addColumnIfMissing(
    "ban_reason",
    "TEXT"
);

// =====================================================
// CORE DATA MODEL â€” WEBTOOLSKITA 2.0
// =====================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS payment_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        reference_id TEXT UNIQUE NOT NULL,
        provider_transaction_id TEXT UNIQUE,
        purpose TEXT DEFAULT 'order',
        plan_code TEXT,
        amount INTEGER NOT NULL,
        fee INTEGER DEFAULT 0,
        currency TEXT DEFAULT 'IDR',
        buyer_name TEXT,
        buyer_phone TEXT,
        buyer_email TEXT,
        payment_method TEXT,
        payment_channel TEXT,
        payment_no TEXT,
        payment_url TEXT,
        status TEXT DEFAULT 'pending',
        provider_status TEXT,
        provider_payload TEXT,
        metadata_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        paid_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS wallet_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        currency TEXT DEFAULT 'IDR',
        status TEXT DEFAULT 'active',
        balance INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wallet_ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        direction TEXT NOT NULL,
        amount INTEGER NOT NULL,
        balance_after INTEGER NOT NULL,
        reference_type TEXT,
        reference_id TEXT,
        description TEXT,
        metadata_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(wallet_id) REFERENCES wallet_accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wallet_transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference_id TEXT UNIQUE NOT NULL,
        sender_user_id INTEGER NOT NULL,
        receiver_user_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT DEFAULT 'completed',
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(sender_user_id) REFERENCES users(id),
        FOREIGN KEY(receiver_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_user_id INTEGER,
        name TEXT NOT NULL,
        target_url TEXT,
        headline TEXT,
        description TEXT,
        cta TEXT,
        format TEXT DEFAULT 'Browser Card',
        status TEXT DEFAULT 'Draft',
        impressions INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS ad_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        placement_id TEXT,
        visitor_key TEXT,
        user_agent TEXT,
        referer TEXT,
        ip_hash TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        ip_hash TEXT,
        metadata_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );


    CREATE TABLE IF NOT EXISTS agencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_user_id INTEGER,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS agency_clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agency_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        status TEXT DEFAULT 'active',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(agency_id) REFERENCES agencies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ceo_projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        owner_user_id INTEGER,
        status TEXT DEFAULT 'planned',
        priority TEXT DEFAULT 'normal',
        progress INTEGER DEFAULT 0,
        budget INTEGER DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS ceo_kpis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric TEXT NOT NULL,
        value REAL DEFAULT 0,
        unit TEXT,
        period TEXT,
        target REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ceo_decisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        decision TEXT,
        owner_user_id INTEGER,
        due_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT DEFAULT 'system',
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS system_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT,
        status TEXT DEFAULT 'published',
        published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT DEFAULT 'info',
        component TEXT NOT NULL,
        message TEXT NOT NULL,
        metadata_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);
    CREATE INDEX IF NOT EXISTS idx_payments_user ON payment_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_transactions(status);
    CREATE INDEX IF NOT EXISTS idx_payments_provider ON payment_transactions(provider_transaction_id);
    CREATE INDEX IF NOT EXISTS idx_ledger_wallet ON wallet_ledger(wallet_id);
    CREATE INDEX IF NOT EXISTS idx_campaign_owner ON campaigns(owner_user_id);
    CREATE INDEX IF NOT EXISTS idx_ad_events_campaign ON ad_events(campaign_id, event_type);
`);

// =====================================================
// CONTROL CENTER SERVER MODE
// =====================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

db.prepare(`
    INSERT OR IGNORE INTO system_settings (key, value)
    VALUES ('server_mode', 'on')
`).run();

function getServerMode() {
    const row = db
        .prepare(
            "SELECT value FROM system_settings WHERE key = ?"
        )
        .get("server_mode");

    return row && row.value === "off"
        ? "off"
        : "on";
}

function setServerMode(mode) {

    db.prepare(`
        INSERT INTO system_settings
            (key, value, updated_at)
        VALUES
            (?, ?, CURRENT_TIMESTAMP)

        ON CONFLICT(key)
        DO UPDATE SET
            value = excluded.value,
            updated_at = CURRENT_TIMESTAMP
    `).run(
        "server_mode",
        mode
    );

    return getServerMode();
}

// =====================================================
// FIREBASE TOKEN
// =====================================================

async function verifyFirebaseToken(
    req,
    res,
    next
) {

    try {

        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Token tidak ditemukan"

            });
        }

        const token =
            authHeader.substring(7);

        const decodedToken =
            await firebaseAuth.verifyIdToken(
                token
            );

        req.firebaseUser =
            decodedToken;

const localUser = db.prepare(
    "SELECT email, banned FROM users WHERE google_uid = ?"
).get(decodedToken.uid);

if (
    localUser &&
    Number(localUser.banned) === 1 &&
    String(localUser.email || "").toLowerCase() !==
        ADMIN_EMAIL.toLowerCase()
) {
    return res.status(403).json({
        success: false,
        banned: true,
        message: "Akun Anda telah diblokir administrator."
    });
}

        next();

    } catch (error) {

        console.error(
            "Token verification error:",
            error.message
        );

        return res.status(401).json({

            success: false,

            message:
                "Token Firebase tidak valid"

        });
    }
}


// =====================================================
// CODEGUARD
// =====================================================

app.use(
    createCodeGuardRouter({
        requireAuth:
            verifyFirebaseToken
    })
);


// =====================================================
// ADMIN CLAIM
// =====================================================

async function applyAdminClaim(
    userRecord
) {

    const email =
        (userRecord.email || "")
            .toLowerCase()
            .trim();

    const isAdmin =
        email === ADMIN_EMAIL.toLowerCase();

    const currentClaims =
        userRecord.customClaims || {};

    const newClaims = {
        ...currentClaims,
        admin: isAdmin
    };

    if (isAdmin) {
        newClaims.vip = true;
    }

    await firebaseAuth.setCustomUserClaims(
        userRecord.uid,
        newClaims
    );

    return {

        admin: isAdmin,

        vip:
            isAdmin ||
            currentClaims.vip === true

    };
}


// =====================================================
// ADMIN MIDDLEWARE
// =====================================================

async function requireAdmin(
    req,
    res,
    next
) {

    try {

        if (
            req.firebaseUser &&
            req.firebaseUser.admin === true
        ) {

            return next();
        }

        const user =
            await firebaseAuth.getUser(
                req.firebaseUser.uid
            );

        const email =
            (user.email || "")
                .toLowerCase()
                .trim();

        if (
            email === ADMIN_EMAIL.toLowerCase()
        ) {

            return next();
        }

        return res.status(403).json({

            success: false,

            message:
                "Akses admin ditolak"

        });

    } catch (error) {

        console.error(
            "Admin verification error:",
            error.message
        );

        return res.status(403).json({

            success: false,

            message:
                "Akses admin ditolak"

        });
    }
}


// =====================================================
// VIP MIDDLEWARE
// =====================================================

async function requireVip(
    req,
    res,
    next
) {

    try {

        if (
            req.firebaseUser &&
            req.firebaseUser.admin === true
        ) {

            return next();
        }

        if (
            req.firebaseUser &&
            req.firebaseUser.vip === true
        ) {

            return next();
        }

        const user =
            db.prepare(`
                SELECT *
                FROM users
                WHERE google_uid = ?
            `)
            .get(
                req.firebaseUser.uid
            );

        if (!user) {

            return res.status(403).json({

                success: false,

                message:
                    "User belum terdaftar"

            });
        }

        if (
            user.vip_status === "active"
        ) {

            if (
                !user.vip_expired ||
                new Date(
                    user.vip_expired
                ) > new Date()
            ) {

                return next();
            }
        }

        return res.status(403).json({

            success: false,

            message:
                "Akses VIP diperlukan"

        });

    } catch (error) {

        console.error(
            "VIP verification error:",
            error.message
        );

        return res.status(500).json({

            success: false,

            message:
                "Gagal memeriksa VIP"

        });
    }
}


// =====================================================
// ROOT
// =====================================================

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                process.env.FRONTEND_HOME || "index3.html"
            )
        );
    }
);


// =====================================================
// SERVER STATUS
// =====================================================

app.get(
    "/api/status",
    (req, res) => {

        res.json({

            success: true,

            message:
                "WebToolsKita server aktif",

            status:
                "online",

            frontend:
                true,

            database:
                true,

            firebase:
                true,

            admin_vip:
                true,

            online_tracking:
                true

        });
    }
);



// =====================================================
// HEALTH / READINESS
// =====================================================

app.get("/health", (req, res) => {
    let database = false;
    try { db.prepare("SELECT 1").get(); database = true; } catch (_) {}
    const payload = {
        ok: database,
        service: "WebToolsKita Core",
        version: "3.0.0",
        environment: process.env.NODE_ENV || "development",
        database,
        firebase: true,
        ipaymu: { configured: Boolean(IPAYMU_VA && IPAYMU_API_KEY), environment: IPAYMU_ENV },
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: nowIso()
    };
    res.status(database ? 200 : 503).json(payload);
});

// =====================================================
// DATABASE STATUS
// Untuk index33
// =====================================================

app.get(
    "/api/database",
    verifyFirebaseToken,
    requireAdmin,
    (req, res) => {

        try {

            const tables =
                db.prepare(`
                    SELECT
                        name
                    FROM sqlite_master
                    WHERE type = 'table'
                    AND name NOT LIKE 'sqlite_%'
                    ORDER BY name
                `)
                .all();

            const tableDetails =
                tables.map(
                    table => {

                        const tableName =
                            table.name;

                        const columns =
                            db.prepare(
                                `PRAGMA table_info("${tableName}")`
                            )
                            .all();

                        let rowCount = 0;

                        try {

                            const result =
                                db.prepare(
                                    `SELECT COUNT(*) AS count FROM "${tableName}"`
                                )
                                .get();

                            rowCount =
                                result.count || 0;

                        } catch (error) {

                            rowCount = 0;
                        }

                        return {

                            name:
                                tableName,

                            columns:
                                columns.length,

                            rows:
                                rowCount

                        };
                    }
                );

            const userCount =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM users
                `)
                .get()
                .count;

            let databaseSize = 0;

            try {

                databaseSize =
                    fs.statSync(dbPath).size;

            } catch (error) {

                databaseSize = 0;
            }

            res.json({

                success:
                    true,

                database:
                    "online",

                connected:
                    true,

                engine:
                    "SQLite",

                name:
                    "webtoolskita.db",

                databaseName:
                    "webtoolskita.db",

                path:
                    dbPath,

                userCount:
                    userCount,

                totalUsers:
                    userCount,

                tableCount:
                    tableDetails.length,

                tables:
                    tableDetails,

                size:
                    databaseSize,

                sizeBytes:
                    databaseSize,

                lastCheck:
                    new Date().toISOString()

            });

        } catch (error) {

            console.error(
                "DATABASE STATUS ERROR:",
                error
            );

            res.status(500).json({

                success:
                    false,

                connected:
                    false,

                message:
                    error.message

            });
        }
    }
);


// =====================================================
// AUTH LOGIN
// =====================================================

app.post(
    "/api/auth/login",
    verifyFirebaseToken,
    async (req, res) => {

        try {

            const uid =
                req.firebaseUser.uid;

            const userRecord =
                await firebaseAuth.getUser(
                    uid
                );

            const access =
                await applyAdminClaim(
                    userRecord
                );

            const name =
                userRecord.displayName ||
                "";

            const email =
                userRecord.email ||
                "";

            const photoURL =
                userRecord.photoURL ||
                "";

            const isAdmin =
                access.admin === true;

            const now =
                new Date().toISOString();

            const existing =
                db.prepare(`
                    SELECT *
                    FROM users
                    WHERE google_uid = ?
                `)
                .get(uid);

            if (!existing) {

                db.prepare(`
                    INSERT INTO users (

                        google_uid,
                        name,
                        email,
                        photo_url,
                        vip_status,
                        payment_status,
                        last_seen

                    )
                    VALUES (
                        ?, ?, ?, ?, ?, ?, ?
                    )
                `)
                .run(

                    uid,
                    name,
                    email,
                    photoURL,

                    isAdmin
                        ? "active"
                        : "free",

                    isAdmin
                        ? "admin"
                        : "none",

                    now
                );

            } else {

                db.prepare(`
                    UPDATE users
                    SET
                        name = ?,
                        email = ?,
                        photo_url = ?,
                        last_seen = ?
                    WHERE google_uid = ?
                `)
                .run(
                    name,
                    email,
                    photoURL,
                    now,
                    uid
                );

                if (isAdmin) {

                    db.prepare(`
                        UPDATE users
                        SET
                            vip_status = 'active',
                            payment_status = 'admin'
                        WHERE google_uid = ?
                    `)
                    .run(uid);
                }
            }

            const savedUser =
                db.prepare(`
                    SELECT *
                    FROM users
                    WHERE google_uid = ?
                `)
                .get(uid);

            res.json({

                success:
                    true,

                message:
                    "Login berhasil",

                user:
                    savedUser,

                access: {

                    admin:
                        isAdmin,

                    vip:
                        isAdmin ||
                        savedUser.vip_status ===
                            "active"

                }

            });

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            res.status(500).json({

                success:
                    false,

                message:
                    "Gagal memproses login"

            });
        }
    }
);


// =====================================================
// AUTH ME
// =====================================================

app.get(
    "/api/auth/me",
    verifyFirebaseToken,
    async (req, res) => {

        try {

            const userRecord =
                await firebaseAuth.getUser(
                    req.firebaseUser.uid
                );

            const email =
                (userRecord.email || "")
                    .toLowerCase()
                    .trim();

            const isAdmin =
                email ===
                ADMIN_EMAIL.toLowerCase();

            const now =
                new Date().toISOString();

            const user =
                db.prepare(`
                    SELECT *
                    FROM users
                    WHERE google_uid = ?
                `)
                .get(
                    req.firebaseUser.uid
                );

            if (user) {

                db.prepare(`
                    UPDATE users
                    SET last_seen = ?
                    WHERE google_uid = ?
                `)
                .run(
                    now,
                    req.firebaseUser.uid
                );

                user.last_seen =
                    now;
            }

            const vipFromDatabase =
                user &&
                user.vip_status === "active" &&
                (
                    !user.vip_expired ||
                    new Date(
                        user.vip_expired
                    ) > new Date()
                );

            res.json({

                success:
                    true,

                user:

                    user || null,

                access: {

                    admin:
                        isAdmin,

                    vip:
                        isAdmin ||
                        req.firebaseUser.vip === true ||
                        vipFromDatabase === true

                }

            });

        } catch (error) {

            console.error(
                "Auth ME error:",
                error
            );

            res.status(500).json({

                success:
                    false,

                message:
                    "Gagal mengambil data user"

            });
        }
    }
);


// =====================================================
// HEARTBEAT
// Dipanggil index/login untuk status online
// =====================================================

app.post(
    "/api/heartbeat",
    verifyFirebaseToken,
    async (req, res) => {

        try {

            const uid =
                req.firebaseUser.uid;

            const now =
                new Date().toISOString();

            const result =
                db.prepare(`
                    UPDATE users
                    SET last_seen = ?
                    WHERE google_uid = ?
                `)
                .run(
                    now,
                    uid
                );

            if (
                result.changes === 0
            ) {

                const userRecord =
                    await firebaseAuth.getUser(
                        uid
                    );

                const email =
                    userRecord.email || "";

                const name =
                    userRecord.displayName ||
                    "Pengguna Google";

                const photoURL =
                    userRecord.photoURL || "";

                const isAdmin =
                    email
                        .toLowerCase()
                        .trim() ===
                    ADMIN_EMAIL.toLowerCase();

                db.prepare(`
                    INSERT OR IGNORE INTO users (

                        google_uid,
                        name,
                        email,
                        photo_url,
                        vip_status,
                        payment_status,
                        last_seen

                    )
                    VALUES (
                        ?, ?, ?, ?, ?, ?, ?
                    )
                `)
                .run(

                    uid,
                    name,
                    email,
                    photoURL,

                    isAdmin
                        ? "active"
                        : "free",

                    isAdmin
                        ? "admin"
                        : "none",

                    now
                );
            }

            res.json({

                success:
                    true,

                online:
                    true,

                last_seen:
                    now

            });

        } catch (error) {

            console.error(
                "Heartbeat error:",
                error
            );

            res.status(500).json({

                success:
                    false,

                message:
                    "Gagal memperbarui status online"

            });
        }
    }
);


// =====================================================
// VIP TEST
// =====================================================

app.get(
    "/api/vip/test",
    verifyFirebaseToken,
    requireVip,
    (req, res) => {

        res.json({

            success:
                true,

            message:
                "Akses VIP berhasil",

            access: {

                admin:
                    req.firebaseUser.admin ===
                    true,

                vip:
                    true

            }

        });
    }
);


// =====================================================
// ADMIN TEST
// =====================================================

app.get(
    "/api/admin/test",
    verifyFirebaseToken,
    requireAdmin,
    (req, res) => {

        res.json({

            success:
                true,

            message:
                "Akses admin berhasil"

        });
    }
);

// =====================================================
// ADVERTISING - GET ALL CAMPAIGNS
// =====================================================

app.get(
    "/api/ads",
    verifyFirebaseToken,
    requireAdmin,
    (req, res) => {

        try {

            const ads = db.prepare(`
                SELECT
                    id,
                    campaign_name,
                    title,
                    description,
                    image_url,
                    button_text,
                    target_url,
                    format,
                    background_color,
                    button_color,
                    label,
                    status,
                    impressions,
                    clicks,
                    created_at,
                    updated_at
                FROM ads
                ORDER BY id DESC
            `).all();

            res.json({

                success: true,

                ads: ads

            });

        } catch (error) {

            console.error(
                "GET ADS ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Gagal mengambil data iklan"

            });
        }
    }
);

// =====================================================
// ADVERTISING - CREATE CAMPAIGN
// =====================================================

app.post(
    "/api/ads",
    verifyFirebaseToken,
    requireAdmin,
    (req, res) => {

        try {

            const {
                campaign_name,
                title,
                description,
                image_url,
                button_text,
                target_url,
                format,
                background_color,
                button_color,
                label,
                status
            } = req.body;

            if (!campaign_name || !title || !target_url) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Nama campaign, judul, dan URL tujuan wajib diisi"

                });
            }

            const result = db.prepare(`
                INSERT INTO ads (

                    campaign_name,
                    title,
                    description,
                    image_url,
                    button_text,
                    target_url,
                    format,
                    background_color,
                    button_color,
                    label,
                    status

                )
                VALUES (

                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?

                )
            `).run(

                campaign_name,
                title,
                description || "",
                image_url || "",
                button_text || "Lihat Sekarang",
                target_url,
                format || "banner",
                background_color || "#ffffff",
                button_color || "#247bb6",
                label || "ADVERTISEMENT",
                status || "draft"

            );

            const ad = db.prepare(`
                SELECT *
                FROM ads
                WHERE id = ?
            `).get(result.lastInsertRowid);

            res.status(201).json({

                success: true,

                message:
                    "Campaign berhasil dibuat",

                ad: ad

            });

        } catch (error) {

            console.error(
                "CREATE ADS ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Gagal membuat campaign"

            });
        }
    }
);

// =====================================================
// ADVERTISING - UPDATE CAMPAIGN
// =====================================================

app.put(
    "/api/ads/:id",
    verifyFirebaseToken,
    requireAdmin,
    (req, res) => {

        try {

            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "ID campaign tidak valid"
                });
            }

            const {
                campaign_name,
                title,
                description,
                image_url,
                button_text,
                target_url,
                format,
                background_color,
                button_color,
                label,
                status
            } = req.body;

            if (!campaign_name || !title || !target_url) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Nama campaign, judul, dan URL tujuan wajib diisi"
                });
            }

            const result = db.prepare(`
                UPDATE ads
                SET
                    campaign_name = ?,
                    title = ?,
                    description = ?,
                    image_url = ?,
                    button_text = ?,
                    target_url = ?,
                    format = ?,
                    background_color = ?,
                    button_color = ?,
                    label = ?,
                    status = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(
                campaign_name,
                title,
                description || "",
                image_url || "",
                button_text || "Lihat Sekarang",
                target_url,
                format || "banner",
                background_color || "#ffffff",
                button_color || "#247bb6",
                label || "ADVERTISEMENT",
                status || "draft",
                id
            );

            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Campaign tidak ditemukan"
                });
            }

            const ad = db.prepare(`
                SELECT *
                FROM ads
                WHERE id = ?
            `).get(id);

            res.json({
                success: true,
                message: "Campaign berhasil diperbarui",
                ad: ad
            });

        } catch (error) {

            console.error("UPDATE ADS ERROR:", error);

            res.status(500).json({
                success: false,
                message: "Gagal memperbarui campaign"
            });

        }
    }
);

// =====================================================
// ADVERTISING - DELETE CAMPAIGN
// =====================================================

app.delete(
    "/api/ads/:id",
    verifyFirebaseToken,
    requireAdmin,
    (req, res) => {

        try {

            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "ID campaign tidak valid"
                });
            }

            const result = db.prepare(`
                DELETE FROM ads
                WHERE id = ?
            `).run(id);

            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Campaign tidak ditemukan"
                });
            }

            res.json({
                success: true,
                message: "Campaign berhasil dihapus"
            });

        } catch (error) {

            console.error("DELETE ADS ERROR:", error);

            res.status(500).json({
                success: false,
                message: "Gagal menghapus campaign"
            });

        }
    }
);

// =====================================================
// ADVERTISING - GET ACTIVE ADS
// Public endpoint
// =====================================================

app.get(
    "/api/ads/active",
    (req, res) => {

        try {

            const ads = db.prepare(`
                SELECT
                    id,
                    campaign_name,
                    title,
                    description,
                    image_url,
                    button_text,
                    target_url,
                    format,
                    background_color,
                    button_color,
                    label
                FROM ads
                WHERE status = 'active'
                ORDER BY RANDOM()
                LIMIT 10
            `).all();

            res.json({
                success: true,
                ads: ads
            });

        } catch (error) {

            console.error("GET ACTIVE ADS ERROR:", error);

            res.status(500).json({
                success: false,
                message: "Gagal mengambil iklan aktif"
            });

        }
    }
);

// =====================================================
// ADVERTISING - TRACK IMPRESSION
// Public endpoint
// =====================================================

app.post(
    "/api/ads/:id/impression",
    (req, res) => {

        try {

            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "ID iklan tidak valid"
                });
            }

            const result = db.prepare(`
                UPDATE ads
                SET impressions = impressions + 1
                WHERE id = ?
                  AND status = 'active'
            `).run(id);

            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Iklan aktif tidak ditemukan"
                });
            }

            res.json({
                success: true,
                message: "Impression tercatat"
            });

        } catch (error) {

            console.error(
                "TRACK IMPRESSION ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Gagal mencatat impression"
            });

        }
    }
);

// =====================================================
// ADVERTISING - TRACK CLICK
// Public endpoint
// =====================================================

app.post(
    "/api/ads/:id/click",
    (req, res) => {

        try {

            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "ID iklan tidak valid"
                });
            }

            const result = db.prepare(`
                UPDATE ads
                SET clicks = clicks + 1
                WHERE id = ?
                  AND status = 'active'
            `).run(id);

            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Iklan aktif tidak ditemukan"
                });
            }

            res.json({
                success: true,
                message: "Click tercatat"
            });

        } catch (error) {

            console.error(
                "TRACK CLICK ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Gagal mencatat click"
            });

        }
    }
);

// =====================================================
// USERS ADMIN
// =====================================================

app.get(
    "/api/users",
    verifyFirebaseToken,
    requireAdmin,
    (req, res) => {

        try {

            const users =
                db.prepare(`
                    SELECT

                        id,

                        google_uid,

                        name,

                        email,

                        photo_url,

                        vip_status,

                        vip_start,

                        vip_expired,

                        payment_status,

                        payment_id,

                        last_seen,

                        created_at

                    FROM users

                    ORDER BY id DESC
                `)
                .all();

            res.json({

                success:
                    true,

                count:
                    users.length,

                users

            });

        } catch (error) {

            console.error(
                "USERS ERROR:",
                error
            );

            res.status(500).json({

                success:
                    false,

                message:
                    error.message

            });
        }
    }
);


// =====================================================
// ADMIN ONLINE USERS
// index32.html
// =====================================================

app.get(
    "/api/admin/online-users",
    verifyFirebaseToken,
    requireAdmin,
    (req, res) => {

        try {

            const users =
                db.prepare(`
                    SELECT

                        id,

                        google_uid,

                        name,

                        email,

                        photo_url,

                        vip_status,

                        last_seen,

                        created_at

                    FROM users

                    ORDER BY last_seen DESC
                `)
                .all();

            const now =
                Date.now();

            // User dianggap online
            // jika heartbeat <= 60 detik

            const ONLINE_SECONDS =
                60;

            const onlineUsers =
                users
                    .filter(
                        user => {

                            if (
                                !user.last_seen
                            ) {

                                return false;
                            }

                            const lastSeen =
                                new Date(
                                    user.last_seen
                                ).getTime();

                            if (
                                Number.isNaN(
                                    lastSeen
                                )
                            ) {

                                return false;
                            }

                            return (
                                now -
                                lastSeen <=
                                ONLINE_SECONDS *
                                1000
                            );
                        }
                    )
                    .map(
                        user => ({

                            id:
                                user.id,

                            google_uid:
                                user.google_uid,

                            name:
                                user.name ||
                                "Pengguna",

                            email:
                                user.email ||
                                "",

                            photo_url:
                                user.photo_url ||
                                "",

                            vip_status:
                                user.vip_status ||
                                "free",

                            last_seen:
                                user.last_seen,

                            online:
                                true

                        })
                    );

            res.json({

                success:
                    true,

                online:
                    true,

                onlineCount:
                    onlineUsers.length,

                totalCount:
                    users.length,

                users:
                    onlineUsers,

                checkedAt:
                    new Date().toISOString(),

                timeoutSeconds:
                    ONLINE_SECONDS

            });

        } catch (error) {

            console.error(
                "ADMIN ONLINE ERROR:",
                error
            );

            res.status(500).json({

                success:
                    false,

                message:
                    "Gagal mengambil pengguna online"

            });
        }
    }
);


// =====================================================
// ADMIN VIP ACTIVATION
// =====================================================

app.post(
    "/api/admin/vip/:uid",
    verifyFirebaseToken,
    requireAdmin,
    (req, res) => {

        try {

            const uid =
                req.params.uid;

            const now =
                new Date();

            const expired =
                new Date(now);

            expired.setMonth(
                expired.getMonth() + 1
            );

            const result =
                db.prepare(`
                    UPDATE users
                    SET

                        vip_status =
                            'active',

                        vip_start =
                            ?,

                        vip_expired =
                            ?,

                        payment_status =
                            'admin'

                    WHERE google_uid = ?
                `)
                .run(

                    now.toISOString(),

                    expired.toISOString(),

                    uid

                );

            if (
                result.changes === 0
            ) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "User tidak ditemukan"

                });
            }

            res.json({

                success:
                    true,

                message:
                    "VIP berhasil diaktifkan",

                vip_expired:
                    expired.toISOString()

            });

        } catch (error) {

            console.error(
                "VIP ADMIN ERROR:",
                error
            );

            res.status(500).json({

                success:
                    false,

                message:
                    error.message

            });
        }
    }
);


// =====================================================
// DATABASE HEALTH
// =====================================================

app.get(
    "/api/database/health",
    verifyFirebaseToken,
    requireAdmin,
    (req, res) => {

        try {

            db.prepare(
                "SELECT 1"
            ).get();

            res.json({

                success:
                    true,

                database:
                    "online",

                engine:
                    "SQLite",

                checkedAt:
                    new Date().toISOString()

            });

        } catch (error) {

            res.status(500).json({

                success:
                    false,

                database:
                    "offline",

                message:
                    error.message

            });
        }
    }
);


// =====================================================
// TARGET NETWORK ANALYZER
// Public / passive only. No login bypass, no password
// extraction, no credential submission, no cookie/token theft.
// =====================================================

const NETWORK_TIMEOUT = 10000;
const NETWORK_MAX_REDIRECTS = 5;
const NETWORK_MAX_BODY = 1024 * 1024;
const NETWORK_USER_AGENT = "WebToolsKita-Target-Analyzer/1.0";

function isPrivateIPv4(ip) {
    const parts = String(ip).split(".").map(Number);
    if (parts.length !== 4 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false;
    const [a,b,c,d] = parts;
    return (
        a === 10 ||
        a === 127 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 198 && (b === 18 || b === 19)) ||
        a === 0 ||
        a >= 224
    );
}

function isPrivateIPv6(ip) {
    const value = String(ip).toLowerCase().split("%")[0];
    if (!net.isIPv6(value)) return false;
    if (value === "::" || value === "::1") return true;
    const first = value.split(":")[0] || "0";
    const n = parseInt(first, 16);
    return (
        (n >= 0xfc00 && n <= 0xfdff) ||
        (n >= 0xfe80 && n <= 0xfebf) ||
        (n >= 0xff00 && n <= 0xffff)
    );
}

function isPrivateIP(ip) {
    if (net.isIPv4(ip)) return isPrivateIPv4(ip);
    if (net.isIPv6(ip)) return isPrivateIPv6(ip);
    return true;
}

function normalizeHostname(hostname) {
    return String(hostname || "")
        .trim()
        .toLowerCase()
        .replace(/^\[|\]$/g, "")
        .replace(/\.$/, "");
}

function normalizeTarget(input) {
    let raw = String(input || "").trim();
    if (!raw) throw new Error("Target wajib diisi");
    if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Hanya HTTP/HTTPS yang didukung");
    }
    if (!url.hostname) throw new Error("Hostname target tidak valid");
    return url;
}

async function resolvePublicHost(hostname) {
    const host = normalizeHostname(hostname);
    if (!host) throw new Error("Hostname kosong");
    if (net.isIP(host)) {
        if (isPrivateIP(host)) throw new Error("Target IP private/reserved ditolak");
        return [host];
    }

    const addresses = await dns.lookup(host, { all: true, verbatim: true });
    const unique = [...new Set(addresses.map(x => x.address))];
    const publicIps = unique.filter(ip => !isPrivateIP(ip));
    if (!publicIps.length) throw new Error("Target tidak memiliki IP publik yang aman untuk dianalisis");
    return publicIps;
}

function ipForRequest(ip) {
    return net.isIPv6(ip) ? `[${ip}]` : ip;
}

function extractTitle(html) {
    const m = String(html || "").match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (!m) return "";
    return decodeHtml(m[1]).replace(/\s+/g, " ").trim().slice(0, 200);
}

function decodeHtml(value) {
    return String(value || "")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">");
}

function absoluteUrl(base, href) {
    try {
        if (!href) return null;
        const clean = decodeHtml(href.trim()).replace(/^javascript:/i, "");
        if (!clean || clean.startsWith("#") || /^mailto:|^tel:|^data:/i.test(clean)) return null;
        const u = new URL(clean, base);
        if (!["http:", "https:"].includes(u.protocol)) return null;
        u.hash = "";
        return u;
    } catch (_) {
        return null;
    }
}

function extractLinks(html, baseUrl) {
    const result = [];
    const seen = new Set();
    const regex = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = regex.exec(String(html || ""))) !== null) {
        const url = absoluteUrl(baseUrl, m[1]);
        if (!url) continue;
        const text = decodeHtml(m[2].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim().slice(0, 180);
        const key = url.toString();
        if (!seen.has(key)) {
            seen.add(key);
            result.push({ url: key, text });
        }
        if (result.length >= 100) break;
    }
    return result;
}

function isSameOrigin(a, b) {
    return a.protocol === b.protocol && normalizeHostname(a.hostname) === normalizeHostname(b.hostname) && a.port === b.port;
}

function scoreRecoveryLink(link) {
    const s = `${link.text} ${link.url}`.toLowerCase();
    let score = 0;
    const terms = [
        ["forgot password", 10], ["lupa password", 10], ["forgot-password", 10],
        ["reset password", 10], ["reset-password", 10], ["password reset", 10],
        ["recovery", 8], ["recover", 7], ["account recovery", 10],
        ["sign in", 5], ["signin", 5], ["login", 5], ["log in", 5],
        ["account", 3], ["auth", 3]
    ];
    for (const [term, points] of terms) if (s.includes(term)) score += points;
    return score;
}

function scoreLoginLink(link) {
    const s = `${link.text} ${link.url}`.toLowerCase();
    let score = 0;
    for (const term of ["login", "log in", "signin", "sign in", "/auth", "/account"]) {
        if (s.includes(term)) score += term.startsWith("/") ? 4 : 7;
    }
    return score;
}

function commonPaths(originUrl) {
    const paths = [
        "/login", "/signin", "/sign-in", "/account/login", "/auth/login",
        "/forgot-password", "/forgotpassword", "/password/reset", "/reset-password",
        "/resetpassword", "/account/forgot-password", "/account/reset-password"
    ];
    return paths.map(p => new URL(p, originUrl).toString());
}

async function requestPublicUrl(url, options = {}) {
    const start = Date.now();
    let current = new URL(url.toString());
    let redirects = 0;
    const method = options.method || "GET";
    const collectBody = options.collectBody === true;

    while (true) {
        const ips = await resolvePublicHost(current.hostname);
        const ip = ips[0];
        const port = current.port ? Number(current.port) : (current.protocol === "https:" ? 443 : 80);
        const transport = current.protocol === "https:" ? https : http;

        const headers = {
            "User-Agent": NETWORK_USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
            "Accept-Encoding": "identity",
            "Host": current.host
        };

        const response = await new Promise((resolve, reject) => {
            const reqOptions = {
                protocol: current.protocol,
                hostname: ip,
                port,
                method,
                path: `${current.pathname || "/"}${current.search || ""}`,
                headers,
                timeout: NETWORK_TIMEOUT,
                rejectUnauthorized: false
            };
            if (current.protocol === "https:") reqOptions.servername = current.hostname;

            const req = transport.request(reqOptions, res => {
                const chunks = [];
                let size = 0;
                res.on("data", chunk => {
                    if (!collectBody || size >= NETWORK_MAX_BODY) return;
                    const remaining = NETWORK_MAX_BODY - size;
                    const part = Buffer.isBuffer(chunk) ? chunk.subarray(0, remaining) : Buffer.from(chunk).subarray(0, remaining);
                    chunks.push(part);
                    size += part.length;
                });
                res.on("end", () => resolve({
                    status: res.statusCode || 0,
                    statusText: res.statusMessage || "",
                    headers: res.headers || {},
                    body: collectBody ? Buffer.concat(chunks).toString("utf8") : "",
                    finalUrl: current.toString(),
                    ip,
                    responseTimeMs: Date.now() - start
                }));
            });
            req.on("timeout", () => req.destroy(new Error("Request timeout")));
            req.on("error", reject);
            req.end();
        });

        const location = response.headers.location;
        if ([301,302,303,307,308].includes(response.status) && location && redirects < NETWORK_MAX_REDIRECTS) {
            const nextUrl = absoluteUrl(current, location);
            if (!nextUrl) throw new Error("Redirect target tidak valid");
            if (!["http:", "https:"].includes(nextUrl.protocol)) throw new Error("Redirect protocol ditolak");
            current = nextUrl;
            redirects++;
            continue;
        }

        response.redirects = redirects;
        response.elapsedMs = Date.now() - start;
        return response;
    }
}

async function networkRecon(target) {
    const url = normalizeTarget(target);
    const ips = await resolvePublicHost(url.hostname);
    const httpResult = await requestPublicUrl(url, { method: "HEAD", collectBody: false }).catch(async () =>
        requestPublicUrl(url, { method: "GET", collectBody: false })
    );
    const reverse = {};
    for (const ip of ips.slice(0, 8)) {
        try { reverse[ip] = await dns.reverse(ip); }
        catch (_) { reverse[ip] = []; }
    }
    return {
        target: url.toString(),
        hostname: normalizeHostname(url.hostname),
        protocol: url.protocol.replace(":", ""),
        port: url.port ? Number(url.port) : (url.protocol === "https:" ? 443 : 80),
        ips,
        reverseDns: reverse,
        httpStatus: httpResult.status,
        server: httpResult.headers.server || "",
        contentType: httpResult.headers["content-type"] || "",
        poweredBy: httpResult.headers["x-powered-by"] || "",
        finalUrl: httpResult.finalUrl,
        responseTimeMs: httpResult.responseTimeMs
    };
}

async function networkDNS(domain) {
    const url = normalizeTarget(domain);
    const hostname = normalizeHostname(url.hostname);
    const result = { hostname };
    const lookups = ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA"];
    for (const type of lookups) {
        try {
            if (type === "A") result.A = await dns.resolve4(hostname);
            else if (type === "AAAA") result.AAAA = await dns.resolve6(hostname);
            else if (type === "MX") result.MX = await dns.resolveMx(hostname);
            else if (type === "NS") result.NS = await dns.resolveNs(hostname);
            else if (type === "TXT") result.TXT = await dns.resolveTxt(hostname);
            else if (type === "CNAME") result.CNAME = await dns.resolveCname(hostname);
            else if (type === "SOA") result.SOA = await dns.resolveSoa(hostname);
        } catch (_) {
            result[type] = [];
        }
    }
    return result;
}

async function networkSecurityHeaders(target) {
    const url = normalizeTarget(target);
    const r = await requestPublicUrl(url, { method: "HEAD", collectBody: false }).catch(async () =>
        requestPublicUrl(url, { method: "GET", collectBody: false })
    );
    const wanted = [
        "strict-transport-security", "content-security-policy", "x-frame-options",
        "x-content-type-options", "referrer-policy", "permissions-policy",
        "cross-origin-opener-policy", "cross-origin-resource-policy",
        "cross-origin-embedder-policy", "cache-control", "server", "x-powered-by"
    ];
    const headers = {};
    for (const key of wanted) headers[key] = r.headers[key] || null;
    return { target: url.toString(), status: r.status, finalUrl: r.finalUrl, headers, responseTimeMs: r.responseTimeMs };
}

async function networkHTTP(target) {
    const url = normalizeTarget(target);
    const r = await requestPublicUrl(url, { method: "GET", collectBody: true });
    const body = r.body || "";
    return {
        target: url.toString(),
        finalUrl: r.finalUrl,
        status: r.status,
        statusText: r.statusText,
        protocol: new URL(r.finalUrl).protocol.replace(":", ""),
        responseTimeMs: r.responseTimeMs,
        redirects: r.redirects,
        contentType: r.headers["content-type"] || "",
        contentLength: r.headers["content-length"] || "",
        server: r.headers.server || "",
        poweredBy: r.headers["x-powered-by"] || "",
        location: r.headers.location || "",
        title: extractTitle(body),
        bodyBytesCollected: Buffer.byteLength(body, "utf8")
    };
}

async function networkReverseDNS(target) {
    const url = normalizeTarget(target);
    const ips = await resolvePublicHost(url.hostname);
    const results = [];
    for (const ip of ips.slice(0, 16)) {
        let names = [];
        try { names = await dns.reverse(ip); } catch (_) {}
        results.push({ ip, hostnames: names });
    }
    return { target: url.toString(), results };
}

async function networkTLS(target) {
    const url = normalizeTarget(target);
    if (url.protocol !== "https:") return { target: url.toString(), supported: false, message: "Target bukan HTTPS" };
    const ips = await resolvePublicHost(url.hostname);
    const ip = ips[0];
    const port = url.port ? Number(url.port) : 443;
    const result = await new Promise((resolve, reject) => {
        const socket = tls.connect({
            host: ip,
            port,
            servername: url.hostname,
            rejectUnauthorized: false,
            timeout: NETWORK_TIMEOUT
        });
        socket.once("secureConnect", () => {
            const cert = socket.getPeerCertificate(true) || {};
            const cipher = socket.getCipher() || {};
            const protocol = socket.getProtocol() || "";
            resolve({
                target: url.toString(),
                supported: true,
                ip,
                protocol,
                authorized: socket.authorized,
                authorizationError: socket.authorizationError || null,
                cipher: cipher.name || "",
                cipherVersion: cipher.version || "",
                certificate: {
                    subject: cert.subject || {},
                    issuer: cert.issuer || {},
                    validFrom: cert.valid_from || "",
                    validTo: cert.valid_to || "",
                    serialNumber: cert.serialNumber || "",
                    fingerprint256: cert.fingerprint256 || "",
                    subjectAltName: cert.subjectaltname || ""
                }
            });
            socket.end();
        });
        socket.once("timeout", () => socket.destroy(new Error("TLS timeout")));
        socket.once("error", reject);
    });
    return result;
}

async function fetchRecoveryPage(urlString, origin) {
    const url = normalizeTarget(urlString);
    if (!isSameOrigin(url, origin)) return null;
    const r = await requestPublicUrl(url, { method: "GET", collectBody: true });
    const type = String(r.headers["content-type"] || "").toLowerCase();
    if (!type.includes("text/html") && !type.includes("application/xhtml+xml") && !type.includes("text/plain")) return null;
    return { url: r.finalUrl, html: r.body, status: r.status, title: extractTitle(r.body), links: extractLinks(r.body, r.finalUrl) };
}

async function networkRecovery(target) {
    const origin = normalizeTarget(target);
    const queue = [origin.toString(), ...commonPaths(origin)];
    const visited = new Set();
    const loginCandidates = [];
    const recoveryCandidates = [];
    const checked = [];
    const maxPages = 12;

    while (queue.length && visited.size < maxPages) {
        const raw = queue.shift();
        let u;
        try { u = normalizeTarget(raw); } catch (_) { continue; }
        if (!isSameOrigin(u, origin)) continue;
        const key = u.toString();
        if (visited.has(key)) continue;
        visited.add(key);

        let page;
        try { page = await fetchRecoveryPage(key, origin); }
        catch (_) { continue; }
        if (!page) continue;
        checked.push({ url: page.url, status: page.status, title: page.title });

        const links = page.links;
        for (const link of links) {
            const loginScore = scoreLoginLink(link);
            const recoveryScore = scoreRecoveryLink(link);
            if (loginScore > 0) loginCandidates.push({ ...link, score: loginScore });
            if (recoveryScore >= 8) recoveryCandidates.push({ ...link, score: recoveryScore });

            let linkUrl;
            try { linkUrl = new URL(link.url); } catch (_) { continue; }
            if (!isSameOrigin(linkUrl, origin)) continue;
            const combined = `${link.text} ${link.url}`.toLowerCase();
            if (/(login|sign.?in|auth|account|forgot|reset|recover|password)/i.test(combined) && queue.length < 30) {
                queue.push(linkUrl.toString());
            }
        }

        const text = String(page.html || "").toLowerCase();
        if (/(forgot\s+password|lupa\s+password|reset\s+password|password\s+reset|account\s+recovery|recover\s+account)/i.test(text)) {
            recoveryCandidates.push({ url: page.url, text: "Recovery text ditemukan pada halaman", score: 9 });
        }
    }

    const unique = arr => {
        const map = new Map();
        for (const item of arr) {
            const key = item.url;
            if (!map.has(key) || item.score > map.get(key).score) map.set(key, item);
        }
        return [...map.values()].sort((a,b) => b.score - a.score).slice(0, 20);
    };

    return {
        target: origin.toString(),
        checkedPages: checked,
        pagesChecked: checked.length,
        login: unique(loginCandidates),
        recovery: unique(recoveryCandidates),
        found: unique(recoveryCandidates).length > 0,
        note: "Hanya mencari jalur login/recovery publik. Tidak mengirim form, tidak mengambil password, cookie, token, atau credential."
    };
}

async function networkMetadata(target) {
    const normalized = normalizeTarget(target);
    const [recon, dnsInfo, headers, httpInfo, reverseDns, tlsInfo, recovery] = await Promise.allSettled([
        networkRecon(normalized.toString()),
        networkDNS(normalized.hostname),
        networkSecurityHeaders(normalized.toString()),
        networkHTTP(normalized.toString()),
        networkReverseDNS(normalized.toString()),
        networkTLS(normalized.toString()),
        networkRecovery(normalized.toString())
    ]);
    const unwrap = x => x.status === "fulfilled" ? x.value : { error: x.reason?.message || "Gagal mengambil data" };
    return {
        success: true,
        target: normalized.toString(),
        checkedAt: new Date().toISOString(),
        recon: unwrap(recon),
        dns: unwrap(dnsInfo),
        securityHeaders: unwrap(headers),
        http: unwrap(httpInfo),
        reverseDns: unwrap(reverseDns),
        tls: unwrap(tlsInfo),
        recovery: unwrap(recovery)
    };
}

// =====================================================
// PUBLIC NETWORK ROUTES
// Dipakai index34. Tetap passive/non-destructive.
// =====================================================

app.get("/api/network/info", async (req, res) => {
    try {
        const target = req.query.target || req.query.domain;
        const normalized = normalizeTarget(target);
        const ips = await resolvePublicHost(normalized.hostname);
        res.json({ success: true, target: normalized.toString(), hostname: normalized.hostname, ips });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

app.get("/api/network/recon", async (req, res) => {
    try { res.json({ success: true, data: await networkRecon(req.query.target) }); }
    catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

app.get("/api/network/dns", async (req, res) => {
    try { res.json({ success: true, data: await networkDNS(req.query.domain || req.query.target) }); }
    catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

app.get("/api/network/security-headers", async (req, res) => {
    try { res.json({ success: true, data: await networkSecurityHeaders(req.query.target) }); }
    catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

// =====================================================
// ADMIN NETWORK ROUTES
// =====================================================

app.get("/api/admin/network/recon", verifyFirebaseToken, requireAdmin, async (req, res) => {
    try { res.json({ success: true, data: await networkRecon(req.query.target) }); }
    catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

app.get("/api/admin/network/dns", verifyFirebaseToken, requireAdmin, async (req, res) => {
    try { res.json({ success: true, data: await networkDNS(req.query.domain || req.query.target) }); }
    catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

app.get("/api/admin/network/security-headers", verifyFirebaseToken, requireAdmin, async (req, res) => {
    try { res.json({ success: true, data: await networkSecurityHeaders(req.query.target) }); }
    catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

app.get("/api/admin/network/http", verifyFirebaseToken, requireAdmin, async (req, res) => {
    try { res.json({ success: true, data: await networkHTTP(req.query.target) }); }
    catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

app.get("/api/admin/network/reverse-dns", verifyFirebaseToken, requireAdmin, async (req, res) => {
    try { res.json({ success: true, data: await networkReverseDNS(req.query.target) }); }
    catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

app.get("/api/admin/network/tls", verifyFirebaseToken, requireAdmin, async (req, res) => {
    try { res.json({ success: true, data: await networkTLS(req.query.target) }); }
    catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

app.get("/api/admin/network/recovery", verifyFirebaseToken, requireAdmin, async (req, res) => {
    try { res.json({ success: true, data: await networkRecovery(req.query.target) }); }
    catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

app.get("/api/admin/network/metadata", verifyFirebaseToken, requireAdmin, async (req, res) => {
    try { res.json(await networkMetadata(req.query.target)); }
    catch (error) { res.status(400).json({ success: false, message: error.message }); }
});



// =====================================================
// PLATFORM CORE HELPERS
// =====================================================

function json(value) {
    return JSON.stringify(value ?? {});
}

function safeJsonParse(value, fallback = {}) {
    try { return value ? JSON.parse(value) : fallback; }
    catch (_) { return fallback; }
}

function nowIso() {
    return new Date().toISOString();
}

function hashIp(req) {
    const raw = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "");
    return crypto.createHash("sha256").update(raw).digest("hex");
}

function audit(req, action, resourceType = null, resourceId = null, metadata = {}) {
    try {
        const uid = req.firebaseUser?.uid || null;
        let userId = null;
        if (uid) {
            userId = db.prepare("SELECT id FROM users WHERE google_uid = ?").get(uid)?.id || null;
        }
        db.prepare(`
            INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_hash, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(userId, action, resourceType, resourceId, hashIp(req), json(metadata));
    } catch (error) {
        console.error("AUDIT ERROR:", error.message);
    }
}

function logSystem(level, component, message, metadata = {}) {
    try {
        db.prepare(`
            INSERT INTO system_events (level, component, message, metadata_json)
            VALUES (?, ?, ?, ?)
        `).run(level, component, message, json(metadata));
    } catch (_) {}
}

function getLocalUser(req) {
    if (!req.firebaseUser?.uid) return null;
    return db.prepare("SELECT * FROM users WHERE google_uid = ?").get(req.firebaseUser.uid) || null;
}

function ensureWalletForUser(userId) {
    const existing = db.prepare("SELECT * FROM wallet_accounts WHERE user_id = ?").get(userId);
    if (existing) return existing;
    const result = db.prepare("INSERT INTO wallet_accounts (user_id) VALUES (?)").run(userId);
    return db.prepare("SELECT * FROM wallet_accounts WHERE id = ?").get(result.lastInsertRowid);
}

function walletView(userId) {
    const wallet = ensureWalletForUser(userId);
    return {
        id: wallet.id,
        userId: wallet.user_id,
        currency: wallet.currency,
        status: wallet.status,
        balance: wallet.balance,
        updatedAt: wallet.updated_at
    };
}

function normalizeIpaymuCallback(raw) {
    const result = {};
    const integerFields = new Set(["trx_id", "status_code", "transaction_status_code", "paid_off"]);
    for (const [key, value] of Object.entries(raw || {})) {
        if (key === "is_escrow") {
            result[key] = value === true || value === 1 || value === "1" || value === "true";
        } else if (integerFields.has(key)) {
            const n = Number.parseInt(value, 10);
            result[key] = Number.isNaN(n) ? 0 : n;
        } else if (key === "additional_info") {
            if (value === "[]") result[key] = [];
            else if (Array.isArray(value)) result[key] = value;
            else result[key] = value;
        } else if (value === null || value === undefined) {
            result[key] = null;
        } else {
            result[key] = String(value);
        }
    }
    if (!Object.prototype.hasOwnProperty.call(result, "additional_info")) result.additional_info = [];
    return result;
}

function sortObject(value) {
    if (Array.isArray(value)) return value.map(sortObject);
    if (!value || typeof value !== "object") return value;
    return Object.keys(value).sort((a, b) => a.localeCompare(b)).reduce((o, key) => {
        o[key] = sortObject(value[key]);
        return o;
    }, {});
}

function verifyIpaymuCallbackSignature(body, received) {
    if (!IPAYMU_VA || !received) return false;
    const normalized = normalizeIpaymuCallback(body);
    delete normalized.signature;
    const sorted = sortObject(normalized);
    let serialized = JSON.stringify(sorted).replace(/\//g, "\\/");
    const expected = crypto.createHmac("sha256", IPAYMU_VA).update(serialized).digest("hex");
    const a = Buffer.from(String(received).trim());
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function ipayTimestamp() {
    const d = new Date();
    const p = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function ipaySignature(method, body) {
    if (!IPAYMU_VA || !IPAYMU_API_KEY) throw new Error("iPaymu credentials belum dikonfigurasi");
    const bodyJson = typeof body === "string" ? body : JSON.stringify(body || {});
    const bodyHash = crypto.createHash("sha256").update(bodyJson).digest("hex").toLowerCase();
    const stringToSign = `${method.toUpperCase()}:${IPAYMU_VA}:${bodyHash}:${IPAYMU_API_KEY}`;
    return crypto.createHmac("sha256", IPAYMU_API_KEY).update(stringToSign).digest("hex");
}

async function ipayRequest(endpoint, method = "GET", body = {}) {
    if (typeof fetch !== "function") throw new Error("Node.js 18+ diperlukan untuk fetch");
    const bodyJson = JSON.stringify(body || {});
    const signature = ipaySignature(method, bodyJson);
    const response = await fetch(`${IPAYMU_BASE_URL}${endpoint}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "va": IPAYMU_VA,
            "signature": signature,
            "timestamp": ipayTimestamp()
        },
        body: method === "GET" ? undefined : bodyJson
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }
    if (!response.ok || data?.Success === false) {
        const error = new Error(data?.Message || `iPaymu HTTP ${response.status}`);
        error.status = response.status;
        error.provider = data;
        throw error;
    }
    return data;
}

function validatePaymentInput(body) {
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const amount = Number(body.amount);
    const paymentMethod = String(body.paymentMethod || "va").trim().toLowerCase();
    const paymentChannel = String(body.paymentChannel || "bca").trim().toLowerCase();

    if (name.length < 2 || name.length > 120) throw new Error("Nama pembayar tidak valid");
    if (!/^[0-9+()\\-\\s]{8,30}$/.test(phone)) throw new Error("Nomor telepon tidak valid");
    if (
    email.length < 5 ||
    email.length > 254 ||
    !/^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)+$/i.test(email)
) {
    throw new Error("Email tidak valid");
}

    if (!Number.isSafeInteger(amount) || amount < 1000) throw new Error("Nominal minimal Rp1.000");
    const allowed = {
        va: ["bag","bca","bpd_bali","bni","cimb","mandiri","bmi","bri","bsi","permata","danamon","btn"],
        cstore: ["alfamart","indomaret"],
        cod: ["rpx"],
        qris: ["mpm"],
        cc: ["cc"],
        paylater: ["akulaku"],
        ewallet: ["dana","shopeepay"]
    };
    if (!allowed[paymentMethod]?.includes(paymentChannel)) throw new Error("Metode/channel iPaymu tidak valid");
    return { name, phone, email, amount, paymentMethod, paymentChannel };
}

// =====================================================
// PLATFORM OVERVIEW / CEO / ADMIN ANALYTICS
// =====================================================

app.get("/api/system/overview", verifyFirebaseToken, requireAdmin, (req, res) => {
    const users = db.prepare("SELECT COUNT(*) c FROM users").get().c;
    const online = db.prepare("SELECT COUNT(*) c FROM users WHERE last_seen IS NOT NULL AND datetime(last_seen) >= datetime('now','-60 seconds')").get().c;
    const payments = db.prepare("SELECT COUNT(*) c FROM payment_transactions").get().c;
    const paid = db.prepare("SELECT COUNT(*) c FROM payment_transactions WHERE status = 'paid'").get().c;
    const campaigns = db.prepare("SELECT COUNT(*) c FROM campaigns").get().c;
    const activeCampaigns = db.prepare("SELECT COUNT(*) c FROM campaigns WHERE lower(status) = 'active'").get().c;
    const walletBalance = db.prepare("SELECT COALESCE(SUM(balance),0) total FROM wallet_accounts WHERE status='active'").get().total;
    res.json({
        success: true,
        service: "WebToolsKita Core",
        version: "3.0.0",
        uptimeSeconds: Math.floor(process.uptime()),
        users, online, payments, paid, campaigns, activeCampaigns,
        walletLedgerBalance: walletBalance,
        paymentGateway: { provider: "iPaymu", environment: IPAYMU_ENV, configured: Boolean(IPAYMU_VA && IPAYMU_API_KEY) },
        checkedAt: nowIso()
    });
});

app.get("/api/ceo/overview", verifyFirebaseToken, requireAdmin, (req, res) => {
    const payments = db.prepare(`
        SELECT status, COUNT(*) count, COALESCE(SUM(amount),0) amount
        FROM payment_transactions GROUP BY status ORDER BY status
    `).all();
    const campaigns = db.prepare(`
        SELECT status, COUNT(*) count, COALESCE(SUM(impressions),0) impressions, COALESCE(SUM(clicks),0) clicks
        FROM campaigns GROUP BY status ORDER BY status
    `).all();
    const vip = db.prepare(`
        SELECT COUNT(*) count FROM users
        WHERE vip_status='active' AND (vip_expired IS NULL OR datetime(vip_expired) > datetime('now'))
    `).get().count;
    const users7d = db.prepare("SELECT COUNT(*) count FROM users WHERE datetime(created_at) >= datetime('now','-7 days')").get().count;
    const recent = db.prepare(`
        SELECT id, reference_id, amount, status, purpose, payment_method, payment_channel, created_at, paid_at
        FROM payment_transactions ORDER BY id DESC LIMIT 20
    `).all();
    res.json({ success: true, generatedAt: nowIso(), kpi: { vipUsers: vip, newUsers7d: users7d }, payments, campaigns, recentPayments: recent });
});

app.get("/api/admin/analytics", verifyFirebaseToken, requireAdmin, (req, res) => {
    const days = Math.min(Math.max(Number(req.query.days || 30), 1), 365);
    const daily = db.prepare(`
        SELECT substr(created_at,1,10) day, COUNT(*) count
        FROM users
        WHERE datetime(created_at) >= datetime('now', ?)
        GROUP BY substr(created_at,1,10) ORDER BY day
    `).all(`-${days} days`);
    const paymentDaily = db.prepare(`
        SELECT substr(created_at,1,10) day, COUNT(*) count, COALESCE(SUM(amount),0) amount
        FROM payment_transactions
        WHERE datetime(created_at) >= datetime('now', ?)
        GROUP BY substr(created_at,1,10) ORDER BY day
    `).all(`-${days} days`);
    res.json({ success: true, days, usersDaily: daily, paymentsDaily: paymentDaily });
});

app.get("/api/admin/audit", verifyFirebaseToken, requireAdmin, (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);
    const rows = db.prepare(`
        SELECT a.*, u.email, u.name
        FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
        ORDER BY a.id DESC LIMIT ?
    `).all(limit);
    res.json({ success: true, count: rows.length, logs: rows });
});

  app.get("/api/admin/monitoring", verifyFirebaseToken, requireAdmin, async (req, res) => {
    try {
        const dbOk = (() => {
            try {
                db.prepare("SELECT 1").get();
                return true;
            } catch (_) {
                return false;
            }
        })();

        const mem = process.memoryUsage();

        // =========================
        // SYSTEM INFORMATION
        // =========================
        const hostname = os.hostname();
        const platform = os.platform();
        const arch = os.arch();
        const osRelease = os.release();
        const cpuInfo = os.cpus();

        // =========================
        // CPU USAGE
        // =========================
        const getCpuSnapshot = () => {
            const cpus = os.cpus();

            let idle = 0;
            let total = 0;

            for (const cpu of cpus) {
                const times = cpu.times;

                idle += times.idle;
                total +=
                    times.user +
                    times.nice +
                    times.sys +
                    times.irq +
                    times.idle;
            }

            return { idle, total };
        };

        const cpuStart = getCpuSnapshot();

        await new Promise(resolve => setTimeout(resolve, 500));

        const cpuEnd = getCpuSnapshot();

        const idleDelta = cpuEnd.idle - cpuStart.idle;
        const totalDelta = cpuEnd.total - cpuStart.total;

        const cpuUsagePercent = totalDelta > 0
            ? Number(((1 - idleDelta / totalDelta) * 100).toFixed(1))
            : 0;

        // =========================
        // SYSTEM MEMORY
        // =========================
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;

        const systemMemory = {
            total: totalMemory,
            free: freeMemory,
            used: usedMemory,
            usagePercent: totalMemory > 0
                ? Number(((usedMemory / totalMemory) * 100).toFixed(1))
                : 0
        };

        // =========================
        // DISK
        // =========================
        let disk = {
            available: false,
            path: process.cwd(),
            total: null,
            free: null,
            used: null,
            usagePercent: null
        };

        try {
            if (typeof fs.statfsSync === "function") {
                const diskPath = path.parse(process.cwd()).root || process.cwd();
                const stats = fs.statfsSync(diskPath);

                const blockSize = Number(stats.bsize);
                const totalBlocks = Number(stats.blocks);
                const freeBlocks = Number(stats.bfree);

                const totalDisk = blockSize * totalBlocks;
                const freeDisk = blockSize * freeBlocks;
                const usedDisk = Math.max(totalDisk - freeDisk, 0);

                disk = {
                    available: true,
                    path: diskPath,
                    total: totalDisk,
                    free: freeDisk,
                    used: usedDisk,
                    usagePercent: totalDisk > 0
                        ? Number(((usedDisk / totalDisk) * 100).toFixed(1))
                        : 0
                };
            }
        } catch (diskError) {
            disk.error = diskError.message;
        }

        // =========================
        // RESPONSE
        // =========================
        res.json({
            success: true,

            server: {
                name: "WebToolsKita Core",
                uptime: process.uptime(),
                node: process.version,
                pid: process.pid,
                hostname: hostname,
                platform: platform,
                architecture: arch,
                osRelease: osRelease
            },

            memory: mem,

            systemMemory: systemMemory,

            cpu: {
                usagePercent: cpuUsagePercent,
                model: cpuInfo[0]?.model || "Unknown",
                cores: cpuInfo.length,
                loadAverage: os.loadavg()
            },

            disk: disk,

            hostname: hostname,

            operatingSystem: {
                platform: platform,
                release: osRelease,
                architecture: arch
            },

            database: {
                online: dbOk,
                path: dbPath
            },

            payment: {
                provider: "iPaymu",
                environment: IPAYMU_ENV,
                configured: Boolean(
                    IPAYMU_VA &&
                    IPAYMU_API_KEY
                )
            },

            checkedAt: nowIso()
        });

    } catch (error) {
        console.error("Admin monitoring error:", error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil data monitoring server",
            error: error.message
        });
    }
});


// =====================================================
// AGENCY CENTER
// =====================================================

app.get("/api/agency", verifyFirebaseToken, requireVip, (req,res) => {
    const user = getLocalUser(req);
    const rows = db.prepare(`
        SELECT a.*, COUNT(c.id) client_count
        FROM agencies a LEFT JOIN agency_clients c ON c.agency_id=a.id
        WHERE a.owner_user_id=? OR ?=1
        GROUP BY a.id ORDER BY a.id DESC
    `).all(user.id, req.firebaseUser?.admin === true ? 1 : 0);
    res.json({success:true, agencies:rows});
});

app.post("/api/agency", verifyFirebaseToken, requireVip, (req,res) => {
    const user = getLocalUser(req);
    const name = String(req.body.name || "").trim().slice(0,120);
    if (!name) return res.status(400).json({success:false,message:"Nama agensi wajib diisi"});
    const r = db.prepare(`
        INSERT INTO agencies(owner_user_id,name,status,description) VALUES(?,?,?,?)
    `).run(user.id,name,"active",String(req.body.description||"").slice(0,1000));
    audit(req,"agency.create","agency",String(r.lastInsertRowid),{name});
    res.status(201).json({success:true,agency:db.prepare("SELECT * FROM agencies WHERE id=?").get(r.lastInsertRowid)});
});

app.get("/api/agency/:id/clients", verifyFirebaseToken, requireVip, (req,res) => {
    const user = getLocalUser(req);
    const agency = db.prepare("SELECT * FROM agencies WHERE id=? AND (owner_user_id=? OR ?=1)")
        .get(req.params.id,user.id,req.firebaseUser?.admin === true ? 1 : 0);
    if (!agency) return res.status(404).json({success:false,message:"Agensi tidak ditemukan"});
    const clients = db.prepare("SELECT * FROM agency_clients WHERE agency_id=? ORDER BY id DESC").all(req.params.id);
    res.json({success:true,agency,clients});
});

app.post("/api/agency/:id/clients", verifyFirebaseToken, requireVip, (req,res) => {
    const user = getLocalUser(req);
    const agency = db.prepare("SELECT * FROM agencies WHERE id=? AND (owner_user_id=? OR ?=1)")
        .get(req.params.id,user.id,req.firebaseUser?.admin === true ? 1 : 0);
    if (!agency) return res.status(404).json({success:false,message:"Agensi tidak ditemukan"});
    const name=String(req.body.name||"").trim().slice(0,120);
    if(!name)return res.status(400).json({success:false,message:"Nama client wajib diisi"});
    const r=db.prepare(`
        INSERT INTO agency_clients(agency_id,name,email,phone,status,notes) VALUES(?,?,?,?,?,?)
    `).run(req.params.id,name,String(req.body.email||"").trim(),String(req.body.phone||"").trim(),"active",String(req.body.notes||"").slice(0,1000));
    audit(req,"agency.client.create","agency_client",String(r.lastInsertRowid),{agencyId:req.params.id});
    res.status(201).json({success:true,client:db.prepare("SELECT * FROM agency_clients WHERE id=?").get(r.lastInsertRowid)});
});

app.patch("/api/agency/clients/:id", verifyFirebaseToken, requireVip, (req,res) => {
    const user=getLocalUser(req);
    const client=db.prepare(`
        SELECT c.*,a.owner_user_id FROM agency_clients c JOIN agencies a ON a.id=c.agency_id
        WHERE c.id=? AND (a.owner_user_id=? OR ?=1)
    `).get(req.params.id,user.id,req.firebaseUser?.admin === true ? 1 : 0);
    if(!client)return res.status(404).json({success:false,message:"Client tidak ditemukan"});
    const fields=[],values=[];
    for(const [key,col,max] of [["name","name",120],["email","email",200],["phone","phone",40],["notes","notes",1000],["status","status",30]]){
        if(req.body[key]!==undefined){fields.push(`${col}=?`);values.push(String(req.body[key]).slice(0,max));}
    }
    if(!fields.length)return res.json({success:true,client});
    fields.push("updated_at=?");values.push(nowIso(),req.params.id);
    db.prepare(`UPDATE agency_clients SET ${fields.join(",")} WHERE id=?`).run(...values);
    res.json({success:true,client:db.prepare("SELECT * FROM agency_clients WHERE id=?").get(req.params.id)});
});

// =====================================================
// CEO COMMAND CENTER DATA
// =====================================================

app.get("/api/ceo/projects", verifyFirebaseToken, requireAdmin, (req,res) => {
    res.json({success:true,projects:db.prepare("SELECT * FROM ceo_projects ORDER BY id DESC").all()});
});

app.post("/api/ceo/projects", verifyFirebaseToken, requireAdmin, (req,res) => {
    const name=String(req.body.name||"").trim().slice(0,160);
    if(!name)return res.status(400).json({success:false,message:"Nama proyek wajib diisi"});
    const progress=Math.min(Math.max(Number(req.body.progress||0),0),100);
    const r=db.prepare(`
        INSERT INTO ceo_projects(name,owner_user_id,status,priority,progress,budget,notes)
        VALUES(?,?,?,?,?,?,?)
    `).run(name,getLocalUser(req)?.id||null,String(req.body.status||"planned"),String(req.body.priority||"normal"),progress,Math.max(0,Number(req.body.budget||0)),String(req.body.notes||"").slice(0,2000));
    audit(req,"ceo.project.create","ceo_project",String(r.lastInsertRowid),{name});
    res.status(201).json({success:true,project:db.prepare("SELECT * FROM ceo_projects WHERE id=?").get(r.lastInsertRowid)});
});

app.get("/api/ceo/kpis", verifyFirebaseToken, requireAdmin, (req,res) => {
    res.json({success:true,kpis:db.prepare("SELECT * FROM ceo_kpis ORDER BY id DESC").all()});
});

app.post("/api/ceo/kpis", verifyFirebaseToken, requireAdmin, (req,res) => {
    const metric=String(req.body.metric||"").trim().slice(0,120);
    if(!metric)return res.status(400).json({success:false,message:"Metric wajib diisi"});
    const r=db.prepare(`
        INSERT INTO ceo_kpis(metric,value,unit,period,target) VALUES(?,?,?,?,?)
    `).run(metric,Number(req.body.value||0),String(req.body.unit||"").slice(0,40),String(req.body.period||"").slice(0,40),req.body.target===undefined?null:Number(req.body.target));
    res.status(201).json({success:true,kpi:db.prepare("SELECT * FROM ceo_kpis WHERE id=?").get(r.lastInsertRowid)});
});

app.get("/api/ceo/decisions", verifyFirebaseToken, requireAdmin, (req,res) => {
    res.json({success:true,decisions:db.prepare("SELECT * FROM ceo_decisions ORDER BY id DESC").all()});
});

app.post("/api/ceo/decisions", verifyFirebaseToken, requireAdmin, (req,res) => {
    const title=String(req.body.title||"").trim().slice(0,180);
    if(!title)return res.status(400).json({success:false,message:"Judul keputusan wajib diisi"});
    const r=db.prepare(`
        INSERT INTO ceo_decisions(title,status,decision,owner_user_id,due_at)
        VALUES(?,?,?,?,?)
    `).run(title,String(req.body.status||"open"),String(req.body.decision||"").slice(0,3000),getLocalUser(req)?.id||null,req.body.dueAt||null);
    audit(req,"ceo.decision.create","ceo_decision",String(r.lastInsertRowid),{title});
    res.status(201).json({success:true,decision:db.prepare("SELECT * FROM ceo_decisions WHERE id=?").get(r.lastInsertRowid)});
});

// =====================================================
// NOTIFICATIONS / UPDATES
// =====================================================

app.get("/api/notifications", verifyFirebaseToken, (req,res) => {
    const user=getLocalUser(req);
    if(!user)return res.status(404).json({success:false,message:"User belum terdaftar"});
    const limit=Math.min(Math.max(Number(req.query.limit||50),1),200);
    const rows=db.prepare(`
        SELECT * FROM notifications WHERE user_id IS NULL OR user_id=? ORDER BY id DESC LIMIT ?
    `).all(user.id,limit);
    res.json({success:true,notifications:rows});
});

app.post("/api/admin/notifications", verifyFirebaseToken, requireAdmin, (req,res) => {
    const title=String(req.body.title||"").trim().slice(0,160);
    const message=String(req.body.message||"").trim().slice(0,2000);
    if(!title||!message)return res.status(400).json({success:false,message:"Judul dan pesan wajib diisi"});
    const r=db.prepare("INSERT INTO notifications(user_id,type,title,message) VALUES(?,?,?,?)").run(req.body.userId?Number(req.body.userId):null,String(req.body.type||"system"),title,message);
    audit(req,"notification.create","notification",String(r.lastInsertRowid));
    res.status(201).json({success:true,notification:db.prepare("SELECT * FROM notifications WHERE id=?").get(r.lastInsertRowid)});
});

app.get("/api/updates", (req,res) => {
    const rows=db.prepare("SELECT * FROM system_updates WHERE status='published' ORDER BY id DESC LIMIT 50").all();
    res.json({success:true,updates:rows});
});

app.post("/api/admin/updates", verifyFirebaseToken, requireAdmin, (req,res) => {
    const version=String(req.body.version||"").trim().slice(0,40);
    const title=String(req.body.title||"").trim().slice(0,160);
    if(!version||!title)return res.status(400).json({success:false,message:"Version dan title wajib diisi"});
    const r=db.prepare("INSERT INTO system_updates(version,title,body,status) VALUES(?,?,?,?,?)".replace("?,?,?,?,?","?,?,?,?"))
        .run(version,title,String(req.body.body||"").slice(0,5000),String(req.body.status||"published"));
    res.status(201).json({success:true,update:db.prepare("SELECT * FROM system_updates WHERE id=?").get(r.lastInsertRowid)});
});

// =====================================================
// iPAYMU PAYMENT CORE
// =====================================================

app.get("/api/ipay/config", (req, res) => {
    res.json({
        success: true,
        provider: "iPaymu",
        environment: IPAYMU_ENV,
        configured: Boolean(IPAYMU_VA && IPAYMU_API_KEY),
        callbackUrl: `${APP_URL}/api/ipaymu/callback`,
        productionReady: IPAYMU_ENV === "production" && Boolean(IPAYMU_VA && IPAYMU_API_KEY && APP_URL.startsWith("https://"))
    });
});

app.get("/api/ipay/channels", async (req, res) => {
    try {
        const data = await ipayRequest("/api/v2/payment-channels", "GET", {});
        res.json({ success: true, provider: data });
    } catch (error) {
        res.status(error.status || 502).json({ success: false, message: error.message, provider: error.provider || null });
    }
});

// Compatibility alias for the first payment scaffold.
app.get("/api/payment/channels", async (req, res) => {
    try {
        const data = await ipayRequest("/api/v2/payment-channels", "GET", {});
        res.json({ success: true, data: data.Data || data });
    } catch (error) {
        res.status(error.status || 502).json({ success: false, message: error.message });
    }
});

app.post("/api/ipay/payments", verifyFirebaseToken, async (req, res) => {
    try {
        const user = getLocalUser(req);
        if (!user) return res.status(404).json({ success: false, message: "User belum terdaftar" });

        const input = validatePaymentInput(req.body);
        const purpose = String(req.body.purpose || "order").trim().toLowerCase();
        const planCode = String(req.body.planCode || "").trim() || null;
        const referenceId = String(req.body.referenceId || `WTK-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`).trim();

        const duplicate = db.prepare("SELECT * FROM payment_transactions WHERE reference_id = ?").get(referenceId);
        if (duplicate) return res.status(409).json({ success: false, message: "referenceId sudah digunakan", data: duplicate });

        const metadata = {
            userId: user.id,
            purpose,
            planCode,
            product: String(req.body.product || "WebToolsKita"),
            walletTopup: purpose === "wallet_topup",
            vipDays: Number(req.body.vipDays || 30)
        };

        const payload = {
            name: input.name,
            phone: input.phone,
            email: input.email,
            amount: input.amount,
            notifyUrl: `${APP_URL}/api/ipaymu/callback`,
            expired: Number(req.body.expired || 24),
            expiredType: "hours",
            comments: String(req.body.comments || `WebToolsKita ${purpose}`).slice(0, 250),
            referenceId,
            paymentMethod: input.paymentMethod,
            paymentChannel: input.paymentChannel,
            product: [String(req.body.product || "WebToolsKita")],
            qty: [1],
            price: [input.amount]
        };

        const provider = await ipayRequest("/api/v2/payment/direct", "POST", payload);
        const d = provider.Data || {};

        db.prepare(`
            INSERT INTO payment_transactions
            (user_id, reference_id, provider_transaction_id, purpose, plan_code, amount, fee, buyer_name, buyer_phone, buyer_email,
             payment_method, payment_channel, payment_no, payment_url, status, provider_status, provider_payload, metadata_json, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            user.id, referenceId, d.TransactionId ? String(d.TransactionId) : null, purpose, planCode,
            input.amount, Number(d.Fee || 0), input.name, input.phone, input.email,
            input.paymentMethod, input.paymentChannel, d.PaymentNo || null, d.Url || null,
            "pending", String(d.Status || "pending"), json(provider), json(metadata), nowIso()
        );

        audit(req, "payment.created", "payment", referenceId, { amount: input.amount, purpose, paymentMethod: input.paymentMethod, paymentChannel: input.paymentChannel });
        res.json({ success: true, data: {
            transactionId: d.TransactionId || null,
            referenceId,
            paymentNo: d.PaymentNo || null,
            paymentName: d.PaymentName || null,
            total: d.Total ?? input.amount,
            fee: d.Fee ?? 0,
            expired: d.Expired || null,
            url: d.Url || null,
            status: "pending"
        }});
    } catch (error) {
        logSystem("error", "ipaymu", error.message, { provider: error.provider || null });
        res.status(error.status || 500).json({ success: false, message: error.message, provider: error.provider || null });
    }
});

app.post("/api/payment/create", verifyFirebaseToken, async (req, res) => {
    try {
        const user = getLocalUser(req);
        if (!user) return res.status(404).json({ ok: false, message: "User belum terdaftar." });
        const input = validatePaymentInput(req.body);
        const purpose = String(req.body.purpose || "order").trim().toLowerCase();
        const referenceId = String(req.body.referenceId || `WTK-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`);
        if (db.prepare("SELECT id FROM payment_transactions WHERE reference_id=?").get(referenceId)) {
            return res.status(409).json({ ok:false, message:"referenceId sudah digunakan." });
        }
        const payload = {
            name:input.name, phone:input.phone, email:input.email, amount:input.amount,
            notifyUrl:`${APP_URL}/api/ipaymu/callback`, expired:Number(req.body.expired||24),
            expiredType:"hours", comments:String(req.body.comments||`Payment ${req.body.product||"WebToolsKita"}`).slice(0,250),
            referenceId, paymentMethod:input.paymentMethod, paymentChannel:input.paymentChannel,
            product:[String(req.body.product||"WebToolsKita")], qty:[1], price:[input.amount]
        };
        const provider=await ipayRequest("/api/v2/payment/direct","POST",payload);
        const d=provider.Data||{};
        db.prepare(`
            INSERT INTO payment_transactions
            (user_id,reference_id,provider_transaction_id,purpose,amount,fee,buyer_name,buyer_phone,buyer_email,
             payment_method,payment_channel,payment_no,payment_url,status,provider_status,provider_payload,metadata_json,updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).run(
            user.id,referenceId,d.TransactionId?String(d.TransactionId):null,purpose,input.amount,Number(d.Fee||0),
            input.name,input.phone,input.email,input.paymentMethod,input.paymentChannel,d.PaymentNo||null,d.Url||null,
            "pending","pending",json(provider),json({userId:user.id,purpose}),nowIso()
        );
        res.json({ok:true,data:d,referenceId});
    } catch(error) {
        res.status(error.status||500).json({ok:false,message:error.message});
    }
});

// Direct implementation of the compatibility route without recursive router dispatch.
app.post("/api/payment/create/v2", verifyFirebaseToken, async (req, res) => {
    try {
        const user = getLocalUser(req);
        if (!user) return res.status(404).json({ ok: false, message: "User belum terdaftar" });
        const input = validatePaymentInput(req.body);
        const referenceId = String(req.body.referenceId || `WTK-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`);
        const payload = {
            name: input.name, phone: input.phone, email: input.email, amount: input.amount,
            notifyUrl: `${APP_URL}/api/ipaymu/callback`, expired: 24, expiredType: "hours",
            comments: String(req.body.comments || `Payment ${req.body.product || "WebToolsKita"}`).slice(0, 250),
            referenceId, paymentMethod: input.paymentMethod, paymentChannel: input.paymentChannel,
            product: [String(req.body.product || "WebToolsKita")], qty: [1], price: [input.amount]
        };
        const provider = await ipayRequest("/api/v2/payment/direct", "POST", payload);
        const d = provider.Data || {};
        db.prepare(`
            INSERT INTO payment_transactions
            (user_id, reference_id, provider_transaction_id, purpose, amount, fee, buyer_name, buyer_phone, buyer_email,
             payment_method, payment_channel, payment_no, payment_url, status, provider_status, provider_payload, metadata_json, updated_at)
            VALUES (?, ?, ?, 'order', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            user.id, referenceId, d.TransactionId ? String(d.TransactionId) : null, input.amount, Number(d.Fee || 0),
            input.name, input.phone, input.email, input.paymentMethod, input.paymentChannel, d.PaymentNo || null, d.Url || null,
            "pending", "pending", json(provider), json({ userId: user.id }), nowIso()
        );
        res.json({ ok: true, data: d });
    } catch (error) {
        res.status(error.status || 500).json({ ok: false, message: error.message });
    }
});

app.get("/api/ipay/payments/:referenceId", verifyFirebaseToken, (req, res) => {
    const user = getLocalUser(req);
    if (!user) return res.status(404).json({ success: false, message: "User belum terdaftar" });
    const row = db.prepare(`
        SELECT id, reference_id, provider_transaction_id, purpose, plan_code, amount, fee, currency,
               payment_method, payment_channel, payment_no, payment_url, status, provider_status, created_at, updated_at, paid_at
        FROM payment_transactions WHERE reference_id = ? AND user_id = ?
    `).get(req.params.referenceId, user.id);
    if (!row) return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan" });
    res.json({ success: true, data: row });
});

app.get("/api/payment/status/:id", verifyFirebaseToken, (req, res) => {
    const user = getLocalUser(req);
    if (!user) return res.status(404).json({ ok: false, message: "User belum terdaftar." });
    const row = db.prepare(`
        SELECT id, reference_id, provider_transaction_id, status, amount, fee, payment_method, payment_channel, payment_no, payment_url, updated_at, paid_at
        FROM payment_transactions
        WHERE (provider_transaction_id = ? OR reference_id = ?) AND user_id = ?
        ORDER BY id DESC LIMIT 1
    `).get(String(req.params.id), String(req.params.id), user.id);
    if (!row) return res.status(404).json({ ok: false, message: "Transaksi tidak ditemukan." });
    res.json({ ok: true, data: row });
});

function applySuccessfulPayment(tx, callback) {
    const statusCode = Number(callback.status_code);
    const transactionStatusCode = Number(callback.transaction_status_code);
    const statusText = String(callback.status || "").toLowerCase();
    const paid = statusCode === 1 || transactionStatusCode === 1 || statusText === "berhasil" || statusText === "success" || statusText === "paid";

    if (!paid) return { paid: false, changed: false };

    const metadata = safeJsonParse(tx.metadata_json, {});
    const user = tx.user_id ? db.prepare("SELECT * FROM users WHERE id = ?").get(tx.user_id) : null;
    if (!user) return { paid: true, changed: false };

    const existing = db.prepare("SELECT status FROM payment_transactions WHERE id = ?").get(tx.id);
    if (existing?.status === "paid") return { paid: true, changed: false };

    const apply = db.transaction(() => {
        db.prepare(`
            UPDATE payment_transactions
            SET status='paid', provider_status=?, provider_payload=?, updated_at=?, paid_at=?
            WHERE id=?
        `).run(statusText || "berhasil", json(callback), nowIso(), callback.paid_at || nowIso(), tx.id);

        if (metadata.purpose === "vip") {
            const days = Math.min(Math.max(Number(metadata.vipDays || 30), 1), 3650);
            const currentExpiry = user.vip_expired && new Date(user.vip_expired) > new Date() ? new Date(user.vip_expired) : new Date();
            currentExpiry.setDate(currentExpiry.getDate() + days);
            db.prepare(`
                UPDATE users SET vip_status='active', vip_start=COALESCE(vip_start, ?), vip_expired=?, payment_status='paid', payment_id=?
                WHERE id=?
            `).run(nowIso(), currentExpiry.toISOString(), tx.reference_id, user.id);
        }

        if (metadata.purpose === "wallet_topup") {
            const wallet = ensureWalletForUser(user.id);
            const current = Number(wallet.balance || 0);
            const next = current + Number(tx.amount);
            db.prepare("UPDATE wallet_accounts SET balance=?, updated_at=? WHERE id=?").run(next, nowIso(), wallet.id);
            db.prepare(`
                INSERT INTO wallet_ledger (wallet_id, type, direction, amount, balance_after, reference_type, reference_id, description, metadata_json)
                VALUES (?, 'topup', 'credit', ?, ?, 'payment', ?, 'Top up melalui iPaymu', ?)
            `).run(wallet.id, tx.amount, next, tx.reference_id, json({ providerTransactionId: tx.provider_transaction_id }));
        }
    });
    apply();
    return { paid: true, changed: true };
}

app.post("/api/ipaymu/callback", async (req, res) => {
    try {
        const received = String(req.headers["x-signature"] || "");
        if (!verifyIpaymuCallbackSignature(req.body, received)) {
            logSystem("warn", "ipaymu", "Callback signature tidak valid");
            return res.status(400).send("Invalid Signature");
        }

        const callback = normalizeIpaymuCallback(req.body);
        const referenceId = String(callback.reference_id || callback.referenceId || "").trim();
        const providerTransactionId = callback.trx_id ? String(callback.trx_id) : null;

        let tx = null;
        if (referenceId) tx = db.prepare("SELECT * FROM payment_transactions WHERE reference_id = ?").get(referenceId);
        if (!tx && providerTransactionId) tx = db.prepare("SELECT * FROM payment_transactions WHERE provider_transaction_id = ?").get(providerTransactionId);
        if (!tx) {
            logSystem("warn", "ipaymu", "Callback untuk transaksi tidak dikenal", { referenceId, providerTransactionId });
            return res.status(200).json({ status: "OK", processed: false });
        }

        const result = applySuccessfulPayment(tx, callback);
        if (!result.paid) {
            db.prepare(`
                UPDATE payment_transactions
                SET status=?, provider_status=?, provider_payload=?, updated_at=?
                WHERE id=?
            `).run(String(callback.status || "pending").toLowerCase(), String(callback.status || ""), json(callback), nowIso(), tx.id);
        }

        return res.status(200).json({ status: "OK", processed: true, paid: result.paid });
    } catch (error) {
        logSystem("error", "ipaymu", "Callback processing error", { error: error.message });
        return res.status(500).send("Callback processing error");
    }
});


// =====================================================
// ADMIN PAYMENT / ADS CONTROL
// =====================================================

app.get("/api/admin/payments", verifyFirebaseToken, requireAdmin, (req,res) => {
    const limit=Math.min(Math.max(Number(req.query.limit||100),1),500);
    const rows=db.prepare(`
        SELECT p.*,u.name user_name,u.email user_email
        FROM payment_transactions p LEFT JOIN users u ON u.id=p.user_id
        ORDER BY p.id DESC LIMIT ?
    `).all(limit);
    res.json({success:true,count:rows.length,payments:rows});
});

app.get("/api/admin/campaigns", verifyFirebaseToken, requireAdmin, (req,res) => {
    const rows=db.prepare(`
        SELECT c.*,u.name owner_name,u.email owner_email
        FROM campaigns c LEFT JOIN users u ON u.id=c.owner_user_id
        ORDER BY c.id DESC
    `).all();
    res.json({success:true,count:rows.length,campaigns:rows});
});

// =====================================================
// WALLET / TRANSFER CENTER
// Internal wallet ledger only. Bank payout requires a separate
// licensed/provider transfer API; this route never fabricates
// bank settlement.
// =====================================================

app.get("/api/wallet", verifyFirebaseToken, (req, res) => {
    const user = getLocalUser(req);
    if (!user) return res.status(404).json({ success: false, message: "User belum terdaftar" });
    res.json({ success: true, wallet: walletView(user.id) });
});

app.get("/api/wallet/ledger", verifyFirebaseToken, (req, res) => {
    const user = getLocalUser(req);
    if (!user) return res.status(404).json({ success: false, message: "User belum terdaftar" });
    const wallet = ensureWalletForUser(user.id);
    const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);
    const rows = db.prepare(`
        SELECT id, type, direction, amount, balance_after, reference_type, reference_id, description, created_at
        FROM wallet_ledger WHERE wallet_id=? ORDER BY id DESC LIMIT ?
    `).all(wallet.id, limit);
    res.json({ success: true, wallet: walletView(user.id), entries: rows });
});

app.post("/api/wallet/transfer", verifyFirebaseToken, (req, res) => {
    const sender = getLocalUser(req);
    if (!sender) return res.status(404).json({ success: false, message: "Pengirim belum terdaftar" });
    const receiverUid = String(req.body.receiverUid || "").trim();
    const receiverEmail = String(req.body.receiverEmail || "").trim().toLowerCase();
    const amount = Number(req.body.amount);
    const note = String(req.body.note || "").trim().slice(0, 250);

    if (!Number.isSafeInteger(amount) || amount < 1000) return res.status(400).json({ success: false, message: "Nominal transfer minimal Rp1.000" });
    const receiver = receiverUid
        ? db.prepare("SELECT * FROM users WHERE google_uid=?").get(receiverUid)
        : db.prepare("SELECT * FROM users WHERE lower(email)=?").get(receiverEmail);
    if (!receiver) return res.status(404).json({ success: false, message: "Penerima tidak ditemukan" });
    if (receiver.id === sender.id) return res.status(400).json({ success: false, message: "Tidak dapat transfer ke diri sendiri" });

    const referenceId = `WTR-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    try {
        const result = db.transaction(() => {
            const from = ensureWalletForUser(sender.id);
            const to = ensureWalletForUser(receiver.id);
            if (from.balance < amount) throw new Error("Saldo wallet tidak mencukupi");

            const nextFrom = from.balance - amount;
            const nextTo = to.balance + amount;
            db.prepare("UPDATE wallet_accounts SET balance=?, updated_at=? WHERE id=?").run(nextFrom, nowIso(), from.id);
            db.prepare("UPDATE wallet_accounts SET balance=?, updated_at=? WHERE id=?").run(nextTo, nowIso(), to.id);

            db.prepare(`
                INSERT INTO wallet_ledger (wallet_id,type,direction,amount,balance_after,reference_type,reference_id,description,metadata_json)
                VALUES (?,?,?,?,?,'transfer',?,?,?)
            `).run(from.id,"transfer","debit",amount,nextFrom,"",referenceId, note || "Transfer wallet");
            db.prepare(`
                INSERT INTO wallet_ledger (wallet_id,type,direction,amount,balance_after,reference_type,reference_id,description,metadata_json)
                VALUES (?,?,?,?,?,'transfer',?,?,?)
            `).run(to.id,"transfer","credit",amount,nextTo,"",referenceId, note || "Transfer wallet");

            db.prepare(`
                INSERT INTO wallet_transfers (reference_id,sender_user_id,receiver_user_id,amount,status,note)
                VALUES (?,?,?,?,?,?)
            `).run(referenceId,sender.id,receiver.id,amount,"completed",note);

            return { from: nextFrom, to: nextTo };
        })();
        audit(req,"wallet.transfer","wallet_transfer",referenceId,{amount,receiverUserId:receiver.id});
        res.json({ success:true, referenceId, status:"completed", amount, balance:result.from });
    } catch (error) {
        res.status(400).json({ success:false, message:error.message });
    }
});

// =====================================================
// ADVERTISING CENTER
// =====================================================

function campaignForRequest(req, id) {
    const user = getLocalUser(req);
    return db.prepare(`
        SELECT c.*, u.email owner_email
        FROM campaigns c LEFT JOIN users u ON u.id=c.owner_user_id
        WHERE c.id=? AND (c.owner_user_id=? OR ?=1)
    `).get(id, user?.id || -1, req.firebaseUser?.admin === true ? 1 : 0);
}

app.get("/api/ads/overview", verifyFirebaseToken, requireVip, (req,res) => {
    const user=getLocalUser(req);
    const rows=db.prepare(`
        SELECT status, COUNT(*) count, COALESCE(SUM(impressions),0) impressions, COALESCE(SUM(clicks),0) clicks
        FROM campaigns WHERE owner_user_id=? GROUP BY status
    `).all(user.id);
    res.json({success:true, rows});
});

app.get("/api/ads/campaigns", verifyFirebaseToken, requireVip, (req,res) => {
    const user=getLocalUser(req);
    const rows=db.prepare("SELECT * FROM campaigns WHERE owner_user_id=? ORDER BY id DESC").all(user.id);
    res.json({success:true,count:rows.length,campaigns:rows});
});

app.post("/api/ads/campaigns", verifyFirebaseToken, requireVip, (req,res) => {
    const user=getLocalUser(req);
    const name=String(req.body.name||"Campaign Baru").trim().slice(0,120);
    const targetUrl=String(req.body.targetUrl||"").trim();
    const status=["Draft","Active","Paused"].includes(req.body.status) ? req.body.status : "Draft";
    const format=["Browser Card","Banner","Native"].includes(req.body.format) ? req.body.format : "Browser Card";
    if (!name) return res.status(400).json({success:false,message:"Nama campaign wajib diisi"});
    if (targetUrl && !/^https?:\/\//i.test(targetUrl)) return res.status(400).json({success:false,message:"URL tujuan harus http/https"});
    const result=db.prepare(`
        INSERT INTO campaigns(owner_user_id,name,target_url,headline,description,cta,format,status)
        VALUES(?,?,?,?,?,?,?,?)
    `).run(user.id,name,targetUrl,String(req.body.headline||"").trim(),String(req.body.description||"").trim(),String(req.body.cta||"Buka Sekarang").trim(),format,status);
    audit(req,"ads.campaign.create","campaign",String(result.lastInsertRowid),{name,status,format});
    res.status(201).json({success:true,campaign:db.prepare("SELECT * FROM campaigns WHERE id=?").get(result.lastInsertRowid)});
});

app.patch("/api/ads/campaigns/:id", verifyFirebaseToken, requireVip, (req,res) => {
    const c=campaignForRequest(req,req.params.id);
    if(!c) return res.status(404).json({success:false,message:"Campaign tidak ditemukan"});
    const fields=[]; const values=[];
    for(const [key,col] of [["name","name"],["targetUrl","target_url"],["headline","headline"],["description","description"],["cta","cta"]]){
        if(req.body[key]!==undefined){fields.push(`${col}=?`);values.push(String(req.body[key]).slice(0,1000));}
    }
    if(req.body.status!==undefined){if(!["Draft","Active","Paused"].includes(req.body.status))return res.status(400).json({success:false,message:"Status tidak valid"});fields.push("status=?");values.push(req.body.status);}
    if(req.body.format!==undefined){if(!["Browser Card","Banner","Native"].includes(req.body.format))return res.status(400).json({success:false,message:"Format tidak valid"});fields.push("format=?");values.push(req.body.format);}
    if(!fields.length)return res.json({success:true,campaign:c});
    fields.push("updated_at=?");values.push(nowIso(),req.params.id);
    db.prepare(`UPDATE campaigns SET ${fields.join(",")} WHERE id=?`).run(...values);
    audit(req,"ads.campaign.update","campaign",String(req.params.id),{fields:fields.map(x=>x.split("=")[0])});
    res.json({success:true,campaign:campaignForRequest(req,req.params.id)});
});

app.delete("/api/ads/campaigns/:id", verifyFirebaseToken, requireVip, (req,res) => {
    const c=campaignForRequest(req,req.params.id);
    if(!c)return res.status(404).json({success:false,message:"Campaign tidak ditemukan"});
    db.prepare("DELETE FROM campaigns WHERE id=?").run(req.params.id);
    audit(req,"ads.campaign.delete","campaign",String(req.params.id));
    res.json({success:true});
});

app.get("/api/ads/serve/:id", (req,res) => {
    const c=db.prepare("SELECT * FROM campaigns WHERE id=? AND lower(status)='active'").get(req.params.id);
    if(!c)return res.status(404).json({success:false,message:"Campaign tidak tersedia"});
    res.json({success:true,campaign:{
        id:c.id,name:c.name,targetUrl:c.target_url,headline:c.headline,description:c.description,cta:c.cta,format:c.format
    }});
});

app.post("/api/ads/events", (req,res) => {
    if(!rateLimit(`ad:${hashIp(req)}`,120,60000)) return res.status(429).json({success:false,message:"Terlalu banyak event"});
    const campaignId=Number(req.body.campaignId);
    const eventType=String(req.body.eventType||"impression").toLowerCase();
    if(!Number.isInteger(campaignId) || !["impression","click"].includes(eventType))return res.status(400).json({success:false,message:"Event iklan tidak valid"});
    const c=db.prepare("SELECT id,status FROM campaigns WHERE id=?").get(campaignId);
    if(!c || String(c.status).toLowerCase()!=="active")return res.status(404).json({success:false,message:"Campaign tidak aktif"});
    const visitorKey=String(req.body.visitorKey||"").slice(0,120);
    const placementId=String(req.body.placementId||"").slice(0,120);
    db.prepare(`
        INSERT INTO ad_events(campaign_id,event_type,placement_id,visitor_key,user_agent,referer,ip_hash)
        VALUES(?,?,?,?,?,?,?)
    `).run(campaignId,eventType,placementId,visitorKey,String(req.headers["user-agent"]||"").slice(0,500),String(req.headers.referer||"").slice(0,500),hashIp(req));
    const field=eventType==="click"?"clicks":"impressions";
    db.prepare(`UPDATE campaigns SET ${field}=${field}+1,updated_at=? WHERE id=?`).run(nowIso(),campaignId);
    res.json({success:true});
});

// =====================================================
// BASIC RATE LIMITING FOR PUBLIC EVENT/CALLBACK SURFACES
// =====================================================

const rateBuckets = new Map();
function rateLimit(key, limit=60, windowMs=60000) {
    const now=Date.now();
    const item=rateBuckets.get(key);
    if(!item || now-item.startedAt>=windowMs){rateBuckets.set(key,{startedAt:now,count:1});return true;}
    item.count++;
    return item.count<=limit;
}

// =====================================================
// CONTROL CENTER API
// =====================================================

app.get(
    "/api/admin/control-center",
    verifyFirebaseToken,
    requireAdmin,
    (req, res) => {

        try {

            const users = db.prepare(`
                SELECT
                    id,
                    google_uid,
                    name,
                    email,
                    photo_url,
                    vip_status,
                    last_seen,
                    banned,
                    ban_reason,
                    created_at
                FROM users
                ORDER BY last_seen DESC, id DESC
            `).all();

            const now = Date.now();

            const timeoutMs =
                60 * 1000;

            const onlineUsers =
                users.filter(user => {

                    if (
                        !user.last_seen ||
                        Number(user.banned) === 1
                    ) {
                        return false;
                    }

                    const time =
                        new Date(
                            user.last_seen
                        ).getTime();

                    return (
                        !Number.isNaN(time) &&
                        now - time <= timeoutMs
                    );
                });

            res.json({

                success: true,

                serverMode:
                    getServerMode(),

                onlineCount:
                    onlineUsers.length,

                totalCount:
                    users.length,

                bannedCount:
                    users.filter(
                        user =>
                            Number(user.banned) === 1
                    ).length,

                timeoutSeconds: 60,

                users:
                    users.map(user => ({
                        ...user,

                        online:
                            !!onlineUsers.find(
                                online =>
                                    online.id === user.id
                            )
                    }))
            });

        } catch (error) {

            console.error(
                "CONTROL CENTER ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Gagal mengambil data Control Center."
            });
        }
    }
);

app.post(
    "/api/admin/server-mode",
    verifyFirebaseToken,
    requireAdmin,
    (req, res) => {

        const mode =
            req.body &&
            req.body.mode;

        if (
            mode !== "on" &&
            mode !== "off"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Mode server tidak valid."
            });
        }

        const value =
            setServerMode(mode);

        res.json({
            success: true,
            serverMode: value,
            updatedAt:
                new Date().toISOString()
        });
    }
);

app.post(
    "/api/admin/users/:uid/ban",
    verifyFirebaseToken,
    requireAdmin,
    (req, res) => {

        const uid =
            req.params.uid;

        const target =
            db.prepare(
                "SELECT email FROM users WHERE google_uid = ?"
            ).get(uid);

        if (
            target &&
            String(target.email || "")
                .toLowerCase() ===
            ADMIN_EMAIL.toLowerCase()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Administrator utama tidak dapat diblokir."
            });
        }

        const reason =
            String(
                (req.body && req.body.reason) ||
                "Diblokir administrator"
            ).slice(0, 500);

        const result =
            db.prepare(`
                UPDATE users
                SET
                    banned = 1,
                    ban_reason = ?
                WHERE google_uid = ?
            `).run(
                reason,
                uid
            );

        if (!result.changes) {
            return res.status(404).json({
                success: false,
                message:
                    "Pengguna tidak ditemukan."
            });
        }

        res.json({
            success: true,
            banned: true,
            message:
                "Pengguna berhasil diblokir."
        });
    }
);

app.post(
    "/api/admin/users/:uid/unban",
    verifyFirebaseToken,
    requireAdmin,
    (req, res) => {

        const uid =
            req.params.uid;

        const result =
            db.prepare(`
                UPDATE users
                SET
                    banned = 0,
                    ban_reason = NULL
                WHERE google_uid = ?
            `).run(uid);

        if (!result.changes) {
            return res.status(404).json({
                success: false,
                message:
                    "Pengguna tidak ditemukan."
            });
        }

        res.json({
            success: true,
            banned: false,
            message:
                "Ban pengguna berhasil dibuka."
        });
    }
);

// =====================================================
// GIT / GITHUB API
// =====================================================

app.get(
    "/api/git/status",
    verifyFirebaseToken,
    requireAdmin,
    async (req, res) => {

        try {

            const result =
                await git.gitStatus();

            res.json(result);

        } catch (error) {

            console.error(
                "GIT STATUS ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Gagal mengambil Git status."
            });
        }
    }
);


app.get(
    "/api/git/branch",
    verifyFirebaseToken,
    requireAdmin,
    async (req, res) => {

        try {

            const result =
                await git.gitBranch();

            res.json(result);

        } catch (error) {

            console.error(
                "GIT BRANCH ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Gagal mengambil Git branch."
            });
        }
    }
);


app.get(
    "/api/git/remote",
    verifyFirebaseToken,
    requireAdmin,
    async (req, res) => {

        try {

            const result =
                await git.gitRemote();

            res.json(result);

        } catch (error) {

            console.error(
                "GIT REMOTE ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Gagal mengambil Git remote."
            });
        }
    }
);


app.post(
    "/api/git/add",
    verifyFirebaseToken,
    requireAdmin,
    async (req, res) => {

        try {

            const result =
                await git.gitAdd();

            res.json(result);

        } catch (error) {

            console.error(
                "GIT ADD ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Gagal menjalankan Git add."
            });
        }
    }
);


app.post(
    "/api/git/commit",
    verifyFirebaseToken,
    requireAdmin,
    async (req, res) => {

        try {

            const message =
                req.body &&
                req.body.message;

            if (
                typeof message !== "string" ||
                !message.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Commit message wajib diisi."
                });
            }

            const result =
                await git.gitCommit(message);

            res.json(result);

        } catch (error) {

            console.error(
                "GIT COMMIT ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Gagal menjalankan Git commit."
            });
        }
    }
);


app.post(
    "/api/git/push",
    verifyFirebaseToken,
    requireAdmin,
    async (req, res) => {

        try {

            const result =
                await git.gitPush();

            res.json(result);

        } catch (error) {

            console.error(
                "GIT PUSH ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Gagal menjalankan Git push."
            });
        }
    }
);


app.post(
    "/api/git/sync",
    verifyFirebaseToken,
    requireAdmin,
    async (req, res) => {

        try {

            const message =
                req.body &&
                req.body.message;

            if (
                typeof message !== "string" ||
                !message.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Commit message wajib diisi."
                });
            }

            const result =
                await git.gitSync(message);

            res.json(result);

        } catch (error) {

            console.error(
                "GIT SYNC ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Gagal menjalankan Git sync."
            });
        }
    }
);

// =====================================================
// 404 API
// =====================================================

app.use(
    "/api",
    (req, res) => {

        res.status(404).json({

            success:
                false,

            message:
                "API endpoint tidak ditemukan",

            path:
                req.originalUrl

        });
    }
);


// =====================================================
// ERROR HANDLER
// =====================================================

app.use(
    (err, req, res, next) => {

        console.error(
            "Server error:",
            err
        );

        res.status(500).json({

            success:
                false,

            message:
                "Internal server error"

        });
    }
);



// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================

function shutdown(signal) {
    console.log(`\n${signal} diterima. Menutup WebToolsKita...`);
    try { db.pragma("wal_checkpoint(TRUNCATE)"); } catch (_) {}
    try { db.close(); } catch (_) {}
    process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// =====================================================
// START SERVER
// =====================================================

if (require.main === module) {

    app.listen(
        PORT,
        () => {

            console.log("");

            console.log(
                "========================================"
            );

            console.log(
                "       WebToolsKita Server"
            );

            console.log(
                "========================================"
            );

            console.log(
                ` Environment  : ${process.env.NODE_ENV || "development"}`
            );

            console.log(
                ` iPaymu       : ${IPAYMU_ENV} / ${IPAYMU_VA && IPAYMU_API_KEY ? "CONFIGURED" : "NOT CONFIGURED"}`
            );

            console.log(
                ` Server       : http://localhost:${PORT}`
            );

            console.log(
                ` Admin Email  : ${ADMIN_EMAIL}`
            );

            console.log(
                " Admin VIP    : AKTIF"
            );

            console.log(
                " Frontend     : AKTIF"
            );

            console.log(
                " Firebase     : AKTIF"
            );

            console.log(
                " SQLite       : AKTIF"
            );

            console.log(
                " Online       : AKTIF"
            );

            console.log(
                " Database API : AKTIF"
            );

            console.log(
                " CodeGuard    : AKTIF"
            );

            console.log(
                "========================================"
            );

            console.log("");
        }
    );

}

module.exports = app;
