const { customersRepo, productsRepo, formulasRepo } = require("../repositories");
const quoteService = require("./quote-service");
const { buildId } = require("./id-service");
const { writeLog } = require("./log-service");

function now() {
  return new Date().toISOString();
}

function normalizeText(value) {
  return String(value || "").trim();
}

function createCustomerDraft(row) {
  return {
    id: buildId("cust_draft"),
    customer_code: normalizeText(row.customer_code),
    customer_name: normalizeText(row.customer_name || row.customer_code),
    customer_level: "NEW",
    customer_type: normalizeText(row.customer_type || "RETAIL"),
    channel_type: normalizeText(row.channel_type || "OFFLINE"),
    region: normalizeText(row.region || "待补充"),
    default_discount: Number(row.discount_factor || 0.8),
    default_rebate_value: Number(row.rebate_value || 0),
    default_rebate_type: normalizeText(row.rebate_type || "AMOUNT").toUpperCase(),
    default_approver_id: "u_admin_01",
    status: "DRAFT",
    remark: "批量导入自动创建客户草稿",
    created_at: now(),
    updated_at: now(),
  };
}

function createProductDraft(row) {
  return {
    id: buildId("prod_draft"),
    sku: normalizeText(row.sku),
    product_name: normalizeText(row.product_name || row.sku),
    product_series: normalizeText(row.product_series || "未分类"),
    product_model: normalizeText(row.product_model || row.product_name || row.sku),
    variant: normalizeText(row.variant || ""),
    launch_date: normalizeText(row.launch_date || ""),
    default_msrp: Number(row.msrp || row.default_msrp || 0),
    default_cost: Number(row.cost_price || row.default_cost || 0),
    default_formula_id: normalizeText(row.formula_id || formulasRepo.list()[0]?.id || ""),
    channel_factor: Number(row.channel_factor || 1),
    status: "DRAFT",
    remark: "批量导入自动创建产品草稿",
    created_at: now(),
    updated_at: now(),
  };
}

function previewQuoteRows(rows, options = {}) {
  const seenKeys = new Set();
  const results = rows.map((row, index) => {
    const rowNo = index + 2;
    const errors = [];
    const customerCode = normalizeText(row.customer_code);
    const sku = normalizeText(row.sku);
    const effectiveMonth = normalizeText(row.effective_month);
    if (!customerCode) {
      errors.push("客户编码不能为空");
    }
    if (!sku) {
      errors.push("SKU 不能为空");
    }
    if (!row.msrp && row.msrp !== 0) {
      errors.push("零售价不能为空");
    }
    if (!row.cost_price && row.cost_price !== 0) {
      errors.push("成本价不能为空");
    }
    if (!effectiveMonth) {
      errors.push("生效月份不能为空");
    }

    const duplicateKey = `${customerCode}::${sku}::${effectiveMonth}`;
    if (seenKeys.has(duplicateKey)) {
      errors.push("导入文件内存在重复客户/SKU/月份数据");
    } else {
      seenKeys.add(duplicateKey);
    }

    const customer = customersRepo.findOne((item) => item.customer_code === customerCode);
    const product = productsRepo.findOne((item) => item.sku === sku);
    const customerDraft = !customer && options.autoCreateCustomerDraft ? createCustomerDraft(row) : null;
    const productDraft = !product && options.autoCreateProductDraft ? createProductDraft(row) : null;
    if (!customer && !customerDraft) {
      errors.push("客户不存在");
    }
    if (!product && !productDraft) {
      errors.push("产品/SKU 不存在");
    }

    const preview = quoteService.previewQuote(
      {
        ...row,
        customer_code: customerCode,
        sku,
        effective_month: effectiveMonth,
      },
      {
        customerDraft,
        productDraft,
      }
    );

    const finalErrors = errors.concat(preview.validation_errors || []);
    return {
      row_no: rowNo,
      status: finalErrors.length === 0 ? "SUCCESS" : "FAILED",
      errors: [...new Set(finalErrors)],
      normalized_payload: {
        ...row,
        customer_code: customerCode,
        sku,
        effective_month: effectiveMonth,
      },
      customer_auto_create: Boolean(customerDraft),
      product_auto_create: Boolean(productDraft),
      quote_preview: preview,
    };
  });

  return {
    rows: results,
    summary: {
      total: results.length,
      success: results.filter((item) => item.status === "SUCCESS").length,
      failed: results.filter((item) => item.status === "FAILED").length,
    },
  };
}

