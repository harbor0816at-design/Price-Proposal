const createRepository = require("./base-repository");

module.exports = {
  usersRepo: createRepository("users"),
  customersRepo: createRepository("customers"),
  productsRepo: createRepository("products"),
  formulasRepo: createRepository("formulas"),
  quotesRepo: createRepository("quotes"),
  orderQuotationsRepo: createRepository("orderQuotations"),
  customerCartsRepo: createRepository("customerCarts"),
  ordersRepo: createRepository("orders"),
  orderItemsRepo: createRepository("orderItems"),
  inventoryRepo: createRepository("inventory"),
  inventoryLocksRepo: createRepository("inventoryLocks"),
  invoicesRepo: createRepository("invoices"),
  invoiceItemsRepo: createRepository("invoiceItems"),
  invoiceSettingsRepo: createRepository("invoiceSettings"),
  shipmentsRepo: createRepository("shipments"),
  approvalsRepo: createRepository("quoteApprovals"),
  approvalNodesRepo: createRepository("quoteApprovalNodes"),
  logsRepo: createRepository("priceChangeLogs"),
};
