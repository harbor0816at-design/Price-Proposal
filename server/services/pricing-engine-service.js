const { customersRepo, productsRepo } = require("../repositories");
const quoteService = require("./quote-service");

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function roundMoney(value) {
  return Number(toNumber(value).toFixed(2));
}

function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getPriceValidUntil(referenceDate = new Date()) {
  const date = new Date(referenceDate);
  date.setDate(date.getDate() + 14);
  return date.toISOString().slice(0, 10);
}

function getProductMoq(product) {
  return Math.max(1, Math.floor(toNumber(product?.min_order_quantity, 1)));
}

function getCustomerPrice(customerId, productId, quantity = 1) {
  const customer = customersRepo.getById(customerId);
  const product = productsRepo.getById(productId) || productsRepo.findOne((item) => item.sku === productId);
  if (!customer || !product) {
    throw new Error("客户或产品不存在。");
  }
  const moq = getProductMoq(product);
  const normalizedQuantity = Math.max(moq, Math.floor(toNumber(quantity, moq)));
  const preview = quoteService.previewQuote({
    customer_id: customer.id,
    product_id: product.id,
    formula_id: product.default_formula_id,
    effective_month: getCurrentMonthValue(),
    msrp: product.default_msrp,
    cost_price: product.default_cost,
    discount_factor: customer.default_discount,
    rebate_value: customer.default_rebate_value,
    rebate_type: customer.default_rebate_type,
    channel_factor: product.channel_factor,
    tax_rate: toNumber(customer.default_vat, 0.2),
  });
  if (!preview.can_submit) {
    throw new Error(preview.validation_errors.join("；") || "价格试算未通过。");
  }
  const unitPrice = roundMoney(preview.calculation.final_quote_price);
  const currency = customer.default_currency || "EUR";
  const validUntil = getPriceValidUntil();
  const snapshot = {
    customer_id: customer.id,
    product_id: product.id,
    sku: product.sku,
    quantity: normalizedQuantity,
    unit_price: unitPrice,
    currency,
    vat_rate: toNumber(customer.default_vat, 0.2),
    formula_id: preview.formula.id,
    formula_version: preview.formula.formula_version,
    price_source: "PRICING_ENGINE",
    calculated_at: new Date().toISOString(),
    valid_until: validUntil,
  };
  return {
    unit_price: unitPrice,
    currency,
    vat_rate: snapshot.vat_rate,
    valid_until: validUntil,
    formula_id: preview.formula.id,
    formula_version: preview.formula.formula_version,
    quotation_rule_id: preview.formula.formula_code,
    approval_required: true,
    min_order_quantity: moq,
    price_source: "PRICING_ENGINE",
    quantity: normalizedQuantity,
    price_snapshot_json: snapshot,
  };
}

function previewCustomerPrice(customerId, productId, quantity) {
  return getCustomerPrice(customerId, productId, quantity);
}

module.exports = {
  getCustomerPrice,
  previewCustomerPrice,
  roundMoney,
};
