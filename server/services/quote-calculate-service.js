const businessRules = require("../config/business-rules");

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function roundMoney(value) {
  return Number(toNumber(value).toFixed(2));
}

function roundRatio(value) {
  return Number(toNumber(value).toFixed(4));
}

function evaluateFormula(expression, context) {
  const keys = Object.keys(context);
  const values = keys.map((key) => context[key]);
  return Function(...keys, `return ${expression};`)(...values);
}

function calculateQuote(input, formula, options = {}) {
  const threshold = options.grossMarginWarningThreshold ?? businessRules.quote.grossMarginWarningThreshold;
  const belowCostMode = String(options.belowCostMode || businessRules.quote.belowCostMode || "STRICT").toUpperCase();
  const allowBelowCostDraft = Boolean(formula?.allow_below_cost_draft);

  const MSRP = roundMoney(input.msrp);
  const Cost = roundMoney(input.cost_price);
  const DiscountFactor = toNumber(input.discount_factor, 1);
  const SpecialDiscount = roundMoney(input.special_discount);
  const TemporarySupport = roundMoney(input.temporary_support);
  const ChannelFactor = toNumber(input.channel_factor, 1);
  const TaxRate = toNumber(input.tax_rate, 0);
  const rebateType = String(input.rebate_type || "AMOUNT").toUpperCase();
  const rawRebate = toNumber(input.rebate_value, 0);
  const RebateValue = roundMoney(rebateType === "RATE" ? MSRP * rawRebate : rawRebate);

  const expression = String(formula?.formula_expression || businessRules.quote.defaultFormulaExpression).trim();
  const errors = [];
  const warnings = [];
  const steps = [
    { label: "零售价 MSRP", formula: "MSRP", value: MSRP },
    { label: "成本价 Cost", formula: "Cost", value: Cost },
    { label: "客户点位/折扣系数", formula: "DiscountFactor", value: DiscountFactor },
    { label: "特殊点位", formula: "SpecialDiscount", value: SpecialDiscount },
    { label: "返利折算值", formula: rebateType === "RATE" ? "MSRP × RebateRate" : "RebateValue", value: RebateValue },
    { label: "临时支持金额", formula: "TemporarySupport", value: TemporarySupport },
    { label: "渠道系数", formula: "ChannelFactor", value: ChannelFactor },
    { label: "税率（如参与公式）", formula: "TaxRate", value: TaxRate },
    { label: "公式版本", formula: `${formula?.formula_code || "DEFAULT"} ${formula?.formula_version || "v1.0"}`, value: expression },
  ];

  if (MSRP <= 0) {
    errors.push("零售价必须大于 0。");
  }
  if (Cost <= 0) {
    errors.push("成本价必须大于 0。");
  }
  if (MSRP < Cost) {
    errors.push("零售价低于成本价，系统直接拦截，不允许保存。");
  }
  if (DiscountFactor <= 0) {
    errors.push("折扣系数必须大于 0。");
  }
  if (ChannelFactor <= 0) {
    errors.push("渠道系数必须大于 0。");
  }

  let finalQuotePrice = 0;
  try {
    finalQuotePrice = roundMoney(
      evaluateFormula(expression, {
        MSRP,
        Cost,
        DiscountFactor,
        SpecialDiscount,
        RebateValue,
        TemporarySupport,
        ChannelFactor,
        TaxRate,
      })
    );
  } catch (error) {
    errors.push(`公式计算失败：${error instanceof Error ? error.message : "未知错误"}`);
  }

  if (finalQuotePrice <= 0) {
    errors.push("报价公式计算结果小于等于 0，系统直接拦截，不允许保存。");
  }

  const grossProfit = roundMoney(finalQuotePrice - Cost);
  const grossMargin = finalQuotePrice > 0 ? roundRatio(grossProfit / finalQuotePrice) : 0;
  const belowCostFlag = finalQuotePrice < Cost;
  const lowMarginWarningFlag = grossMargin < threshold;

  if (belowCostFlag) {
    const message = "当前报价已击穿成本价，请调整参数或提交特批审批。";
    if (belowCostMode === "STRICT" || !allowBelowCostDraft) {
      errors.push(message);
    } else {
      warnings.push(message);
    }
  }

  if (!belowCostFlag && lowMarginWarningFlag) {
    warnings.push(`当前毛利率 ${Number((grossMargin * 100).toFixed(2))}% 低于系统阈值 ${Number((threshold * 100).toFixed(2))}%，将进入加强审批流。`);
  }

  steps.push(
    { label: "客户报价", formula: expression, value: finalQuotePrice },
    { label: "毛利额", formula: "FinalQuotePrice - Cost", value: grossProfit },
    { label: "毛利率", formula: "GrossProfit / FinalQuotePrice", value: grossMargin }
  );

  return {
    final_quote_price: finalQuotePrice,
    gross_profit: grossProfit,
    gross_margin: grossMargin,
    below_cost_flag: belowCostFlag,
    low_margin_warning_flag: lowMarginWarningFlag,
    warning_level: belowCostFlag ? "RED" : lowMarginWarningFlag ? "YELLOW" : "NONE",
    warning_message: errors[0] || warnings[0] || "",
    warning_messages: warnings,
    error_messages: errors,
    special_approval_required: belowCostFlag || lowMarginWarningFlag,
    approval_type: belowCostFlag || lowMarginWarningFlag ? "SPECIAL" : "NORMAL",
    can_save: errors.length === 0,
    calculation_steps: steps,
  };
}

module.exports = {
  calculateQuote,
  roundMoney,
  roundRatio,
};
