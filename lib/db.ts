import { Pool, PoolClient } from "pg";

let pool: Pool | null = null;

// Pool sizing notes:
// - The app runs on a single reserved-VM (see replit.md "Deployment"), so all
//   connections live in one process. `max` is the hard ceiling for concurrent
//   queries; pick a value smaller than the upstream PG `max_connections` to
//   leave headroom for psql, migrations, and other tools.
// - `idleTimeoutMillis` keeps the pool from holding idle connections for a
//   long time so PG can recycle them; 30s is a good default for low-traffic
//   web apps.
// - `connectionTimeoutMillis` makes a slow handshake fail loudly instead of
//   hanging a request handler forever.
// Override via env if the deploy moves to a hotter database tier.
function poolMax(): number {
  const n = Number(process.env.PG_POOL_MAX);
  return Number.isFinite(n) && n > 0 ? n : 10;
}
function poolIdleTimeoutMs(): number {
  const n = Number(process.env.PG_POOL_IDLE_TIMEOUT_MS);
  return Number.isFinite(n) && n > 0 ? n : 30_000;
}
function poolConnectionTimeoutMs(): number {
  const n = Number(process.env.PG_POOL_CONNECTION_TIMEOUT_MS);
  return Number.isFinite(n) && n > 0 ? n : 10_000;
}

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: poolMax(),
      idleTimeoutMillis: poolIdleTimeoutMs(),
      connectionTimeoutMillis: poolConnectionTimeoutMs(),
    });
    // Surface pool-level errors (e.g. a backend killed the connection) so they
    // don't crash the process via the default unhandled-error path.
    pool.on("error", (err) => {
      console.error("[db] Unexpected idle client error:", err);
    });
  }
  return pool;
}

export async function query(sql: string, params?: unknown[]) {
  return getPool().query(sql, params);
}

export async function withClient<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export interface PoolStats {
  total: number;
  idle: number;
  waiting: number;
  max: number;
}

/** Snapshot of the pool, used by the /api/health endpoint. */
export function getPoolStats(): PoolStats {
  const p = getPool();
  return {
    total: p.totalCount,
    idle: p.idleCount,
    waiting: p.waitingCount,
    max: poolMax(),
  };
}
