const {
  customersRepo,
  productsRepo,
  usersRepo,
  orderQuotationsRepo,
  ordersRepo,
  orderItemsRepo,
  invoicesRepo,
  invoiceItemsRepo,
} = require("../repositories");
const { readDatabase } = require("../db/database");
const { buildId } = require("./id-service");
const { writeLog } = require("./log-service");

const DEFAULT_INVOICE_SETTINGS = {
  seller_company_name: "Rfriend Services GmbH",
  seller_address_line_1: "30th Floor, DC Tower 1",
  seller_address_line_2: "Donau-City-Strasse 7",
  seller_address_line_3: "1220 Vienna, Austria",
  commercial_court: "Vienna",
  company_no: "FN 654071w",
  vat_id: "ATU82229928",
  bank_name: "Erste Bank",
  account_holder: "Rfriend Services GmbH",
  iban: "AT36 2011 1854 3486 1400",
  bic_swift: "GIBAATWWXXX",
  default_currency: "EUR",
  default_payment_days: 14,
};

const SMV_RATES = {
  PHONE: 5.5,
  TABLET: 5.5,
  SMARTWATCH: 1.3,
};

function now() {
  return new Date().toISOString();
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function roundMoney(value) {
  return Number(toNumber(value).toFixed(2));
}

function getOperator(operatorId) {
  return usersRepo.getById(operatorId) || usersRepo.findOne((item) => item.role === "SYSTEM_ADMIN") || { id: "u_system", display_name: "系统" };
}

function assertInvoicePermission(operator, action, invoiceType = "") {
  const role = operator.role || "";
  if (operator.account_type === "CUSTOMER" || role.startsWith("CUSTOMER_")) {
    throw new Error("No permission to operate internal invoices.");
  }
  if (role === "SYSTEM_ADMIN") return;
  if (action === "CREATE" && invoiceType === "PROFORMA_INVOICE" && ["SALES_ENTRY", "SALES_MANAGER", "FINANCE_HEAD"].includes(role)) return;
  if (action === "CREATE" && ["COMMERCIAL_INVOICE", "CREDIT_NOTE"].includes(invoiceType) && role === "FINANCE_HEAD") return;
  if (action === "PAYMENT" && role === "FINANCE_HEAD") return;
  if (action === "CANCEL" && role === "FINANCE_HEAD") return;
  throw new Error("No permission to operate internal invoices.");
}

function getSettings() {
  const db = readDatabase();
  return { ...DEFAULT_INVOICE_SETTINGS, ...(db.invoiceSettings || {}) };
}

function normalizeCategory(value) {
  const text = String(value || "").toUpperCase();
  if (/WATCH|SMARTWATCH/.test(text)) return "SMARTWATCH";
  if (/TABLET|PAD/.test(text)) return "TABLET";
  if (/PHONE|SMARTPHONE|MOBILE|FIND|RENO/.test(text)) return "PHONE";
  return text || "PHONE";
}

function parsePaymentDays(paymentTerms, fallbackDays) {
  const match = String(paymentTerms || "").match(/(\d+)/);
  return match ? Math.max(1, Number(match[1])) : Math.max(1, Math.floor(toNumber(fallbackDays, 14)));
}

function addDays(dateValue, days) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + Math.max(0, Math.floor(toNumber(days, 0))));
  return date.toISOString().slice(0, 10);
}

function prefixForType(invoiceType) {
  if (invoiceType === "PROFORMA_INVOICE") return "PI";
  if (invoiceType === "CREDIT_NOTE") return "CN";
  return "INV";
}

function generateInvoiceNo(invoiceType, date = new Date()) {
  const prefix = prefixForType(invoiceType);
  const year = date.getFullYear();
  const existing = invoicesRepo
    .list()
    .map((invoice) => String(invoice.invoice_no || ""))
    .filter((no) => no.startsWith(`${prefix}-${year}-`))
    .map((no) => Number(no.split("-").pop()))
    .filter((num) => Number.isFinite(num));
  let next = existing.length ? Math.max(...existing) + 1 : 1;
  let invoiceNo = `${prefix}-${year}-${String(next).padStart(4, "0")}`;
  while (invoicesRepo.findOne((invoice) => invoice.invoice_no === invoiceNo)) {
    next += 1;
    invoiceNo = `${prefix}-${year}-${String(next).padStart(4, "0")}`;
  }
  return invoiceNo;
}

function hasActiveInvoice(orderId, invoiceType) {
  return invoicesRepo.findOne((invoice) => invoice.order_id === orderId && invoice.invoice_type === invoiceType && invoice.invoice_status !== "CANCELLED");
}

