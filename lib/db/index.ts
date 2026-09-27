import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import * as dotenv from "dotenv";
import { ensureDatabaseSchema } from "./init";

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env.local" });
  dotenv.config();
}

const connectionUri = process.env.DATABASE_URL;

if (!connectionUri) {
  throw new Error("DATABASE_URL environment variable is missing. Please set it in .env.local");
}

// Global cached pool to survive HMR in development
const globalForDb = globalThis as unknown as {
  pool: mysql.Pool | undefined;
  dbInitRan: boolean | undefined;
};

export const pool =
  globalForDb.pool ??
  mysql.createPool({
    uri: connectionUri,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

// Auto-run schema verification & table creation whenever db connection is initialized
if (!globalForDb.dbInitRan) {
  globalForDb.dbInitRan = true;
  ensureDatabaseSchema(pool).catch((err) => {
    console.error("[DB Auto-Init Error]", err?.message || err);
    globalForDb.dbInitRan = false;
  });
}

export const db = drizzle(pool, { schema, mode: "default" });
export { schema, ensureDatabaseSchema };
