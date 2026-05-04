#!/usr/bin/env node
// Run this script to apply the database schema:  node scripts/db-init.js
// It is safe to run multiple times (all DDL uses IF NOT EXISTS).

const { Pool } = require("pg");
const { readFileSync } = require("fs");
const { join } = require("path");

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const sql = readFileSync(join(__dirname, "../db/schema.sql"), "utf-8");
    await pool.query(sql);
    console.log("DB schema applied successfully.");
  } catch (err) {
    console.error("DB schema init failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