function validateOrderForInvoice(order, invoiceType) {
  const errors = [];
  const customer = customersRepo.getById(order?.customer_id);
  const quotation = orderQuotationsRepo.getById(order?.quotation_id);
  const items = orderItemsRepo.filter((item) => item.order_id === order?.id);
  if (!order) errors.push("Order does not exist.");
  if (order && !["APPROVED", "PAYMENT_CONFIRMED"].includes(order.order_status)) errors.push("Order has not been approved.");
  if (order && order.approval_status !== "APPROVED") errors.push("Order has not been approved.");
  if (!quotation || quotation.quotation_status !== "LOCKED") errors.push("Locked quotation snapshot is missing.");
  if (order && hasActiveInvoice(order.id, invoiceType)) errors.push("Invoice already exists for this order.");
  if (!customer?.vat_id) errors.push("Missing customer VAT ID. Please complete customer billing information before generating invoice.");
  if (!customer?.billing_address) errors.push("Billing address is missing.");
  if (!customer?.country) errors.push("Customer country is missing.");
  if (!items.length) errors.push("Order item is missing.");
  items.forEach((item) => {
    if (toNumber(item.quantity, 0) <= 0) errors.push(`${item.sku} quantity must be greater than 0.`);
    if (item.unit_price_snapshot == null || !item.price_snapshot_json) errors.push("Order item price snapshot is missing.");
  });
  return { ok: errors.length === 0, errors, customer, quotation, items };
}

function buildInvoiceItems(invoiceId, orderItems, reverseChargeApplied) {
  return orderItems.map((item, index) => {
    const product = productsRepo.getById(item.product_id);
    const category = normalizeCategory(product?.category || product?.product_series);
    const isBundleItem = Boolean(item.is_bundle_item);
    const isFreeOfCharge = Boolean(item.is_free_of_charge || isBundleItem);
    const quantity = Math.max(0, Math.floor(toNumber(item.quantity, 0)));
    const unitPrice = isFreeOfCharge ? 0 : roundMoney(item.unit_price_snapshot);
    const netAmount = roundMoney(unitPrice * quantity);
    const vatRate = reverseChargeApplied ? 0 : toNumber(item.vat_rate_snapshot, 0);
    const smvRate = SMV_RATES[category] || 0;
    const id = buildId("invoice_item");
    const description = `${[product?.product_name || item.product_name || item.sku, product?.variant || ""].filter(Boolean).join(" ")}${isFreeOfCharge ? " (Bundle item - free of charge)" : ""}`;
    return {
      id,
      invoice_item_id: id,
      invoice_id: invoiceId,
      order_item_id: item.id,
      product_id: item.product_id,
      sku: item.sku,
      ean: product?.ean_13 || "",
      product_name: item.product_name,
      description,
      quantity,
      unit: item.unit || "PCS",
      unit_price_net: unitPrice,
      net_amount: netAmount,
      vat_rate: vatRate,
      vat_amount: roundMoney(netAmount * vatRate),
      total_amount: roundMoney(netAmount * (1 + vatRate)),
      is_bundle_item: isBundleItem,
      bundle_parent_sku: item.bundle_parent_sku || "",
      is_free_of_charge: isFreeOfCharge,
      smv_category: smvRate > 0 ? category : "",
      smv_rate: smvRate,
      smv_amount_included: smvRate > 0 ? roundMoney(smvRate * quantity) : 0,
      sort_order: index + 1,
    };
  });
}

function buildSmvNotes(items) {
  const categories = new Set(items.map((item) => item.smv_category).filter(Boolean));
  const notes = [];
  if (categories.has("PHONE") || categories.has("TABLET")) notes.push("Mobile phones and tablets: EUR 5.50 per device");
  if (categories.has("SMARTWATCH")) notes.push("Smartwatches: EUR 1.30 per device");
  return notes;
}