function confirmQuoteRows(rows, options = {}) {
  const operator = quoteService.getOperator(options.operatorId);
  const successes = [];
  const failures = [];

  rows.forEach((row) => {
    try {
      if (row.customer_auto_create) {
        const existingCustomer = customersRepo.findOne((item) => item.customer_code === row.normalized_payload.customer_code);
        if (!existingCustomer) {
          customersRepo.insert(createCustomerDraft(row.normalized_payload));
        }
      }
      if (row.product_auto_create) {
        const existingProduct = productsRepo.findOne((item) => item.sku === row.normalized_payload.sku);
        if (!existingProduct) {
          productsRepo.insert(createProductDraft(row.normalized_payload));
        }
      }
      const quote = quoteService.createQuote(row.normalized_payload, operator.id);
      successes.push({ row_no: row.row_no, quote_no: quote.quote_no, quote_id: quote.id });
    } catch (error) {
      failures.push({ row_no: row.row_no, error: error instanceof Error ? error.message : "导入失败" });
    }
  });

  writeLog({
    businessType: "QUOTE_IMPORT",
    targetId: "BATCH_IMPORT",
    actionType: "CONFIRM_IMPORT",
    beforeData: null,
    afterData: { successes, failures },
    operator,
  });

  return {
    success_count: successes.length,
    failed_count: failures.length,
    successes,
    failures,
  };
}

function previewCustomerRows(rows) {
  const results = rows.map((row, index) => {
    const errors = [];
    if (!normalizeText(row.customer_code)) {
      errors.push("客户编码不能为空");
    }
    if (!normalizeText(row.customer_name)) {
      errors.push("客户名称不能为空");
    }
    return { row_no: index + 2, status: errors.length ? "FAILED" : "SUCCESS", errors, normalized_payload: row };
  });
  return { rows: results, summary: { total: results.length, success: results.filter((item) => item.status === "SUCCESS").length, failed: results.filter((item) => item.status === "FAILED").length } };
}

function confirmCustomerRows(rows, operatorId) {
  const operator = quoteService.getOperator(operatorId);
  const saved = [];
  rows.forEach((row) => {
    customersRepo.insert({
      ...createCustomerDraft(row.normalized_payload),
      customer_name: normalizeText(row.normalized_payload.customer_name),
      status: "ACTIVE",
    });
    saved.push(row.normalized_payload.customer_code);
  });
  writeLog({ businessType: "CUSTOMER", targetId: "BATCH_IMPORT", actionType: "IMPORT", beforeData: null, afterData: saved, operator });
  return { success_count: saved.length, failed_count: 0, successes: saved };
}

function previewProductRows(rows) {
  const results = rows.map((row, index) => {
    const errors = [];
    if (!normalizeText(row.sku)) {
      errors.push("SKU 不能为空");
    }
    if (!normalizeText(row.product_name)) {
      errors.push("产品名称不能为空");
    }
    return { row_no: index + 2, status: errors.length ? "FAILED" : "SUCCESS", errors, normalized_payload: row };
  });
  return { rows: results, summary: { total: results.length, success: results.filter((item) => item.status === "SUCCESS").length, failed: results.filter((item) => item.status === "FAILED").length } };
}

function confirmProductRows(rows, operatorId) {
  const operator = quoteService.getOperator(operatorId);
  const saved = [];
  rows.forEach((row) => {
    productsRepo.insert({
      ...createProductDraft(row.normalized_payload),
      product_name: normalizeText(row.normalized_payload.product_name),
      status: "ACTIVE",
    });
    saved.push(row.normalized_payload.sku);
  });
  writeLog({ businessType: "PRODUCT", targetId: "BATCH_IMPORT", actionType: "IMPORT", beforeData: null, afterData: saved, operator });
  return { success_count: saved.length, failed_count: 0, successes: saved };
}

function buildTemplate(type) {
  if (type === "quotes") {
    return "customer_code,customer_name,sku,product_name,product_series,msrp,cost_price,discount_factor,special_discount,rebate_value,rebate_type,temporary_support,channel_factor,effective_month,effective_to,remark\nDE-RTL-001,德国核心连锁A,FINDX8-512-BLK,Find X8,Find,999,728,0.83,15,8,AMOUNT,5,1,2026-05,2026-05-31,标准报价样例\n";
  }
  if (type === "customers") {
    return "customer_code,customer_name,customer_type,channel_type,region,default_discount,default_rebate_value,default_rebate_type,remark\nEU-NEW-001,新客户样例,RETAIL,OFFLINE,德国,0.82,10,AMOUNT,模板样例\n";
  }
  if (type === "products") {
    return "sku,product_name,product_series,product_model,variant,default_msrp,default_cost,channel_factor,remark\nNEW-SKU-001,新品样例,Reno,R16,12+256G,499,360,1,模板样例\n";
  }
  return "";
}

module.exports = {
  previewQuoteRows,
  confirmQuoteRows,
  previewCustomerRows,
  confirmCustomerRows,
  previewProductRows,
  confirmProductRows,
  buildTemplate,
};
