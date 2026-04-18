const businessRules = require("../config/business-rules");
const { customersRepo, productsRepo, formulasRepo, usersRepo } = require("../repositories");
const quoteService = require("../services/quote-service");
const approvalService = require("../services/approval-service");
const importService = require("../services/import-service");
const { calculateQuote } = require("../services/quote-calculate-service");
const { buildId } = require("../services/id-service");
const { writeLog, listLogs } = require("../services/log-service");
const { readJsonBody, sendJson, parseRequestUrl } = require("../utils/http");

function normalizeText(value) {
  return String(value || "").trim();
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function matchPath(pattern, pathname) {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) {
    return null;
  }
  const params = {};
  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index];
    const pathPart = pathParts[index];
    if (patternPart.startsWith(":")) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart);
      continue;
    }
    if (patternPart !== pathPart) {
      return null;
    }
  }
  return params;
}

function paginate(items, query) {
  const page = Math.max(1, Number(query.page || 1));
  const pageSize = Math.min(businessRules.quote.maxPageSize, Math.max(1, Number(query.pageSize || businessRules.quote.defaultPageSize)));
  const sortBy = normalizeText(query.sortBy || "created_at");
  const sortDirection = String(query.sortDirection || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const sorted = items.slice().sort((left, right) => {
    const leftValue = left[sortBy] ?? "";
    const rightValue = right[sortBy] ?? "";
    const compare = String(leftValue).localeCompare(String(rightValue), "zh-CN", { numeric: true });
    return sortDirection === "asc" ? compare : compare * -1;
  });
  const start = (page - 1) * pageSize;
  return {
    items: sorted.slice(start, start + pageSize),
    page,
    pageSize,
    total: sorted.length,
  };
}

function buildCustomerPayload(body = {}) {
  const now = new Date().toISOString();
  return {
    id: body.id || buildId("cust"),
    customer_code: normalizeText(body.customer_code),
    customer_name: normalizeText(body.customer_name),
    customer_level: normalizeText(body.customer_level || "B"),
    customer_type: normalizeText(body.customer_type || "RETAIL"),
    channel_type: normalizeText(body.channel_type || "OFFLINE"),
    region: normalizeText(body.region || "待补充"),
    default_discount: toNumber(body.default_discount, 0.8),
    default_rebate_value: toNumber(body.default_rebate_value, 0),
    default_rebate_type: normalizeText(body.default_rebate_type || "AMOUNT").toUpperCase(),
    default_approver_id: normalizeText(body.default_approver_id || "u_admin_01"),
    status: normalizeText(body.status || "ACTIVE"),
    remark: normalizeText(body.remark),
    created_at: body.created_at || now,
    updated_at: now,
  };
}

function buildProductPayload(body = {}) {
  const now = new Date().toISOString();
  return {
    id: body.id || buildId("prod"),
    sku: normalizeText(body.sku),
    product_name: normalizeText(body.product_name),
    product_series: normalizeText(body.product_series || "未分类"),
    product_model: normalizeText(body.product_model || body.product_name),
    variant: normalizeText(body.variant),
    launch_date: normalizeText(body.launch_date),
    default_msrp: toNumber(body.default_msrp, 0),
    default_cost: toNumber(body.default_cost, 0),
    default_formula_id: normalizeText(body.default_formula_id || formulasRepo.list()[0]?.id || ""),
    channel_factor: toNumber(body.channel_factor, 1),
    status: normalizeText(body.status || "ACTIVE"),
    remark: normalizeText(body.remark),
    created_at: body.created_at || now,
    updated_at: now,
  };
}

function buildFormulaPayload(body = {}, operatorId = "u_admin_01") {
  const now = new Date().toISOString();
  return {
    id: body.id || buildId("formula"),
    formula_code: normalizeText(body.formula_code),
    formula_name: normalizeText(body.formula_name),
    formula_version: normalizeText(body.formula_version || "v1.0"),
    formula_expression: normalizeText(body.formula_expression || businessRules.quote.defaultFormulaExpression),
    applicable_customer_type: normalizeText(body.applicable_customer_type || "ALL"),
    applicable_product_series: normalizeText(body.applicable_product_series || "ALL"),
    applicable_channel_type: normalizeText(body.applicable_channel_type || "ALL"),
    allow_below_cost_draft: Boolean(body.allow_below_cost_draft),
    status: normalizeText(body.status || "ACTIVE"),
    effective_from: normalizeText(body.effective_from || now.slice(0, 10)),
    effective_to: normalizeText(body.effective_to),
    created_by: body.created_by || operatorId,
    created_at: body.created_at || now,
    updated_at: now,
    remark: normalizeText(body.remark),
  };
}

function getOperator(request, body = {}) {
  const operatorId = request.headers["x-operator-id"] || body.operatorId || "u_admin_01";
  return quoteService.getOperator(String(operatorId));
}

function createRouter() {
  const routes = [];

  function register(method, pattern, handler) {
    routes.push({ method, pattern, handler });
  }

  register("GET", "/api/health", async (_request, response) => {
    sendJson(response, 200, { status: "ok", system: businessRules.systemName });
  });

  register("GET", "/api/bootstrap", async (_request, response) => {
    sendJson(response, 200, {
      system: businessRules,
      users: usersRepo.list(),
      customers: customersRepo.list(),
      products: productsRepo.list(),
      formulas: formulasRepo.list(),
    });
  });

  register("GET", "/api/users", async (_request, response) => {
    sendJson(response, 200, { items: usersRepo.list() });
  });

  register("GET", "/api/customers", async (request, response) => {
    const { searchParams } = parseRequestUrl(request.url);
    const items = customersRepo.list().filter((item) => {
      return (
        (!searchParams.get("keyword") ||
          item.customer_name.includes(searchParams.get("keyword")) ||
          item.customer_code.includes(searchParams.get("keyword"))) &&
        (!searchParams.get("status") || item.status === searchParams.get("status"))
      );
    });
    sendJson(response, 200, paginate(items, Object.fromEntries(searchParams.entries())));
  });

  register("GET", "/api/customers/:id", async (_request, response, context) => {
    const item = customersRepo.getById(context.params.id);
    if (!item) {
      sendJson(response, 404, { message: "客户不存在。" });
      return;
    }
    sendJson(response, 200, item);
  });

  register("POST", "/api/customers", async (request, response, _context, body) => {
    const operator = getOperator(request, body);
    const payload = buildCustomerPayload(body);
    if (!payload.customer_code || !payload.customer_name) {
      sendJson(response, 400, { message: "客户编码和客户名称不能为空。" });
      return;
    }
    customersRepo.insert(payload);
    writeLog({ businessType: "CUSTOMER", targetId: payload.id, actionType: "CREATE", beforeData: null, afterData: payload, operator });
    sendJson(response, 201, payload);
  });

  register("PUT", "/api/customers/:id", async (request, response, context, body) => {
    const operator = getOperator(request, body);
    const current = customersRepo.getById(context.params.id);
    if (!current) {
      sendJson(response, 404, { message: "客户不存在。" });
      return;
    }
    const payload = { ...current, ...buildCustomerPayload({ ...current, ...body, id: current.id, created_at: current.created_at }) };
    const updated = customersRepo.update(current.id, payload);
    writeLog({ businessType: "CUSTOMER", targetId: current.id, actionType: "UPDATE", beforeData: updated.previous, afterData: updated.current, operator });
    sendJson(response, 200, updated.current);
  });

  register("POST", "/api/customers/import/preview", async (_request, response, _context, body) => {
    sendJson(response, 200, importService.previewCustomerRows(body.rows || []));
  });

  register("POST", "/api/customers/import/confirm", async (request, response, _context, body) => {
    sendJson(response, 200, importService.confirmCustomerRows(body.rows || [], getOperator(request, body).id));
  });

  register("GET", "/api/products", async (request, response) => {
    const { searchParams } = parseRequestUrl(request.url);
    const items = productsRepo.list().filter((item) => {
      return (
        (!searchParams.get("keyword") ||
          item.product_name.includes(searchParams.get("keyword")) ||
          item.sku.includes(searchParams.get("keyword"))) &&
        (!searchParams.get("status") || item.status === searchParams.get("status"))
      );
    });
    sendJson(response, 200, paginate(items, Object.fromEntries(searchParams.entries())));
  });

  register("GET", "/api/products/:id", async (_request, response, context) => {
    const item = productsRepo.getById(context.params.id);
    if (!item) {
      sendJson(response, 404, { message: "产品不存在。" });
      return;
    }
    sendJson(response, 200, item);
  });

  register("POST", "/api/products", async (request, response, _context, body) => {
    const operator = getOperator(request, body);
    const payload = buildProductPayload(body);
    if (!payload.sku || !payload.product_name) {
      sendJson(response, 400, { message: "SKU 和产品名称不能为空。" });
      return;
    }
    productsRepo.insert(payload);
    writeLog({ businessType: "PRODUCT", targetId: payload.id, actionType: "CREATE", beforeData: null, afterData: payload, operator });
    sendJson(response, 201, payload);
  });

  register("PUT", "/api/products/:id", async (request, response, context, body) => {
    const operator = getOperator(request, body);
    const current = productsRepo.getById(context.params.id);
    if (!current) {
      sendJson(response, 404, { message: "产品不存在。" });
      return;
    }
    const payload = { ...current, ...buildProductPayload({ ...current, ...body, id: current.id, created_at: current.created_at }) };
    const updated = productsRepo.update(current.id, payload);
    writeLog({ businessType: "PRODUCT", targetId: current.id, actionType: "UPDATE", beforeData: updated.previous, afterData: updated.current, operator });
    sendJson(response, 200, updated.current);
  });

  register("POST", "/api/products/import/preview", async (_request, response, _context, body) => {
    sendJson(response, 200, importService.previewProductRows(body.rows || []));
  });

  register("POST", "/api/products/import/confirm", async (request, response, _context, body) => {
    sendJson(response, 200, importService.confirmProductRows(body.rows || [], getOperator(request, body).id));
  });

  register("GET", "/api/formulas", async (request, response) => {
    const { searchParams } = parseRequestUrl(request.url);
    const items = formulasRepo.list().filter((item) => {
      return (
        (!searchParams.get("keyword") ||
          item.formula_name.includes(searchParams.get("keyword")) ||
          item.formula_code.includes(searchParams.get("keyword"))) &&
        (!searchParams.get("status") || item.status === searchParams.get("status"))
      );
    });
    sendJson(response, 200, paginate(items, Object.fromEntries(searchParams.entries())));
  });

  register("GET", "/api/formulas/:id", async (_request, response, context) => {
    const item = formulasRepo.getById(context.params.id);
    if (!item) {
      sendJson(response, 404, { message: "公式不存在。" });
      return;
    }
    sendJson(response, 200, item);
  });

  register("POST", "/api/formulas", async (request, response, _context, body) => {
    const operator = getOperator(request, body);
    const payload = buildFormulaPayload(body, operator.id);
    if (!payload.formula_code || !payload.formula_name || !payload.formula_expression) {
      sendJson(response, 400, { message: "公式编码、名称、表达式不能为空。" });
      return;
    }
    formulasRepo.insert(payload);
    writeLog({ businessType: "FORMULA", targetId: payload.id, actionType: "CREATE", beforeData: null, afterData: payload, operator });
    sendJson(response, 201, payload);
  });

  register("PUT", "/api/formulas/:id", async (request, response, context, body) => {
    const operator = getOperator(request, body);
    const current = formulasRepo.getById(context.params.id);
    if (!current) {
      sendJson(response, 404, { message: "公式不存在。" });
      return;
    }
    const payload = { ...current, ...buildFormulaPayload({ ...current, ...body, id: current.id, created_at: current.created_at }, operator.id) };
    const updated = formulasRepo.update(current.id, payload);
    writeLog({ businessType: "FORMULA", targetId: current.id, actionType: "UPDATE", beforeData: updated.previous, afterData: updated.current, operator });
    sendJson(response, 200, updated.current);
  });

  register("POST", "/api/formulas/:id/toggle", async (request, response, context, body) => {
    const operator = getOperator(request, body);
    const current = formulasRepo.getById(context.params.id);
    if (!current) {
      sendJson(response, 404, { message: "公式不存在。" });
      return;
    }
    const updated = formulasRepo.update(current.id, (item) => ({
      ...item,
      status: item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      updated_at: new Date().toISOString(),
    }));
    writeLog({ businessType: "FORMULA", targetId: current.id, actionType: "TOGGLE_STATUS", beforeData: updated.previous, afterData: updated.current, operator });
    sendJson(response, 200, updated.current);
  });

  register("POST", "/api/formulas/try-calculate", async (_request, response, _context, body) => {
    const formula = formulasRepo.getById(body.formula_id);
    if (!formula) {
      sendJson(response, 404, { message: "公式不存在。" });
      return;
    }
    sendJson(response, 200, calculateQuote(body, formula));
  });

  register("POST", "/api/quotes/calculate", async (_request, response, _context, body) => {
    sendJson(response, 200, quoteService.previewQuote(body));
  });

  register("POST", "/api/quotes", async (request, response, _context, body) => {
    try {
      const quote = quoteService.createQuote(body, getOperator(request, body).id);
      sendJson(response, 201, quote);
    } catch (error) {
      sendJson(response, 400, { message: error instanceof Error ? error.message : "报价生成失败。" });
    }
  });

  register("GET", "/api/quotes", async (request, response) => {
    const { searchParams } = parseRequestUrl(request.url);
    sendJson(response, 200, quoteService.listQuotes(Object.fromEntries(searchParams.entries())));
  });

  register("GET", "/api/quotes/:id", async (_request, response, context) => {
    try {
      sendJson(response, 200, quoteService.getQuoteDetail(context.params.id));
    } catch (error) {
      sendJson(response, 404, { message: error instanceof Error ? error.message : "报价不存在。" });
    }
  });

  register("PUT", "/api/quotes/:id", async (request, response, context, body) => {
    try {
      sendJson(response, 200, quoteService.updateQuote(context.params.id, body, getOperator(request, body).id));
    } catch (error) {
      sendJson(response, 400, { message: error instanceof Error ? error.message : "报价修改失败。" });
    }
  });

  register("POST", "/api/quotes/:id/submit", async (request, response, context, body) => {
    try {
      sendJson(response, 200, quoteService.submitQuote(context.params.id, getOperator(request, body).id));
    } catch (error) {
      sendJson(response, 400, { message: error instanceof Error ? error.message : "提交审批失败。" });
    }
  });

  register("POST", "/api/imports/quotes/preview", async (_request, response, _context, body) => {
    sendJson(
      response,
      200,
      importService.previewQuoteRows(body.rows || [], {
        autoCreateCustomerDraft: Boolean(body.autoCreateCustomerDraft),
        autoCreateProductDraft: Boolean(body.autoCreateProductDraft),
      })
    );
  });

  register("POST", "/api/imports/quotes/confirm", async (request, response, _context, body) => {
    sendJson(
      response,
      200,
      importService.confirmQuoteRows(body.rows || [], {
        operatorId: getOperator(request, body).id,
      })
    );
  });

  register("GET", "/api/approvals", async (request, response) => {
    const { searchParams } = parseRequestUrl(request.url);
    const approvals = approvalService.listApprovals().map((item) => ({
      ...item,
      quote_detail: quoteService.getQuoteDetail(item.quote_id),
    }));
    const filtered = approvals.filter((item) => {
      return (
        (!searchParams.get("approval_status") || item.approval_status === searchParams.get("approval_status")) &&
        (!searchParams.get("approver_id") || item.approver_id === searchParams.get("approver_id"))
      );
    });
    sendJson(response, 200, paginate(filtered, Object.fromEntries(searchParams.entries())));
  });

  register("POST", "/api/approvals/:id/approve", async (request, response, context, body) => {
    try {
      sendJson(
        response,
        200,
        approvalService.approve({
          approvalId: context.params.id,
          operatorId: getOperator(request, body).id,
          comment: normalizeText(body.comment),
        })
      );
    } catch (error) {
      sendJson(response, 400, { message: error instanceof Error ? error.message : "审批失败。" });
    }
  });

  register("POST", "/api/approvals/:id/reject", async (request, response, context, body) => {
    try {
      sendJson(
        response,
        200,
        approvalService.reject({
          approvalId: context.params.id,
          operatorId: getOperator(request, body).id,
          comment: normalizeText(body.comment),
        })
      );
    } catch (error) {
      sendJson(response, 400, { message: error instanceof Error ? error.message : "驳回失败。" });
    }
  });

  register("GET", "/api/logs", async (request, response) => {
    const { searchParams } = parseRequestUrl(request.url);
    const items = listLogs().filter((item) => {
      return (
        (!searchParams.get("business_type") || item.business_type === searchParams.get("business_type")) &&
        (!searchParams.get("action_type") || item.action_type === searchParams.get("action_type"))
      );
    });
    sendJson(response, 200, paginate(items, Object.fromEntries(searchParams.entries())));
  });

  register("GET", "/api/templates/:type", async (_request, response, context) => {
    const content = importService.buildTemplate(context.params.type);
    if (!content) {
      sendJson(response, 404, { message: "模板不存在。" });
      return;
    }
    response.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${context.params.type}-template.csv"`,
      "Access-Control-Allow-Origin": "*",
    });
    response.end(content);
  });

  return {
    async handle(request, response) {
      try {
        const { pathname, searchParams } = parseRequestUrl(request.url);
        const route = routes.find((item) => item.method === request.method && matchPath(item.pattern, pathname));
        if (!route) {
          sendJson(response, 404, { message: "接口不存在。", path: pathname });
          return;
        }
        const params = matchPath(route.pattern, pathname) || {};
        const body = request.method === "GET" ? {} : await readJsonBody(request);
        await route.handler(request, response, { params, query: Object.fromEntries(searchParams.entries()) }, body);
      } catch (error) {
        sendJson(response, 500, { message: error instanceof Error ? error.message : "服务端异常。" });
      }
    },
  };
}

module.exports = {
  createRouter,
};