function createInvoice({ orderId, invoiceType = "PROFORMA_INVOICE", operatorId, reverseChargeApplied }) {
  const operator = getOperator(operatorId);
  assertInvoicePermission(operator, "CREATE", invoiceType);
  const order = ordersRepo.getById(orderId);
  const validation = validateOrderForInvoice(order, invoiceType);
  if (!validation.ok) throw new Error(validation.errors[0]);
  const { customer, quotation, items } = validation;
  const settings = getSettings();
  const dateOfIssue = now().slice(0, 10);
  const paymentDays = parsePaymentDays(customer.payment_terms, settings.default_payment_days);
  const reverseCharge = Boolean(reverseChargeApplied ?? customer.reverse_charge_eligible);
  const invoiceId = buildId("invoice");
  const invoiceItems = buildInvoiceItems(invoiceId, items, reverseCharge);
  const subtotalNet = roundMoney(invoiceItems.reduce((sum, item) => sum + item.net_amount, 0));
  const vatRate = reverseCharge ? 0 : toNumber(invoiceItems.find((item) => item.net_amount > 0)?.vat_rate, 0);
  const vatAmount = roundMoney(reverseCharge ? 0 : subtotalNet * vatRate);
  const totalGross = roundMoney(subtotalNet + vatAmount);
  const expectedTotal = reverseCharge ? roundMoney(order.subtotal) : roundMoney(order.total_amount);
  if (Math.abs(totalGross - expectedTotal) > 0.02) throw new Error("Invoice total does not match order total.");
  const invoiceNo = generateInvoiceNo(invoiceType, new Date(`${dateOfIssue}T00:00:00`));
  const invoice = {
    id: invoiceId,
    invoice_id: invoiceId,
    invoice_no: invoiceNo,
    invoice_type: invoiceType,
    invoice_status: "GENERATED",
    order_id: order.id,
    order_no: order.external_order_reference || order.order_no,
    order_reference: order.external_order_reference || order.order_no,
    quotation_id: quotation.id,
    customer_id: customer.id,
    customer_name: customer.customer_name,
    customer_company_no: customer.company_no || customer.customer_code,
    customer_vat_id: customer.vat_id,
    customer_email: customer.invoice_email || customer.email || "",
    customer_country: customer.country || customer.region || "",
    billing_address: customer.billing_address,
    shipping_address: customer.shipping_address || customer.delivery_address || "",
    currency: order.currency || settings.default_currency,
    date_of_issue: dateOfIssue,
    due_date: addDays(dateOfIssue, paymentDays),
    payment_terms: customer.payment_terms || `${paymentDays} days`,
    subtotal_net: subtotalNet,
    vat_rate: vatRate,
    vat_amount: vatAmount,
    total_gross: totalGross,
    reverse_charge_applied: reverseCharge,
    smv_note_applied: buildSmvNotes(invoiceItems).length > 0,
    smv_notes: buildSmvNotes(invoiceItems),
    payment_status: "UNPAID",
    pdf_url: `${invoiceNo}_${String(customer.customer_name || "customer").replace(/[^\w-]+/g, "-")}.pdf`,
    created_by: operator.id,
    created_at: now(),
    updated_at: now(),
    cancelled_at: "",
    cancelled_reason: "",
  };
  invoicesRepo.insert(invoice);
  invoiceItems.forEach((item) => invoiceItemsRepo.insert(item));
  ordersRepo.update(order.id, { ...order, invoice_status: invoiceType === "PROFORMA_INVOICE" ? "PI_GENERATED" : "COMMERCIAL_GENERATED", updated_at: now() });
  writeLog({ businessType: "INVOICE", targetId: invoice.id, actionType: invoiceType === "COMMERCIAL_INVOICE" ? "CREATE_COMMERCIAL_INVOICE" : invoiceType === "CREDIT_NOTE" ? "CREATE_CREDIT_NOTE" : "CREATE_INVOICE", beforeData: null, afterData: invoice, operator });
  return { invoice, items: invoiceItems };
}

function listInvoices(query = {}) {
  return invoicesRepo
    .list()
    .filter((invoice) => !query.customer_id || invoice.customer_id === query.customer_id)
    .map((invoice) => ({ ...invoice, items: invoiceItemsRepo.filter((item) => item.invoice_id === invoice.id) }))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

function updatePaymentStatus({ invoiceId, paymentStatus, operatorId }) {
  const operator = getOperator(operatorId);
  assertInvoicePermission(operator, "PAYMENT");
  const invoice = invoicesRepo.getById(invoiceId);
  if (!invoice) throw new Error("发票不存在。");
  const nextInvoice = { ...invoice, payment_status: paymentStatus, invoice_status: paymentStatus === "PAID" ? "PAID" : invoice.invoice_status, updated_at: now() };
  invoicesRepo.update(invoice.id, nextInvoice);
  const order = ordersRepo.getById(invoice.order_id);
  if (order && ["PAID", "CREDIT_TERM_CONFIRMED"].includes(paymentStatus)) {
    ordersRepo.update(order.id, { ...order, order_status: "PAYMENT_CONFIRMED", updated_at: now() });
  }
  writeLog({ businessType: "INVOICE", targetId: invoice.id, actionType: paymentStatus === "CREDIT_TERM_CONFIRMED" ? "CONFIRM_CREDIT_TERM" : "MARK_INVOICE_PAID", beforeData: invoice, afterData: nextInvoice, operator });
  return invoicesRepo.getById(invoice.id);
}

function cancelInvoice({ invoiceId, reason, operatorId }) {
  const operator = getOperator(operatorId);
  assertInvoicePermission(operator, "CANCEL");
  const invoice = invoicesRepo.getById(invoiceId);
  if (!invoice) throw new Error("发票不存在。");
  const nextInvoice = { ...invoice, invoice_status: "CANCELLED", cancelled_reason: String(reason || "").trim(), cancelled_at: now(), updated_at: now() };
  invoicesRepo.update(invoice.id, nextInvoice);
  writeLog({ businessType: "INVOICE", targetId: invoice.id, actionType: "CANCEL_INVOICE", beforeData: invoice, afterData: nextInvoice, operator });
  return nextInvoice;
}

module.exports = {
  getSettings,
  createInvoice,
  listInvoices,
  updatePaymentStatus,
  cancelInvoice,
};
