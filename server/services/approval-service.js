const businessRules = require("../config/business-rules");
const { approvalsRepo, approvalNodesRepo, quotesRepo, usersRepo } = require("../repositories");
const { buildId, buildBusinessNo } = require("./id-service");
const { writeLog } = require("./log-service");

function now() {
  return new Date().toISOString();
}

function findFirstUserByRole(role) {
  return usersRepo.findOne((item) => item.role === role && item.status === "ACTIVE");
}

function getUserOrThrow(userId) {
  const user = usersRepo.getById(userId);
  if (!user) {
    throw new Error("审批人不存在。");
  }
  return user;
}

function buildApprovalNodes({ approvalId, approvalType, customer }) {
  const salesManager = customer?.default_approver_id
    ? usersRepo.getById(customer.default_approver_id)
    : findFirstUserByRole("SALES_MANAGER");
  const businessHead = findFirstUserByRole("BUSINESS_HEAD");
  const financeHead = findFirstUserByRole("FINANCE_HEAD");
  const flow = approvalType === "SPECIAL" ? businessRules.approvalFlow.special : businessRules.approvalFlow.normal;

  return flow.map((nodeName, index) => {
    const approver =
      index === 0 ? salesManager : approvalType === "SPECIAL" && index === 1 ? businessHead : financeHead;
    return {
      id: buildId("approval_node"),
      approval_id: approvalId,
      node_order: index + 1,
      node_name: nodeName,
      approver_id: approver?.id || "",
      approver_name: approver?.display_name || "待配置审批人",
      approval_status: index === 0 ? "IN_PROGRESS" : "PENDING",
      approval_comment: "",
      approved_at: "",
    };
  });
}

function createApprovalForQuote({ quote, customer, operator }) {
  const approvalId = buildId("approval");
  const approvalNo = buildBusinessNo("APR");
  const approvalType = quote.warning_level === "RED" || quote.warning_level === "YELLOW" ? "SPECIAL" : "NORMAL";
  const nodes = buildApprovalNodes({ approvalId, approvalType, customer });
  const currentNode = nodes[0];
  const approval = {
    id: approvalId,
    approval_no: approvalNo,
    quote_id: quote.id,
    approval_type: approvalType,
    current_node: 1,
    approver_id: currentNode?.approver_id || "",
    approver_name: currentNode?.approver_name || "",
    approval_status: "IN_PROGRESS",
    approval_comment: "",
    initiated_by: operator?.id || businessRules.operators.system.id,
    initiated_at: now(),
    approved_at: "",
    created_at: now(),
    updated_at: now(),
  };
  approvalsRepo.insert(approval);
  approvalNodesRepo.replaceAll([...approvalNodesRepo.list(), ...nodes]);
  quotesRepo.update(quote.id, (current) => ({
    ...current,
    approval_status: "IN_PROGRESS",
    quote_status: "PENDING_APPROVAL",
    updated_at: now(),
  }));

  writeLog({
    businessType: "QUOTE_APPROVAL",
    targetId: quote.id,
    actionType: "AUTO_CREATE_APPROVAL",
    beforeData: null,
    afterData: { approval, nodes },
    operator,
  });

  return { approval, nodes };
}

function getApprovalDetail(approvalId) {
  const approval = approvalsRepo.getById(approvalId);
  if (!approval) {
    throw new Error("审批单不存在。");
  }
  const nodes = approvalNodesRepo
    .filter((item) => item.approval_id === approvalId)
    .sort((a, b) => a.node_order - b.node_order);
  const quote = quotesRepo.getById(approval.quote_id);
  return { approval, nodes, quote };
}

