const createRepository = require("./base-repository");

module.exports = {
  usersRepo: createRepository("users"),
  customersRepo: createRepository("customers"),
  productsRepo: createRepository("products"),
  formulasRepo: createRepository("formulas"),
  quotesRepo: createRepository("quotes"),
  approvalsRepo: createRepository("quoteApprovals"),
  approvalNodesRepo: createRepository("quoteApprovalNodes"),
  logsRepo: createRepository("priceChangeLogs"),
};
