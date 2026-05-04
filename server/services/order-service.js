const {
  customersRepo,
  productsRepo,
  usersRepo,
  orderQuotationsRepo,
  ordersRepo,
  orderItemsRepo,
  inventoryRepo,
  inventoryLocksRepo,
  approvalsRepo,
  approvalNodesRepo,
} = require("../repositories");
const { buildId, buildBusinessNo } = require("./id-service");
const { writeLog } = require("./log-service");
const pricingEngine = require("./pricing-engine-service");

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

function getCustomerAccount(operatorId) {
  const operator = getOperator(operatorId);
  if (String(operator.account_type || "").toUpperCase() !== "CUSTOMER") {
    throw new Error("当前账号不是客户门户账号。");
  }
  if (!operator.portal_enabled || !operator.linked_customer_id) {
    throw new Error("客户门户账号未启用或未绑定客户。");
  }
  const customer = customersRepo.getById(operator.linked_customer_id);
  if (!customer || !customer.portal_enabled) {
    throw new Error("绑定客户不存在或门户未启用。");
  }
  return { operator, customer };
}

function assertCanSubmit(operator) {
  if (!["CUSTOMER_ADMIN", "CUSTOMER_BUYER"].includes(operator.role)) {
    throw new Error("当前客户角色不能提交订单。");
  }
}

function recalculateInventory(inventory) {
  const next = {
    ...inventory,
    total_stock: Math.max(0, Math.floor(toNumber(inventory.total_stock, 0))),
    reserved_stock: Math.max(0, Math.floor(toNumber(inventory.reserved_stock, 0))),
    locked_stock: Math.max(0, Math.floor(toNumber(inventory.locked_stock, 0))),
    safety_stock: Math.max(0, Math.floor(toNumber(inventory.safety_stock, 0))),
    updated_at: now(),
  };
  next.available_stock = Math.max(0, next.total_stock - next.reserved_stock - next.locked_stock - next.safety_stock);
  return next;
}

function getInventoryForProduct(productId) {
  const product = productsRepo.getById(productId);
  return inventoryRepo.findOne((item) => item.product_id === productId) || inventoryRepo.findOne((item) => item.sku === product?.sku) || null;
}

function listPortalProducts(operatorId) {
  const { customer } = getCustomerAccount(operatorId);
  return productsRepo
    .list()
    .filter((product) => {
      const salesStatus = String(product.sales_status || product.status || "").toUpperCase();
      return product.is_sellable !== false && product.available_for_portal !== false && ["ACTIVE", "CLEARANCE"].includes(salesStatus);
    })
    .map((product) => {
      const price = pricingEngine.previewCustomerPrice(customer.id, product.id, product.min_order_quantity || 1);
      const inventory = getInventoryForProduct(product.id);
      const availableStock = inventory ? recalculateInventory(inventory).available_stock : 0;
      return {
        id: product.id,
        sku: product.sku,
        product_name: product.product_name,
        product_series: product.product_series,
        variant: product.variant,
        min_order_quantity: price.min_order_quantity,
        unit_price: price.unit_price,
        currency: price.currency,
        vat_rate: price.vat_rate,
        available_stock: availableStock,
        stock_label: String(customer.customer_level || "").toUpperCase() === "A" ? `${availableStock} pcs` : availableStock <= 0 ? "Out of Stock" : availableStock <= 10 ? "Limited Stock" : "In Stock",
      };
    });
}

function createQuotation(customer, pricedItems, source) {
  const quotation = {
    id: buildId("quotation"),
    quotation_no: buildBusinessNo("OQT"),
    quotation_status: "DRAFT",
    customer_id: customer.id,
    source,
    valid_until: pricedItems[0]?.valid_until || "",
    converted_order_id: "",
    locked_at: "",
    locked_by: "",
    price_snapshot_json: {
      customer_id: customer.id,
      customer_name: customer.customer_name,
      items: pricedItems.map((item) => item.price_snapshot_json),
    },
    created_at: now(),
    updated_at: now(),
  };
  orderQuotationsRepo.insert(quotation);
  return quotation;
}

