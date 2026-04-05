const fs = require("node:fs");
const path = require("node:path");
const seedData = require("../data/seed-data");

const DB_FILE = path.join(__dirname, "runtime-db.json");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(clone(seedData), null, 2));
  }
}

function readDatabase() {
  ensureDatabase();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDatabase(nextDb) {
  fs.writeFileSync(DB_FILE, JSON.stringify(nextDb, null, 2));
  return clone(nextDb);
}

function getTable(tableName) {
  const db = readDatabase();
  return clone(db[tableName] || []);
}

function saveTable(tableName, records) {
  const db = readDatabase();
  db[tableName] = clone(records);
  writeDatabase(db);
  return clone(db[tableName]);
}

function resetDatabase() {
  writeDatabase(clone(seedData));
}

module.exports = {
  DB_FILE,
  clone,
  readDatabase,
  writeDatabase,
  getTable,
  saveTable,
  resetDatabase,
};
