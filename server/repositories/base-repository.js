const { getTable, saveTable, clone } = require("../db/database");

function createRepository(tableName) {
  function list() {
    return getTable(tableName);
  }

  function getById(id) {
    return list().find((item) => item.id === id) || null;
  }

  function findOne(predicate) {
    return list().find(predicate) || null;
  }

  function filter(predicate) {
    return list().filter(predicate);
  }

  function insert(record) {
    const records = list();
    records.push(clone(record));
    saveTable(tableName, records);
    return clone(record);
  }

  function update(id, updater) {
    const records = list();
    const index = records.findIndex((item) => item.id === id);
    if (index < 0) {
      return null;
    }
    const previous = clone(records[index]);
    const nextValue = typeof updater === "function" ? updater(clone(records[index])) : { ...records[index], ...updater };
    records[index] = clone(nextValue);
    saveTable(tableName, records);
    return { previous, current: clone(records[index]) };
  }

  function remove(id) {
    const records = list();
    const nextRecords = records.filter((item) => item.id !== id);
    if (nextRecords.length === records.length) {
      return false;
    }
    saveTable(tableName, nextRecords);
    return true;
  }

  function replaceAll(records) {
    saveTable(tableName, records.map((item) => clone(item)));
    return list();
  }

  return {
    tableName,
    list,
    getById,
    findOne,
    filter,
    insert,
    update,
    remove,
    replaceAll,
  };
}

module.exports = createRepository;