function lockQuotation(quotationId, orderId, operator) {
  return orderQuotationsRepo.update(quotationId, (quotation) => ({
    ...quotation,
    quotation_status: "LOCKED",
    converted_order_id: orderId,
    locked_at: now(),
    locked_by: operator.id,
    updated_at: now(),
  }))?.current;
}

function buildApprovalForOrder(order, customer, operator) {
  const primaryAdmin = usersRepo.findOne((item) => item.role === "SYSTEM_ADMIN");
  const salesManager = usersRepo.getById(customer.default_approver_id) || usersRepo.findOne((item) => item.role === "SALES_MANAGER") || primaryAdmin;
  const financeHead = usersRepo.findOne((item) => item.role === "FINANCE_HEAD") || primaryAdmin;
  const approvalId = buildId("approval");
  const flow = [salesManager, financeHead].filter(Boolean);
  const nodes = flow.map((approver, index) => ({
    id: buildId("approval_node"),
    approval_id: approvalId,
    node_order: index + 1,
    node_name: index === 0 ? "订单负责人审批" : "财务信用审批",
    approver_id: approver.id,
    approver_name: approver.display_name,
    approval_status: index === 0 ? "IN_PROGRESS" : "PENDING",
    approval_comment: "",
    approved_at: "",
  }));
  const approval = {
    id: approvalId,
    approval_no: buildBusinessNo("APR"),
    scope: "order",
    order_id: order.id,
    quote_id: "",
    approval_type: "ORDER_APPROVAL",
    current_node: 1,
    approver_id: nodes[0]?.approver_id || "",
    approver_name: nodes[0]?.approver_name || "",
    approval_status: "IN_PROGRESS",
    approval_comment: "",
    initiated_by: operator.id,
    initiated_at: now(),
    approved_at: "",
    created_at: now(),
    updated_at: now(),
  };
  approvalsRepo.insert(approval);
  approvalNodesRepo.replaceAll([...approvalNodesRepo.list(), ...nodes]);
  return { approval, nodes };
}

function lockInventory(order, orderItem) {
  const inventory = getInventoryForProduct(orderItem.product_id);
  if (!inventory) {
    throw new Error(`${orderItem.sku} 未配置库存。`);
  }
  const normalized = recalculateInventory(inventory);
  if (normalized.available_stock < orderItem.quantity) {
    throw new Error(`${orderItem.sku} 可销售库存不足。`);
  }
  const lock = {
    id: buildId("inventory_lock"),
    order_id: order.id,
    order_item_id: orderItem.id,
    sku: orderItem.sku,
    quantity: orderItem.quantity,
    lock_status: "RESERVED",
    locked_at: now(),
    released_at: "",
  };
  inventoryLocksRepo.insert(lock);
  inventoryRepo.update(inventory.id, (item) => recalculateInventory({ ...item, reserved_stock: toNumber(item.reserved_stock, 0) + orderItem.quantity }));
  return lock;
}

