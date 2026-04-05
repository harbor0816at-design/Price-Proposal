const businessRules = require("../config/business-rules");
const { customersRepo, productsRepo, formulasRepo, quotesRepo, usersRepo, approvalsRepo, approvalNodesRepo } = require("../repositories");
const { buildId, buildBusinessNo } = require("./id-service");
const { writeLog } = require("./log-service");
const { calculateQuote } = require("./quote-calculate-service");
const approvalService = require("./approval-service");

function now() {
  return new Date().toISOString();
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function getOperator(operatorId) {
  return usersRepo.getById(operatorId) || usersRepo.findOne((item) => item.role === "SYSTEM_ADMIN") || businessRules.operators.system;
}

function resolveCustomer(payload, fallbackCustomer = null) {
  return (
    customersRepo.getById(payload.customer_id) ||
    customersRepo.findOne((item) => item.customer_code === payload.customer_code) ||
    fallbackCustomer ||
    null
  );
}

function resolveProduct(payload, fallbackProduct = null) {
  return (
    productsRepo.getById(payload.product_id) ||
    productsRepo.findOne((item) => item.sku === payload.sku) ||
    fallbackProduct ||
    null
  );
}

function resolveFormula({ payload, customer, product }) {
  const explicit = formulasRepo.getById(payload.formula_id);
  if (explicit) {
    return explicit;
  }
  const productDefault = product?.default_formula_id ? formulasRepo.getById(product.default_formula_id) : null;
  if (productDefault && productDefault.status === "ACTIVE") {
    return productDefault;
  }
  const activeFormulas = formulasRepo.list().filter((item) => item.status === "ACTIVE");
  const ranked = activeFormulas
    .map((formula) => {
      let score = 0;
      if (formula.applicable_customer_type === customer?.customer_type) {
        score += 3;
      } else if (formula.applicable_customer_type === "ALL") {
        score += 1;
      }
      if (formula.applicable_product_series === product?.product_series) {
        score += 3;
      } else if (formula.applicable_product_series === "ALL") {
        score += 1;
      }
      if (formula.applicable_channel_type === customer?.channel_type) {
        score += 3;
      } else if (formula.applicable_channel_type === "ALL") {
        score += 1;
      }
      return { formula, score };
    })
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.formula || null;
}

function buildQuoteInput(payload, { customer, product }) {
  return {
    msrp: toNumber(payload.msrp, product?.default_msrp || 0),
    cost_price: toNumber(payload.cost_price, product?.default_cost || 0),
    discount_factor: toNumber(payload.discount_factor, customer?.default_discount || 1),
    special_discount: toNumber(payload.special_discount, 0),
    rebate_value: toNumber(payload.rebate_value, customer?.default_rebate_value || 0),
    rebate_type: normalizeText(payload.rebate_type || customer?.default_rebate_type || "AMOUNT").toUpperCase(),
    temporary_support: toNumber(payload.temporary_support, 0),
    channel_factor: toNumber(payload.channel_factor, product?.channel_factor || 1),
    tax_rate: toNumber(payload.tax_rate, 0),
  };
}

function enrichQuote(quote) {
  const customer = customersRepo.getById(quote.customer_id);
  const product = productsRepo.getById(quote.product_id);
  const formula = formulasRepo.getById(quote.formula_id);
  const approval = approvalsRepo.findOne((item) => item.quote_id === quote.id);
  const approvalNodes = approval
    ? approvalNodesRepo.filter((item) => item.approval_id === approval.id).sort((a, b) => a.node_order - b.node_order)
    : [];
  return {
    ...quote,
    customer,
    product,
    formula,
    approval,
    approval_nodes: approvalNodes,
  };
}

function paginate(items, query = {}) {
  const page = Math.max(1, Number(query.page || 1));
  const pageSize = Math.min(businessRules.quote.maxPageSize, Math.max(1, Number(query.pageSize || businessRules.quote.defaultPageSize)));
  const sortBy = normalizeText(query.sortBy || "created_at");
  const sortDirection = String(query.sortDirection || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const sorted = items.slice().sort((left, right) => {
    const leftValue = left[sortBy] ?? "";
    const rightValue = right[sortBy] ?? "";
    if (leftValue === rightValue) {
      return 0;
    }
    const result = String(leftValue).localeCompare(String(rightValue), "zh-CN", { numeric: true });
    return sortDirection === "asc" ? result : result * -1;
  });
  const start = (page - 1) * pageSize;
  return {
    items: sorted.slice(start, start + pageSize),
    page,
    pageSize,
    total: sorted.length,
  };
}

function previewQuote(payload, options = {}) {
  const customer = resolveCustomer(payload, options.customerDraft || null);
  const product = resolveProduct(payload, options.productDraft || null);
  const formula = resolveFormula({ payload, customer, product });
  const errors = [];

  if (!customer) {
    errors.push("客户不存在，请先创建客户或选择自动创建客户草稿。");
  }
  if (!product) {
    errors.push("产品不存在，请先创建产品或选择自动创建产品草稿。");
  }
  if (!formula) {
    errors.push("未找到可用公式，请检查公式配置。");
  }
  if (!normalizeText(payload.effective_month)) {
    errors.push("生效月份不能为空。");
  }

  const normalizedInput = buildQuoteInput(payload, { customer, product });
  const calculation = formula ? calculateQuote(normalizedInput, formula, {}) : null;
  return {
    customer,
    product,
    formula,
    normalized_input: normalizedInput,
    calculation,
    validation_errors: errors.concat(calculation?.error_messages || []),
    can_submit: errors.length === 0 && Boolean(calculation?.can_save),
  };
}

function createQuote(payload, operatorId) {
  const operator = getOperator(operatorId);
  const preview = previewQuote(payload);
  if (!preview.customer || !preview.product || !preview.formula) {
    throw new Error(preview.validation_errors.join("；"));
  }
  if (!preview.can_submit) {
    throw new Error(preview.validation_errors.join("；"));
  }

  const quote = {
    id: buildId("quote"),
    quote_no: buildBusinessNo("QUO"),
    customer_id: preview.customer.id,
    product_id: preview.product.id,
    formula_id: preview.formula.id,
    msrp: preview.normalized_input.msrp,
    cost_price: preview.normalized_input.cost_price,
    discount_factor: preview.normalized_input.discount_factor,
    special_discount: preview.normalized_input.special_discount,
    rebate_value: preview.normalized_input.rebate_value,
    rebate_type: preview.normalized_input.rebate_type,
    temporary_support: preview.normalized_input.temporary_support,
    channel_factor: preview.normalized_input.channel_factor,
    tax_rate: preview.normalized_input.tax_rate,
    effective_month: normalizeText(payload.effective_month),
    effective_from: normalizeText(payload.effective_from || `${payload.effective_month}-01`),
    effective_to: normalizeText(payload.effective_to || ""),
    final_quote_price: preview.calculation.final_quote_price,
    gross_profit: preview.calculation.gross_profit,
    gross_margin: preview.calculation.gross_margin,
    below_cost_flag: preview.calculation.below_cost_flag,
    warning_level: preview.calculation.warning_level,
    warning_message: preview.calculation.warning_message,
    approval_required_flag: true,
    approval_status: "PENDING",
    quote_status: "PENDING_APPROVAL",
    formula_version_snapshot: preview.formula.formula_version,
    calculation_steps: preview.calculation.calculation_steps,
    remark: normalizeText(payload.remark),
    created_by: operator.id,
    created_at: now(),
    updated_at: now(),
  };

  quotesRepo.insert(quote);
  approvalService.createApprovalForQuote({ quote, customer: preview.customer, operator });
  writeLog({
    businessType: "QUOTE",
    targetId: quote.id,
    actionType: "CREATE",
    beforeData: null,
    afterData: enrichQuote(quote),
    operator,
  });
  return enrichQuote(quotesRepo.getById(quote.id));
}

function updateQuote(quoteId, payload, operatorId) {
  const operator = getOperator(operatorId);
  const currentQuote = quotesRepo.getById(quoteId);
  if (!currentQuote) {
    throw new Error("报价不存在。");
  }
  if (currentQuote.quote_status === "ACTIVE") {
    throw new Error("已生效报价不允许直接编辑，请复制后生成新报价。");
  }

  const mergedPayload = {
    ...currentQuote,
    ...payload,
    customer_id: currentQuote.customer_id,
    product_id: currentQuote.product_id,
    formula_id: payload.formula_id || currentQuote.formula_id,
  };
  const preview = previewQuote(mergedPayload);
  if (!preview.can_submit) {
    throw new Error(preview.validation_errors.join("；"));
  }

  const updated = quotesRepo.update(quoteId, (item) => ({
    ...item,
    ...preview.normalized_input,
    formula_id: preview.formula.id,
    final_quote_price: preview.calculation.final_quote_price,
    gross_profit: preview.calculation.gross_profit,
    gross_margin: preview.calculation.gross_margin,
    below_cost_flag: preview.calculation.below_cost_flag,
    warning_level: preview.calculation.warning_level,
    warning_message: preview.calculation.warning_message,
    formula_version_snapshot: preview.formula.formula_version,
    calculation_steps: preview.calculation.calculation_steps,
    quote_status: "DRAFT",
    approval_status: "PENDING",
    effective_month: normalizeText(payload.effective_month || item.effective_month),
    effective_from: normalizeText(payload.effective_from || item.effective_from),
    effective_to: normalizeText(payload.effective_to || item.effective_to),
    remark: normalizeText(payload.remark || item.remark),
    updated_at: now(),
  }));

  writeLog({
    businessType: "QUOTE",
    targetId: quoteId,
    actionType: "UPDATE",
    beforeData: updated.previous,
    afterData: updated.current,
    operator,
  });
  return enrichQuote(updated.current);
}

function submitQuote(quoteId, operatorId) {
  const operator = getOperator(operatorId);
  const quote = quotesRepo.getById(quoteId);
  if (!quote) {
    throw new Error("报价不存在。");
  }
  if (quote.quote_status === "PENDING_APPROVAL") {
    return enrichQuote(quote);
  }
  approvalService.createApprovalForQuote({
    quote,
    customer: customersRepo.getById(quote.customer_id),
    operator,
  });
  return enrichQuote(quotesRepo.getById(quoteId));
}

function getQuoteDetail(quoteId) {
  const quote = quotesRepo.getById(quoteId);
  if (!quote) {
    throw new Error("报价不存在。");
  }
  return enrichQuote(quote);
}

function listQuotes(query = {}) {
  const rawQuotes = quotesRepo.list().map((item) => enrichQuote(item));
  const filtered = rawQuotes.filter((item) => {
    const customerName = item.customer?.customer_name || "";
    const customerCode = item.customer?.customer_code || "";
    const sku = item.product?.sku || "";
    const productName = item.product?.product_name || "";
    const productSeries = item.product?.product_series || "";
    const formulaVersion = item.formula?.formula_version || item.formula_version_snapshot || "";
    return (
      (!query.customer_name || customerName.includes(query.customer_name)) &&
      (!query.customer_code || customerCode.includes(query.customer_code)) &&
      (!query.sku || sku.includes(query.sku)) &&
      (!query.product_name || productName.includes(query.product_name)) &&
      (!query.product_series || productSeries === query.product_series) &&
      (!query.effective_month || item.effective_month === query.effective_month) &&
      (!query.quote_status || item.quote_status === query.quote_status) &&
      (!query.approval_status || item.approval_status === query.approval_status) &&
      (!query.formula_version || formulaVersion === query.formula_version)
    );
  });
  return paginate(filtered, query);
}

module.exports = {
  previewQuote,
  createQuote,
  updateQuote,
  submitQuote,
  listQuotes,
  getQuoteDetail,
  getOperator,
};