function approve({ approvalId, operatorId, comment = "" }) {
  const operator = getUserOrThrow(operatorId);
  const { approval, nodes, quote } = getApprovalDetail(approvalId);
  const currentNode = nodes.find((item) => item.node_order === approval.current_node);
  if (!currentNode) {
    throw new Error("当前审批节点不存在。");
  }
  if (currentNode.approval_status !== "IN_PROGRESS") {
    throw new Error("当前审批节点不可审批。");
  }
  if (currentNode.approver_id && currentNode.approver_id !== operator.id && operator.role !== "SYSTEM_ADMIN") {
    throw new Error("当前用户不是本节点审批人。");
  }

  const approvalTime = now();
  approvalNodesRepo.update(currentNode.id, (item) => ({
    ...item,
    approval_status: "APPROVED",
    approval_comment: comment,
    approved_at: approvalTime,
  }));

  const nextNode = nodes.find((item) => item.node_order === approval.current_node + 1);
  if (!nextNode) {
    approvalsRepo.update(approvalId, (item) => ({
      ...item,
      approval_status: "APPROVED",
      approval_comment: comment,
      approved_at: approvalTime,
      updated_at: approvalTime,
    }));
    quotesRepo.update(quote.id, (item) => ({
      ...item,
      approval_status: "APPROVED",
      quote_status: new Date(item.effective_from) <= new Date() ? "ACTIVE" : "PENDING_EFFECTIVE",
      updated_at: approvalTime,
    }));
  } else {
    approvalNodesRepo.update(nextNode.id, (item) => ({
      ...item,
      approval_status: "IN_PROGRESS",
    }));
    approvalsRepo.update(approvalId, (item) => ({
      ...item,
      current_node: nextNode.node_order,
      approver_id: nextNode.approver_id,
      approver_name: nextNode.approver_name,
      updated_at: approvalTime,
    }));
  }

  writeLog({
    businessType: "QUOTE_APPROVAL",
    targetId: approval.quote_id,
    actionType: "APPROVE",
    beforeData: { approval_status: approval.approval_status, current_node: approval.current_node },
    afterData: { approval_id: approvalId, comment, operator: operator.display_name },
    operator,
  });

  return getApprovalDetail(approvalId);
}

function reject({ approvalId, operatorId, comment = "" }) {
  const operator = getUserOrThrow(operatorId);
  const { approval, nodes, quote } = getApprovalDetail(approvalId);
  const currentNode = nodes.find((item) => item.node_order === approval.current_node);
  if (!currentNode) {
    throw new Error("当前审批节点不存在。");
  }
  if (currentNode.approver_id && currentNode.approver_id !== operator.id && operator.role !== "SYSTEM_ADMIN") {
    throw new Error("当前用户不是本节点审批人。");
  }

  const rejectTime = now();
  approvalNodesRepo.update(currentNode.id, (item) => ({
    ...item,
    approval_status: "REJECTED",
    approval_comment: comment,
    approved_at: rejectTime,
  }));
  approvalsRepo.update(approvalId, (item) => ({
    ...item,
    approval_status: "REJECTED",
    approval_comment: comment,
    updated_at: rejectTime,
  }));
  quotesRepo.update(quote.id, (item) => ({
    ...item,
    approval_status: "REJECTED",
    quote_status: "REJECTED_PENDING_EDIT",
    updated_at: rejectTime,
  }));

  writeLog({
    businessType: "QUOTE_APPROVAL",
    targetId: approval.quote_id,
    actionType: "REJECT",
    beforeData: { approval_status: approval.approval_status, current_node: approval.current_node },
    afterData: { approval_id: approvalId, comment, operator: operator.display_name },
    operator,
  });

  return getApprovalDetail(approvalId);
}

function listApprovals() {
  const approvals = approvalsRepo
    .list()
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return approvals.map((approval) => {
    const quote = quotesRepo.getById(approval.quote_id);
    const nodes = approvalNodesRepo
      .filter((item) => item.approval_id === approval.id)
      .sort((a, b) => a.node_order - b.node_order);
    return {
      ...approval,
      quote,
      nodes,
    };
  });
}

module.exports = {
  createApprovalForQuote,
  getApprovalDetail,
  approve,
  reject,
  listApprovals,
};
