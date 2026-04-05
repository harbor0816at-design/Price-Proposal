const { logsRepo } = require("../repositories");
const { buildId } = require("./id-service");

function writeLog({
  businessType,
  targetId,
  actionType,
  beforeData = null,
  afterData = null,
  operator = null,
  deviceInfo = "WEB-PROTOTYPE",
}) {
  const entry = {
    id: buildId("log"),
    business_type: businessType,
    target_id: targetId,
    action_type: actionType,
    before_data: beforeData,
    after_data: afterData,
    operator_id: operator?.id || "u_system",
    operator_name: operator?.display_name || operator?.name || "系统管理员",
    operation_time: new Date().toISOString(),
    device_info: deviceInfo,
  };
  logsRepo.insert(entry);
  return entry;
}

function listLogs() {
  return logsRepo.list().sort((a, b) => String(b.operation_time).localeCompare(String(a.operation_time)));
}

module.exports = {
  writeLog,
  listLogs,
};
