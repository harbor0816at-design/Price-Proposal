module.exports = {
  systemName: "客户报价管理系统",
  quote: {
    defaultFormulaExpression: "MSRP * DiscountFactor * ChannelFactor - SpecialDiscount - RebateValue - TemporarySupport",
    belowCostMode: "STRICT",
    grossMarginWarningThreshold: 0.05,
    minimumGrossMarginEscalationThreshold: 0.03,
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  approvalFlow: {
    normal: ["直属上级负责人审批", "财务负责人审批"],
    special: ["直属上级负责人审批", "销售/经营负责人审批", "财务负责人审批"],
  },
  operators: {
    system: {
      id: "u_system",
      name: "系统管理员",
      role: "SYSTEM_ADMIN",
    },
  },
};
