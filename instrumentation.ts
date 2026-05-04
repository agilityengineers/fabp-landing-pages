export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { query } = await import("@/lib/db");
    const { readFileSync } = await import("fs");
    const { join } = await import("path");

    try {
      const sql = readFileSync(join(process.cwd(), "db/schema.sql"), "utf-8");
      await query(sql);
      console.log("[DB] Schema initialised successfully");
    } catch (err) {
      console.error("[DB] Schema initialisation failed:", err);
    }
  }
}
