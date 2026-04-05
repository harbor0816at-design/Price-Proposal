function randomSuffix(size = 6) {
  return Math.random().toString(36).slice(2, 2 + size).toUpperCase();
}

function buildId(prefix) {
  return `${prefix}_${Date.now()}_${randomSuffix(6)}`;
}

function buildBusinessNo(prefix) {
  const now = new Date();
  const compactDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `${prefix}-${compactDate}-${randomSuffix(5)}`;
}

module.exports = {
  buildId,
  buildBusinessNo,
};