function createOrderFromCart({ operatorId, items }) {
  const { operator, customer } = getCustomerAccount(operatorId);
  assertCanSubmit(operator);
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("购物车为空。");
  }
  const pricedItems = items.map((item) => {
    const product = productsRepo.getById(item.product_id);
    if (!product) {
      throw new Error("产品不存在。");
    }
    const price = pricingEngine.getCustomerPrice(customer.id, product.id, item.quantity);
    const inventory = getInventoryForProduct(product.id);
    const availableStock = inventory ? recalculateInventory(inventory).available_stock : 0;
    if (availableStock < price.quantity) {
      throw new Error(`${product.sku} 可销售库存不足。`);
    }
    return {
      product,
      quantity: price.quantity,
      unit_price: price.unit_price,
      vat_rate: price.vat_rate,
      subtotal: roundMoney(price.unit_price * price.quantity),
      currency: price.currency,
      formula_version_snapshot: price.formula_version,
      price_snapshot_json: price.price_snapshot_json,
      valid_until: price.valid_until,
    };
  });
  const quotation = createQuotation(customer, pricedItems, "CUSTOMER_PORTAL");
  const subtotal = roundMoney(pricedItems.reduce((sum, item) => sum + item.subtotal, 0));
  const vatAmount = roundMoney(pricedItems.reduce((sum, item) => sum + item.subtotal * item.vat_rate, 0));
  const order = {
    id: buildId("order"),
    order_no: buildBusinessNo("ORD"),
    customer_id: customer.id,
    quotation_id: quotation.id,
    order_status: "PENDING_APPROVAL",
    approval_status: "IN_PROGRESS",
    invoice_status: "NOT_GENERATED",
    shipment_status: "PENDING",
    subtotal,
    vat_amount: vatAmount,
    total_amount: roundMoney(subtotal + vatAmount),
    currency: pricedItems[0]?.currency || customer.default_currency || "EUR",
    payment_terms: customer.payment_terms || "PREPAID",
    shipping_address: customer.delivery_address || customer.shipping_address || "",
    billing_address: customer.billing_address || "",
    created_by: operator.id,
    created_at: now(),
    approved_by: "",
    approved_at: "",
    rejected_reason: "",
  };
  ordersRepo.insert(order);
  const lockedQuotation = lockQuotation(quotation.id, order.id, operator) || quotation;
  const orderItems = pricedItems.map((item) => {
    const orderItem = {
      id: buildId("order_item"),
      order_id: order.id,
      product_id: item.product.id,
      sku: item.product.sku,
      product_name: item.product.product_name,
      quantity: item.quantity,
      unit: "PCS",
      unit_price_snapshot: item.unit_price,
      vat_rate_snapshot: item.vat_rate,
      subtotal: item.subtotal,
      formula_version_snapshot: item.formula_version_snapshot,
      quotation_id: quotation.id,
      price_snapshot_json: item.price_snapshot_json,
      inventory_lock_id: "",
    };
    const lock = lockInventory(order, orderItem);
    orderItem.inventory_lock_id = lock.id;
    orderItemsRepo.insert(orderItem);
    return orderItem;
  });
  const approvalBundle = buildApprovalForOrder(order, customer, operator);
  writeLog({ businessType: "ORDER", targetId: order.id, actionType: "CREATE_ORDER", beforeData: null, afterData: { order, orderItems }, operator });
  return { order, order_items: orderItems, quotation: lockedQuotation, approval: approvalBundle.approval };
}

