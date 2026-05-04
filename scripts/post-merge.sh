#!/bin/bash
set -e

npm install --legacy-peer-deps
node scripts/db-init.js