function listOrders(query = {}) {
  return ordersRepo
    .list()
    .filter((order) => !query.customer_id || order.customer_id === query.customer_id)
    .map((order) => ({
      ...order,
      items: orderItemsRepo.filter((item) => item.order_id === order.id),
      customer: customersRepo.getById(order.customer_id),
    }))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

function promoteInventoryLocks(orderId) {
  inventoryLocksRepo
    .filter((lock) => lock.order_id === orderId && lock.lock_status === "RESERVED")
    .forEach((lock) => {
      const inventory = inventoryRepo.findOne((item) => item.sku === lock.sku);
      if (inventory) {
        inventoryRepo.update(inventory.id, (item) =>
          recalculateInventory({
            ...item,
            reserved_stock: Math.max(0, toNumber(item.reserved_stock, 0) - lock.quantity),
            locked_stock: toNumber(item.locked_stock, 0) + lock.quantity,
          })
        );
      }
      inventoryLocksRepo.update(lock.id, { ...lock, lock_status: "LOCKED" });
    });
}

function releaseInventoryLocks(orderId) {
  inventoryLocksRepo
    .filter((lock) => lock.order_id === orderId && ["RESERVED", "LOCKED"].includes(lock.lock_status))
    .forEach((lock) => {
      const inventory = inventoryRepo.findOne((item) => item.sku === lock.sku);
      if (inventory) {
        inventoryRepo.update(inventory.id, (item) =>
          recalculateInventory({
            ...item,
            reserved_stock: lock.lock_status === "RESERVED" ? Math.max(0, toNumber(item.reserved_stock, 0) - lock.quantity) : item.reserved_stock,
            locked_stock: lock.lock_status === "LOCKED" ? Math.max(0, toNumber(item.locked_stock, 0) - lock.quantity) : item.locked_stock,
          })
        );
      }
      inventoryLocksRepo.update(lock.id, { ...lock, lock_status: "RELEASED", released_at: now() });
    });
}

function processOrderApproval({ approvalId, operatorId, action, comment = "" }) {
  const operator = getOperator(operatorId);
  const approval = approvalsRepo.getById(approvalId);
  if (!approval || approval.scope !== "order") {
    throw new Error("订单审批单不存在。");
  }
  if (approval.approval_status !== "IN_PROGRESS") {
    throw new Error("当前审批单不可处理。");
  }
  if (approval.approver_id && approval.approver_id !== operator.id && operator.role !== "SYSTEM_ADMIN") {
    throw new Error("当前用户不是本节点审批人。");
  }
  const order = ordersRepo.getById(approval.order_id);
  if (!order) {
    throw new Error("订单不存在。");
  }
  const nodes = approvalNodesRepo.filter((node) => node.approval_id === approval.id).sort((a, b) => a.node_order - b.node_order);
  const currentNode = nodes.find((node) => node.node_order === approval.current_node);
  if (!currentNode) {
    throw new Error("当前审批节点不存在。");
  }
  const approvalTime = now();
  if (action === "reject") {
    approvalNodesRepo.update(currentNode.id, { ...currentNode, approval_status: "REJECTED", approval_comment: comment, approved_at: approvalTime });
    approvalsRepo.update(approval.id, { ...approval, approval_status: "REJECTED", approval_comment: comment, updated_at: approvalTime });
    ordersRepo.update(order.id, { ...order, order_status: "REJECTED", approval_status: "REJECTED", rejected_reason: comment, updated_at: approvalTime });
    releaseInventoryLocks(order.id);
    writeLog({ businessType: "ORDER_APPROVAL", targetId: order.id, actionType: "REJECT_ORDER", beforeData: order, afterData: { order_status: "REJECTED" }, operator });
    return { approval: approvalsRepo.getById(approval.id), order: ordersRepo.getById(order.id) };
  }
  approvalNodesRepo.update(currentNode.id, { ...currentNode, approval_status: "APPROVED", approval_comment: comment, approved_at: approvalTime });
  const nextNode = nodes.find((node) => node.node_order === approval.current_node + 1);
  if (nextNode) {
    approvalNodesRepo.update(nextNode.id, { ...nextNode, approval_status: "IN_PROGRESS" });
    approvalsRepo.update(approval.id, { ...approval, current_node: nextNode.node_order, approver_id: nextNode.approver_id, approver_name: nextNode.approver_name, updated_at: approvalTime });
  } else {
    approvalsRepo.update(approval.id, { ...approval, approval_status: "APPROVED", approval_comment: comment, approved_at: approvalTime, updated_at: approvalTime });
    ordersRepo.update(order.id, { ...order, order_status: "APPROVED", approval_status: "APPROVED", approved_by: operator.id, approved_at: approvalTime, updated_at: approvalTime });
    promoteInventoryLocks(order.id);
    writeLog({ businessType: "ORDER_APPROVAL", targetId: order.id, actionType: "APPROVE_ORDER", beforeData: order, afterData: { order_status: "APPROVED" }, operator });
  }
  return { approval: approvalsRepo.getById(approval.id), order: ordersRepo.getById(order.id) };
}

module.exports = {
  listPortalProducts,
  createOrderFromCart,
  listOrders,
  processOrderApproval,
};
