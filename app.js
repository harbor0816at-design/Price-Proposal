(function () {
  const STORAGE_KEY = "customer_quote_management_web_v1";
  const SESSION_KEY = "customer_quote_management_web_session_v1";
  const WORKFLOW_CLEANUP_KEY = "customer_quote_management_workflow_cleanup_v2";
  const WORKFLOW_CLEANUP_VERSION = "2026-04-19-clean-request-and-workflow";
  const IMPORT_TEMPLATE_HEADERS = [
    "customer_name",
    "customer_code",
    "sku",
    "effective_month",
    "rrp",
    "db_rate",
    "customer_margin",
    "service_fee",
    "mkt_funding",
    "stk_buffer",
    "front_margin",
    "vat",
    "ura",
    "formula_code",
    "remark",
  ];
  const QUOTE_WARNING_THRESHOLD = 0.05;
  const DEFAULT_FORMULA_EXPRESSION = "((MSRP / (1 + VAT)) * (1 - FrontMargin) * (1 - DB - CustomerMargin - ServiceFee - MKTFundingRate)) - STKbuffer";
  const CUSTOMER_QUOTE_SHEET_VERSION = 1;
  const TEMP_ACCOUNT_PASSWORD = "Welcome@123";
  const PRIMARY_ADMIN_ID = "u_admin_01";
  const PRIMARY_ADMIN_USER_NAME = "harbor";
  const PRIMARY_ADMIN_PASSWORD = "harbor123";
  const PRIMARY_ADMIN_DISPLAY_NAME = "Harbor";
  const LEGACY_SEED_USER_IDS = new Set(["u_sales_01", "u_mgr_01", "u_business_01", "u_finance_01"]);
  const LEGACY_SEED_USER_NAMES = new Set(["li.sales", "wang.manager", "zhou.business", "liu.finance", "sun.admin"]);
  const INITIAL_DATA_MARKERS = ["审批中心初始化", "系统初始化", "INIT_APPROVAL_CENTER", "INIT_LOG"];
  const ADMIN_PAGE_IDS = ["quoteQueryPage", "quoteCreatePage", "importPage", "formulaPage", "productPage", "customerPage", "approvalPage", "accountPage", "logPage"];
  const ADMIN_ROLES = new Set(["BUSINESS_HEAD", "FINANCE_HEAD", "SYSTEM_ADMIN"]);
  const CORE_PERMISSION_KEYS = {
    CREATE_CUSTOMER: "create_customer",
    CREATE_PRODUCT: "create_product",
    VIEW_FOB: "view_fob",
    VIEW_GROSS_MARGIN: "view_gross_margin",
    VIEW_GROSS_PROFIT: "view_gross_profit",
  };
  const i18n = window.customerQuoteI18n || null;
  const PAGE_ACCESS_MAP = {
    SALES_ENTRY: ["quoteQueryPage", "quoteCreatePage", "importPage", "customerPage"],
    SALES_MANAGER: ["quoteQueryPage", "customerPage", "approvalPage"],
    BUSINESS_HEAD: ADMIN_PAGE_IDS,
    FINANCE_HEAD: ADMIN_PAGE_IDS,
    SYSTEM_ADMIN: ADMIN_PAGE_IDS,
  };

  const state = {
    data: null,
    ui: {
      currentPage: "quoteCreatePage",
      activeQuoteId: "",
      editingFormulaId: "",
      editingProductId: "",
      editingCustomerId: "",
      quotePreview: null,
      filteredQuotes: [],
      importPreviewRows: [],
      selectedOperatorId: "",
      detailNotice: null,
      activeCustomerRequestId: "",
      logsPageCollapsed: false,
      logFilters: {
        actionType: "",
        targetKeyword: "",
        operatorName: "",
        dateFrom: "",
        dateTo: "",
      },
      expandedLogIds: [],
    },
  };

  const dom = {};

  init();

  function tr(text) {
    return i18n?.tr ? i18n.tr(text) : String(text == null ? "" : text);
  }

  function tt(key, vars) {
    return i18n?.t ? i18n.t(key, vars) : String(key || "");
  }

  function syncLanguage() {
    i18n?.refresh?.();
  }

  function getNumberLocale() {
    return i18n?.getNumberLocale?.() || "zh-CN";
  }

  function getDateLocale() {
    return i18n?.getDateLocale?.() || "zh-CN";
  }

  function getCurrentLanguage() {
    return i18n?.getLanguage?.() || "zh";
  }

  function init() {
    cacheDom();
    loadData();
    loadSession();
    bindEvents();
    seedDemoIfNeeded();
    ensureApprovedCustomerQuoteSheets();
    ensureInitialSelections();
    renderAll();
  }

  function cacheDom() {
    dom.loginShell = document.getElementById("loginShell");
    dom.appShell = document.getElementById("appShell");
    dom.loginUserName = document.getElementById("loginUserName");
    dom.loginPassword = document.getElementById("loginPassword");
    dom.loginBtn = document.getElementById("loginBtn");
    dom.loginAlert = document.getElementById("loginAlert");
    dom.requestDisplayName = document.getElementById("requestDisplayName");
    dom.requestUserName = document.getElementById("requestUserName");
    dom.requestPassword = document.getElementById("requestPassword");
    dom.requestTeam = document.getElementById("requestTeam");
    dom.requestReason = document.getElementById("requestReason");
    dom.submitAccountRequestBtn = document.getElementById("submitAccountRequestBtn");
    dom.accountRequestAlert = document.getElementById("accountRequestAlert");

    dom.navButtons = Array.from(document.querySelectorAll(".nav-item[data-page-target]"));
    dom.pageSections = Array.from(document.querySelectorAll(".page-section"));
    dom.pageTitle = document.getElementById("pageTitle");
    dom.permissionIsolationHint = document.getElementById("permissionIsolationHint");
    dom.currentAccountName = document.getElementById("currentAccountName");
    dom.currentAccountMeta = document.getElementById("currentAccountMeta");
    dom.logoutBtn = document.getElementById("logoutBtn");
    dom.refreshAllBtn = document.getElementById("refreshAllBtn");

    dom.quoteQueryForm = document.getElementById("quoteQueryForm");
    dom.queryBatchKeywords = document.getElementById("queryBatchKeywords");
    dom.queryCustomerName = document.getElementById("queryCustomerName");
    dom.queryCustomerCode = document.getElementById("queryCustomerCode");
    dom.querySku = document.getElementById("querySku");
    dom.queryProductName = document.getElementById("queryProductName");
    dom.queryProductSeries = document.getElementById("queryProductSeries");
    dom.queryEffectiveMonth = document.getElementById("queryEffectiveMonth");
    dom.queryQuoteStatus = document.getElementById("queryQuoteStatus");
    dom.queryApprovalStatus = document.getElementById("queryApprovalStatus");
    dom.queryFormulaVersion = document.getElementById("queryFormulaVersion");
    dom.queryQuotesBtn = document.getElementById("queryQuotesBtn");
    dom.downloadQuotesPriceSheetBtn = document.getElementById("downloadQuotesPriceSheetBtn");
    dom.exportQuotesBtn = document.getElementById("exportQuotesBtn");
    dom.quoteQueryAlert = document.getElementById("quoteQueryAlert");
    dom.quotesSummary = document.getElementById("quotesSummary");
    dom.quotesTableBody = document.querySelector("#quotesTable tbody");
    dom.quoteDetailPanel = document.getElementById("quoteDetailPanel");
    dom.quoteDetailContent = document.getElementById("quoteDetailContent");

    dom.quoteCustomerId = document.getElementById("quoteCustomerId");
    dom.quoteProductId = document.getElementById("quoteProductId");
    dom.quoteFormulaId = document.getElementById("quoteFormulaId");
    dom.quoteEffectiveMonth = document.getElementById("quoteEffectiveMonth");
    dom.quoteMsrp = document.getElementById("quoteMsrp");
    dom.quoteCostPrice = document.getElementById("quoteCostPrice");
    dom.quoteDbRate = document.getElementById("quoteDbRate");
    dom.quoteCustomerMargin = document.getElementById("quoteCustomerMargin");
    dom.quoteServiceFee = document.getElementById("quoteServiceFee");
    dom.quoteMktFunding = document.getElementById("quoteMktFunding");
    dom.quoteMktFundingRate = document.getElementById("quoteMktFundingRate");
    dom.quoteStkBuffer = document.getElementById("quoteStkBuffer");
    dom.quoteFrontMargin = document.getElementById("quoteFrontMargin");
    dom.quoteVat = document.getElementById("quoteVat");
    dom.quoteUra = document.getElementById("quoteUra");
    dom.quoteRemark = document.getElementById("quoteRemark");
    dom.previewQuoteBtn = document.getElementById("previewQuoteBtn");
    dom.createQuoteBtn = document.getElementById("createQuoteBtn");
    dom.createQuotesByProductBtn = document.getElementById("createQuotesByProductBtn");
    dom.createQuotesByCustomerBtn = document.getElementById("createQuotesByCustomerBtn");
    dom.quoteCreateAlert = document.getElementById("quoteCreateAlert");
    dom.quoteCalcSummary = document.getElementById("quoteCalcSummary");
    dom.quoteCalcStepsTableBody = document.querySelector("#quoteCalcStepsTable tbody");

    dom.downloadQuoteTemplateBtn = document.getElementById("downloadQuoteTemplateBtn");
    dom.autoCreateCustomerDraft = document.getElementById("autoCreateCustomerDraft");
    dom.autoCreateProductDraft = document.getElementById("autoCreateProductDraft");
    dom.quoteImportFile = document.getElementById("quoteImportFile");
    dom.previewImportBtn = document.getElementById("previewImportBtn");
    dom.confirmImportBtn = document.getElementById("confirmImportBtn");
    dom.importSummary = document.getElementById("importSummary");
    dom.importPreviewTableBody = document.querySelector("#importPreviewTable tbody");

    dom.formulaEditId = document.getElementById("formulaEditId");
    dom.formulaName = document.getElementById("formulaName");
    dom.formulaCode = document.getElementById("formulaCode");
    dom.formulaVersion = document.getElementById("formulaVersion");
    dom.formulaCustomerType = document.getElementById("formulaCustomerType");
    dom.formulaProductSeries = document.getElementById("formulaProductSeries");
    dom.formulaChannelType = document.getElementById("formulaChannelType");
    dom.formulaExpression = document.getElementById("formulaExpression");
    dom.formulaAllowBelowCost = document.getElementById("formulaAllowBelowCost");
    dom.formulaStatus = document.getElementById("formulaStatus");
    dom.formulaRemark = document.getElementById("formulaRemark");
    dom.formulaFormAlert = document.getElementById("formulaFormAlert");
    dom.saveFormulaBtn = document.getElementById("saveFormulaBtn");
    dom.resetFormulaBtn = document.getElementById("resetFormulaBtn");
    dom.trialMsrp = document.getElementById("trialMsrp");
    dom.trialCost = document.getElementById("trialCost");
    dom.trialDbRate = document.getElementById("trialDbRate");
    dom.trialCustomerMargin = document.getElementById("trialCustomerMargin");
    dom.trialServiceFee = document.getElementById("trialServiceFee");
    dom.trialMktFunding = document.getElementById("trialMktFunding");
    dom.trialMktFundingRate = document.getElementById("trialMktFundingRate");
    dom.trialStkBuffer = document.getElementById("trialStkBuffer");
    dom.trialFrontMargin = document.getElementById("trialFrontMargin");
    dom.trialVat = document.getElementById("trialVat");
    dom.trialUra = document.getElementById("trialUra");
    dom.tryFormulaBtn = document.getElementById("tryFormulaBtn");
    dom.formulaTrialResult = document.getElementById("formulaTrialResult");
    dom.formulasTableBody = document.querySelector("#formulasTable tbody");

    dom.productEditId = document.getElementById("productEditId");
    dom.productName = document.getElementById("productName");
    dom.productSku = document.getElementById("productSku");
    dom.productSeries = document.getElementById("productSeries");
    dom.productModel = document.getElementById("productModel");
    dom.productVariant = document.getElementById("productVariant");
    dom.productLaunchDate = document.getElementById("productLaunchDate");
    dom.productDefaultMsrp = document.getElementById("productDefaultMsrp");
    dom.productDefaultCost = document.getElementById("productDefaultCost");
    dom.productFormulaId = document.getElementById("productFormulaId");
    dom.productRemark = document.getElementById("productRemark");
    dom.productFormAlert = document.getElementById("productFormAlert");
    dom.saveProductBtn = document.getElementById("saveProductBtn");
    dom.resetProductBtn = document.getElementById("resetProductBtn");
    dom.productsTableBody = document.querySelector("#productsTable tbody");

    dom.customerEditId = document.getElementById("customerEditId");
    dom.customerRequestId = document.getElementById("customerRequestId");
    dom.customerBaseCustomerLabel = document.getElementById("customerBaseCustomerLabel");
    dom.customerBaseCustomerId = document.getElementById("customerBaseCustomerId");
    dom.customerPanelTitle = document.getElementById("customerPanelTitle");
    dom.customerPageHint = document.getElementById("customerPageHint");
    dom.customerTableTitle = document.getElementById("customerTableTitle");
    dom.customerName = document.getElementById("customerName");
    dom.customerCode = document.getElementById("customerCode");
    dom.customerFormalDate = document.getElementById("customerFormalDate");
    dom.customerLevel = document.getElementById("customerLevel");
    dom.customerType = document.getElementById("customerType");
    dom.customerChannelType = document.getElementById("customerChannelType");
    dom.customerRegion = document.getElementById("customerRegion");
    dom.customerDbRate = document.getElementById("customerDbRate");
    dom.customerCustomerMargin = document.getElementById("customerCustomerMargin");
    dom.customerServiceFee = document.getElementById("customerServiceFee");
    dom.customerMktFunding = document.getElementById("customerMktFunding");
    dom.customerStkBuffer = document.getElementById("customerStkBuffer");
    dom.customerFrontMargin = document.getElementById("customerFrontMargin");
    dom.customerVat = document.getElementById("customerVat");
    dom.customerUra = document.getElementById("customerUra");
    dom.customerApproverId = document.getElementById("customerApproverId");
    dom.customerRemark = document.getElementById("customerRemark");
    dom.saveCustomerBtn = document.getElementById("saveCustomerBtn");
    dom.resetCustomerBtn = document.getElementById("resetCustomerBtn");
    dom.customerFormAlert = document.getElementById("customerFormAlert");
    dom.customerRequestsWrap = document.getElementById("customerRequestsWrap");
    dom.customersMasterWrap = document.getElementById("customersMasterWrap");
    dom.customerRequestsTableBody = document.querySelector("#customerRequestsTable tbody");
    dom.customersTableBody = document.querySelector("#customersTable tbody");

    dom.approvalsTableBody = document.querySelector("#approvalsTable tbody");

    dom.accountEditId = document.getElementById("accountEditId");
    dom.accountDisplayName = document.getElementById("accountDisplayName");
    dom.accountUserName = document.getElementById("accountUserName");
    dom.accountRole = document.getElementById("accountRole");
    dom.accountTeam = document.getElementById("accountTeam");
    dom.accountPosition = document.getElementById("accountPosition");
    dom.accountPassword = document.getElementById("accountPassword");
    dom.accountStatus = document.getElementById("accountStatus");
    dom.accountPermCreateCustomer = document.getElementById("accountPermCreateCustomer");
    dom.accountPermCreateProduct = document.getElementById("accountPermCreateProduct");
    dom.accountPermViewFob = document.getElementById("accountPermViewFob");
    dom.accountPermViewGrossMargin = document.getElementById("accountPermViewGrossMargin");
    dom.accountPermViewGrossProfit = document.getElementById("accountPermViewGrossProfit");
    dom.accountRemark = document.getElementById("accountRemark");
    dom.saveAccountBtn = document.getElementById("saveAccountBtn");
    dom.resetAccountBtn = document.getElementById("resetAccountBtn");
    dom.accountFormAlert = document.getElementById("accountFormAlert");
    dom.accountRequestsTableBody = document.querySelector("#accountRequestsTable tbody");
    dom.accountsTableBody = document.querySelector("#accountsTable tbody");

    dom.logsFilterForm = document.getElementById("logsFilterForm");
    dom.logActionType = document.getElementById("logActionType");
    dom.logTargetKeyword = document.getElementById("logTargetKeyword");
    dom.logOperatorName = document.getElementById("logOperatorName");
    dom.logDateFrom = document.getElementById("logDateFrom");
    dom.logDateTo = document.getElementById("logDateTo");
    dom.queryLogsBtn = document.getElementById("queryLogsBtn");
    dom.resetLogsBtn = document.getElementById("resetLogsBtn");
    dom.toggleLogsPageBtn = document.getElementById("toggleLogsPageBtn");
    dom.logsPageContent = document.getElementById("logsPageContent");
    dom.logsSummary = document.getElementById("logsSummary");
    dom.logsTableBody = document.querySelector("#logsTable tbody");
  }

  function bindEvents() {
    window.addEventListener("customer-quote-language-change", () => {
      renderAll();
      if (!isAuthenticated()) {
        syncLanguage();
      }
    });

    dom.navButtons.forEach((button) => {
      button.addEventListener("click", () => switchPage(String(button.dataset.pageTarget || "quoteQueryPage")));
    });

    dom.loginBtn?.addEventListener("click", onLogin);
    dom.logoutBtn?.addEventListener("click", logout);
    dom.submitAccountRequestBtn?.addEventListener("click", onSubmitAccountRequest);
    dom.refreshAllBtn?.addEventListener("click", renderAll);

    dom.quoteQueryForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      renderQuotesPage();
    });
    dom.queryQuotesBtn?.addEventListener("click", renderQuotesPage);
    dom.downloadQuotesPriceSheetBtn?.addEventListener("click", downloadCurrentQuotesPriceSheet);
    dom.exportQuotesBtn?.addEventListener("click", exportCurrentQuotes);
    dom.quotesTableBody?.addEventListener("click", onQuotesTableAction);
    dom.quoteDetailContent?.addEventListener("click", onQuoteDetailAction);

    dom.quoteCustomerId?.addEventListener("change", syncCreateFormDefaults);
    dom.quoteProductId?.addEventListener("change", syncCreateFormDefaults);
    dom.quoteFormulaId?.addEventListener("change", () => renderQuotePreview(calculateCurrentQuotePreview()));
    [
      dom.quoteEffectiveMonth,
      dom.quoteMsrp,
      dom.quoteCostPrice,
      dom.quoteDbRate,
      dom.quoteCustomerMargin,
      dom.quoteServiceFee,
      dom.quoteMktFunding,
      dom.quoteStkBuffer,
      dom.quoteFrontMargin,
      dom.quoteVat,
      dom.quoteUra,
      dom.quoteRemark,
    ].forEach((element) => {
      element?.addEventListener("input", () => {
        syncQuoteMktFundingRate();
        renderQuotePreview(calculateCurrentQuotePreview());
      });
      element?.addEventListener("change", () => {
        syncQuoteMktFundingRate();
        renderQuotePreview(calculateCurrentQuotePreview());
      });
    });
    [dom.trialMsrp, dom.trialVat, dom.trialMktFunding].forEach((element) => {
      element?.addEventListener("input", syncTrialMktFundingRate);
      element?.addEventListener("change", syncTrialMktFundingRate);
    });
    dom.previewQuoteBtn?.addEventListener("click", () => renderQuotePreview(calculateCurrentQuotePreview(), true));
    dom.createQuoteBtn?.addEventListener("click", onCreateQuote);
    dom.createQuotesByProductBtn?.addEventListener("click", onCreateQuotesByProduct);
    dom.createQuotesByCustomerBtn?.addEventListener("click", onCreateQuotesByCustomer);

    dom.downloadQuoteTemplateBtn?.addEventListener("click", downloadQuoteTemplate);
    dom.previewImportBtn?.addEventListener("click", onPreviewImport);
    dom.confirmImportBtn?.addEventListener("click", onConfirmImport);

    dom.saveFormulaBtn?.addEventListener("click", onSaveFormula);
    dom.resetFormulaBtn?.addEventListener("click", () => {
      resetFormulaForm();
      setAlert(dom.formulaFormAlert, "", "success");
    });
    dom.tryFormulaBtn?.addEventListener("click", runFormulaTrial);
    dom.formulasTableBody?.addEventListener("click", onFormulaTableAction);

    dom.saveProductBtn?.addEventListener("click", onSaveProduct);
    dom.resetProductBtn?.addEventListener("click", () => {
      resetProductForm();
      setAlert(dom.productFormAlert, "", "success");
    });
    dom.productsTableBody?.addEventListener("click", onProductsTableAction);

    dom.saveCustomerBtn?.addEventListener("click", onSaveCustomer);
    dom.resetCustomerBtn?.addEventListener("click", () => {
      resetCustomerForm();
      setAlert(dom.customerFormAlert, "", "success");
    });
    dom.customerBaseCustomerId?.addEventListener("change", onCustomerBaseChange);
    dom.customerName?.addEventListener("input", () => syncCustomerCodeFromRule());
    dom.customerFormalDate?.addEventListener("input", () => syncCustomerCodeFromRule());
    dom.customerFormalDate?.addEventListener("change", () => syncCustomerCodeFromRule());
    dom.customerRequestsTableBody?.addEventListener("click", onCustomerRequestsTableAction);
    dom.customersTableBody?.addEventListener("click", onCustomersTableAction);

    dom.approvalsTableBody?.addEventListener("click", onApprovalsTableAction);
    dom.saveAccountBtn?.addEventListener("click", onSaveAccount);
    dom.accountRole?.addEventListener("change", onAccountRoleChange);
    dom.resetAccountBtn?.addEventListener("click", () => {
      resetAccountForm();
      setAlert(dom.accountFormAlert, "", "success");
    });
    dom.accountRequestsTableBody?.addEventListener("click", onAccountRequestsTableAction);
    dom.accountsTableBody?.addEventListener("click", onAccountsTableAction);
    dom.logsFilterForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      onQueryLogs();
    });
    dom.queryLogsBtn?.addEventListener("click", onQueryLogs);
    dom.resetLogsBtn?.addEventListener("click", onResetLogs);
    dom.toggleLogsPageBtn?.addEventListener("click", onToggleLogsPage);
    dom.logsTableBody?.addEventListener("click", onLogsTableAction);
  }

  function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      state.data = buildDefaultData();
      persistData();
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      state.data = normalizeData(parsed);
    } catch (error) {
      state.data = buildDefaultData();
      persistData();
    }
  }

  function normalizeAccountName(value) {
    return String(value || "").trim().toLowerCase();
  }

  function buildPrimaryAdministrator(now = nowIso()) {
    return {
      id: PRIMARY_ADMIN_ID,
      user_name: PRIMARY_ADMIN_USER_NAME,
      display_name: PRIMARY_ADMIN_DISPLAY_NAME,
      role: "SYSTEM_ADMIN",
      permissions: buildDefaultPermissionsForRole("SYSTEM_ADMIN"),
      team: "系统管理",
      position: "",
      status: "ACTIVE",
      password: PRIMARY_ADMIN_PASSWORD,
      account_origin: "SYSTEM_SEED",
      approved_by: "system",
      approved_by_name: "系统初始化",
      last_login_at: "",
      remark: "系统预置超级管理员账号",
      created_at: now,
      updated_at: now,
    };
  }

  function isLegacySeedAccount(user) {
    if (!user) {
      return false;
    }
    return (
      String(user.account_origin || "").toUpperCase() === "SYSTEM_SEED" &&
      (LEGACY_SEED_USER_IDS.has(String(user.id || "")) || LEGACY_SEED_USER_NAMES.has(normalizeAccountName(user.user_name)))
    );
  }

  function isPrimaryAdministratorUser(user) {
    return normalizeAccountName(user?.user_name) === PRIMARY_ADMIN_USER_NAME && String(user?.role || "") === "SYSTEM_ADMIN";
  }

  function buildDefaultData() {
    const now = nowIso();
    return {
      users: [buildPrimaryAdministrator(now)],
      customers: [
        {
          id: "cust_001",
          customer_code: "DE-RTL-001",
          customer_name: "德国核心连锁A",
          customer_level: "A",
          customer_type: "RETAIL",
          channel_type: "OFFLINE",
          region: "德国",
          default_db_rate: 0.0334,
          default_customer_margin: 0.124,
          default_service_fee: 0.0012,
          default_mkt_funding: 0,
          default_stk_buffer: 5,
          default_front_margin: 0.005,
          default_vat: 0.2,
          default_ura: 5.5,
          default_approver_id: PRIMARY_ADMIN_ID,
          status: "ACTIVE",
          remark: "重点 KA 客户",
          created_at: now,
          updated_at: now,
        },
        {
          id: "cust_002",
          customer_code: "EU-ECOM-009",
          customer_name: "欧洲电商客户B",
          customer_level: "B",
          customer_type: "ECOM",
          channel_type: "ONLINE",
          region: "欧盟",
          default_db_rate: 0.03,
          default_customer_margin: 0.118,
          default_service_fee: 0.001,
          default_mkt_funding: 0,
          default_stk_buffer: 4,
          default_front_margin: 0.006,
          default_vat: 0.2,
          default_ura: 5,
          default_approver_id: PRIMARY_ADMIN_ID,
          status: "ACTIVE",
          remark: "线上渠道客户",
          created_at: now,
          updated_at: now,
        },
      ],
      products: [
        {
          id: "prod_001",
          sku: "FINDX8-512-BLK",
          product_name: "Find X8",
          product_series: "Find",
          product_model: "X8",
          variant: "12+512G 黑色",
          launch_date: "2026-01-10",
          default_msrp: 899,
          default_cost: 622,
          default_formula_id: "formula_001",
          status: "ACTIVE",
          remark: "旗舰产品",
          created_at: now,
          updated_at: now,
        },
        {
          id: "prod_002",
          sku: "RENO14-256-SLV",
          product_name: "Reno 14",
          product_series: "Reno",
          product_model: "14",
          variant: "12+256G 银色",
          launch_date: "2026-02-18",
          default_msrp: 529,
          default_cost: 364,
          default_formula_id: "formula_001",
          status: "ACTIVE",
          remark: "主销机型",
          created_at: now,
          updated_at: now,
        },
      ],
      formulas: [
        {
          id: "formula_001",
          formula_code: "STD-QUOTE",
          formula_name: "标准直营报价公式",
          formula_version: "v1.0",
          formula_expression: DEFAULT_FORMULA_EXPRESSION,
          applicable_customer_type: "ALL",
          applicable_product_series: "ALL",
          applicable_channel_type: "ALL",
          allow_below_cost_draft: false,
          status: "ACTIVE",
          remark: "默认标准公式",
          created_at: now,
          updated_at: now,
        },
        {
          id: "formula_002",
          formula_code: "ECOM-QUOTE",
          formula_name: "电商渠道报价公式",
          formula_version: "v2.0",
          formula_expression: "((MSRP / (1 + VAT)) * (1 - FrontMargin) * (1 - DB - CustomerMargin - ServiceFee - MKTFundingRate)) - STKbuffer - 5",
          applicable_customer_type: "ECOM",
          applicable_product_series: "ALL",
          applicable_channel_type: "ONLINE",
          allow_below_cost_draft: true,
          status: "ACTIVE",
          remark: "线上渠道促销支持公式",
          created_at: now,
          updated_at: now,
        },
      ],
      quotes: [],
      approvals: [],
      customer_requests: [],
      account_requests: [],
      logs: [],
    };
  }

  function normalizeUsers(users, defaults) {
    const normalizedUsers = filterInactiveMasterRecords(
      users.map((user) => {
        const fallback = defaults.find((item) => item.id === user.id || item.user_name === user.user_name);
        return {
          ...(fallback || {}),
          ...user,
          permissions: normalizeUserPermissions(user.role || fallback?.role || "", user.permissions || fallback?.permissions),
          status: user.status || fallback?.status || "ACTIVE",
          password: user.password || fallback?.password || TEMP_ACCOUNT_PASSWORD,
          account_origin: user.account_origin || fallback?.account_origin || "DIRECT_CREATE",
          approved_by: user.approved_by || fallback?.approved_by || "",
          approved_by_name: user.approved_by_name || fallback?.approved_by_name || "",
          last_login_at: user.last_login_at || fallback?.last_login_at || "",
          position: String(user.position || fallback?.position || "").trim(),
          remark: user.remark || fallback?.remark || "",
        };
      })
    );

    const primarySource =
      normalizedUsers.find(
        (item) =>
          item.id === PRIMARY_ADMIN_ID ||
          normalizeAccountName(item.user_name) === PRIMARY_ADMIN_USER_NAME ||
          normalizeAccountName(item.user_name) === "sun.admin"
      ) || null;

    const primaryAdmin = {
      ...buildPrimaryAdministrator(primarySource?.created_at || nowIso()),
      ...(primarySource || {}),
      id: PRIMARY_ADMIN_ID,
      user_name: PRIMARY_ADMIN_USER_NAME,
      display_name: PRIMARY_ADMIN_DISPLAY_NAME,
      role: "SYSTEM_ADMIN",
      permissions: buildDefaultPermissionsForRole("SYSTEM_ADMIN"),
      status: "ACTIVE",
      password: PRIMARY_ADMIN_PASSWORD,
      team: "系统管理",
      position: String(primarySource?.position || "").trim(),
      remark: "系统预置超级管理员账号",
    };

    const remainingUsers = normalizedUsers.filter(
      (item) =>
        item !== primarySource &&
        !isLegacySeedAccount(item) &&
        item.id !== PRIMARY_ADMIN_ID &&
        normalizeAccountName(item.user_name) !== PRIMARY_ADMIN_USER_NAME
    );

    return [primaryAdmin].concat(remainingUsers);
  }

  function migratePrimaryAdministratorReferences(data) {
    const primaryAdmin = data.users.find((item) => isPrimaryAdministratorUser(item)) || buildPrimaryAdministrator();
    const validUserIds = new Set(data.users.map((item) => item.id));
    const needsPrimaryAdminFallback = (userId) => !userId || !validUserIds.has(userId) || LEGACY_SEED_USER_IDS.has(String(userId || ""));

    return {
      ...data,
      quotes: data.quotes.map((quote) =>
        needsPrimaryAdminFallback(quote.created_by)
          ? {
              ...quote,
              created_by: primaryAdmin.id,
              created_by_name: primaryAdmin.display_name,
            }
          : quote
      ),
      approvals: data.approvals.map((approval) => {
        const nodes = Array.isArray(approval.nodes)
          ? approval.nodes.map((node) =>
              needsPrimaryAdminFallback(node.approver_id)
                ? {
                    ...node,
                    approver_id: primaryAdmin.id,
                    approver_name: primaryAdmin.display_name,
                  }
                : node
            )
          : [];
        const currentNode = nodes.find((item) => item.node_order === approval.current_node) || nodes[0] || null;
        return {
          ...approval,
          initiated_by: needsPrimaryAdminFallback(approval.initiated_by) ? primaryAdmin.id : approval.initiated_by,
          initiated_by_name: needsPrimaryAdminFallback(approval.initiated_by) ? primaryAdmin.display_name : approval.initiated_by_name,
          approver_id:
            String(approval.approval_status || "").toUpperCase() === "IN_PROGRESS"
              ? currentNode?.approver_id || primaryAdmin.id
              : approval.approver_id,
          approver_name:
            String(approval.approval_status || "").toUpperCase() === "IN_PROGRESS"
              ? currentNode?.approver_name || primaryAdmin.display_name
              : approval.approver_name,
          nodes,
        };
      }),
      customer_requests: data.customer_requests.map((request) => {
        const nodes = Array.isArray(request.nodes)
          ? request.nodes.map((node) =>
              needsPrimaryAdminFallback(node.approver_id)
                ? {
                    ...node,
                    approver_id: primaryAdmin.id,
                    approver_name: primaryAdmin.display_name,
                  }
                : node
            )
          : [];
        const currentNode = nodes.find((item) => item.node_order === request.current_node) || nodes[0] || null;
        return {
          ...request,
          approver_id: currentNode?.approver_id || primaryAdmin.id,
          approver_name: currentNode?.approver_name || primaryAdmin.display_name,
          finance_cc_id: needsPrimaryAdminFallback(request.finance_cc_id) ? primaryAdmin.id : request.finance_cc_id,
          finance_cc_name: needsPrimaryAdminFallback(request.finance_cc_id) ? primaryAdmin.display_name : request.finance_cc_name,
          initiated_by: needsPrimaryAdminFallback(request.initiated_by) ? primaryAdmin.id : request.initiated_by,
          initiated_by_name: needsPrimaryAdminFallback(request.initiated_by) ? primaryAdmin.display_name : request.initiated_by_name,
          nodes,
        };
      }),
      account_requests: data.account_requests.map((request) => ({
        ...request,
        approver_id: primaryAdmin.id,
        approver_name: primaryAdmin.display_name,
      })),
      customers: data.customers.map((customer) => ({
        ...customer,
        default_approver_id: needsPrimaryAdminFallback(customer.default_approver_id) ? primaryAdmin.id : customer.default_approver_id,
      })),
    };
  }

  function normalizeData(raw) {
    const defaults = buildDefaultData();
    const normalized = {
      users: Array.isArray(raw?.users) ? normalizeUsers(raw.users, defaults.users) : defaults.users,
      customers: Array.isArray(raw?.customers) ? filterInactiveMasterRecords(raw.customers.map((item) => normalizeCustomerRecord(item))) : defaults.customers,
      products: Array.isArray(raw?.products) ? filterInactiveMasterRecords(raw.products.map((item) => normalizeProductRecord(item))) : defaults.products,
      formulas: Array.isArray(raw?.formulas)
        ? filterInactiveMasterRecords(raw.formulas.map((formula) => ({
            ...formula,
            status: formula.status || "ACTIVE",
            formula_expression: normalizeFormulaExpression(formula.formula_expression),
          })))
        : defaults.formulas,
      quotes: Array.isArray(raw?.quotes) ? raw.quotes.map((item) => normalizeQuoteRecord(item)) : [],
      approvals: Array.isArray(raw?.approvals) ? raw.approvals : [],
      customer_requests: Array.isArray(raw?.customer_requests) ? raw.customer_requests : [],
      account_requests: Array.isArray(raw?.account_requests)
        ? raw.account_requests.map((request) => ({
            ...request,
            requested_position: String(request?.requested_position || "").trim(),
            requested_password: String(request?.requested_password || "").trim(),
            generated_password: String(request?.generated_password || ""),
          }))
        : [],
      logs: Array.isArray(raw?.logs) ? raw.logs : [],
    };
    return migratePrimaryAdministratorReferences(normalized);
  }

  function normalizeCustomerRecord(customer) {
    return {
      ...customer,
      status: customer?.status || "ACTIVE",
      formal_cooperation_date: String(customer?.formal_cooperation_date || "").trim(),
      default_db_rate: toRateInput(customer?.default_db_rate, 0.0334),
      default_customer_margin: toRateInput(
        customer?.default_customer_margin,
        customer?.default_rebate_type === "RATE" ? customer?.default_rebate_value : 0.124
      ),
      default_service_fee: toRateInput(customer?.default_service_fee, 0.0012),
      default_mkt_funding: roundMoney(customer?.default_mkt_funding ?? 0),
      default_stk_buffer: toNumber(customer?.default_stk_buffer, 5),
      default_front_margin: toRateInput(customer?.default_front_margin, 0.005),
      default_vat: toRateInput(customer?.default_vat, 0.2),
      default_ura: toNumber(customer?.default_ura, 5.5),
      default_approver_id: customer?.default_approver_id || "",
      remark: customer?.remark || "",
    };
  }

  function normalizeProductRecord(product) {
    return {
      ...product,
      status: product?.status || "ACTIVE",
      default_msrp: roundMoney(product?.default_msrp || 0),
      default_cost: roundMoney(product?.default_cost || 0),
      default_formula_id: product?.default_formula_id || "",
      remark: product?.remark || "",
    };
  }

  function filterInactiveMasterRecords(items) {
    return (items || []).filter((item) => String(item?.status || "ACTIVE").toUpperCase() !== "INACTIVE");
  }

  function normalizeQuoteRecord(quote) {
    const normalized = {
      ...quote,
      msrp: roundMoney(quote?.msrp || 0),
      cost_price: roundMoney(quote?.cost_price || 0),
      db_rate: toRateInput(quote?.db_rate, 0.0334),
      customer_margin: toRateInput(
        quote?.customer_margin,
        quote?.rebate_type === "RATE" ? quote?.rebate_value : 0.124
      ),
      service_fee: toRateInput(quote?.service_fee, 0.0012),
      mkt_funding: roundMoney(quote?.mkt_funding ?? 0),
      stk_buffer: roundMoney(quote?.stk_buffer ?? quote?.temporary_support ?? 0),
      front_margin: toRateInput(quote?.front_margin, 0.005),
      vat: toRateInput(quote?.vat, quote?.tax_rate ?? 0.2),
      ura: roundMoney(quote?.ura ?? 5.5),
      remark: quote?.remark || "",
    };
    const recalculated = calculateQuote(
      {
        effective_month: normalized.effective_month || getCurrentMonthValue(),
        msrp: normalized.msrp,
        cost_price: normalized.cost_price,
        db_rate: normalized.db_rate,
        customer_margin: normalized.customer_margin,
        service_fee: normalized.service_fee,
        mkt_funding: normalized.mkt_funding,
        stk_buffer: normalized.stk_buffer,
        front_margin: normalized.front_margin,
        vat: normalized.vat,
        ura: normalized.ura,
      },
      {
        formula_expression: normalizeFormulaExpression(quote?.expression || quote?.formula_expression),
        allow_below_cost_draft: true,
      }
    );
    return {
      ...normalized,
      final_quote_price: recalculated.final_quote_price || normalized.final_quote_price || 0,
      gross_profit: recalculated.gross_profit || normalized.gross_profit || 0,
      gross_margin: recalculated.gross_margin || normalized.gross_margin || 0,
      warning_level: recalculated.warning_level || normalized.warning_level || "NONE",
      warning_message: recalculated.warning_message || normalized.warning_message || "",
      approval_type: recalculated.approval_type || normalized.approval_type || "NORMAL",
      calculation_steps: recalculated.calculation_steps,
    };
  }

  function normalizeFormulaExpression(expression) {
    const text = String(expression || "").trim();
    if (!text) {
      return DEFAULT_FORMULA_EXPRESSION;
    }
    if (text === "((MSRP / (1 + VAT)) * (1 - FrontMargin) * (1 - DB - CustomerMargin - ServiceFee)) - STKbuffer") {
      return DEFAULT_FORMULA_EXPRESSION;
    }
    if (text === "((MSRP / (1 + VAT)) * (1 - FrontMargin) * (1 - DB - CustomerMargin - ServiceFee)) - STKbuffer - 5") {
      return "((MSRP / (1 + VAT)) * (1 - FrontMargin) * (1 - DB - CustomerMargin - ServiceFee - MKTFundingRate)) - STKbuffer - 5";
    }
    if (/(DiscountFactor|SpecialDiscount|RebateValue|TemporarySupport|ChannelFactor|TaxRate)/.test(text)) {
      return /-\s*5(\b|$)/.test(text)
        ? "((MSRP / (1 + VAT)) * (1 - FrontMargin) * (1 - DB - CustomerMargin - ServiceFee - MKTFundingRate)) - STKbuffer - 5"
        : DEFAULT_FORMULA_EXPRESSION;
    }
    return text;
  }

  function persistData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  }

  function loadSession() {
    const sessionUserId = localStorage.getItem(SESSION_KEY);
    const current = sessionUserId ? getUserById(sessionUserId) : null;
    state.ui.selectedOperatorId = current?.status === "ACTIVE" ? current.id : "";
    if (!state.ui.selectedOperatorId) {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  function persistSession() {
    if (state.ui.selectedOperatorId) {
      localStorage.setItem(SESSION_KEY, state.ui.selectedOperatorId);
      return;
    }
    localStorage.removeItem(SESSION_KEY);
  }

  function isSeededApprovalQuote(quote) {
    return ["审批中心初始化待审批报价", "审批中心初始化已审批报价"].includes(String(quote?.remark || "").trim());
  }

  function isSeededCustomerRequest(request) {
    return String(request?.proposed_customer?.remark || "").trim() === "审批中心初始化客户申请";
  }

  function isSeededCustomerRecord(customer) {
    return String(customer?.remark || "").trim() === "审批中心初始化客户申请";
  }

  function stringifyForSeedCheck(value) {
    if (typeof value === "string") {
      return value;
    }
    try {
      return JSON.stringify(value);
    } catch (error) {
      return String(value || "");
    }
  }

  function containsInitialDataMarker(value) {
    const text = stringifyForSeedCheck(value);
    return INITIAL_DATA_MARKERS.some((marker) => text.includes(marker));
  }

  function isInitialSeedLog(log) {
    const actionType = String(log?.action_type || "").toUpperCase();
    if (actionType.startsWith("INIT_")) {
      return true;
    }
    return (
      containsInitialDataMarker(log?.target_name) ||
      containsInitialDataMarker(log?.before_data) ||
      containsInitialDataMarker(log?.after_data) ||
      containsInitialDataMarker(log?.operator_name)
    );
  }

  function cleanupInitialApprovalAndLogData() {
    const removedQuoteIds = new Set();
    const removedLogTargets = new Set();
    const removedCustomerCodes = new Set();
    let changed = false;

    state.data.quotes = state.data.quotes.filter((quote) => {
      if (!isSeededApprovalQuote(quote) && !containsInitialDataMarker(quote?.remark)) {
        return true;
      }
      changed = true;
      removedQuoteIds.add(quote.id);
      removedLogTargets.add(String(quote.quote_no || ""));
      return false;
    });

    state.data.approvals = state.data.approvals.filter((approval) => {
      if (!removedQuoteIds.has(approval.quote_id) && !containsInitialDataMarker(approval)) {
        return true;
      }
      changed = true;
      removedLogTargets.add(String(approval.approval_no || ""));
      return false;
    });

    state.data.customer_requests = state.data.customer_requests.filter((request) => {
      if (!isSeededCustomerRequest(request) && !containsInitialDataMarker(request)) {
        return true;
      }
      changed = true;
      removedLogTargets.add(String(request.request_no || ""));
      removedLogTargets.add(String(request.customer_code || ""));
      removedCustomerCodes.add(String(request.customer_code || ""));
      return false;
    });

    state.data.customers = state.data.customers.filter((customer) => {
      if (
        !isSeededCustomerRecord(customer) &&
        !removedCustomerCodes.has(String(customer.customer_code || "")) &&
        !containsInitialDataMarker(customer?.remark)
      ) {
        return true;
      }
      changed = true;
      removedLogTargets.add(String(customer.customer_code || ""));
      return false;
    });

    state.data.logs = state.data.logs.filter((log) => {
      const target = String(log?.target_name || "");
      if (isInitialSeedLog(log)) {
        changed = true;
        return false;
      }
      if (removedLogTargets.has(target)) {
        changed = true;
        return false;
      }
      return true;
    });

    return changed;
  }

  function seedDemoIfNeeded() {
    let changed = false;
    const hasAppliedWorkflowCleanup = localStorage.getItem(WORKFLOW_CLEANUP_KEY) === WORKFLOW_CLEANUP_VERSION;

    if (!hasAppliedWorkflowCleanup) {
      if (state.data.approvals.length || state.data.customer_requests.length || state.data.account_requests.length || state.data.logs.length) {
        changed = true;
      }
      state.data.approvals = [];
      state.data.customer_requests = [];
      state.data.account_requests = [];
      state.data.logs = [];
      state.ui.activeCustomerRequestId = "";
      state.ui.expandedLogIds = [];
      state.ui.logFilters = {
        actionType: "",
        targetKeyword: "",
        operatorName: "",
        dateFrom: "",
        dateTo: "",
      };
      localStorage.setItem(WORKFLOW_CLEANUP_KEY, WORKFLOW_CLEANUP_VERSION);
    }

    if (cleanupInitialApprovalAndLogData()) {
      changed = true;
    }

    if (changed) {
      persistData();
    }
  }

  function ensureInitialSelections() {
    if (dom.quoteEffectiveMonth && !dom.quoteEffectiveMonth.value) {
      dom.quoteEffectiveMonth.value = getCurrentMonthValue();
    }
    resetFormulaForm();
    resetProductForm();
    resetCustomerForm();
    resetAccountForm();
  }

  function renderAll() {
    refreshQuoteLifecycleStatuses();
    renderAuthPresentation();
    renderOperatorOptions();
    syncLanguage();
    if (!isAuthenticated()) {
      return;
    }
    renderNavigation();
    renderMasterOptions();
    renderQuotesPage();
    renderQuotePreview(calculateCurrentQuotePreview());
    renderImportPreview();
    renderFormulasTable();
    renderProductsTable();
    renderCustomersTable();
    renderCustomerRequestsTable();
    renderCustomerPagePresentation();
    renderProductPagePresentation();
    renderApprovalsTable();
    renderAccountsPage();
    renderLogsPage();
    applyManagementIsolation();
    applyPresentationIsolation();
    syncLanguage();
  }

  function refreshQuoteLifecycleStatuses(referenceMonth = getCurrentMonthValue()) {
    state.data.quotes.forEach((quote) => {
      const approvalStatus = String(quote.approval_status || "").toUpperCase();
      if (approvalStatus === "APPROVED") {
        quote.quote_status = getQuoteLifecycleStatus(quote, referenceMonth);
        return;
      }
      if (approvalStatus === "IN_PROGRESS") {
        quote.quote_status = "PENDING_APPROVAL";
        return;
      }
      if (approvalStatus === "REJECTED") {
        quote.quote_status = "REJECTED_PENDING_EDIT";
      }
    });
  }

  function renderNavigation() {
    const allowedPages = getAccessiblePages();
    if (!allowedPages.includes(state.ui.currentPage)) {
      state.ui.currentPage = getPreferredHomePage(allowedPages);
    }
    dom.navButtons.forEach((button) => {
      const targetId = String(button.dataset.pageTarget || "");
      const allowed = allowedPages.includes(targetId);
      button.classList.toggle("role-hidden", !allowed);
      const active = allowed && targetId === state.ui.currentPage;
      button.classList.toggle("active", active);
    });
    dom.pageSections.forEach((section) => {
      const allowed = allowedPages.includes(section.id);
      section.classList.toggle("role-hidden", !allowed);
      section.classList.toggle("active", allowed && section.id === state.ui.currentPage);
    });
    const activeButton = dom.navButtons.find((button) => button.dataset.pageTarget === state.ui.currentPage);
    if (dom.pageTitle) {
      dom.pageTitle.textContent = activeButton?.textContent?.trim() || tr("客户报价管理系统");
    }
    updatePermissionIsolationHint();
    syncLanguage();
  }

  function switchPage(pageId) {
    const allowedPages = getAccessiblePages();
    state.ui.currentPage = canAccessPage(pageId) ? pageId : getPreferredHomePage(allowedPages);
    renderNavigation();
    if (pageId === "quoteQueryPage") {
      renderQuotesPage();
    }
    if (pageId === "approvalPage") {
      renderApprovalsTable();
    }
    if (pageId === "customerPage") {
      renderCustomersTable();
      renderCustomerRequestsTable();
      renderCustomerPagePresentation();
    }
    if (pageId === "productPage") {
      renderProductPagePresentation();
    }
    if (pageId === "accountPage") {
      renderAccountsPage();
    }
    if (pageId === "logPage") {
      renderLogsPage();
    }
    applyManagementIsolation();
    applyPresentationIsolation();
  }

  function renderOperatorOptions() {
    const current = getCurrentOperator();
    if (dom.currentAccountName) {
      dom.currentAccountName.textContent = current?.display_name || tr("未登录");
    }
    if (dom.currentAccountMeta) {
      dom.currentAccountMeta.textContent = current
        ? tt("operator.meta", { userName: current.user_name, role: renderRoleLabel(current.role) })
        : tr("请先登录后进入系统");
    }
    if (dom.logoutBtn) {
      dom.logoutBtn.disabled = !current;
    }
    syncLanguage();
  }

  function renderAuthPresentation() {
    const authenticated = isAuthenticated();
    dom.loginShell?.classList.toggle("role-hidden", authenticated);
    dom.appShell?.classList.toggle("role-hidden", !authenticated);
  }

  function isAuthenticated() {
    return Boolean(getCurrentOperator());
  }

  function isValidApplicantPassword(password) {
    return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/.test(String(password || "").trim());
  }

  function onLogin() {
    const userName = String(dom.loginUserName?.value || "").trim().toLowerCase();
    const password = String(dom.loginPassword?.value || "");
    const user = state.data.users.find((item) => String(item.user_name || "").toLowerCase() === userName) || null;
    if (!user) {
      setAlert(dom.loginAlert, tr("账号不存在，请检查登录账号或先提交账号申请。"), "danger");
      return;
    }
    if (user.status !== "ACTIVE") {
      setAlert(dom.loginAlert, tr("该账号当前不可用，请联系管理员。"), "warn");
      return;
    }
    if (String(user.password || "") !== password) {
      setAlert(dom.loginAlert, tr("登录密码错误，请重新输入。"), "danger");
      return;
    }
    user.last_login_at = nowIso();
    user.updated_at = nowIso();
    state.ui.selectedOperatorId = user.id;
    persistSession();
    persistData();
    if (dom.loginPassword) {
      dom.loginPassword.value = "";
    }
    setAlert(dom.loginAlert, "", "success");
    renderAll();
  }

  function logout() {
    state.ui.selectedOperatorId = "";
    persistSession();
    if (dom.loginPassword) {
      dom.loginPassword.value = "";
    }
    renderAll();
  }

  function onSubmitAccountRequest() {
    const applicantName = String(dom.requestDisplayName?.value || "").trim();
    const userName = String(dom.requestUserName?.value || "").trim().toLowerCase();
    const password = String(dom.requestPassword?.value || "").trim();
    const role = "SALES_ENTRY";
    const position = "";
    const team = String(dom.requestTeam?.value || "").trim();
    const reason = String(dom.requestReason?.value || "").trim();
    if (!applicantName || !userName || !password || !team || !reason) {
      setAlert(dom.accountRequestAlert, tr("请完整填写申请人、申请账号、申请密码、团队和申请原因。"), "danger");
      return;
    }
    if (!isValidApplicantPassword(password)) {
      setAlert(dom.accountRequestAlert, tr("申请密码必须同时包含英文字母和数字，且只能使用英文字母与数字。"), "danger");
      return;
    }
    if (getUserByUserName(userName)) {
      setAlert(dom.accountRequestAlert, tr("该登录账号已存在，请更换申请账号。"), "warn");
      return;
    }
    const pendingRequest = state.data.account_requests.find(
      (item) => String(item.requested_user_name || "").toLowerCase() === userName && item.approval_status === "PENDING"
    );
    if (pendingRequest) {
      setAlert(dom.accountRequestAlert, tt("alerts.pendingAccountRequest", { requestNo: pendingRequest.request_no }), "warn");
      return;
    }
    const now = nowIso();
    const request = {
      id: buildId("account_request"),
      request_no: buildBusinessNo("ARQ", state.data.account_requests),
      applicant_name: applicantName,
      requested_user_name: userName,
      requested_password: password,
      requested_role: role,
      requested_position: position,
      team,
      reason,
      approval_status: "PENDING",
      generated_user_id: "",
      generated_password: "",
      approver_id: findPrimaryAdministratorUser()?.id || "",
      approver_name: findPrimaryAdministratorUser()?.display_name || tr("管理员"),
      approved_at: "",
      created_at: now,
      updated_at: now,
    };
    state.data.account_requests.unshift(request);
    writeLog(
      "SUBMIT_ACCOUNT_REQUEST",
      userName,
      null,
      { request_no: request.request_no, requested_role: request.requested_role, requested_position: request.requested_position || "" },
      buildVirtualOperator("访客申请")
    );
    persistData();
    if (dom.requestDisplayName) {
      dom.requestDisplayName.value = "";
    }
    if (dom.requestUserName) {
      dom.requestUserName.value = "";
    }
    if (dom.requestPassword) {
      dom.requestPassword.value = "";
    }
    if (dom.requestTeam) {
      dom.requestTeam.value = "";
    }
    if (dom.requestReason) {
      dom.requestReason.value = "";
    }
    renderAll();
    setAlert(dom.accountRequestAlert, tt("alerts.accountRequestSubmitted", { requestNo: request.request_no }), "success");
  }

  function renderMasterOptions() {
    renderQuoteQueryOptions();
    renderQuoteCreateOptions();
    renderProductFormulaOptions();
    renderCustomerApproverOptions();
    renderCustomerBaseOptions();
  }

  function renderQuoteQueryOptions() {
    populateChoiceOptions(dom.queryCustomerName, buildSimpleOptionItems([
      ...state.data.customers.map((item) => item.customer_name),
      ...state.data.quotes.map((item) => item.customer_name),
    ]));
    populateChoiceOptions(dom.queryCustomerCode, buildSimpleOptionItems([
      ...state.data.customers.map((item) => item.customer_code),
      ...state.data.quotes.map((item) => item.customer_code),
    ]));
    populateChoiceOptions(dom.querySku, buildSimpleOptionItems([
      ...state.data.products.map((item) => item.sku),
      ...state.data.quotes.map((item) => item.sku),
    ]));
    populateChoiceOptions(dom.queryProductName, buildSimpleOptionItems([
      ...state.data.products.map((item) => item.product_name),
      ...state.data.quotes.map((item) => item.product_name),
    ]));
    populateChoiceOptions(dom.queryProductSeries, buildSimpleOptionItems([
      ...state.data.products.map((item) => item.product_series),
      ...state.data.quotes.map((item) => item.product_series),
    ]));
    populateChoiceOptions(
      dom.queryEffectiveMonth,
      buildEffectiveMonthOptionItems()
    );
    populateChoiceOptions(
      dom.queryQuoteStatus,
      [
        { value: "PENDING_APPROVAL", label: tr("待审批") },
        { value: "PENDING_EFFECTIVE", label: tr("待生效") },
        { value: "ACTIVE", label: tr("已生效") },
        { value: "REJECTED_PENDING_EDIT", label: tr("驳回待修改") },
        { value: "REJECTED", label: tr("已驳回") },
      ]
    );
    populateChoiceOptions(
      dom.queryApprovalStatus,
      [
        { value: "IN_PROGRESS", label: tr("审批中") },
        { value: "APPROVED", label: tr("已批准") },
        { value: "REJECTED", label: tr("已驳回") },
      ]
    );
    populateChoiceOptions(dom.queryFormulaVersion, buildSimpleOptionItems([
      ...state.data.formulas.map((item) => item.formula_version),
      ...state.data.quotes.map((item) => item.formula_version),
    ]));
  }

  function buildEffectiveMonthOptionItems() {
    const monthValues = new Set(
      state.data.quotes
        .map((item) => normalizeMonthValue(item.effective_month))
        .filter(Boolean)
    );
    const currentMonth = getCurrentMonthValue();
    for (let offset = -12; offset <= 18; offset += 1) {
      monthValues.add(addMonthsToMonthValue(currentMonth, offset));
    }
    return buildSimpleOptionItems(Array.from(monthValues), { sort: "desc" });
  }

  function renderQuoteCreateOptions() {
    populateSelectOptions(dom.quoteCustomerId, getActiveCustomers(), "id", (item) => `${item.customer_name} / ${item.customer_code}`);
    populateSelectOptions(dom.quoteProductId, getActiveProducts(), "id", (item) => `${item.product_name} / ${item.sku}`);
    populateSelectOptions(dom.quoteFormulaId, getActiveFormulas(), "id", (item) => `${item.formula_name} / ${item.formula_version}`);

    if (!dom.quoteCustomerId.value && getActiveCustomers()[0]) {
      dom.quoteCustomerId.value = getActiveCustomers()[0].id;
    }
    if (!dom.quoteProductId.value && getActiveProducts()[0]) {
      dom.quoteProductId.value = getActiveProducts()[0].id;
    }
    if (!dom.quoteFormulaId.value && getActiveFormulas()[0]) {
      dom.quoteFormulaId.value = getActiveFormulas()[0].id;
    }
    if (dom.quoteCostPrice) {
      dom.quoteCostPrice.readOnly = !canViewFob();
      dom.quoteCostPrice.setAttribute("aria-hidden", String(!canViewFob()));
    }
    syncCreateFormDefaults();
  }

  function renderProductFormulaOptions() {
    populateSelectOptions(dom.productFormulaId, getActiveFormulas(), "id", (item) => `${item.formula_name} / ${item.formula_version}`);
  }

  function renderCustomerApproverOptions() {
    populateSelectOptions(
      dom.customerApproverId,
      getActiveUsers().filter((item) => ["SALES_MANAGER", "BUSINESS_HEAD", "FINANCE_HEAD", "SYSTEM_ADMIN"].includes(item.role)),
      "id",
      (item) => `${item.display_name} / ${renderRoleLabel(item.role)}`
    );
  }

  function getDefaultCustomerApproverUser() {
    return findFirstUserByRole("SALES_MANAGER") || findFirstUserByRole("BUSINESS_HEAD") || findFirstUserByRole("FINANCE_HEAD") || findPrimaryAdministratorUser();
  }

  function renderCustomerBaseOptions() {
    if (!dom.customerBaseCustomerId) {
      return;
    }
    const previous = dom.customerBaseCustomerId.value;
    dom.customerBaseCustomerId.innerHTML = `<option value="">${escapeHtml(tr("新客户 / 独立申请"))}</option>`;
    getActiveCustomers().forEach((customer) => {
      const option = document.createElement("option");
      option.value = customer.id;
      option.textContent = `${customer.customer_name} / ${customer.customer_code}`;
      dom.customerBaseCustomerId.appendChild(option);
    });
    const allowed = getActiveCustomers().some((item) => item.id === previous);
    dom.customerBaseCustomerId.value = allowed ? previous : "";
  }

  function populateSelectOptions(select, items, valueKey, labelBuilder) {
    if (!select) {
      return;
    }
    const previous = select.value;
    select.innerHTML = "";
    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = String(item[valueKey] || "");
      option.textContent = labelBuilder(item);
      select.appendChild(option);
    });
    if (items.some((item) => String(item[valueKey] || "") === previous)) {
      select.value = previous;
    }
  }

  function populateChoiceOptions(select, items, emptyLabel = tr("全部")) {
    if (!select) {
      return;
    }
    const previous = select.value;
    select.innerHTML = "";
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = emptyLabel;
    select.appendChild(emptyOption);
    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = String(item.value || "");
      option.textContent = item.label || String(item.value || "");
      select.appendChild(option);
    });
    const allowed = items.some((item) => String(item.value || "") === previous);
    select.value = allowed ? previous : "";
  }

  function buildSimpleOptionItems(values, options = {}) {
    const direction = options.sort === "desc" ? "desc" : "asc";
    return Array.from(
      new Set(
        (values || [])
          .map((value) => String(value == null ? "" : value).trim())
          .filter(Boolean)
      )
    )
      .sort((a, b) => (direction === "desc" ? b.localeCompare(a, "zh-CN") : a.localeCompare(b, "zh-CN")))
      .map((value) => ({ value, label: value }));
  }

  function syncCreateFormDefaults() {
    const customer = getCustomerById(dom.quoteCustomerId?.value);
    const product = getProductById(dom.quoteProductId?.value);
    const suggestedFormula = selectBestFormula(customer, product);
    const currentFormulaId = dom.quoteFormulaId?.value;

    if (product) {
      syncLatestQuoteProductPricing(product);
    }
    if (customer) {
      setInputValue(dom.quoteDbRate, customer.default_db_rate ?? 0);
      setInputValue(dom.quoteCustomerMargin, customer.default_customer_margin ?? 0);
      setInputValue(dom.quoteServiceFee, customer.default_service_fee ?? 0);
      setInputValue(dom.quoteMktFunding, customer.default_mkt_funding ?? 0);
      setInputValue(dom.quoteStkBuffer, customer.default_stk_buffer ?? 0);
      setInputValue(dom.quoteFrontMargin, customer.default_front_margin ?? 0);
      setInputValue(dom.quoteVat, customer.default_vat ?? 0.2);
      setInputValue(dom.quoteUra, customer.default_ura ?? 0);
    }
    if (dom.quoteDbRate && !String(dom.quoteDbRate.value || "").trim()) {
      dom.quoteDbRate.value = "0";
    }
    if (dom.quoteCustomerMargin && !String(dom.quoteCustomerMargin.value || "").trim()) {
      dom.quoteCustomerMargin.value = "0";
    }
    if (dom.quoteServiceFee && !String(dom.quoteServiceFee.value || "").trim()) {
      dom.quoteServiceFee.value = "0";
    }
    if (dom.quoteMktFunding && !String(dom.quoteMktFunding.value || "").trim()) {
      dom.quoteMktFunding.value = "0";
    }
    if (dom.quoteStkBuffer && !String(dom.quoteStkBuffer.value || "").trim()) {
      dom.quoteStkBuffer.value = "0";
    }
    if (dom.quoteFrontMargin && !String(dom.quoteFrontMargin.value || "").trim()) {
      dom.quoteFrontMargin.value = "0";
    }
    if (dom.quoteVat && !String(dom.quoteVat.value || "").trim()) {
      dom.quoteVat.value = "0.2";
    }
    if (dom.quoteUra && !String(dom.quoteUra.value || "").trim()) {
      dom.quoteUra.value = "0";
    }
    if (dom.quoteEffectiveMonth && !String(dom.quoteEffectiveMonth.value || "").trim()) {
      dom.quoteEffectiveMonth.value = getCurrentMonthValue();
    }
    if (dom.quoteFormulaId && suggestedFormula && (!currentFormulaId || !getFormulaById(currentFormulaId))) {
      dom.quoteFormulaId.value = suggestedFormula.id;
    }
    syncQuoteMktFundingRate();
    renderQuotePreview(calculateCurrentQuotePreview());
  }

  function syncLatestQuoteProductPricing(product = getProductById(dom.quoteProductId?.value), fallback = {}) {
    const latestMsrp = roundMoney(product?.default_msrp ?? fallback.msrp ?? 0);
    const latestCost = roundMoney(product?.default_cost ?? fallback.cost_price ?? 0);
    setInputValue(dom.quoteMsrp, latestMsrp);
    setInputValue(dom.quoteCostPrice, latestCost);
    syncQuoteMktFundingRate();
    return {
      msrp: latestMsrp,
      cost_price: latestCost,
    };
  }

  function calculateMktFundingRate(mktFunding, msrp, vat) {
    const funding = roundMoney(mktFunding);
    const normalizedVat = toRateInput(vat, 0);
    const denominator = 1 + normalizedVat;
    if (funding <= 0 || denominator <= 0) {
      return 0;
    }
    const netRetailPrice = Number(msrp) / denominator;
    if (!Number.isFinite(netRetailPrice) || netRetailPrice <= 0) {
      return 0;
    }
    return roundRatio(funding / netRetailPrice);
  }

  function syncQuoteMktFundingRate() {
    setInputValue(dom.quoteMktFundingRate, formatPercent(calculateMktFundingRate(dom.quoteMktFunding?.value, dom.quoteMsrp?.value, dom.quoteVat?.value)));
  }

  function syncTrialMktFundingRate() {
    setInputValue(dom.trialMktFundingRate, formatPercent(calculateMktFundingRate(dom.trialMktFunding?.value, dom.trialMsrp?.value, dom.trialVat?.value)));
  }

  function calculateCurrentQuotePreview() {
    const customer = getCustomerById(dom.quoteCustomerId?.value);
    const product = getProductById(dom.quoteProductId?.value);
    const formula = getFormulaById(dom.quoteFormulaId?.value);

    if (!customer || !product || !formula) {
      return {
        ok: false,
        message: tr("请先选择客户、产品和公式版本。"),
      };
    }

    const payload = collectCreateFormPayload();
    const calculation = calculateQuote(payload, formula);
    return {
      ok: calculation.can_save,
      customer,
      product,
      formula,
      payload,
      calculation,
      message: calculation.error_messages[0] || calculation.warning_messages[0] || "报价试算完成。",
    };
  }

  function collectCreateFormPayload() {
    return {
      customer_id: String(dom.quoteCustomerId?.value || ""),
      product_id: String(dom.quoteProductId?.value || ""),
      formula_id: String(dom.quoteFormulaId?.value || ""),
      effective_month: String(dom.quoteEffectiveMonth?.value || "").trim(),
      msrp: toNumber(dom.quoteMsrp?.value, 0),
      cost_price: toNumber(dom.quoteCostPrice?.value, 0),
      db_rate: toRateInput(dom.quoteDbRate?.value, 0),
      customer_margin: toRateInput(dom.quoteCustomerMargin?.value, 0),
      service_fee: toRateInput(dom.quoteServiceFee?.value, 0),
      mkt_funding: toNumber(dom.quoteMktFunding?.value, 0),
      stk_buffer: toNumber(dom.quoteStkBuffer?.value, 0),
      front_margin: toRateInput(dom.quoteFrontMargin?.value, 0),
      vat: toRateInput(dom.quoteVat?.value, 0),
      ura: toNumber(dom.quoteUra?.value, 0),
      remark: String(dom.quoteRemark?.value || "").trim(),
    };
  }

  function calculateQuote(input, formula) {
    const MSRP = roundMoney(input.msrp);
    const Cost = roundMoney(input.cost_price);
    const DB = toRateInput(input.db_rate, 0);
    const CustomerMargin = toRateInput(input.customer_margin, 0);
    const ServiceFee = toRateInput(input.service_fee, 0);
    const MKTFunding = roundMoney(input.mkt_funding);
    const STKbuffer = roundMoney(input.stk_buffer);
    const FrontMargin = toRateInput(input.front_margin, 0);
    const VAT = toRateInput(input.vat, 0);
    const URA = roundMoney(input.ura);
    const MKTFundingRate = calculateMktFundingRate(MKTFunding, MSRP, VAT);
    const expression = String(formula?.formula_expression || DEFAULT_FORMULA_EXPRESSION).trim();
    const errors = [];
    const warnings = [];

    if (!String(input.effective_month || "").trim()) {
      errors.push(tr("生效月份不能为空。"));
    }
    if (MSRP <= 0) {
      errors.push(tr("零售价必须大于 0。"));
    }
    if (Cost <= 0) {
      errors.push(tr("成本价必须大于 0。"));
    }
    if (DB < 0 || CustomerMargin < 0 || ServiceFee < 0 || MKTFunding < 0 || FrontMargin < 0 || VAT < 0) {
      errors.push(tr("点位、费率与联合营销金额不能为负数。"));
    }
    if (1 + VAT <= 0) {
      errors.push(tr("VAT 不能使分母小于等于 0。"));
    }
    if (DB + CustomerMargin + ServiceFee >= 1) {
      errors.push(tr("DB、客户Margin 与 Service Fee 合计不能大于等于 100%。"));
    }
    if (MKTFundingRate > 0 && DB + CustomerMargin + ServiceFee + MKTFundingRate >= 1) {
      errors.push(tr("DB、客户Margin、Service Fee 与联合营销占比合计不能大于等于 100%。"));
    }
    if (MSRP < Cost) {
      errors.push(tr("零售价低于成本价，系统直接拦截。"));
    }

    let finalQuotePrice = 0;
    try {
      finalQuotePrice = roundMoney(
        Function(
          "MSRP",
          "Cost",
          "DB",
          "CustomerMargin",
          "ServiceFee",
          "MKTFunding",
          "MKTFundingRate",
          "STKbuffer",
          "FrontMargin",
          "VAT",
          "URA",
          `return ${expression};`
        )(MSRP, Cost, DB, CustomerMargin, ServiceFee, MKTFunding, MKTFundingRate, STKbuffer, FrontMargin, VAT, URA)
      );
    } catch (error) {
      errors.push(`${tr("公式计算失败：")}${error instanceof Error ? error.message : tr("未知错误")}`);
    }

    if (finalQuotePrice <= 0) {
      errors.push(tr("报价公式结果小于等于 0，无法生成报价。"));
    }

    const grossProfit = roundMoney(finalQuotePrice - Cost);
    const grossMargin = finalQuotePrice > 0 ? roundRatio(grossProfit / finalQuotePrice) : 0;
    const belowCostFlag = finalQuotePrice < Cost;
    const lowMarginWarningFlag = grossMargin < QUOTE_WARNING_THRESHOLD;
    const warningLevel = belowCostFlag ? "RED" : lowMarginWarningFlag ? "YELLOW" : "NONE";

    if (belowCostFlag) {
      const message = tr("当前报价已击穿成本价，需要走特批审批。");
      if (formula?.allow_below_cost_draft) {
        warnings.push(message);
      } else {
        errors.push(message);
      }
    }
    if (!belowCostFlag && lowMarginWarningFlag) {
      warnings.push(
        tt("warnings.lowMargin", {
          margin: formatPercent(grossMargin),
          threshold: formatPercent(QUOTE_WARNING_THRESHOLD),
        })
      );
    }

    const steps = [
      { label: tr("RRP"), formula: "MSRP", value: MSRP },
      { label: tr("内部成本参考"), formula: "Cost", value: Cost },
      { label: tr("DB (F)"), formula: "DB", value: DB, type: "percent" },
      { label: tr("客户Margin (G)"), formula: "CustomerMargin", value: CustomerMargin, type: "percent" },
      { label: tr("Service Fee (H)"), formula: "ServiceFee", value: ServiceFee, type: "percent" },
      { label: tr("联合营销 / MKT Funding"), formula: "MKTFunding", value: MKTFunding },
      { label: tr("联合营销占比"), formula: "MKTFunding / (MSRP / (1 + VAT))", value: MKTFundingRate, type: "percent" },
      { label: tr("STKbuffer (I)"), formula: "STKbuffer", value: STKbuffer },
      { label: tr("Front Margin (J)"), formula: "FrontMargin", value: FrontMargin, type: "percent" },
      { label: tr("VAT (K)"), formula: "VAT", value: VAT, type: "percent" },
      { label: tr("URA (L)"), formula: tr("参考字段，不参与当前公式"), value: URA },
      { label: tr("客户报价"), formula: expression, value: finalQuotePrice },
      { label: tr("毛利额"), formula: "FinalQuotePrice - Cost", value: grossProfit },
      { label: tr("毛利率"), formula: "GrossProfit / FinalQuotePrice", value: grossMargin, type: "percent" },
    ];

    return {
      final_quote_price: finalQuotePrice,
      gross_profit: grossProfit,
      gross_margin: grossMargin,
      mkt_funding: MKTFunding,
      mkt_funding_rate: MKTFundingRate,
      below_cost_flag: belowCostFlag,
      low_margin_warning_flag: lowMarginWarningFlag,
      warning_level: warningLevel,
      warning_message: errors[0] || warnings[0] || tr("报价正常，可走标准审批。"),
      warning_messages: warnings,
      error_messages: errors,
      special_approval_required: warningLevel !== "NONE",
      approval_type: warningLevel === "NONE" ? "NORMAL" : "SPECIAL",
      calculation_steps: steps,
      can_save: errors.length === 0,
      expression,
    };
  }

  function renderQuotePreview(preview, showStatus) {
    state.ui.quotePreview = preview;
    if (!dom.quoteCalcSummary || !dom.quoteCalcStepsTableBody) {
      return;
    }
    if (!preview || !preview.customer || !preview.product || !preview.formula) {
      dom.quoteCalcSummary.innerHTML = "";
      dom.quoteCalcStepsTableBody.innerHTML = `<tr><td colspan="3">${escapeHtml(tr("暂无数据"))}</td></tr>`;
      if (showStatus) {
        setAlert(dom.quoteCreateAlert, tr("请先选择客户、产品和公式版本。"), "danger");
      }
      return;
    }

    const calc = preview.calculation;
    const visibleSteps = calc.calculation_steps.filter((item) => canViewCalculationStep(item.label));
    const warningMessage = getVisibleWarningMessage(calc.warning_message);
    const summaryCards = [
      `
        <div class="summary-card">
          <span class="hint">${escapeHtml(tr("客户报价"))}</span>
          <strong>${formatMoney(calc.final_quote_price)}</strong>
        </div>
      `,
    ];
    if (canViewGrossProfit()) {
      summaryCards.push(`
        <div class="summary-card">
          <span class="hint">${escapeHtml(tr("毛利额"))}</span>
          <strong>${formatMoney(calc.gross_profit)}</strong>
        </div>
      `);
    }
    if (canViewGrossMargin()) {
      summaryCards.push(`
        <div class="summary-card">
          <span class="hint">${escapeHtml(tr("毛利率"))}</span>
          <strong>${formatPercent(calc.gross_margin)}</strong>
        </div>
      `);
    }
    if (!canViewGrossProfit() && !canViewGrossMargin()) {
      summaryCards.push(`
        <div class="summary-card">
          <span class="hint">${escapeHtml(tr("敏感价格口径"))}</span>
          <strong>${escapeHtml(tr("已按权限隔离"))}</strong>
        </div>
      `);
    }
    summaryCards.push(`
      <div class="summary-card">
        <span class="hint">${escapeHtml(tr("预警级别"))}</span>
        <strong>${escapeHtml(renderWarningText(calc.warning_level))}</strong>
      </div>
    `);
    summaryCards.push(`
      <div class="summary-card">
        <span class="hint">${escapeHtml(tr("审批流"))}</span>
        <strong>${escapeHtml(calc.approval_type === "SPECIAL" ? tr("加强审批") : tr("标准审批"))}</strong>
      </div>
    `);
    dom.quoteCalcSummary.innerHTML = `
      <div class="summary-grid">
        ${summaryCards.join("")}
      </div>
    `;
    dom.quoteCalcStepsTableBody.innerHTML = visibleSteps
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.label)}</td>
            <td>${escapeHtml(item.formula)}</td>
            <td>${escapeHtml(item.type === "percent" ? formatPercent(item.value) : formatMoney(item.value))}</td>
          </tr>
        `
      )
      .join("");

    if (showStatus) {
      setAlert(dom.quoteCreateAlert, warningMessage || preview.message, calc.can_save ? (calc.warning_messages.length > 0 ? "warn" : "success") : "danger");
    }
    syncLanguage();
  }

  function onCreateQuote() {
    const operator = getCurrentOperator();
    try {
      const result = createQuoteFromPayload(collectCreateFormPayload(), operator);
      persistData();
      renderAll();
      state.ui.activeQuoteId = result.quote.id;
      switchPage("quoteQueryPage");
      renderQuoteDetail();
      setAlert(
        dom.quoteCreateAlert,
        tt("alerts.quoteCreated", {
          quoteNo: result.quote.quote_no,
          approvalType: result.approval.approval_type === "SPECIAL" ? tr("加强审批") : tr("标准审批"),
        }),
        "success"
      );
    } catch (error) {
      setAlert(dom.quoteCreateAlert, error instanceof Error ? error.message : tr("生成报价失败。"), "danger");
    }
  }

  function onCreateQuotesByProduct() {
    const product = getProductById(dom.quoteProductId?.value);
    if (!product) {
      setAlert(dom.quoteCreateAlert, tr("请先选择当前产品后再执行批量生成。"), "danger");
      return;
    }
    createBatchQuotesForMatrix({
      scope: "product",
      label: product.product_name,
      pairs: getActiveCustomers().map((customer) => ({ customer, product })),
    });
  }

  function onCreateQuotesByCustomer() {
    const customer = getCustomerById(dom.quoteCustomerId?.value);
    if (!customer) {
      setAlert(dom.quoteCreateAlert, tr("请先选择当前客户后再执行批量生成。"), "danger");
      return;
    }
    createBatchQuotesForMatrix({
      scope: "customer",
      label: customer.customer_name,
      pairs: getActiveProducts().map((product) => ({ customer, product })),
    });
  }

  function createBatchQuotesForMatrix(config) {
    const operator = getCurrentOperator();
    const basePayload = collectCreateFormPayload();
    const scope = String(config?.scope || "");
    const label = String(config?.label || "").trim();
    const rawPairs = Array.isArray(config?.pairs) ? config.pairs : [];
    const pairs = rawPairs.filter((item) => item?.customer && item?.product);

    if (pairs.length === 0) {
      const emptyMessage = scope === "product" ? tr("当前没有可批量生成报价的客户。") : tr("当前没有可批量生成报价的产品。");
      setAlert(dom.quoteCreateAlert, emptyMessage, "warn");
      return;
    }

    const results = pairs.map((item) => tryCreateBatchQuote(item.customer, item.product, basePayload, operator));
    const successes = results.filter((item) => item.ok);
    const failures = results.filter((item) => !item.ok);

    if (successes.length === 0) {
      const firstError = failures[0]?.error || tr("批量生成失败。");
      setAlert(dom.quoteCreateAlert, firstError, "danger");
      return;
    }

    persistData();
    renderAll();

    const effectiveMonth = String(basePayload.effective_month || "").trim();
    const firstQuote = successes[0]?.quote || null;
    if (scope === "product") {
      setQuoteQueryFilters({
        batch_keywords: "",
        customer_name: "",
        customer_code: "",
        sku: firstQuote?.sku || "",
        product_name: firstQuote?.product_name || "",
        product_series: firstQuote?.product_series || "",
        effective_month: effectiveMonth,
        quote_status: "PENDING_APPROVAL",
        approval_status: "IN_PROGRESS",
        formula_version: "",
      });
    } else {
      setQuoteQueryFilters({
        batch_keywords: "",
        customer_name: firstQuote?.customer_name || "",
        customer_code: firstQuote?.customer_code || "",
        sku: "",
        product_name: "",
        product_series: "",
        effective_month: effectiveMonth,
        quote_status: "PENDING_APPROVAL",
        approval_status: "IN_PROGRESS",
        formula_version: "",
      });
    }

    switchPage("quoteQueryPage");
    const alertKey = scope === "product" ? "alerts.batchQuotesByProductCreated" : "alerts.batchQuotesByCustomerCreated";
    const summary = tt(alertKey, {
      label,
      success: String(successes.length),
      failed: String(failures.length),
    });
    const failureSuffix = failures[0]?.error ? ` ${tt("alerts.batchQuotesFirstError", { reason: failures[0].error })}` : "";
    setAlert(dom.quoteQueryAlert, `${summary}${failureSuffix}`.trim(), failures.length > 0 ? "warn" : "success");
  }

  function tryCreateBatchQuote(customer, product, basePayload, operator) {
    try {
      const payload = buildBatchQuotePayload(customer, product, basePayload);
      const result = createQuoteFromPayload(payload, operator, { silent: true });
      return {
        ok: true,
        quote: result.quote,
        approval: result.approval,
      };
    } catch (error) {
      return {
        ok: false,
        customer,
        product,
        error: error instanceof Error ? error.message : tr("批量生成失败。"),
      };
    }
  }

  function buildBatchQuotePayload(customer, product, basePayload) {
    const fallbackFormula = getFormulaById(basePayload.formula_id) || getActiveFormulas()[0] || null;
    const formula = selectBestFormula(customer, product) || fallbackFormula;
    return {
      customer_id: customer?.id || "",
      product_id: product?.id || "",
      formula_id: formula?.id || "",
      effective_month: String(basePayload.effective_month || "").trim() || getCurrentMonthValue(),
      msrp: roundMoney(product?.default_msrp ?? basePayload.msrp ?? 0),
      cost_price: roundMoney(product?.default_cost ?? basePayload.cost_price ?? 0),
      db_rate: toRateInput(customer?.default_db_rate, toRateInput(basePayload.db_rate, 0)),
      customer_margin: toRateInput(customer?.default_customer_margin, toRateInput(basePayload.customer_margin, 0)),
      service_fee: toRateInput(customer?.default_service_fee, toRateInput(basePayload.service_fee, 0)),
      mkt_funding: roundMoney(customer?.default_mkt_funding ?? basePayload.mkt_funding ?? 0),
      stk_buffer: toNumber(customer?.default_stk_buffer, toNumber(basePayload.stk_buffer, 0)),
      front_margin: toRateInput(customer?.default_front_margin, toRateInput(basePayload.front_margin, 0)),
      vat: toRateInput(customer?.default_vat, toRateInput(basePayload.vat, 0.2)),
      ura: toNumber(customer?.default_ura, toNumber(basePayload.ura, 0)),
      remark: String(basePayload.remark || "").trim(),
    };
  }

  function setQuoteQueryFilters(filters = {}) {
    setInputValue(dom.queryBatchKeywords, filters.batch_keywords || "");
    setInputValue(dom.queryCustomerName, filters.customer_name || "");
    setInputValue(dom.queryCustomerCode, filters.customer_code || "");
    setInputValue(dom.querySku, filters.sku || "");
    setInputValue(dom.queryProductName, filters.product_name || "");
    setInputValue(dom.queryProductSeries, filters.product_series || "");
    setInputValue(dom.queryEffectiveMonth, filters.effective_month || "");
    setInputValue(dom.queryQuoteStatus, filters.quote_status || "");
    setInputValue(dom.queryApprovalStatus, filters.approval_status || "");
    setInputValue(dom.queryFormulaVersion, filters.formula_version || "");
  }

  function createQuoteFromPayload(payload, operator, options = {}) {
    const customer = getCustomerById(payload.customer_id);
    const product = getProductById(payload.product_id);
    const formula = getFormulaById(payload.formula_id);
    const effectiveMonth = normalizeMonthValue(payload.effective_month) || "";
    if (!customer) {
      throw new Error("客户不存在，无法生成报价。");
    }
    if (!product) {
      throw new Error("产品不存在，无法生成报价。");
    }
    if (!formula) {
      throw new Error("公式不存在，无法生成报价。");
    }
    if (!effectiveMonth) {
      throw new Error(tr("生效月份不能为空。"));
    }

    const duplicateQuote = state.data.quotes.find((item) => {
      if (item.customer_id !== customer.id || item.product_id !== product.id) {
        return false;
      }
      if (normalizeMonthValue(item.effective_month) !== effectiveMonth) {
        return false;
      }
      return String(item.approval_status || "").toUpperCase() !== "REJECTED";
    });
    if (duplicateQuote) {
      throw new Error(tt("alerts.quoteMonthDuplicate", {
        month: effectiveMonth,
        customerName: customer.customer_name,
        sku: product.sku,
        quoteNo: duplicateQuote.quote_no,
      }));
    }

    const calculation = calculateQuote(payload, formula);
    if (!calculation.can_save) {
      throw new Error(calculation.error_messages[0] || "报价计算未通过校验。");
    }

    const now = nowIso();
    const quote = {
      id: buildId("quote"),
      quote_no: buildBusinessNo("QT", state.data.quotes),
      customer_id: customer.id,
      customer_name: customer.customer_name,
      customer_code: customer.customer_code,
      customer_type: customer.customer_type,
      channel_type: customer.channel_type,
      product_id: product.id,
      sku: product.sku,
      product_name: product.product_name,
      product_series: product.product_series,
      formula_id: formula.id,
      formula_name: formula.formula_name,
      formula_version: formula.formula_version,
      msrp: roundMoney(payload.msrp),
      cost_price: roundMoney(payload.cost_price),
      db_rate: toRateInput(payload.db_rate, 0),
      customer_margin: toRateInput(payload.customer_margin, 0),
      service_fee: toRateInput(payload.service_fee, 0),
      mkt_funding: roundMoney(payload.mkt_funding ?? 0),
      stk_buffer: roundMoney(payload.stk_buffer),
      front_margin: toRateInput(payload.front_margin, 0),
      vat: toRateInput(payload.vat, 0),
      ura: roundMoney(payload.ura),
      final_quote_price: calculation.final_quote_price,
      gross_profit: calculation.gross_profit,
      gross_margin: calculation.gross_margin,
      mkt_funding_rate: calculation.mkt_funding_rate,
      warning_level: calculation.warning_level,
      warning_message: calculation.warning_message,
      approval_type: calculation.approval_type,
      approval_status: "IN_PROGRESS",
      quote_status: "PENDING_APPROVAL",
      effective_month: effectiveMonth,
      remark: String(payload.remark || ""),
      calculation_steps: calculation.calculation_steps,
      created_by: operator.id,
      created_by_name: operator.display_name,
      created_at: now,
      updated_at: now,
    };
    const approval = buildApprovalForQuote(quote, customer, operator);
    quote.approval_id = approval.id;
    state.data.quotes.unshift(quote);
    state.data.approvals.unshift(approval);
    writeLog("CREATE_QUOTE", quote.quote_no, null, {
      customer_name: quote.customer_name,
      sku: quote.sku,
      final_quote_price: quote.final_quote_price,
      db_rate: quote.db_rate,
      customer_margin: quote.customer_margin,
      mkt_funding: quote.mkt_funding,
      mkt_funding_rate: quote.mkt_funding_rate,
      approval_type: quote.approval_type,
    }, operator);
    if (!options.silent) {
      persistData();
    }
    return { quote, approval };
  }

  function buildApprovalForQuote(quote, customer, operator) {
    const primaryAdmin = findPrimaryAdministratorUser();
    const salesManager = getUserById(customer.default_approver_id) || findFirstUserByRole("SALES_MANAGER") || primaryAdmin;
    const businessHead = findFirstUserByRole("BUSINESS_HEAD") || primaryAdmin;
    const financeHead = findFirstUserByRole("FINANCE_HEAD") || primaryAdmin;
    const flow = quote.approval_type === "SPECIAL"
      ? [tr("直属上级负责人审批"), tr("销售/经营负责人审批"), tr("财务负责人审批")]
      : [tr("直属上级负责人审批"), tr("财务负责人审批")];

    const nodes = flow.map((nodeName, index) => {
      const approver = index === 0 ? salesManager : quote.approval_type === "SPECIAL" && index === 1 ? businessHead : financeHead;
      return {
        id: buildId("approval_node"),
        node_order: index + 1,
        node_name: nodeName,
        approver_id: approver?.id || "",
        approver_name: approver?.display_name || tr("待配置审批人"),
        approval_status: index === 0 ? "IN_PROGRESS" : "PENDING",
        approval_comment: "",
        approved_at: "",
      };
    });

    return {
      id: buildId("approval"),
      approval_no: buildBusinessNo("APR", state.data.approvals),
      quote_id: quote.id,
      quote_no: quote.quote_no,
      customer_name: quote.customer_name,
      sku: quote.sku,
      product_name: quote.product_name,
      approval_type: quote.approval_type,
      current_node: 1,
      current_node_name: nodes[0]?.node_name || "",
      approver_id: nodes[0]?.approver_id || "",
      approver_name: nodes[0]?.approver_name || "",
      approval_status: "IN_PROGRESS",
      initiated_by: operator.id,
      initiated_by_name: operator.display_name,
      initiated_at: nowIso(),
      approved_at: "",
      updated_at: nowIso(),
      nodes,
    };
  }

  function renderQuotesPage() {
    const records = getFilteredQuotes();
    state.ui.filteredQuotes = records;
    setAlert(dom.quoteQueryAlert, records.length === 0 ? tr("当前筛选条件下没有价格结果。") : "", records.length === 0 ? "warn" : "success");
    renderQuotesTable(records);
    renderQuotesSummary(records);
    applyPresentationIsolation();
    syncLanguage();
  }

  function getFilteredQuotes() {
    const formData = new FormData(dom.quoteQueryForm);
    const filters = Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, String(value || "").trim()]));
    const batchTokens = parseBatchQueryKeywords(filters.batch_keywords);
    const referenceMonth = getQuoteReferenceMonth(filters);
    const records = state.data.quotes
      .slice()
      .filter((quote) => {
        if (filters.customer_name && !quote.customer_name.toLowerCase().includes(filters.customer_name.toLowerCase())) {
          return false;
        }
        if (filters.customer_code && !quote.customer_code.toLowerCase().includes(filters.customer_code.toLowerCase())) {
          return false;
        }
        if (filters.sku && !quote.sku.toLowerCase().includes(filters.sku.toLowerCase())) {
          return false;
        }
        if (filters.product_name && !quote.product_name.toLowerCase().includes(filters.product_name.toLowerCase())) {
          return false;
        }
        if (filters.product_series && !quote.product_series.toLowerCase().includes(filters.product_series.toLowerCase())) {
          return false;
        }
        if (filters.formula_version && !quote.formula_version.toLowerCase().includes(filters.formula_version.toLowerCase())) {
          return false;
        }
        if (batchTokens.length > 0) {
          const haystacks = [
            quote.quote_no,
            quote.customer_name,
            quote.customer_code,
            quote.sku,
            quote.product_name,
            quote.product_series,
          ]
            .map((value) => String(value || "").toLowerCase())
            .filter(Boolean);
          if (!batchTokens.some((token) => haystacks.some((value) => value.includes(token)))) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at), "zh-CN"));
    if (shouldUseQuoteCarryForwardLookup(filters)) {
      const carriedRecords = records.filter(
        (quote) => String(quote.approval_status || "").toUpperCase() === "APPROVED" && compareMonthValue(quote.effective_month, referenceMonth) <= 0
      );
      return pickApplicableQuotesForMonth(carriedRecords, referenceMonth);
    }
    const exactRecords = records.filter((quote) => {
      if (filters.effective_month && normalizeMonthValue(quote.effective_month) !== normalizeMonthValue(filters.effective_month)) {
        return false;
      }
      if (filters.approval_status && String(quote.approval_status || "").toUpperCase() !== String(filters.approval_status || "").toUpperCase()) {
        return false;
      }
      if (filters.quote_status && getQuoteLifecycleStatus(quote, referenceMonth) !== String(filters.quote_status || "").toUpperCase()) {
        return false;
      }
      return true;
    });
    return pickLatestPriceQuotes(exactRecords);
  }

  function parseBatchQueryKeywords(value) {
    return Array.from(
      new Set(
        String(value || "")
          .split(/[\n,，;；\t]+/)
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean)
      )
    );
  }

  function pickLatestPriceQuotes(records) {
    const latestMap = new Map();
    (records || []).forEach((quote) => {
      const key = buildQuoteIdentityKey(quote, { includeEffectiveMonth: true });
      if (!latestMap.has(key)) {
        latestMap.set(key, quote);
      }
    });
    return Array.from(latestMap.values()).sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at), "zh-CN"));
  }

  function buildQuoteIdentityKey(quote, { includeEffectiveMonth = false } = {}) {
    const baseParts = [
      quote?.customer_id || quote?.customer_code || "",
      quote?.product_id || quote?.sku || "",
    ];
    if (includeEffectiveMonth) {
      baseParts.push(normalizeMonthValue(quote?.effective_month) || "");
    }
    return baseParts.map((item) => String(item || "")).join("::");
  }

  function shouldUseQuoteCarryForwardLookup(filters = {}) {
    const approvalStatus = String(filters.approval_status || "").toUpperCase();
    const quoteStatus = String(filters.quote_status || "").toUpperCase();
    const canUseApprovedFlow = !approvalStatus || approvalStatus === "APPROVED";
    const canUseQuoteFlow = !quoteStatus || quoteStatus === "ACTIVE";
    return canUseApprovedFlow && canUseQuoteFlow;
  }

  function getQuoteReferenceMonth(filters = {}) {
    return normalizeMonthValue(filters.effective_month) || getCurrentMonthValue();
  }

  function getQuoteReferenceMonthFromDom() {
    return getQuoteReferenceMonth({ effective_month: dom.queryEffectiveMonth?.value || "" });
  }

  function pickApplicableQuotesForMonth(records, referenceMonth) {
    const latestMap = new Map();
    (records || []).forEach((quote) => {
      const key = buildQuoteIdentityKey(quote);
      const current = latestMap.get(key);
      if (!current) {
        latestMap.set(key, quote);
        return;
      }
      const monthCompare = compareMonthValue(quote.effective_month, current.effective_month);
      if (monthCompare > 0) {
        latestMap.set(key, quote);
        return;
      }
      if (monthCompare === 0 && String(quote.updated_at || "").localeCompare(String(current.updated_at || ""), "zh-CN") > 0) {
        latestMap.set(key, quote);
      }
    });
    return Array.from(latestMap.values())
      .filter((quote) => compareMonthValue(quote.effective_month, referenceMonth) <= 0)
      .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at), "zh-CN"));
  }

  function getQuoteLifecycleStatus(quote, referenceMonth = getCurrentMonthValue()) {
    if (!quote) {
      return "";
    }
    const approvalStatus = String(quote.approval_status || "").toUpperCase();
    if (approvalStatus === "APPROVED") {
      return compareMonthValue(quote.effective_month, referenceMonth) <= 0 ? "ACTIVE" : "PENDING_EFFECTIVE";
    }
    return String(quote.quote_status || "").toUpperCase();
  }

  function renderQuotesSummary(records) {
    if (!dom.quotesSummary) {
      return;
    }
    const totalAmount = records.reduce((sum, item) => sum + Number(item.final_quote_price || 0), 0);
    dom.quotesSummary.textContent =
      records.length === 0 ? tr("暂无价格结果") : tt("price.querySummary", { count: records.length, amount: formatMoney(totalAmount) });
  }

  function renderQuotesTable(records) {
    if (!dom.quotesTableBody) {
      return;
    }
    const referenceMonth = getQuoteReferenceMonthFromDom();
    if (records.length === 0) {
      dom.quotesTableBody.innerHTML = `<tr><td colspan="14">${escapeHtml(tr("暂无价格结果"))}</td></tr>`;
      return;
    }
    dom.quotesTableBody.innerHTML = records
      .map(
        (quote) => `
          <tr>
            <td>${escapeHtml(quote.customer_name)}</td>
            <td>${escapeHtml(quote.customer_code)}</td>
            <td>${escapeHtml(quote.product_name)}</td>
            <td>${escapeHtml(quote.sku)}</td>
            <td>${escapeHtml(quote.product_series)}</td>
            <td>${escapeHtml(formatMoney(quote.msrp))}</td>
            <td data-permission-key="view_fob">${escapeHtml(renderProtectedMoney(quote.cost_price, CORE_PERMISSION_KEYS.VIEW_FOB))}</td>
            <td>${escapeHtml(formatMoney(quote.final_quote_price))}</td>
            <td data-permission-key="view_gross_profit">${escapeHtml(renderProtectedMoney(quote.gross_profit, CORE_PERMISSION_KEYS.VIEW_GROSS_PROFIT))}</td>
            <td data-permission-key="view_gross_margin">${escapeHtml(renderProtectedPercent(quote.gross_margin, CORE_PERMISSION_KEYS.VIEW_GROSS_MARGIN))}</td>
            <td>${escapeHtml(quote.effective_month)}</td>
            <td>${renderStatusBadge(quote.approval_status)}</td>
            <td>${renderStatusBadge(getQuoteLifecycleStatus(quote, referenceMonth))}</td>
            <td>${escapeHtml(formatDateTime(quote.updated_at || quote.created_at))}</td>
          </tr>
        `
      )
      .join("");
    syncLanguage();
  }

  function onQuotesTableAction(event) {
    const button = closestDataButton(event, "quoteAction");
    if (!button) {
      return;
    }
    const action = String(button.dataset.quoteAction || "");
    const quote = getQuoteById(button.dataset.quoteId);
    if (!quote) {
      return;
    }
    if (action === "mail") {
      downloadCustomerPriceSheet(quote, dom.quoteQueryAlert);
      return;
    }
    if (action === "copy") {
      loadQuoteIntoCreateForm(quote);
      return;
    }
    if (action === "delete") {
      deleteQuote(quote);
    }
  }

  function renderQuoteDetail() {
    if (!dom.quoteDetailContent) {
      return;
    }
    const quote = getQuoteById(state.ui.activeQuoteId) || state.ui.filteredQuotes[0] || null;
    if (!quote) {
      dom.quoteDetailContent.textContent = tr("点击“查看明细”后展示公式版本、计算过程、审批轨迹和日志。");
      return;
    }
    state.ui.activeQuoteId = quote.id;
    const approval = getApprovalByQuoteId(quote.id);
    const logs = state.data.logs.filter((item) => item.target_name === quote.quote_no).slice(0, 8);
    const customerQuoteSheet = ensureCustomerQuoteSheet(quote);
    const detailNotice = state.ui.detailNotice?.quoteId === quote.id ? state.ui.detailNotice : null;
    const detailReferenceMonth =
      state.ui.currentPage === "quoteQueryPage" ? getQuoteReferenceMonthFromDom() : getCurrentMonthValue();
    const quoteStatus = getQuoteLifecycleStatus(quote, detailReferenceMonth);
    const detailItems = [
      buildDetailItem("报价单号", quote.quote_no),
      buildDetailItem("客户名称", quote.customer_name),
      buildDetailItem("SKU", quote.sku),
      buildDetailItem("产品名称", quote.product_name),
      buildDetailItem("RRP", formatMoney(quote.msrp)),
      buildDetailItem("DB (F)", formatPercent(quote.db_rate)),
      buildDetailItem("客户Margin (G)", formatPercent(quote.customer_margin)),
      buildDetailItem("Service Fee (H)", formatPercent(quote.service_fee)),
      buildDetailItem("联合营销 / MKT Funding", formatMoney(quote.mkt_funding)),
      buildDetailItem("联合营销占比", formatPercent(quote.mkt_funding_rate)),
      buildDetailItem("STKbuffer (I)", formatMoney(quote.stk_buffer)),
      buildDetailItem("Front Margin (J)", formatPercent(quote.front_margin)),
      buildDetailItem("VAT (K)", formatPercent(quote.vat)),
      buildDetailItem("URA (L)", formatMoney(quote.ura)),
      buildDetailItem("客户报价", formatMoney(quote.final_quote_price)),
      buildDetailItem("审批状态", renderPlainStatus(quote.approval_status)),
      buildDetailItem("报价状态", renderPlainStatus(quoteStatus)),
      buildDetailItem("生效月份", quote.effective_month),
      buildDetailItem("公式版本", `${quote.formula_name} / ${quote.formula_version}`),
      buildDetailItem("预警说明", getVisibleWarningMessage(quote.warning_message || tr("报价正常，可走标准审批。"))),
    ];
    if (canViewGrossProfit()) {
      detailItems.splice(13, 0, buildDetailItem("毛利额", formatMoney(quote.gross_profit)));
    }
    if (canViewGrossMargin()) {
      detailItems.splice(canViewGrossProfit() ? 14 : 13, 0, buildDetailItem("毛利率", formatPercent(quote.gross_margin)));
    }
    if (!canViewGrossProfit() && !canViewGrossMargin()) {
      detailItems.splice(13, 0, buildDetailItem("敏感价格口径", tr("已按权限隔离")));
    }
    const visibleSteps = (quote.calculation_steps || []).filter((step) => canViewCalculationStep(step.label));
    dom.quoteDetailContent.innerHTML = `
      <div class="detail-block">
        <div class="detail-grid">
          ${detailItems.join("")}
        </div>
        <div class="panel-head">
          <h4>计算过程</h4>
          <span class="hint">${escapeHtml(getVisibleWarningMessage(quote.warning_message || "报价正常"))}</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>步骤</th>
                <th>公式/说明</th>
                <th>结果</th>
              </tr>
            </thead>
            <tbody>
              ${visibleSteps
                .map(
                  (step) => `
                    <tr>
                      <td>${escapeHtml(step.label)}</td>
                      <td>${escapeHtml(step.formula)}</td>
                      <td>${escapeHtml(step.type === "percent" ? formatPercent(step.value) : formatMoney(step.value))}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        <div class="panel-head">
          <h4>审批轨迹</h4>
          <span class="hint">${approval ? escapeHtml(tt("details.currentNode", { node: tr(approval.current_node_name || "-") })) : escapeHtml(tr("未生成审批"))}</span>
        </div>
        <div class="detail-grid">
          ${
            approval
              ? approval.nodes
                  .map(
                    (node) => `
                      <div class="detail-item">
                        <span>${escapeHtml(`${node.node_order}. ${tr(node.node_name)}`)}</span>
                        <strong>${renderPlainStatus(node.approval_status)}</strong>
                        <span>${escapeHtml(tt("details.approver", { name: node.approver_name || tr("待配置") }))}</span>
                        <span>${escapeHtml(tr(node.approval_comment || (node.approval_status === "IN_PROGRESS" ? "待当前节点处理" : "等待流转")))}</span>
                      </div>
                    `
                  )
                  .join("")
              : buildDetailItem("审批轨迹", "暂无")
          }
        </div>
        <div class="panel-head">
          <h4>客户价格表</h4>
          <span class="hint">审批通过后自动生成，可直接复制、下载并发送给客户</span>
        </div>
        ${
          customerQuoteSheet
            ? `
              <div class="detail-block customer-quote-sheet">
                <div class="toolbar quote-mail-toolbar">
                  <button class="btn btn-primary" type="button" data-mail-action="copy-body" data-quote-id="${escapeHtml(quote.id)}">复制邮件正文</button>
                  <button class="btn" type="button" data-mail-action="copy-subject" data-quote-id="${escapeHtml(quote.id)}">复制邮件主题</button>
                  <button class="btn" type="button" data-mail-action="download-pdf" data-quote-id="${escapeHtml(quote.id)}">下载价格表 PDF</button>
                  <button class="btn" type="button" data-mail-action="download-html" data-quote-id="${escapeHtml(quote.id)}">下载价格表 HTML</button>
                  <button class="btn" type="button" data-mail-action="download-txt" data-quote-id="${escapeHtml(quote.id)}">下载价格表 TXT</button>
                  <button class="btn" type="button" data-mail-action="open-mail" data-quote-id="${escapeHtml(quote.id)}">打开邮件草稿</button>
                </div>
                ${detailNotice ? `<div class="alert alert-${escapeHtml(detailNotice.type)}">${escapeHtml(detailNotice.text)}</div>` : ""}
                <div class="detail-grid">
                  ${customerQuoteSheet.preview_fields.map((item) => buildDetailItem(item.label, escapeHtml(item.value))).join("")}
                </div>
                <div class="quote-mail-card">
                  <div class="panel-head">
                    <h4>邮件内容预览</h4>
                    <span class="hint">${escapeHtml(tt("details.generatedAt", { time: formatDateTime(customerQuoteSheet.generated_at) }))}</span>
                  </div>
                  <div class="quote-mail-subject">${escapeHtml(tt("details.mailSubject", { subject: customerQuoteSheet.subject }))}</div>
                  <pre class="quote-mail-preview">${escapeHtml(customerQuoteSheet.body_text)}</pre>
                </div>
              </div>
            `
            : `<div class="detail-placeholder">当前报价尚未审批通过。审批完成后，系统会自动生成一份客户可发送版本，并提供下载与复制入口。</div>`
        }
        <div class="panel-head">
          <h4>相关日志</h4>
          <span class="hint">最近 8 条</span>
        </div>
        <div class="detail-block">
          ${
            logs.length === 0
              ? `<div class="detail-placeholder">暂无日志</div>`
              : logs
                  .map(
                    (log) => `
                      <div class="detail-item">
                        <span>${escapeHtml(renderLogActionType(log.action_type))}</span>
                        <strong>${escapeHtml(log.operator_name)}</strong>
                        <span>${escapeHtml(formatDateTime(log.operated_at))}</span>
                      </div>
                    `
                  )
                  .join("")
          }
        </div>
      </div>
    `;
    syncLanguage();
  }

  async function onQuoteDetailAction(event) {
    const button = closestDataButton(event, "mailAction");
    if (!button) {
      return;
    }
    const quote = getQuoteById(button.dataset.quoteId);
    if (!quote) {
      return;
    }
    const customerQuoteSheet = ensureCustomerQuoteSheet(quote);
    if (!customerQuoteSheet) {
      setDetailNotice(quote.id, tr("当前报价尚未审批通过，暂时不能下载客户价格表。"), "warn");
      renderQuoteDetail();
      return;
    }

    const action = String(button.dataset.mailAction || "");
    let success = true;
    if (action === "copy-body") {
      success = await copyTextToClipboard(customerQuoteSheet.body_text);
      setDetailNotice(quote.id, success ? tr("邮件正文已复制，可直接粘贴到邮件中。") : tr("复制失败，请检查浏览器剪贴板权限。"), success ? "success" : "danger");
    }
    if (action === "copy-subject") {
      success = await copyTextToClipboard(customerQuoteSheet.subject);
      setDetailNotice(quote.id, success ? tr("邮件主题已复制。") : tr("复制失败，请检查浏览器剪贴板权限。"), success ? "success" : "danger");
    }
    if (action === "download-html") {
      downloadFile(customerQuoteSheet.html_filename, customerQuoteSheet.attachment_html, "text/html;charset=utf-8");
      setDetailNotice(quote.id, tt("details.mailDownloadHtml", { filename: customerQuoteSheet.html_filename }), "success");
    }
    if (action === "download-pdf") {
      const pdfBundle = buildCustomerQuoteSheetPdf(quote, customerQuoteSheet);
      downloadBlobFile(pdfBundle.filename, pdfBundle.blob);
      setDetailNotice(quote.id, tt("details.mailDownloadPdf", { filename: pdfBundle.filename }), "success");
    }
    if (action === "download-txt") {
      downloadFile(customerQuoteSheet.txt_filename, customerQuoteSheet.attachment_text, "text/plain;charset=utf-8");
      setDetailNotice(quote.id, tt("details.mailDownloadTxt", { filename: customerQuoteSheet.txt_filename }), "success");
    }
    if (action === "open-mail") {
      openCustomerQuoteMailDraft(customerQuoteSheet);
      setDetailNotice(quote.id, tr("已尝试打开本机默认邮件客户端草稿。"), "success");
    }
    renderQuoteDetail();
  }

  function loadQuoteIntoCreateForm(quote) {
    if (!canAccessPage("quoteCreatePage")) {
      state.ui.activeQuoteId = quote.id;
      renderQuoteDetail();
      return;
    }
    const product = getProductById(quote.product_id);
    switchPage("quoteCreatePage");
    if (dom.quoteCustomerId) {
      dom.quoteCustomerId.value = quote.customer_id;
    }
    if (dom.quoteProductId) {
      dom.quoteProductId.value = quote.product_id;
    }
    if (dom.quoteFormulaId) {
      dom.quoteFormulaId.value = quote.formula_id;
    }
    setInputValue(dom.quoteEffectiveMonth, quote.effective_month);
    const latestPricing = syncLatestQuoteProductPricing(product, {
      msrp: quote.msrp,
      cost_price: quote.cost_price,
    });
    setInputValue(dom.quoteDbRate, quote.db_rate);
    setInputValue(dom.quoteCustomerMargin, quote.customer_margin);
    setInputValue(dom.quoteServiceFee, quote.service_fee);
    setInputValue(dom.quoteMktFunding, quote.mkt_funding ?? 0);
    setInputValue(dom.quoteStkBuffer, quote.stk_buffer);
    setInputValue(dom.quoteFrontMargin, quote.front_margin);
    setInputValue(dom.quoteVat, quote.vat);
    setInputValue(dom.quoteUra, quote.ura);
    if (dom.quoteRemark) {
      dom.quoteRemark.value = quote.remark || "";
    }
    syncQuoteMktFundingRate();
    renderQuotePreview(calculateCurrentQuotePreview(), true);
    const loadedLatestPricing =
      Number(latestPricing.msrp) !== Number(roundMoney(quote.msrp)) || Number(latestPricing.cost_price) !== Number(roundMoney(quote.cost_price));
    setAlert(
      dom.quoteCreateAlert,
      loadedLatestPricing ? tt("alerts.quoteLoadedLatestPrice", { quoteNo: quote.quote_no }) : tt("alerts.quoteLoaded", { quoteNo: quote.quote_no }),
      "success"
    );
  }

  function downloadQuoteTemplate() {
    downloadTextFile("quote-import-template.csv", `${IMPORT_TEMPLATE_HEADERS.join(",")}\n`);
  }

  async function onPreviewImport() {
    const file = dom.quoteImportFile?.files?.[0];
    if (!file) {
      dom.importSummary.textContent = tr("请先选择 CSV 文件。");
      return;
    }
    const text = await readFileAsText(file);
    const rows = parseCsv(text);
    if (rows.length === 0) {
      dom.importSummary.textContent = tr("文件为空或没有有效数据。");
      state.ui.importPreviewRows = [];
      renderImportPreview();
      return;
    }

    const previewRows = rows.map((row, index) => buildImportPreviewRow(row, index + 2));
    state.ui.importPreviewRows = previewRows;
    renderImportPreview();
  }

  function buildImportPreviewRow(row, lineNo) {
    const wantsAutoCreateCustomer = Boolean(dom.autoCreateCustomerDraft?.checked);
    const wantsAutoCreateProduct = Boolean(dom.autoCreateProductDraft?.checked);
    const autoCreateCustomer = wantsAutoCreateCustomer && canCreateCustomer();
    const autoCreateProduct = wantsAutoCreateProduct && canCreateProduct();
    let customer =
      findCustomerByCode(String(row.customer_code || "").trim()) ||
      findCustomerByName(String(row.customer_name || "").trim());
    let product = findProductBySku(String(row.sku || "").trim());
    const formula =
      findFormulaByCode(String(row.formula_code || "").trim()) ||
      selectBestFormula(customer || null, product || null) ||
      getActiveFormulas()[0];

    const issues = [];
    if (!customer && !autoCreateCustomer) {
      issues.push(wantsAutoCreateCustomer ? tr("当前账号无新增客户权限。") : "客户不存在");
    }
    if (!product && !autoCreateProduct) {
      issues.push(wantsAutoCreateProduct ? tr("当前账号无新增产品权限。") : "产品不存在");
    }

    if (!customer && autoCreateCustomer) {
      customer = createDraftCustomerFromImportRow(row);
      state.data.customers.push(customer);
    }
    if (!product && autoCreateProduct) {
      product = createDraftProductFromImportRow(row, formula?.id);
      state.data.products.push(product);
    }

    if (!formula) {
      issues.push("找不到匹配公式");
    }

    const payload = {
      customer_id: customer?.id || "",
      product_id: product?.id || "",
      formula_id: formula?.id || "",
      effective_month: String(row.effective_month || "").trim(),
      msrp: toNumber(row.rrp ?? row.msrp, product?.default_msrp || 0),
      cost_price: toNumber(row.cost_price, product?.default_cost || 0),
      db_rate: toRateInput(row.db_rate, customer?.default_db_rate || 0),
      customer_margin: toRateInput(row.customer_margin, customer?.default_customer_margin || 0),
      service_fee: toRateInput(row.service_fee, customer?.default_service_fee || 0),
      mkt_funding: toNumber(row.mkt_funding, customer?.default_mkt_funding || 0),
      stk_buffer: toNumber(row.stk_buffer, customer?.default_stk_buffer || 0),
      front_margin: toRateInput(row.front_margin, customer?.default_front_margin || 0),
      vat: toRateInput(row.vat, customer?.default_vat || 0),
      ura: toNumber(row.ura, customer?.default_ura || 0),
      remark: String(row.remark || "").trim(),
    };

    const calculation = formula ? calculateQuote(payload, formula) : null;
    const ok = issues.length === 0 && Boolean(calculation?.can_save);
    return {
      lineNo,
      row,
      payload,
      customer,
      product,
      formula,
      calculation,
      status: ok ? "PASS" : "FAIL",
      message: ok ? formatMoney(calculation.final_quote_price) : issues[0] || calculation?.error_messages?.[0] || "校验失败",
    };
  }

  function renderImportPreview() {
    if (!dom.importPreviewTableBody || !dom.importSummary) {
      return;
    }
    const rows = state.ui.importPreviewRows;
    if (rows.length === 0) {
      dom.importSummary.textContent = "";
      dom.importPreviewTableBody.innerHTML = `<tr><td colspan="7">${escapeHtml(tr("暂无数据"))}</td></tr>`;
      return;
    }

    const passed = rows.filter((item) => item.status === "PASS").length;
    dom.importSummary.textContent = tt("import.summary", {
      rows: rows.length,
      passed,
      failed: rows.length - passed,
    });
    dom.importPreviewTableBody.innerHTML = rows
      .map(
        (item) => `
          <tr>
            <td>${item.lineNo}</td>
            <td>${item.status === "PASS" ? renderStatusBadge("APPROVED") : renderStatusBadge("REJECTED")}</td>
            <td>${escapeHtml(item.customer?.customer_name || String(item.row.customer_name || ""))}</td>
            <td>${escapeHtml(item.product?.sku || String(item.row.sku || ""))}</td>
            <td>${escapeHtml(String(item.payload.effective_month || ""))}</td>
            <td>${escapeHtml(item.status === "PASS" ? formatMoney(item.calculation?.final_quote_price) : "--")}</td>
            <td>${escapeHtml(item.status === "PASS" ? "" : item.message)}</td>
          </tr>
        `
      )
      .join("");
    syncLanguage();
  }

  function onConfirmImport() {
    const rows = state.ui.importPreviewRows.filter((item) => item.status === "PASS");
    if (rows.length === 0) {
      dom.importSummary.textContent = tr("没有可导入的有效行，请先预校验。");
      return;
    }
    const operator = getCurrentOperator();
    rows.forEach((item) => {
      createQuoteFromPayload(item.payload, operator, { silent: true });
    });
    persistData();
    state.ui.importPreviewRows = [];
    renderAll();
    switchPage("quoteQueryPage");
    dom.importSummary.textContent = tt("import.created", { count: rows.length });
  }

  function onSaveFormula() {
    const now = nowIso();
    const id = String(dom.formulaEditId?.value || "").trim() || buildId("formula");
    const exists = getFormulaById(id);
    const formula = {
      id,
      formula_name: String(dom.formulaName?.value || "").trim(),
      formula_code: String(dom.formulaCode?.value || "").trim().toUpperCase(),
      formula_version: String(dom.formulaVersion?.value || "").trim() || "v1.0",
      applicable_customer_type: String(dom.formulaCustomerType?.value || "ALL").trim() || "ALL",
      applicable_product_series: String(dom.formulaProductSeries?.value || "ALL").trim() || "ALL",
      applicable_channel_type: String(dom.formulaChannelType?.value || "ALL").trim() || "ALL",
      formula_expression: String(dom.formulaExpression?.value || "").trim() || DEFAULT_FORMULA_EXPRESSION,
      allow_below_cost_draft: String(dom.formulaAllowBelowCost?.value || "false") === "true",
      status: "ACTIVE",
      remark: String(dom.formulaRemark?.value || "").trim(),
      created_at: exists?.created_at || now,
      updated_at: now,
    };
    if (!formula.formula_name || !formula.formula_code) {
      setAlert(dom.formulaFormAlert, tr("公式名称和公式编码不能为空。"), "danger");
      return;
    }
    if (exists) {
      replaceItem(state.data.formulas, formula.id, formula);
    } else {
      state.data.formulas.unshift(formula);
    }
    writeLog(exists ? "UPDATE_FORMULA" : "CREATE_FORMULA", formula.formula_code, exists || null, formula, getCurrentOperator());
    persistData();
    renderAll();
    resetFormulaForm();
    setAlert(dom.formulaFormAlert, tt("formula.saved", { code: formula.formula_code }), "success");
  }

  function resetFormulaForm() {
    setInputValue(dom.formulaEditId, "");
    setInputValue(dom.formulaName, "");
    setInputValue(dom.formulaCode, "");
    setInputValue(dom.formulaVersion, "v1.0");
    setInputValue(dom.formulaCustomerType, "ALL");
    setInputValue(dom.formulaProductSeries, "ALL");
    setInputValue(dom.formulaChannelType, "ALL");
    setInputValue(dom.formulaExpression, DEFAULT_FORMULA_EXPRESSION);
    if (dom.formulaAllowBelowCost) {
      dom.formulaAllowBelowCost.value = "false";
    }
    if (dom.formulaStatus) {
      dom.formulaStatus.value = "ACTIVE";
    }
    setInputValue(dom.formulaRemark, "");
    syncTrialMktFundingRate();
  }

  function runFormulaTrial() {
    const formula = {
      formula_expression: String(dom.formulaExpression?.value || "").trim() || DEFAULT_FORMULA_EXPRESSION,
      allow_below_cost_draft: String(dom.formulaAllowBelowCost?.value || "false") === "true",
    };
    const result = calculateQuote(
      {
        effective_month: getCurrentMonthValue(),
        msrp: toNumber(dom.trialMsrp?.value, 0),
        cost_price: toNumber(dom.trialCost?.value, 0),
        db_rate: toRateInput(dom.trialDbRate?.value, 0),
        customer_margin: toRateInput(dom.trialCustomerMargin?.value, 0),
        service_fee: toRateInput(dom.trialServiceFee?.value, 0),
        mkt_funding: toNumber(dom.trialMktFunding?.value, 0),
        stk_buffer: toNumber(dom.trialStkBuffer?.value, 0),
        front_margin: toRateInput(dom.trialFrontMargin?.value, 0),
        vat: toRateInput(dom.trialVat?.value, 0),
        ura: toNumber(dom.trialUra?.value, 0),
      },
      formula
    );
    const detailItems = [buildDetailItem("试算报价", formatMoney(result.final_quote_price))];
    if (canViewGrossProfit()) {
      detailItems.push(buildDetailItem("毛利额", formatMoney(result.gross_profit)));
    }
    if (canViewGrossMargin()) {
      detailItems.push(buildDetailItem("毛利率", formatPercent(result.gross_margin)));
    }
    detailItems.push(buildDetailItem("联合营销 / MKT Funding", formatMoney(result.mkt_funding)));
    detailItems.push(buildDetailItem("联合营销占比", formatPercent(result.mkt_funding_rate)));
    if (!canViewGrossProfit() && !canViewGrossMargin()) {
      detailItems.push(buildDetailItem("敏感价格口径", tr("已按权限隔离")));
    }
    detailItems.push(buildDetailItem("预警", renderWarningText(result.warning_level)));
    detailItems.push(buildDetailItem("审批流", result.approval_type === "SPECIAL" ? tr("加强审批") : tr("标准审批")));
    dom.formulaTrialResult.innerHTML = `
      <div class="detail-grid">
        ${detailItems.join("")}
      </div>
    `;
    syncTrialMktFundingRate();
    syncLanguage();
  }

  function renderFormulasTable() {
    if (!dom.formulasTableBody) {
      return;
    }
    const formulas = state.data.formulas.slice().sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at), "zh-CN"));
    dom.formulasTableBody.innerHTML = formulas
      .map(
        (formula) => `
          <tr>
            <td>${escapeHtml(formula.formula_name)}</td>
            <td>${escapeHtml(formula.formula_code)}</td>
            <td>${escapeHtml(formula.formula_version)}</td>
            <td>${escapeHtml(formula.applicable_customer_type)}</td>
            <td>${escapeHtml(formula.applicable_product_series)}</td>
            <td>${escapeHtml(formula.applicable_channel_type)}</td>
            <td>${escapeHtml(formula.allow_below_cost_draft ? "是" : "否")}</td>
            <td>${renderStatusBadge(formula.status)}</td>
            <td>
              <div class="inline-actions">
                <button class="btn" type="button" data-formula-action="edit" data-formula-id="${escapeHtml(formula.id)}">编辑</button>
                <button class="btn btn-danger" type="button" data-formula-action="delete" data-formula-id="${escapeHtml(formula.id)}">删除</button>
              </div>
            </td>
          </tr>
        `
      )
      .join("");
    syncLanguage();
  }

  function onFormulaTableAction(event) {
    const button = closestDataButton(event, "formulaAction");
    if (!button) {
      return;
    }
    const formula = getFormulaById(button.dataset.formulaId);
    if (!formula) {
      return;
    }
    if (button.dataset.formulaAction === "edit") {
      setInputValue(dom.formulaEditId, formula.id);
      setInputValue(dom.formulaName, formula.formula_name);
      setInputValue(dom.formulaCode, formula.formula_code);
      setInputValue(dom.formulaVersion, formula.formula_version);
      setInputValue(dom.formulaCustomerType, formula.applicable_customer_type);
      setInputValue(dom.formulaProductSeries, formula.applicable_product_series);
      setInputValue(dom.formulaChannelType, formula.applicable_channel_type);
      setInputValue(dom.formulaExpression, formula.formula_expression);
      if (dom.formulaAllowBelowCost) {
        dom.formulaAllowBelowCost.value = String(Boolean(formula.allow_below_cost_draft));
      }
      if (dom.formulaStatus) {
        dom.formulaStatus.value = formula.status;
      }
      setInputValue(dom.formulaRemark, formula.remark);
      switchPage("formulaPage");
      return;
    }
    if (isFormulaReferenced(formula.id)) {
      setAlert(dom.formulaFormAlert, tr("公式已被产品或报价引用，暂不能删除。"), "warn");
      return;
    }
    const confirmed = window.confirm(tt("confirm.formulaDelete", { code: formula.formula_code }));
    if (!confirmed) {
      return;
    }
    removeItem(state.data.formulas, formula.id);
    writeLog("DELETE_FORMULA", formula.formula_code, formula, null, getCurrentOperator());
    resetFormulaForm();
    persistData();
    renderAll();
    setAlert(dom.formulaFormAlert, tt("alerts.formulaDeleted", { code: formula.formula_code }), "success");
  }

  function onSaveProduct() {
    if (!canCreateProduct()) {
      setAlert(dom.productFormAlert, tr("当前账号无新增产品权限。"), "warn");
      return;
    }
    const now = nowIso();
    const id = String(dom.productEditId?.value || "").trim() || buildId("product");
    const exists = getProductById(id);
    const product = {
      id,
      product_name: String(dom.productName?.value || "").trim(),
      sku: String(dom.productSku?.value || "").trim().toUpperCase(),
      product_series: String(dom.productSeries?.value || "").trim(),
      product_model: String(dom.productModel?.value || "").trim(),
      variant: String(dom.productVariant?.value || "").trim(),
      launch_date: String(dom.productLaunchDate?.value || "").trim(),
      default_msrp: roundMoney(dom.productDefaultMsrp?.value || 0),
      default_cost: roundMoney(dom.productDefaultCost?.value || 0),
      default_formula_id: String(dom.productFormulaId?.value || "").trim(),
      remark: String(dom.productRemark?.value || "").trim(),
      status: "ACTIVE",
      created_at: exists?.created_at || now,
      updated_at: now,
    };
    if (!product.product_name || !product.sku) {
      setAlert(dom.productFormAlert, tr("产品名称和 SKU 不能为空。"), "danger");
      return;
    }
    if (exists) {
      replaceItem(state.data.products, product.id, product);
    } else {
      state.data.products.unshift(product);
    }
    const refreshQuotePricing = String(dom.quoteProductId?.value || "") === product.id;
    if (refreshQuotePricing) {
      syncLatestQuoteProductPricing(product);
    }
    writeLog(exists ? "UPDATE_PRODUCT" : "CREATE_PRODUCT", product.sku, exists || null, product, getCurrentOperator());
    persistData();
    renderAll();
    resetProductForm();
    setAlert(dom.productFormAlert, exists ? tr("产品主数据已更新。") : tr("产品主数据已新增。"), "success");
    if (refreshQuotePricing) {
      setAlert(dom.quoteCreateAlert, tr("当前报价页已同步产品最新零售价与 FOB。"), "success");
    }
  }

  function resetProductForm() {
    setInputValue(dom.productEditId, "");
    setInputValue(dom.productName, "");
    setInputValue(dom.productSku, "");
    setInputValue(dom.productSeries, "");
    setInputValue(dom.productModel, "");
    setInputValue(dom.productVariant, "");
    setInputValue(dom.productLaunchDate, "");
    setInputValue(dom.productDefaultMsrp, "");
    setInputValue(dom.productDefaultCost, "");
    if (dom.productFormulaId && getActiveFormulas()[0]) {
      dom.productFormulaId.value = getActiveFormulas()[0].id;
    }
    setInputValue(dom.productRemark, "");
  }

  function renderProductsTable() {
    if (!dom.productsTableBody) {
      return;
    }
    const canManageProduct = canCreateProduct();
    dom.productsTableBody.innerHTML = state.data.products
      .slice()
      .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at), "zh-CN"))
      .map((product) => {
        const formula = getFormulaById(product.default_formula_id);
        return `
          <tr>
            <td>${escapeHtml(product.product_name)}</td>
            <td>${escapeHtml(product.sku)}</td>
            <td>${escapeHtml(product.product_series)}</td>
            <td>${escapeHtml(product.product_model)}</td>
            <td>${escapeHtml(formatMoney(product.default_msrp))}</td>
            <td data-permission-key="view_fob">${escapeHtml(renderProtectedMoney(product.default_cost, CORE_PERMISSION_KEYS.VIEW_FOB))}</td>
            <td>${escapeHtml(formula?.formula_name || "-")}</td>
            <td>${renderStatusBadge(product.status)}</td>
            <td>
              <div class="inline-actions">
                ${canManageProduct ? `<button class="btn" type="button" data-product-action="edit" data-product-id="${escapeHtml(product.id)}">编辑</button>` : ""}
                ${canManageProduct ? `<button class="btn btn-danger" type="button" data-product-action="delete" data-product-id="${escapeHtml(product.id)}">删除</button>` : ""}
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
    syncLanguage();
  }

  function onProductsTableAction(event) {
    const button = closestDataButton(event, "productAction");
    if (!button) {
      return;
    }
    const product = getProductById(button.dataset.productId);
    if (!product) {
      return;
    }
    if (!canCreateProduct()) {
      setAlert(dom.productFormAlert, tr("当前账号无新增产品权限。"), "warn");
      return;
    }
    if (button.dataset.productAction === "edit") {
      setInputValue(dom.productEditId, product.id);
      setInputValue(dom.productName, product.product_name);
      setInputValue(dom.productSku, product.sku);
      setInputValue(dom.productSeries, product.product_series);
      setInputValue(dom.productModel, product.product_model);
      setInputValue(dom.productVariant, product.variant);
      setInputValue(dom.productLaunchDate, product.launch_date);
      setInputValue(dom.productDefaultMsrp, product.default_msrp);
      setInputValue(dom.productDefaultCost, product.default_cost);
      if (dom.productFormulaId) {
        dom.productFormulaId.value = product.default_formula_id;
      }
      setInputValue(dom.productRemark, product.remark);
      switchPage("productPage");
      return;
    }
    if (isProductReferenced(product.id)) {
      setAlert(dom.productFormAlert, tr("产品仍存在审批中的报价，暂不能删除。"), "warn");
      return;
    }
    const confirmed = window.confirm(tt("confirm.productDelete", { sku: product.sku }));
    if (!confirmed) {
      return;
    }
    removeItem(state.data.products, product.id);
    writeLog("DELETE_PRODUCT", product.sku, product, null, getCurrentOperator());
    resetProductForm();
    persistData();
    renderAll();
    setAlert(dom.productFormAlert, tt("alerts.productDeleted", { sku: product.sku }), "success");
  }

  function renderProductPagePresentation() {
    if (dom.saveProductBtn) {
      dom.saveProductBtn.disabled = !canCreateProduct();
      dom.saveProductBtn.textContent = canCreateProduct() ? tr("保存产品") : tr("当前账号无新增产品权限");
    }
    if (dom.resetProductBtn) {
      dom.resetProductBtn.disabled = !canCreateProduct();
    }
  }

  function getCustomerPageMode(role = getCurrentOperatorRole(), user = getCurrentOperator()) {
    if (hasAdministratorAccess(role)) {
      return "admin";
    }
    if (role === "SALES_MANAGER" && !canCreateCustomer(user)) {
      return "review";
    }
    return "request";
  }

  function onSaveCustomer() {
    if (!canCreateCustomer()) {
      setAlert(dom.customerFormAlert, tr("当前账号无新增客户权限。"), "warn");
      return;
    }
    if (getCustomerPageMode() === "admin") {
      saveCustomerMaster();
      return;
    }
    if (getCustomerPageMode() === "review") {
      setAlert(dom.customerFormAlert, tr("当前角色仅可查看申请详情，审批请在审批中心处理。"), "warn");
      return;
    }
    if (String(dom.customerRequestId?.value || "").trim()) {
      setAlert(dom.customerFormAlert, tr("当前表单加载的是历史申请详情，如需再次提报，请点击“复制为新申请”后再提交。"), "warn");
      return;
    }
    submitCustomerRequest();
  }

  function saveCustomerMaster() {
    const now = nowIso();
    const id = String(dom.customerEditId?.value || "").trim() || buildId("customer");
    const exists = getCustomerById(id);
    const generatedCode = syncCustomerCodeFromRule(true);
    const formalDate = String(dom.customerFormalDate?.value || "").trim();
    if (!formalDate || !generatedCode) {
      setAlert(dom.customerFormAlert, tr("请先填写客户名称和正式合作日期，系统会自动生成客户编码。"), "danger");
      return;
    }
    const customer = {
      id,
      customer_name: String(dom.customerName?.value || "").trim(),
      customer_code: generatedCode,
      formal_cooperation_date: formalDate,
      customer_level: String(dom.customerLevel?.value || "").trim() || "B",
      customer_type: String(dom.customerType?.value || "").trim() || "RETAIL",
      channel_type: String(dom.customerChannelType?.value || "").trim() || "OFFLINE",
      region: String(dom.customerRegion?.value || "").trim(),
      default_db_rate: toRateInput(dom.customerDbRate?.value, 0),
      default_customer_margin: toRateInput(dom.customerCustomerMargin?.value, 0),
      default_service_fee: toRateInput(dom.customerServiceFee?.value, 0),
      default_mkt_funding: roundMoney(dom.customerMktFunding?.value),
      default_stk_buffer: toNumber(dom.customerStkBuffer?.value, 0),
      default_front_margin: toRateInput(dom.customerFrontMargin?.value, 0),
      default_vat: toRateInput(dom.customerVat?.value, 0.2),
      default_ura: toNumber(dom.customerUra?.value, 0),
      default_approver_id: String(dom.customerApproverId?.value || ""),
      remark: String(dom.customerRemark?.value || "").trim(),
      status: "ACTIVE",
      created_at: exists?.created_at || now,
      updated_at: now,
    };
    if (!customer.customer_name || !customer.customer_code) {
      setAlert(dom.customerFormAlert, tr("请完整填写客户名称和客户编码。"), "danger");
      return;
    }
    if (exists) {
      replaceItem(state.data.customers, customer.id, customer);
    } else {
      state.data.customers.unshift(customer);
    }
    writeLog(exists ? "UPDATE_CUSTOMER" : "CREATE_CUSTOMER", customer.customer_code, exists || null, customer, getCurrentOperator());
    persistData();
    renderAll();
    setAlert(dom.customerFormAlert, exists ? tr("客户主数据已更新。") : tr("客户主数据已新增。"), "success");
    resetCustomerForm();
  }

  function submitCustomerRequest() {
    const operator = getCurrentOperator();
    const primaryAdmin = findPrimaryAdministratorUser();
    const businessHead = findFirstUserByRole("SALES_MANAGER") || findFirstUserByRole("BUSINESS_HEAD") || primaryAdmin;
    const financeHead = findFirstUserByRole("FINANCE_HEAD") || primaryAdmin;
    if (!businessHead) {
      setAlert(dom.customerFormAlert, tr("系统尚未配置业务负责人，无法提交客户申请。"), "danger");
      return;
    }
    if (!financeHead) {
      setAlert(dom.customerFormAlert, tr("系统尚未配置财务负责人，无法完成财务抄送配置。"), "danger");
      return;
    }

    const snapshot = collectCustomerFormSnapshot();
    if (!snapshot.formal_cooperation_date || !snapshot.customer_code) {
      setAlert(dom.customerFormAlert, tr("请先填写客户名称和正式合作日期，系统会自动生成客户编码。"), "danger");
      return;
    }
    if (!snapshot.customer_name || !snapshot.customer_code) {
      setAlert(dom.customerFormAlert, tr("请完整填写客户名称和客户编码。"), "danger");
      return;
    }
    const pendingDuplicate = state.data.customer_requests.find(
      (item) => item.customer_code === snapshot.customer_code && item.approval_status === "IN_PROGRESS"
    );
    if (pendingDuplicate) {
      setAlert(dom.customerFormAlert, tt("alerts.customerPendingRequest", { customerCode: snapshot.customer_code, requestNo: pendingDuplicate.request_no }), "warn");
      return;
    }

    const existingCustomer = snapshot.id ? getCustomerById(snapshot.id) : findCustomerByCode(snapshot.customer_code);
    const requestType = existingCustomer ? "POLICY_CHANGE" : "NEW_CUSTOMER";
    const now = nowIso();
    const request = {
      id: buildId("customer_request"),
      request_no: buildBusinessNo("CRQ", state.data.customer_requests),
      request_type: requestType,
      target_customer_id: existingCustomer?.id || snapshot.id || "",
      customer_name: snapshot.customer_name,
      customer_code: snapshot.customer_code,
      proposed_customer: {
        ...snapshot,
        id: existingCustomer?.id || snapshot.id || "",
        status: "ACTIVE",
        created_at: existingCustomer?.created_at || now,
        updated_at: now,
      },
      before_customer: existingCustomer ? { ...existingCustomer } : null,
      summary: buildCustomerRequestSummary(snapshot, existingCustomer),
      policy_snapshot: buildCustomerPolicySnapshot(snapshot),
      approval_status: "IN_PROGRESS",
      request_status: "PENDING_APPROVAL",
      current_node: 1,
      current_node_name: tr("业务负责人审批"),
      approver_id: businessHead.id,
      approver_name: businessHead.display_name,
      finance_cc_id: financeHead.id,
      finance_cc_name: financeHead.display_name,
      finance_cc_status: tr("待抄送"),
      finance_copied_at: "",
      initiated_by: operator.id,
      initiated_by_name: operator.display_name,
      initiated_at: now,
      approved_at: "",
      updated_at: now,
      nodes: [
        {
          id: buildId("customer_request_node"),
          node_order: 1,
          node_name: tr("业务负责人审批"),
          approver_id: businessHead.id,
          approver_name: businessHead.display_name,
          approval_status: "IN_PROGRESS",
          approval_comment: "",
          approved_at: "",
        },
      ],
    };

    state.data.customer_requests.unshift(request);
    writeLog(
      requestType === "NEW_CUSTOMER" ? "SUBMIT_NEW_CUSTOMER_REQUEST" : "SUBMIT_CUSTOMER_POLICY_REQUEST",
      request.customer_code,
      request.before_customer,
      {
        request_no: request.request_no,
        request_type: request.request_type,
        summary: request.summary,
        finance_cc_name: request.finance_cc_name,
      },
      operator
    );
    persistData();
    state.ui.activeCustomerRequestId = request.id;
    renderAll();
    setAlert(
      dom.customerFormAlert,
      tt("alerts.customerRequestSubmitted", { requestNo: request.request_no }),
      "success"
    );
    resetCustomerForm();
  }

  function collectCustomerFormSnapshot() {
    const generatedCode = syncCustomerCodeFromRule(true);
    return {
      id: String(dom.customerEditId?.value || "").trim(),
      customer_name: String(dom.customerName?.value || "").trim(),
      customer_code: generatedCode,
      formal_cooperation_date: String(dom.customerFormalDate?.value || "").trim(),
      customer_level: String(dom.customerLevel?.value || "").trim() || "B",
      customer_type: String(dom.customerType?.value || "").trim() || "RETAIL",
      channel_type: String(dom.customerChannelType?.value || "").trim() || "OFFLINE",
      region: String(dom.customerRegion?.value || "").trim(),
      default_db_rate: toRateInput(dom.customerDbRate?.value, 0),
      default_customer_margin: toRateInput(dom.customerCustomerMargin?.value, 0),
      default_service_fee: toRateInput(dom.customerServiceFee?.value, 0),
      default_mkt_funding: roundMoney(dom.customerMktFunding?.value),
      default_stk_buffer: toNumber(dom.customerStkBuffer?.value, 0),
      default_front_margin: toRateInput(dom.customerFrontMargin?.value, 0),
      default_vat: toRateInput(dom.customerVat?.value, 0.2),
      default_ura: toNumber(dom.customerUra?.value, 0),
      default_approver_id: String(dom.customerApproverId?.value || ""),
      remark: String(dom.customerRemark?.value || "").trim(),
    };
  }

  function buildCustomerPolicySnapshot(snapshot) {
    return [
      `${tr("正式合作日期")} ${snapshot.formal_cooperation_date || "-"}`,
      `${tr("默认 DB (F)")} ${formatPercent(snapshot.default_db_rate)}`,
      `${tr("默认 客户Margin (G)")} ${formatPercent(snapshot.default_customer_margin)}`,
      `${tr("默认 Service Fee (H)")} ${formatPercent(snapshot.default_service_fee)}`,
      `${tr("默认 联合营销 / MKT Funding")} ${formatMoney(snapshot.default_mkt_funding)}`,
      `${tr("默认 STKbuffer (I)")} ${formatMoney(snapshot.default_stk_buffer)}`,
      `${tr("默认 Front Margin (J)")} ${formatPercent(snapshot.default_front_margin)}`,
      `${tr("默认 VAT (K)")} ${formatPercent(snapshot.default_vat)}`,
      `${tr("默认 URA (L)")} ${formatMoney(snapshot.default_ura)}`,
      `${tr("渠道")} ${snapshot.channel_type}`,
    ].join(" / ");
  }

  function buildCustomerRequestSummary(snapshot, existingCustomer) {
    if (!existingCustomer) {
      return `${tr("新增客户申请")}；${buildCustomerPolicySnapshot(snapshot)}`;
    }
    const changes = [];
    if (String(existingCustomer.formal_cooperation_date || "") !== snapshot.formal_cooperation_date) {
      changes.push(`${tr("正式合作日期")} ${existingCustomer.formal_cooperation_date || "-"} -> ${snapshot.formal_cooperation_date || "-"}`);
    }
    if (existingCustomer.customer_level !== snapshot.customer_level) {
      changes.push(`${tr("等级")} ${existingCustomer.customer_level} -> ${snapshot.customer_level}`);
    }
    if (existingCustomer.customer_type !== snapshot.customer_type) {
      changes.push(`${tr("客户类型")} ${existingCustomer.customer_type} -> ${snapshot.customer_type}`);
    }
    if (existingCustomer.channel_type !== snapshot.channel_type) {
      changes.push(`${tr("渠道")} ${existingCustomer.channel_type} -> ${snapshot.channel_type}`);
    }
    if (String(existingCustomer.region || "") !== snapshot.region) {
      changes.push(`${tr("区域")} ${existingCustomer.region || "-"} -> ${snapshot.region || "-"}`);
    }
    if (Number(existingCustomer.default_db_rate || 0) !== Number(snapshot.default_db_rate || 0)) {
      changes.push(`${tr("默认 DB (F)")} ${formatPercent(existingCustomer.default_db_rate)} -> ${formatPercent(snapshot.default_db_rate)}`);
    }
    if (Number(existingCustomer.default_customer_margin || 0) !== Number(snapshot.default_customer_margin || 0)) {
      changes.push(`${tr("默认 客户Margin (G)")} ${formatPercent(existingCustomer.default_customer_margin)} -> ${formatPercent(snapshot.default_customer_margin)}`);
    }
    if (Number(existingCustomer.default_service_fee || 0) !== Number(snapshot.default_service_fee || 0)) {
      changes.push(`${tr("默认 Service Fee (H)")} ${formatPercent(existingCustomer.default_service_fee)} -> ${formatPercent(snapshot.default_service_fee)}`);
    }
    if (Number(existingCustomer.default_mkt_funding || 0) !== Number(snapshot.default_mkt_funding || 0)) {
      changes.push(`${tr("默认 联合营销 / MKT Funding")} ${formatMoney(existingCustomer.default_mkt_funding)} -> ${formatMoney(snapshot.default_mkt_funding)}`);
    }
    if (Number(existingCustomer.default_stk_buffer || 0) !== Number(snapshot.default_stk_buffer || 0)) {
      changes.push(`${tr("默认 STKbuffer (I)")} ${formatMoney(existingCustomer.default_stk_buffer)} -> ${formatMoney(snapshot.default_stk_buffer)}`);
    }
    if (Number(existingCustomer.default_front_margin || 0) !== Number(snapshot.default_front_margin || 0)) {
      changes.push(`${tr("默认 Front Margin (J)")} ${formatPercent(existingCustomer.default_front_margin)} -> ${formatPercent(snapshot.default_front_margin)}`);
    }
    if (Number(existingCustomer.default_vat || 0) !== Number(snapshot.default_vat || 0)) {
      changes.push(`${tr("默认 VAT (K)")} ${formatPercent(existingCustomer.default_vat)} -> ${formatPercent(snapshot.default_vat)}`);
    }
    if (Number(existingCustomer.default_ura || 0) !== Number(snapshot.default_ura || 0)) {
      changes.push(`${tr("默认 URA (L)")} ${formatMoney(existingCustomer.default_ura)} -> ${formatMoney(snapshot.default_ura)}`);
    }
    if (existingCustomer.default_approver_id !== snapshot.default_approver_id) {
      changes.push(
        `${tr("默认审批人")} ${(getUserById(existingCustomer.default_approver_id)?.display_name || "-")} -> ${(getUserById(snapshot.default_approver_id)?.display_name || "-")}`
      );
    }
    if (String(existingCustomer.remark || "") !== snapshot.remark) {
      changes.push(tr("备注已调整"));
    }
    return changes.length > 0 ? `${tr("客户政策变更")}；${changes.join("；")}` : `${tr("客户政策变更")}；${tr("未检测到核心政策差异，按当前填写内容重新提报审批。")}`;
  }

  function resetCustomerForm() {
    state.ui.activeCustomerRequestId = "";
    setInputValue(dom.customerEditId, "");
    setInputValue(dom.customerRequestId, "");
    if (dom.customerBaseCustomerId) {
      dom.customerBaseCustomerId.value = "";
    }
    setInputValue(dom.customerName, "");
    setInputValue(dom.customerCode, "");
    setInputValue(dom.customerFormalDate, "");
    setInputValue(dom.customerLevel, "B");
    setInputValue(dom.customerType, "RETAIL");
    setInputValue(dom.customerChannelType, "OFFLINE");
    setInputValue(dom.customerRegion, "");
    setInputValue(dom.customerDbRate, "0.0334");
    setInputValue(dom.customerCustomerMargin, "0.124");
    setInputValue(dom.customerServiceFee, "0.0012");
    setInputValue(dom.customerMktFunding, "0");
    setInputValue(dom.customerStkBuffer, "5");
    setInputValue(dom.customerFrontMargin, "0.005");
    setInputValue(dom.customerVat, "0.2");
    setInputValue(dom.customerUra, "5.5");
    const defaultApprover = getDefaultCustomerApproverUser();
    if (dom.customerApproverId && defaultApprover) {
      dom.customerApproverId.value = defaultApprover.id;
    }
    setInputValue(dom.customerRemark, "");
  }

  function renderCustomerPagePresentation() {
    const mode = getCustomerPageMode();
    const canManageCustomer = canCreateCustomer();
    if (dom.customerPanelTitle) {
      dom.customerPanelTitle.textContent = mode === "admin" ? tr("客户主数据管理") : mode === "review" ? tr("客户申请查看") : tr("客户申请");
    }
    if (dom.customerPageHint) {
      dom.customerPageHint.textContent =
        mode === "admin"
          ? canManageCustomer
            ? tr("系统管理员可维护已生效客户主数据。")
            : tr("当前账号可查看客户主数据，但没有新增或删除客户的权限。")
          : mode === "review"
            ? tr("此页用于查看客户申请详情，审批动作请在审批中心完成，审批通过后自动抄送财务。")
            : canManageCustomer
              ? tr("新增客户或客户政策变更需要先提交审批，审批通过后自动生效并抄送财务。")
              : tr("当前账号可查看客户申请记录，但没有新增或删除客户的权限。");
    }
    if (dom.customerTableTitle) {
      dom.customerTableTitle.textContent = mode === "admin" ? tr("客户列表") : tr("客户申请记录");
    }
    dom.customerRequestsWrap?.classList.toggle("role-hidden", mode === "admin");
    dom.customersMasterWrap?.classList.toggle("role-hidden", mode !== "admin");
    dom.customerBaseCustomerLabel?.classList.toggle("role-hidden", mode === "admin");
    if (dom.saveCustomerBtn) {
      dom.saveCustomerBtn.textContent = mode === "admin" ? tr("保存客户") : mode === "review" ? tr("审批请在审批中心处理") : tr("提交客户申请");
      if (!canManageCustomer && mode !== "review") {
        dom.saveCustomerBtn.textContent = tr("当前账号无新增客户权限");
      }
      dom.saveCustomerBtn.disabled = mode === "review" || !canManageCustomer;
    }
    if (dom.resetCustomerBtn) {
      dom.resetCustomerBtn.disabled = mode === "review" || !canManageCustomer;
    }
    setCustomerFormDisabled(mode === "review" || !canManageCustomer);
    syncLanguage();
  }

  function setCustomerFormDisabled(disabled) {
    [
      dom.customerBaseCustomerId,
      dom.customerName,
      dom.customerCode,
      dom.customerFormalDate,
      dom.customerLevel,
      dom.customerType,
      dom.customerChannelType,
      dom.customerRegion,
      dom.customerDbRate,
      dom.customerCustomerMargin,
      dom.customerServiceFee,
      dom.customerMktFunding,
      dom.customerStkBuffer,
      dom.customerFrontMargin,
      dom.customerVat,
      dom.customerUra,
      dom.customerApproverId,
      dom.customerRemark,
    ].forEach((element) => {
      if (!element) {
        return;
      }
      if (element instanceof HTMLSelectElement || element instanceof HTMLInputElement) {
        element.disabled = disabled;
      }
    });
  }

  function renderCustomersTable() {
    if (!dom.customersTableBody) {
      return;
    }
    const canManageCustomer = canCreateCustomer();
    dom.customersTableBody.innerHTML = state.data.customers
      .slice()
      .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at), "zh-CN"))
      .map((customer) => {
        const approver = getUserById(customer.default_approver_id);
        return `
          <tr>
            <td>${escapeHtml(customer.customer_name)}</td>
            <td>${escapeHtml(customer.customer_code)}</td>
            <td>${escapeHtml(customer.customer_level)}</td>
            <td>${escapeHtml(customer.customer_type)}</td>
            <td>${escapeHtml(customer.channel_type)}</td>
            <td>${escapeHtml(customer.region || "-")}</td>
            <td>${escapeHtml(formatPercent(customer.default_db_rate))}</td>
            <td>${escapeHtml(formatPercent(customer.default_customer_margin))}</td>
            <td>${escapeHtml(formatPercent(customer.default_service_fee))}</td>
            <td>${escapeHtml(formatMoney(customer.default_mkt_funding))}</td>
            <td>${escapeHtml(formatMoney(customer.default_stk_buffer))}</td>
            <td>${escapeHtml(formatPercent(customer.default_front_margin))}</td>
            <td>${escapeHtml(formatPercent(customer.default_vat))}</td>
            <td>${escapeHtml(formatMoney(customer.default_ura))}</td>
            <td>${escapeHtml(approver?.display_name || "-")}</td>
            <td>${renderStatusBadge(customer.status)}</td>
            <td>
              <div class="inline-actions">
                ${canManageCustomer ? `<button class="btn" type="button" data-customer-action="edit" data-customer-id="${escapeHtml(customer.id)}">编辑</button>` : ""}
                ${canManageCustomer ? `<button class="btn btn-danger" type="button" data-customer-action="delete" data-customer-id="${escapeHtml(customer.id)}">删除</button>` : ""}
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
    syncLanguage();
  }

  function renderCustomerRequestsTable() {
    if (!dom.customerRequestsTableBody) {
      return;
    }
    const rows = getVisibleCustomerRequests();
    const canDuplicate = getCustomerPageMode() === "request" && canCreateCustomer();
    if (rows.length === 0) {
      dom.customerRequestsTableBody.innerHTML = `<tr><td colspan="10">${escapeHtml(tr("暂无客户申请记录"))}</td></tr>`;
      return;
    }
    dom.customerRequestsTableBody.innerHTML = rows
      .map(
        (request) => `
          <tr>
            <td>${escapeHtml(request.request_no)}</td>
            <td>${escapeHtml(renderCustomerRequestType(request.request_type))}</td>
            <td>${escapeHtml(request.customer_name)}</td>
            <td>${escapeHtml(request.customer_code)}</td>
            <td>${escapeHtml(request.summary)}</td>
            <td>${escapeHtml(request.initiated_by_name)}</td>
            <td>${renderStatusBadge(request.approval_status)}</td>
            <td>${escapeHtml(tt("finance.ccStatus", { name: request.finance_cc_name || "-", status: tr(request.finance_cc_status || "待抄送") }))}</td>
            <td>${renderStatusBadge(request.request_status)}</td>
            <td>
              <div class="inline-actions">
                <button class="btn" type="button" data-customer-request-action="view" data-customer-request-id="${escapeHtml(request.id)}">查看</button>
                ${canDuplicate ? `<button class="btn" type="button" data-customer-request-action="copy" data-customer-request-id="${escapeHtml(request.id)}">复制为新申请</button>` : ""}
                ${canDeleteCustomerRequest(request) ? `<button class="btn btn-danger" type="button" data-customer-request-action="delete" data-customer-request-id="${escapeHtml(request.id)}">删除</button>` : ""}
              </div>
            </td>
          </tr>
        `
      )
      .join("");
    syncLanguage();
  }

  function getVisibleCustomerRequests() {
    const role = getCurrentOperatorRole();
    const operator = getCurrentOperator();
    const rows = state.data.customer_requests
      .slice()
      .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at), "zh-CN"));
    if (hasAdministratorAccess(role)) {
      return rows;
    }
    return rows.filter((item) => item.initiated_by === operator.id);
  }

  function onCustomerBaseChange() {
    if (getCustomerPageMode() !== "request") {
      return;
    }
    const customer = getCustomerById(dom.customerBaseCustomerId?.value);
    if (!customer) {
      setInputValue(dom.customerEditId, "");
      return;
    }
    loadCustomerIntoForm(customer, true);
    setInputValue(dom.customerRequestId, "");
    setAlert(dom.customerFormAlert, tt("alerts.customerPolicyLoaded", { customerCode: customer.customer_code }), "success");
  }

  function onCustomerRequestsTableAction(event) {
    const button = closestDataButton(event, "customerRequestAction");
    if (!button) {
      return;
    }
    const request = getCustomerRequestById(button.dataset.customerRequestId);
    if (!request) {
      return;
    }
    state.ui.activeCustomerRequestId = request.id;
    if (button.dataset.customerRequestAction === "view") {
      loadCustomerRequestIntoForm(request, false);
      return;
    }
    if (button.dataset.customerRequestAction === "copy") {
      loadCustomerRequestIntoForm(request, true);
      return;
    }
    if (button.dataset.customerRequestAction === "delete") {
      const confirmed = window.confirm(tt("confirm.customerRequestDelete", { requestNo: request.request_no }));
      if (!confirmed) {
        return;
      }
      removeItem(state.data.customer_requests, request.id);
      if (state.ui.activeCustomerRequestId === request.id) {
        resetCustomerForm();
      }
      writeLog("DELETE_CUSTOMER_REQUEST", request.request_no, request, null, getCurrentOperator());
      persistData();
      renderAll();
      setAlert(dom.customerFormAlert, tt("alerts.customerRequestDeleted", { requestNo: request.request_no }), "success");
    }
  }

  function loadCustomerIntoForm(customer, requestMode) {
    setInputValue(dom.customerEditId, requestMode ? customer.id : customer.id);
    setInputValue(dom.customerName, customer.customer_name);
    setInputValue(dom.customerFormalDate, customer.formal_cooperation_date || "");
    setInputValue(dom.customerCode, generateCustomerCode(customer.customer_name, customer.formal_cooperation_date) || customer.customer_code);
    setInputValue(dom.customerLevel, customer.customer_level);
    setInputValue(dom.customerType, customer.customer_type);
    setInputValue(dom.customerChannelType, customer.channel_type);
    setInputValue(dom.customerRegion, customer.region);
    setInputValue(dom.customerDbRate, customer.default_db_rate);
    setInputValue(dom.customerCustomerMargin, customer.default_customer_margin);
    setInputValue(dom.customerServiceFee, customer.default_service_fee);
    setInputValue(dom.customerMktFunding, customer.default_mkt_funding ?? 0);
    setInputValue(dom.customerStkBuffer, customer.default_stk_buffer);
    setInputValue(dom.customerFrontMargin, customer.default_front_margin);
    setInputValue(dom.customerVat, customer.default_vat);
    setInputValue(dom.customerUra, customer.default_ura);
    if (dom.customerApproverId) {
      dom.customerApproverId.value = customer.default_approver_id;
    }
    setInputValue(dom.customerRemark, customer.remark);
    if (dom.customerBaseCustomerId) {
      dom.customerBaseCustomerId.value = requestMode ? customer.id : "";
    }
  }

  function loadCustomerRequestIntoForm(request, duplicateAsNew) {
    const proposed = request.proposed_customer || {};
    setInputValue(dom.customerRequestId, duplicateAsNew ? "" : request.id);
    setInputValue(dom.customerEditId, proposed.id || request.target_customer_id || "");
    if (dom.customerBaseCustomerId) {
      dom.customerBaseCustomerId.value = proposed.id || request.target_customer_id || "";
    }
    setInputValue(dom.customerName, proposed.customer_name || request.customer_name);
    setInputValue(dom.customerFormalDate, proposed.formal_cooperation_date || "");
    setInputValue(
      dom.customerCode,
      generateCustomerCode(proposed.customer_name || request.customer_name, proposed.formal_cooperation_date || "") ||
        proposed.customer_code ||
        request.customer_code
    );
    setInputValue(dom.customerLevel, proposed.customer_level || "B");
    setInputValue(dom.customerType, proposed.customer_type || "RETAIL");
    setInputValue(dom.customerChannelType, proposed.channel_type || "OFFLINE");
    setInputValue(dom.customerRegion, proposed.region || "");
    setInputValue(dom.customerDbRate, proposed.default_db_rate ?? 0);
    setInputValue(dom.customerCustomerMargin, proposed.default_customer_margin ?? 0);
    setInputValue(dom.customerServiceFee, proposed.default_service_fee ?? 0);
    setInputValue(dom.customerMktFunding, proposed.default_mkt_funding ?? 0);
    setInputValue(dom.customerStkBuffer, proposed.default_stk_buffer ?? 0);
    setInputValue(dom.customerFrontMargin, proposed.default_front_margin ?? 0);
    setInputValue(dom.customerVat, proposed.default_vat ?? 0.2);
    setInputValue(dom.customerUra, proposed.default_ura ?? 0);
    if (dom.customerApproverId) {
      dom.customerApproverId.value = proposed.default_approver_id || "";
    }
    setInputValue(dom.customerRemark, proposed.remark || "");
    setAlert(
      dom.customerFormAlert,
      duplicateAsNew
        ? tt("alerts.customerRequestLoadedNew", { requestNo: request.request_no })
        : tt("alerts.customerRequestLoadedStatus", { requestNo: request.request_no, status: renderPlainStatus(request.request_status) }),
      duplicateAsNew ? "success" : "warn"
    );
  }

  function renderCustomerRequestType(type) {
    return type === "NEW_CUSTOMER" ? tr("新增客户") : tr("客户政策变更");
  }

  function renderAccountsPage() {
    if (!canManageAccounts()) {
      if (dom.accountRequestsTableBody) {
        dom.accountRequestsTableBody.innerHTML = `<tr><td colspan="9">${escapeHtml(tr("仅超级管理员 harbor 可查看账号审批数据"))}</td></tr>`;
      }
      if (dom.accountsTableBody) {
        dom.accountsTableBody.innerHTML = `<tr><td colspan="10">${escapeHtml(tr("仅超级管理员 harbor 可查看账号列表"))}</td></tr>`;
      }
      syncLanguage();
      return;
    }
    renderAccountRequestsTable();
    renderAccountsTable();
    syncLanguage();
  }

  function renderAccountRequestsTable() {
    if (!dom.accountRequestsTableBody) {
      return;
    }
    const rows = state.data.account_requests
      .slice()
      .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at), "zh-CN"));
    if (rows.length === 0) {
      dom.accountRequestsTableBody.innerHTML = `<tr><td colspan="9">${escapeHtml(tr("暂无账号申请"))}</td></tr>`;
      return;
    }
    dom.accountRequestsTableBody.innerHTML = rows
      .map(
        (request) => `
          <tr>
            <td>${escapeHtml(request.request_no)}</td>
            <td>${escapeHtml(request.applicant_name)}</td>
            <td>${escapeHtml(request.requested_user_name)}</td>
            <td>${escapeHtml(renderRoleLabel(request.requested_role))}</td>
            <td>${escapeHtml(request.team)}</td>
            <td>${escapeHtml(request.reason)}</td>
            <td>${renderStatusBadge(request.approval_status === "PENDING" ? "PENDING_APPROVAL" : request.approval_status)}</td>
            <td>${escapeHtml(renderAccountRequestResult(request))}</td>
            <td>
              <div class="inline-actions">
                <button class="btn" type="button" data-account-request-action="load" data-account-request-id="${escapeHtml(request.id)}">载入</button>
                ${request.approval_status === "PENDING" ? `<button class="btn" type="button" data-account-request-action="approve" data-account-request-id="${escapeHtml(request.id)}">批准生成</button>` : ""}
                ${request.approval_status === "PENDING" ? `<button class="btn btn-danger" type="button" data-account-request-action="reject" data-account-request-id="${escapeHtml(request.id)}">驳回</button>` : ""}
                <button class="btn btn-danger" type="button" data-account-request-action="delete" data-account-request-id="${escapeHtml(request.id)}">删除</button>
              </div>
            </td>
          </tr>
        `
      )
      .join("");
    syncLanguage();
  }

  function renderAccountRequestResult(request) {
    if (request.approval_status === "APPROVED") {
      return tt("account.requestResultApproved", { userName: request.requested_user_name });
    }
    if (request.approval_status === "REJECTED") {
      return tr("已驳回");
    }
    return tr("待审批");
  }

  function renderAccountsTable() {
    if (!dom.accountsTableBody) {
      return;
    }
    const rows = state.data.users
      .slice()
      .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at), "zh-CN"));
    dom.accountsTableBody.innerHTML = rows
      .map(
        (user) => `
          <tr>
            <td>${escapeHtml(user.display_name)}</td>
            <td>${escapeHtml(user.user_name)}</td>
            <td>${escapeHtml(renderRoleLabel(user.role))}</td>
            <td>${escapeHtml(user.position || "-")}</td>
            <td>${escapeHtml(user.team || "-")}</td>
            <td>${escapeHtml(buildPermissionSummary(user.permissions))}</td>
            <td>${renderStatusBadge(user.status)}</td>
            <td>${escapeHtml(formatDateTime(user.last_login_at))}</td>
            <td>${escapeHtml(renderAccountOrigin(user.account_origin))}</td>
            <td>
              <div class="inline-actions">
                <button class="btn" type="button" data-account-action="edit" data-account-id="${escapeHtml(user.id)}">编辑</button>
                <button class="btn" type="button" data-account-action="reset-password" data-account-id="${escapeHtml(user.id)}">重置密码</button>
                <button class="btn btn-danger" type="button" data-account-action="delete" data-account-id="${escapeHtml(user.id)}">删除</button>
              </div>
            </td>
          </tr>
        `
      )
      .join("");
    syncLanguage();
  }

  function onSaveAccount() {
    const operator = getCurrentOperator();
    if (!canManageAccounts(operator)) {
      setAlert(dom.accountFormAlert, tr("仅超级管理员 harbor 可以生成或维护账号。"), "danger");
      return;
    }
    const id = String(dom.accountEditId?.value || "").trim() || buildId("user");
    const exists = getUserById(id);
    const userName = String(dom.accountUserName?.value || "").trim().toLowerCase();
    const displayName = String(dom.accountDisplayName?.value || "").trim();
    const role = String(dom.accountRole?.value || "SALES_ENTRY");
    const team = String(dom.accountTeam?.value || "").trim();
    const position = String(dom.accountPosition?.value || "").trim();
    const password = String(dom.accountPassword?.value || "");
    const permissions = collectAccountPermissionsFromForm(role);
    const remark = String(dom.accountRemark?.value || "").trim();

    if (!userName || !displayName || !team) {
      setAlert(dom.accountFormAlert, tr("请完整填写显示名称、登录账号和所属团队。"), "danger");
      return;
    }
    if (!exists && !password) {
      setAlert(dom.accountFormAlert, tr("新账号必须设置初始密码。"), "danger");
      return;
    }
    const duplicate = state.data.users.find((item) => item.id !== id && String(item.user_name || "").toLowerCase() === userName);
    if (duplicate) {
      setAlert(dom.accountFormAlert, tt("alerts.accountExists", { userName }), "warn");
      return;
    }
    if (exists && isPrimaryAdministratorUser(exists) && (userName !== PRIMARY_ADMIN_USER_NAME || role !== "SYSTEM_ADMIN")) {
      setAlert(dom.accountFormAlert, tr("Harbor 超级管理员账号必须保留 SYSTEM_ADMIN 角色与固定登录名。"), "warn");
      return;
    }
    if (exists?.id === operator.id && !hasAdministratorAccess(role)) {
      setAlert(dom.accountFormAlert, tr("当前登录的管理员账号不能被降权。"), "warn");
      return;
    }

    const now = nowIso();
    const nextUser = {
      id,
      user_name: userName,
      display_name: displayName,
      role,
      permissions,
      team,
      position,
      status: "ACTIVE",
      password: password || exists?.password || TEMP_ACCOUNT_PASSWORD,
      account_origin: exists?.account_origin || "DIRECT_CREATE",
      approved_by: operator.id,
      approved_by_name: operator.display_name,
      last_login_at: exists?.last_login_at || "",
      remark,
      created_at: exists?.created_at || now,
      updated_at: now,
    };
    const nextUsers = exists ? state.data.users.map((item) => (item.id === nextUser.id ? nextUser : item)) : [nextUser].concat(state.data.users);
    if (countAdministratorUsers(nextUsers) < 1) {
      setAlert(dom.accountFormAlert, tr("至少保留一个管理员账号。"), "warn");
      return;
    }
    if (exists) {
      replaceItem(state.data.users, nextUser.id, nextUser);
    } else {
      state.data.users.unshift(nextUser);
    }
    writeLog(
      exists ? "UPDATE_ACCOUNT" : "CREATE_ACCOUNT",
      nextUser.user_name,
      exists
        ? { role: exists.role, position: exists.position || "", status: exists.status, permission_summary: buildPermissionSummary(exists.permissions) }
        : null,
      { role: nextUser.role, position: nextUser.position, status: nextUser.status, permission_summary: buildPermissionSummary(nextUser.permissions) },
      operator
    );
    persistData();
    renderAll();
    setAlert(dom.accountFormAlert, exists ? tt("alerts.accountUpdated", { userName: nextUser.user_name }) : tt("alerts.accountCreated", { userName: nextUser.user_name }), "success");
    resetAccountForm();
  }

  function onAccountRoleChange() {
    const role = String(dom.accountRole?.value || "SALES_ENTRY");
    setAccountPermissionInputs(buildDefaultPermissionsForRole(role));
  }

  function resetAccountForm() {
    setInputValue(dom.accountEditId, "");
    setInputValue(dom.accountDisplayName, "");
    setInputValue(dom.accountUserName, "");
    if (dom.accountRole) {
      dom.accountRole.value = "SALES_ENTRY";
    }
    setAccountPermissionInputs(buildDefaultPermissionsForRole("SALES_ENTRY"));
    setInputValue(dom.accountTeam, "");
    setInputValue(dom.accountPosition, "");
    setInputValue(dom.accountPassword, "");
    if (dom.accountStatus) {
      dom.accountStatus.value = "ACTIVE";
    }
    setInputValue(dom.accountRemark, "");
  }

  function onAccountRequestsTableAction(event) {
    const button = closestDataButton(event, "accountRequestAction");
    if (!button) {
      return;
    }
    const request = getAccountRequestById(button.dataset.accountRequestId);
    if (!request) {
      return;
    }
    const operator = getCurrentOperator();
    if (!canManageAccounts(operator)) {
      setAlert(dom.accountFormAlert, tr("仅超级管理员 harbor 可以审批账号申请。"), "danger");
      return;
    }
    const action = String(button.dataset.accountRequestAction || "");
    if (action === "load") {
      loadAccountRequestIntoForm(request);
      return;
    }
    if (action === "approve") {
      approveAccountRequest(request, operator);
      return;
    }
    if (action === "reject") {
      rejectAccountRequest(request, operator);
      return;
    }
    if (action === "delete") {
      const confirmed = window.confirm(tt("confirm.accountRequestDelete", { requestNo: request.request_no }));
      if (!confirmed) {
        return;
      }
      removeItem(state.data.account_requests, request.id);
      resetAccountForm();
      writeLog("DELETE_ACCOUNT_REQUEST", request.request_no, request, null, operator);
      persistData();
      renderAll();
      setAlert(dom.accountFormAlert, tt("alerts.accountRequestDeleted", { requestNo: request.request_no }), "success");
    }
  }

  function onAccountsTableAction(event) {
    const button = closestDataButton(event, "accountAction");
    if (!button) {
      return;
    }
    const account = getUserById(button.dataset.accountId);
    if (!account) {
      return;
    }
    const operator = getCurrentOperator();
    if (!canManageAccounts(operator)) {
      setAlert(dom.accountFormAlert, tr("仅超级管理员 harbor 可以维护账号。"), "danger");
      return;
    }
    const action = String(button.dataset.accountAction || "");
    if (action === "edit") {
      loadAccountIntoForm(account);
      return;
    }
    if (action === "reset-password") {
      replaceItem(state.data.users, account.id, {
        ...account,
        password: TEMP_ACCOUNT_PASSWORD,
        updated_at: nowIso(),
      });
      writeLog("RESET_ACCOUNT_PASSWORD", account.user_name, null, { temp_password: TEMP_ACCOUNT_PASSWORD }, operator);
      persistData();
      renderAll();
      setAlert(dom.accountFormAlert, tt("alerts.accountPasswordReset", { userName: account.user_name, password: TEMP_ACCOUNT_PASSWORD }), "success");
      return;
    }
    if (action === "delete") {
      if (isPrimaryAdministratorUser(account)) {
        setAlert(dom.accountFormAlert, tr("Harbor 超级管理员账号不能删除。"), "warn");
        return;
      }
      if (account.id === operator.id) {
        setAlert(dom.accountFormAlert, tr("不能删除当前正在登录的管理员账号。"), "warn");
        return;
      }
      if (hasAdministratorAccess(account.role) && countAdministratorUsers(state.data.users) <= 1) {
        setAlert(dom.accountFormAlert, tr("至少保留一个管理员账号。"), "warn");
        return;
      }
      if (isUserReferenced(account.id)) {
        setAlert(dom.accountFormAlert, tr("该账号仍被客户审批人、账号申请或审批流程引用，暂不能删除。"), "warn");
        return;
      }
      const confirmed = window.confirm(tt("confirm.accountDelete", { userName: account.user_name }));
      if (!confirmed) {
        return;
      }
      removeItem(state.data.users, account.id);
      writeLog("DELETE_ACCOUNT", account.user_name, account, null, operator);
      resetAccountForm();
      persistData();
      renderAll();
      setAlert(dom.accountFormAlert, tt("alerts.accountDeleted", { userName: account.user_name }), "success");
    }
  }

  function loadAccountIntoForm(account) {
    setInputValue(dom.accountEditId, account.id);
    setInputValue(dom.accountDisplayName, account.display_name);
    setInputValue(dom.accountUserName, account.user_name);
    if (dom.accountRole) {
      dom.accountRole.value = account.role;
    }
    setAccountPermissionInputs(normalizeUserPermissions(account.role, account.permissions));
    setInputValue(dom.accountTeam, account.team);
    setInputValue(dom.accountPosition, account.position || "");
    setInputValue(dom.accountPassword, "");
    if (dom.accountStatus) {
      dom.accountStatus.value = "ACTIVE";
    }
    setInputValue(dom.accountRemark, account.remark || "");
    setAlert(dom.accountFormAlert, tt("alerts.accountLoaded", { userName: account.user_name }), "success");
  }

  function loadAccountRequestIntoForm(request) {
    setInputValue(dom.accountEditId, "");
    setInputValue(dom.accountDisplayName, request.applicant_name);
    setInputValue(dom.accountUserName, request.requested_user_name);
    if (dom.accountRole) {
      dom.accountRole.value = request.requested_role;
    }
    setAccountPermissionInputs(buildDefaultPermissionsForRole(request.requested_role));
    setInputValue(dom.accountTeam, request.team);
    setInputValue(dom.accountPosition, request.requested_position || "");
    setInputValue(dom.accountPassword, "");
    if (dom.accountStatus) {
      dom.accountStatus.value = "ACTIVE";
    }
    setInputValue(dom.accountRemark, tt("remarks.fromAccountRequest", { requestNo: request.request_no }));
    setAlert(dom.accountFormAlert, tt("alerts.accountRequestLoaded", { requestNo: request.request_no }), "success");
  }

  function approveAccountRequest(request, operator) {
    if (request.approval_status !== "PENDING") {
      setAlert(dom.accountFormAlert, tt("alerts.accountRequestProcessed", { requestNo: request.request_no }), "warn");
      return;
    }
    if (!isValidApplicantPassword(request.requested_password)) {
      setAlert(dom.accountFormAlert, tr("该申请未包含有效密码，请通知申请人重新提交账号申请。"), "danger");
      return;
    }
    if (getUserByUserName(request.requested_user_name)) {
      setAlert(dom.accountFormAlert, tt("alerts.accountRequestDuplicateUser", { userName: request.requested_user_name }), "danger");
      return;
    }
    const now = nowIso();
    const user = {
      id: buildId("user"),
      user_name: request.requested_user_name,
      display_name: request.applicant_name,
      role: request.requested_role,
      permissions: buildDefaultPermissionsForRole(request.requested_role),
      team: request.team,
      position: request.requested_position || "",
      status: "ACTIVE",
      password: request.requested_password,
      account_origin: "ACCOUNT_REQUEST",
      approved_by: operator.id,
      approved_by_name: operator.display_name,
      last_login_at: "",
      remark: tt("remarks.generatedFromAccountRequest", { requestNo: request.request_no }),
      created_at: now,
      updated_at: now,
    };
    state.data.users.unshift(user);
    replaceItem(state.data.account_requests, request.id, {
      ...request,
      approval_status: "APPROVED",
      generated_user_id: user.id,
      generated_password: "",
      approved_at: now,
      updated_at: now,
    });
    writeLog(
      "APPROVE_ACCOUNT_REQUEST",
      request.requested_user_name,
      null,
      {
        request_no: request.request_no,
        position: user.position || "",
        permission_summary: buildPermissionSummary(user.permissions),
      },
      operator
    );
    persistData();
    renderAll();
    setAlert(dom.accountFormAlert, tt("alerts.accountRequestApproved", { requestNo: request.request_no, userName: user.user_name }), "success");
  }

  function rejectAccountRequest(request, operator) {
    if (request.approval_status !== "PENDING") {
      setAlert(dom.accountFormAlert, tt("alerts.accountRequestProcessedReject", { requestNo: request.request_no }), "warn");
      return;
    }
    replaceItem(state.data.account_requests, request.id, {
      ...request,
      approval_status: "REJECTED",
      approved_at: nowIso(),
      updated_at: nowIso(),
    });
    writeLog("REJECT_ACCOUNT_REQUEST", request.requested_user_name, null, { request_no: request.request_no }, operator);
    persistData();
    renderAll();
    setAlert(dom.accountFormAlert, tt("alerts.accountRequestRejected", { requestNo: request.request_no }), "success");
  }

  function renderAccountOrigin(origin) {
    const map = {
      SYSTEM_SEED: tr("系统初始化"),
      ACCOUNT_REQUEST: tr("账号申请生成"),
      DIRECT_CREATE: tr("管理员直接生成"),
    };
    return map[String(origin || "").toUpperCase()] || String(origin || "-");
  }

  function onCustomersTableAction(event) {
    const button = closestDataButton(event, "customerAction");
    if (!button) {
      return;
    }
    const customer = getCustomerById(button.dataset.customerId);
    if (!customer) {
      return;
    }
    if (!canCreateCustomer()) {
      setAlert(dom.customerFormAlert, tr("当前账号无新增客户权限。"), "warn");
      return;
    }
    if (button.dataset.customerAction === "edit") {
      setInputValue(dom.customerRequestId, "");
      loadCustomerIntoForm(customer, false);
      setAlert(dom.customerFormAlert, tt("alerts.customerMasterLoaded", { customerCode: customer.customer_code }), "success");
      switchPage("customerPage");
      return;
    }
    if (isCustomerReferenced(customer.id)) {
      setAlert(dom.customerFormAlert, tr("客户仍存在审批中的报价或客户申请，暂不能删除。"), "warn");
      return;
    }
    const confirmed = window.confirm(tt("confirm.customerDelete", { customerCode: customer.customer_code }));
    if (!confirmed) {
      return;
    }
    removeItem(state.data.customers, customer.id);
    writeLog("DELETE_CUSTOMER", customer.customer_code, customer, null, getCurrentOperator());
    resetCustomerForm();
    persistData();
    renderAll();
    setAlert(dom.customerFormAlert, tt("alerts.customerDeleted", { customerCode: customer.customer_code }), "success");
  }

  function renderApprovalsTable() {
    if (!dom.approvalsTableBody) {
      return;
    }
    const operator = getCurrentOperator();
    const rows = buildApprovalCenterRows(operator);
    if (rows.length === 0) {
      dom.approvalsTableBody.innerHTML = `<tr><td colspan="8">${escapeHtml(tr("暂无审批数据"))}</td></tr>`;
      return;
    }
    dom.approvalsTableBody.innerHTML = rows
      .map((row) => {
        const canProcess = row.scope === "quote"
          ? canCurrentOperatorProcessApproval(row.approval, operator)
          : row.scope === "customer"
            ? canCurrentOperatorProcessCustomerRequest(row.request, operator)
            : canCurrentOperatorProcessAccountRequest(row.request, operator);
        return `
          <tr>
            <td>${escapeHtml(row.approvalNo)}</td>
            <td>${escapeHtml(row.approvalType)}</td>
            <td>
              <div class="approval-object">
                <strong>${escapeHtml(row.targetName)}</strong>
                <span class="hint">${escapeHtml(row.targetCode)}</span>
                <span class="hint">${escapeHtml(row.summary)}</span>
              </div>
            </td>
            <td>
              <div class="approval-metrics">
                <strong>${escapeHtml(row.amount)}</strong>
                <div class="approval-meta-list">
                  <div class="approval-pair" data-permission-key="view_fob">
                    <span class="hint">${escapeHtml(tr("成本价 / FOB"))}</span>
                    <strong>${escapeHtml(row.sensitiveAmount)}</strong>
                  </div>
                  <div class="approval-pair" data-permission-key="view_gross_margin">
                    <span class="hint">${escapeHtml(tr("毛利率"))}</span>
                    <strong>${escapeHtml(row.sensitiveRate)}</strong>
                  </div>
                </div>
              </div>
            </td>
            <td>${row.policyOrWarning}</td>
            <td>
              <div class="approval-flow">
                <div class="approval-meta-list">
                  <div class="approval-pair">
                    <span class="hint">${escapeHtml(tr("发起人"))}</span>
                    <strong>${escapeHtml(row.initiatedBy)}</strong>
                  </div>
                  <div class="approval-pair">
                    <span class="hint">${escapeHtml(tr("当前审批节点"))}</span>
                    <strong>${escapeHtml(row.currentNode)}</strong>
                  </div>
                  <div class="approval-pair">
                    <span class="hint">${escapeHtml(tr("财务抄送"))}</span>
                    <strong>${escapeHtml(row.financeCc)}</strong>
                  </div>
                </div>
              </div>
            </td>
            <td>${renderStatusBadge(row.approvalStatus)}</td>
            <td>
              <div class="inline-actions inline-actions-compact">
                <button class="btn" type="button" data-approval-action="view" data-approval-scope="${escapeHtml(row.scope)}" data-approval-id="${escapeHtml(row.id)}">查看</button>
                ${row.scope === "quote" && row.approvalStatus === "APPROVED" ? `<button class="btn" type="button" data-approval-action="mail" data-approval-scope="quote" data-approval-id="${escapeHtml(row.id)}">${escapeHtml(tr("下载价格表"))}</button>` : ""}
                ${canProcess ? `<button class="btn" type="button" data-approval-action="approve" data-approval-scope="${escapeHtml(row.scope)}" data-approval-id="${escapeHtml(row.id)}">批准</button>` : ""}
                ${canProcess ? `<button class="btn btn-danger" type="button" data-approval-action="reject" data-approval-scope="${escapeHtml(row.scope)}" data-approval-id="${escapeHtml(row.id)}">驳回</button>` : ""}
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function onApprovalsTableAction(event) {
    const button = closestDataButton(event, "approvalAction");
    if (!button) {
      return;
    }
    const action = String(button.dataset.approvalAction || "");
    const scope = String(button.dataset.approvalScope || "quote");
    if (scope === "customer") {
      const request = getCustomerRequestById(button.dataset.approvalId);
      if (!request) {
        return;
      }
      if (action === "view") {
        state.ui.activeCustomerRequestId = request.id;
        switchPage("customerPage");
        loadCustomerRequestIntoForm(request, false);
        return;
      }
      processCustomerRequest(request.id, action, getCurrentOperator(), "", false);
      persistData();
      renderAll();
      return;
    }
    if (scope === "account") {
      const request = getAccountRequestById(button.dataset.approvalId);
      if (!request) {
        return;
      }
      if (action === "view") {
        switchPage("accountPage");
        loadAccountRequestIntoForm(request);
        return;
      }
      if (action === "approve") {
        approveAccountRequest(request, getCurrentOperator());
        return;
      }
      if (action === "reject") {
        rejectAccountRequest(request, getCurrentOperator());
      }
      return;
    }
    const approval = getApprovalById(button.dataset.approvalId);
    if (!approval) {
      return;
    }
    if (action === "view") {
      const quote = getQuoteById(approval.quote_id);
      if (quote) {
        state.ui.activeQuoteId = quote.id;
        applyQuoteFilters(quote);
        switchPage("quoteQueryPage");
      }
      return;
    }
    if (action === "mail") {
      const quote = getQuoteById(approval.quote_id);
      if (quote) {
        downloadCustomerPriceSheet(quote);
      }
      return;
    }
    processApproval(approval.id, action, getCurrentOperator(), "", false);
    persistData();
    renderAll();
  }

  function buildApprovalCenterRows(operator = getCurrentOperator()) {
    const quoteRows = state.data.approvals.map((approval) => {
      const quote = getQuoteById(approval.quote_id);
      return {
        id: approval.id,
        scope: "quote",
        updated_at: approval.updated_at,
        approval: approval,
        request: null,
        approvalNo: approval.approval_no,
        approvalType: approval.approval_type === "SPECIAL" ? tr("报价加强审批") : tr("报价标准审批"),
        targetName: approval.customer_name,
        targetCode: approval.sku,
        summary: quote?.product_name || "-",
        amount: formatMoney(quote?.final_quote_price || 0),
        sensitiveAmount: renderProtectedMoney(quote?.cost_price || 0, CORE_PERMISSION_KEYS.VIEW_FOB),
        sensitiveRate: renderProtectedPercent(quote?.gross_margin || 0, CORE_PERMISSION_KEYS.VIEW_GROSS_MARGIN),
        policyOrWarning: renderBadge(quote?.warning_level || "NONE"),
        initiatedBy: approval.initiated_by_name,
        currentNode: tr(approval.current_node_name || "-"),
        financeCc: "-",
        approvalStatus: approval.approval_status,
      };
    });
    const customerRows = state.data.customer_requests.map((request) => ({
      id: request.id,
      scope: "customer",
      updated_at: request.updated_at,
      approval: null,
      request: request,
      approvalNo: request.request_no,
      approvalType: renderCustomerRequestType(request.request_type),
      targetName: request.customer_name,
      targetCode: request.customer_code,
      summary: request.summary,
      amount: "-",
      sensitiveAmount: "-",
      sensitiveRate: "-",
      policyOrWarning: `<span class="hint">${escapeHtml(request.policy_snapshot || "-")}</span>`,
      initiatedBy: request.initiated_by_name,
      currentNode: tr(request.current_node_name || "-"),
      financeCc: renderFinanceCcStatus(request),
      approvalStatus: request.approval_status,
    }));
    const accountRows = canManageAccounts(operator)
      ? state.data.account_requests.map((request) => ({
          id: request.id,
          scope: "account",
          updated_at: request.updated_at,
          approval: null,
          request: request,
          approvalNo: request.request_no,
          approvalType: tr("申请账号"),
          targetName: request.applicant_name,
          targetCode: request.requested_user_name,
          summary: request.reason || "-",
          amount: "-",
          sensitiveAmount: "-",
          sensitiveRate: "-",
          policyOrWarning: `<span class="hint">${escapeHtml(`${renderRoleLabel(request.requested_role)} / ${request.team || "-"}`)}</span>`,
          initiatedBy: request.applicant_name,
          currentNode: request.approval_status === "PENDING" ? (request.approver_name || tr("待审批")) : tr("审批完成"),
          financeCc: "-",
          approvalStatus: request.approval_status === "PENDING" ? "PENDING_APPROVAL" : request.approval_status,
        }))
      : [];
    return quoteRows.concat(customerRows, accountRows).sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at), "zh-CN"));
  }

  function renderFinanceCcStatus(request) {
    if (!request?.finance_cc_name) {
      return "-";
    }
    return tt("finance.ccStatus", { name: request.finance_cc_name, status: tr(request.finance_cc_status || "待抄送") });
  }

  function canCurrentOperatorProcessCustomerRequest(request, operator) {
    if (!request || !operator || request.approval_status !== "IN_PROGRESS") {
      return false;
    }
    return hasAdministratorAccess(operator.role) || request.approver_id === operator.id;
  }

  function canCurrentOperatorProcessAccountRequest(request, operator) {
    if (!request || !operator || request.approval_status !== "PENDING") {
      return false;
    }
    return canManageAccounts(operator) || request.approver_id === operator.id;
  }

  function processCustomerRequest(requestId, action, operator, comment, silent) {
    const request = getCustomerRequestById(requestId);
    if (!request) {
      return;
    }
    if (!canCurrentOperatorProcessCustomerRequest(request, operator)) {
      if (!silent) {
        alert(tr("当前操作人不是该客户申请的处理人。"));
      }
      return;
    }
    const currentNode = (request.nodes || []).find((item) => item.node_order === request.current_node);
    if (!currentNode) {
      return;
    }
    const now = nowIso();
    if (action === "approve") {
      currentNode.approval_status = "APPROVED";
      currentNode.approval_comment = comment || tr("业务负责人审批通过");
      currentNode.approved_at = now;
      request.approval_status = "APPROVED";
      request.request_status = "APPROVED";
      request.current_node_name = tr("审批完成");
      request.approver_id = "";
      request.approver_name = "";
      request.approved_at = now;
      request.updated_at = now;
      request.finance_cc_status = tr("已抄送");
      request.finance_copied_at = now;
      applyApprovedCustomerRequest(request, operator, now);
      writeLog(
        "APPROVE_CUSTOMER_REQUEST",
        request.customer_code,
        { request_status: "PENDING_APPROVAL", request_no: request.request_no },
        { request_status: request.request_status, finance_cc_status: request.finance_cc_status, request_no: request.request_no },
        operator
      );
      return;
    }
    currentNode.approval_status = "REJECTED";
    currentNode.approval_comment = comment || tr("业务负责人审批驳回");
    currentNode.approved_at = now;
    request.approval_status = "REJECTED";
    request.request_status = "REJECTED";
    request.current_node_name = tr("审批驳回");
    request.updated_at = now;
    writeLog(
      "REJECT_CUSTOMER_REQUEST",
      request.customer_code,
      { request_status: "PENDING_APPROVAL", request_no: request.request_no },
      { request_status: request.request_status, request_no: request.request_no },
      operator
    );
  }

  function applyApprovedCustomerRequest(request, operator, now) {
    const existingCustomer = request.target_customer_id ? getCustomerById(request.target_customer_id) : findCustomerByCode(request.customer_code);
    const proposed = request.proposed_customer || {};
    const customer = {
      id: existingCustomer?.id || proposed.id || buildId("customer"),
      customer_name: proposed.customer_name || request.customer_name,
      customer_code: (proposed.customer_code || request.customer_code || "").toUpperCase(),
      formal_cooperation_date: proposed.formal_cooperation_date || "",
      customer_level: proposed.customer_level || "B",
      customer_type: proposed.customer_type || "RETAIL",
      channel_type: proposed.channel_type || "OFFLINE",
      region: proposed.region || "",
      default_db_rate: toRateInput(proposed.default_db_rate, 0),
      default_customer_margin: toRateInput(proposed.default_customer_margin, 0),
      default_service_fee: toRateInput(proposed.default_service_fee, 0),
      default_mkt_funding: roundMoney(proposed.default_mkt_funding),
      default_stk_buffer: toNumber(proposed.default_stk_buffer, 0),
      default_front_margin: toRateInput(proposed.default_front_margin, 0),
      default_vat: toRateInput(proposed.default_vat, 0.2),
      default_ura: toNumber(proposed.default_ura, 0),
      default_approver_id: proposed.default_approver_id || "",
      remark: proposed.remark || "",
      status: "ACTIVE",
      created_at: existingCustomer?.created_at || proposed.created_at || now,
      updated_at: now,
    };
    if (existingCustomer) {
      replaceItem(state.data.customers, customer.id, customer);
    } else {
      state.data.customers.unshift(customer);
    }
    request.target_customer_id = customer.id;
    request.proposed_customer.id = customer.id;
    writeLog(
      existingCustomer ? "APPLY_CUSTOMER_POLICY" : "CREATE_CUSTOMER_FROM_REQUEST",
      customer.customer_code,
      request.before_customer || null,
      customer,
      operator
    );
  }

  function processApproval(approvalId, action, operator, comment, silent) {
    const approval = getApprovalById(approvalId);
    const quote = getQuoteById(approval?.quote_id);
    if (!approval || !quote) {
      return;
    }
    if (!canCurrentOperatorProcessApproval(approval, operator)) {
      if (!silent) {
        alert(tr("当前操作人不是该审批节点的处理人。"));
      }
      return;
    }
    const currentNode = approval.nodes.find((item) => item.node_order === approval.current_node);
    if (!currentNode) {
      return;
    }
    const now = nowIso();
    if (action === "approve") {
      currentNode.approval_status = "APPROVED";
      currentNode.approval_comment = comment || tr("审批通过");
      currentNode.approved_at = now;
      const nextNode = approval.nodes.find((item) => item.node_order === approval.current_node + 1);
      if (nextNode) {
        nextNode.approval_status = "IN_PROGRESS";
        approval.current_node = nextNode.node_order;
        approval.current_node_name = nextNode.node_name;
        approval.approver_id = nextNode.approver_id;
        approval.approver_name = nextNode.approver_name;
        approval.approval_status = "IN_PROGRESS";
        quote.approval_status = "IN_PROGRESS";
        quote.quote_status = "PENDING_APPROVAL";
      } else {
        approval.approval_status = "APPROVED";
        approval.approved_at = now;
        approval.current_node_name = tr("审批完成");
        approval.approver_id = "";
        approval.approver_name = "";
        quote.approval_status = "APPROVED";
        quote.quote_status = getQuoteLifecycleStatus({ ...quote, approval_status: "APPROVED" }, getCurrentMonthValue());
        const customerQuoteSheet = ensureCustomerQuoteSheet(quote, { force: true, generatedAt: now });
        if (customerQuoteSheet) {
          writeLog(
            "GENERATE_CUSTOMER_QUOTE_SHEET",
            quote.quote_no,
            null,
            { generated_at: customerQuoteSheet.generated_at, html_filename: customerQuoteSheet.html_filename },
            operator
          );
        }
      }
      approval.updated_at = now;
      quote.updated_at = now;
      writeLog(
        "APPROVE",
        quote.quote_no,
        { approval_status: "IN_PROGRESS", approval_no: approval.approval_no },
        { approval_status: approval.approval_status, approval_no: approval.approval_no },
        operator
      );
      return;
    }
    currentNode.approval_status = "REJECTED";
    currentNode.approval_comment = comment || tr("审批驳回");
    currentNode.approved_at = now;
    approval.approval_status = "REJECTED";
    approval.updated_at = now;
    quote.approval_status = "REJECTED";
    quote.quote_status = "REJECTED_PENDING_EDIT";
    quote.updated_at = now;
    writeLog(
      "REJECT",
      quote.quote_no,
      { approval_status: "IN_PROGRESS", approval_no: approval.approval_no },
      { approval_status: "REJECTED", approval_no: approval.approval_no },
      operator
    );
  }

  function renderLogsPage() {
    renderLogFilterOptions();
    renderLogsPageCollapseState();
    renderLogsTable();
  }

  function renderLogsPageCollapseState() {
    dom.logsPageContent?.classList.toggle("role-hidden", Boolean(state.ui.logsPageCollapsed));
    if (dom.toggleLogsPageBtn) {
      dom.toggleLogsPageBtn.textContent = state.ui.logsPageCollapsed ? tr("展开页面") : tr("收起页面");
    }
  }

  function renderLogFilterOptions() {
    populateChoiceOptions(dom.logActionType, buildSimpleOptionItems(state.data.logs.map((item) => renderLogActionType(item.action_type))));
    populateChoiceOptions(dom.logOperatorName, buildSimpleOptionItems(state.data.logs.map((item) => item.operator_name)));
    setInputValue(dom.logTargetKeyword, state.ui.logFilters.targetKeyword);
    setInputValue(dom.logDateFrom, state.ui.logFilters.dateFrom);
    setInputValue(dom.logDateTo, state.ui.logFilters.dateTo);
    if (dom.logActionType) {
      dom.logActionType.value = state.ui.logFilters.actionType;
    }
    if (dom.logOperatorName) {
      dom.logOperatorName.value = state.ui.logFilters.operatorName;
    }
  }

  function onQueryLogs() {
    state.ui.logFilters = {
      actionType: String(dom.logActionType?.value || "").trim(),
      targetKeyword: String(dom.logTargetKeyword?.value || "").trim(),
      operatorName: String(dom.logOperatorName?.value || "").trim(),
      dateFrom: String(dom.logDateFrom?.value || "").trim(),
      dateTo: String(dom.logDateTo?.value || "").trim(),
    };
    state.ui.expandedLogIds = [];
    renderLogsPage();
  }

  function onResetLogs() {
    state.ui.logFilters = {
      actionType: "",
      targetKeyword: "",
      operatorName: "",
      dateFrom: "",
      dateTo: "",
    };
    state.ui.expandedLogIds = [];
    renderLogsPage();
  }

  function onToggleLogsPage() {
    state.ui.logsPageCollapsed = !state.ui.logsPageCollapsed;
    renderLogsPageCollapseState();
    syncLanguage();
  }

  function getFilteredLogs() {
    const filters = state.ui.logFilters || {};
    return state.data.logs
      .slice()
      .sort((a, b) => String(b.operated_at).localeCompare(String(a.operated_at), "zh-CN"))
      .filter((log) => {
        if (filters.actionType && renderLogActionType(log.action_type) !== filters.actionType) {
          return false;
        }
        if (filters.operatorName && String(log.operator_name || "") !== filters.operatorName) {
          return false;
        }
        if (filters.targetKeyword) {
          const keyword = filters.targetKeyword.toLowerCase();
          const haystacks = [
            renderLogActionType(log.action_type),
            log.target_name,
            log.operator_name,
            stringifyLogData(getVisibleLogPayload(log.before_data)),
            stringifyLogData(getVisibleLogPayload(log.after_data)),
          ]
            .join(" ")
            .toLowerCase();
          if (!haystacks.includes(keyword)) {
            return false;
          }
        }
        const dateValue = getDateInputValue(log.operated_at);
        if (filters.dateFrom && dateValue < filters.dateFrom) {
          return false;
        }
        if (filters.dateTo && dateValue > filters.dateTo) {
          return false;
        }
        return true;
      });
  }

  function renderLogsTable() {
    if (!dom.logsTableBody) {
      return;
    }
    const rows = getFilteredLogs();
    const canDelete = canDeleteLogs();
    if (dom.logsSummary) {
      dom.logsSummary.textContent = tt("logs.summary", { total: state.data.logs.length, count: rows.length });
    }
    if (rows.length === 0) {
      dom.logsTableBody.innerHTML = `<tr><td colspan="7">${escapeHtml(state.data.logs.length > 0 ? tr("暂无符合条件的日志") : tr("暂无日志"))}</td></tr>`;
      return;
    }
    dom.logsTableBody.innerHTML = rows
      .map((log) => {
        return `
          <tr>
            <td>${escapeHtml(renderLogActionType(log.action_type))}</td>
            <td>${escapeHtml(log.target_name)}</td>
            <td>${renderLogSummaryPreview(log)}</td>
            <td>${escapeHtml(log.operator_name)}</td>
            <td>${escapeHtml(formatDateTime(log.operated_at))}</td>
            <td><span class="device-summary">${escapeHtml(renderDeviceSummary(log.device_info))}</span></td>
            <td>
              ${canDelete ? `<div class="inline-actions inline-actions-compact"><button class="btn btn-danger" type="button" data-log-action="delete" data-log-id="${escapeHtml(log.id)}">${escapeHtml(tr("删除"))}</button></div>` : `<span class="hint">-</span>`}
            </td>
          </tr>
        `;
      })
      .join("");
    syncLanguage();
  }

  function onLogsTableAction(event) {
    const button = closestDataButton(event, "logAction");
    if (!button) {
      return;
    }
    const action = String(button.dataset.logAction || "");
    const logId = String(button.dataset.logId || "");
    if (!logId) {
      return;
    }
    if (action === "delete") {
      const log = getLogById(logId);
      if (!log || !canDeleteLogs()) {
        return;
      }
      const confirmed = window.confirm(tt("confirm.logDelete", { target: log.target_name || renderLogActionType(log.action_type) }));
      if (!confirmed) {
        return;
      }
      removeItem(state.data.logs, log.id);
      state.ui.expandedLogIds = state.ui.expandedLogIds.filter((item) => item !== log.id);
      persistData();
      renderLogsPage();
      return;
    }
  }

  function renderLogSummaryPreview(log) {
    const beforeEntries = buildLogEntries(getVisibleLogPayload(log.before_data), 2);
    const afterEntries = buildLogEntries(getVisibleLogPayload(log.after_data), 2);
    if (beforeEntries.length === 0 && afterEntries.length === 0) {
      return `<span class="log-empty">${escapeHtml(tr("无"))}</span>`;
    }
    const previewEntries = (afterEntries.length > 0 ? afterEntries : beforeEntries).slice(0, 2);
    return `
      <div class="log-summary-stack">
        <div class="log-preview-stats">
          <span class="badge badge-none">${escapeHtml(tt("logs.beforeCount", { count: beforeEntries.length }))}</span>
          <span class="badge badge-none">${escapeHtml(tt("logs.afterCount", { count: afterEntries.length }))}</span>
        </div>
        <div class="log-preview-list">
          ${previewEntries
            .map(
              (entry) => `
                <span class="log-preview-item">${escapeHtml(entry.label)}: ${escapeHtml(entry.value)}</span>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function renderLogSummaryDetail(log) {
    const beforeEntries = buildLogEntries(getVisibleLogPayload(log.before_data), 8);
    const afterEntries = buildLogEntries(getVisibleLogPayload(log.after_data), 8);
    if (beforeEntries.length === 0 && afterEntries.length === 0) {
      return `<span class="log-empty">${escapeHtml(tr("无"))}</span>`;
    }
    return `
      <div class="log-detail-wrap">
        <div class="panel-head">
          <h4>${escapeHtml(tr("日志详情"))}</h4>
          <span class="hint">${escapeHtml(log.target_name)}</span>
        </div>
        <div class="log-change-grid">
          ${beforeEntries.length > 0 ? renderLogSnapshot(tr("变更前"), beforeEntries) : ""}
          ${afterEntries.length > 0 ? renderLogSnapshot(tr("变更后"), afterEntries) : ""}
        </div>
      </div>
    `;
  }

  function renderLogSnapshot(title, entries) {
    return `
      <div class="log-card">
        <span class="log-card-title">${escapeHtml(title)}</span>
        <div class="log-field-list">
          ${entries
            .map(
              (entry) => `
                <div class="log-field">
                  <span>${escapeHtml(entry.label)}</span>
                  <strong>${escapeHtml(entry.value)}</strong>
                </div>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function buildLogEntries(payload, limit = 4) {
    if (!payload) {
      return [];
    }
    if (typeof payload !== "object") {
      return [{ label: tr("状态"), value: renderLogFieldValue("status", payload) }];
    }
    const priority = [
      "request_no",
      "approval_no",
      "quote_no",
      "customer_name",
      "customer_code",
      "sku",
      "product_name",
      "final_quote_price",
      "db_rate",
      "customer_margin",
      "service_fee",
      "mkt_funding",
      "mkt_funding_rate",
      "stk_buffer",
      "front_margin",
      "vat",
      "ura",
      "approval_status",
      "request_status",
      "finance_cc_status",
      "status",
      "role",
      "permission_summary",
      "summary",
      "generated_at",
      "html_filename",
    ];
    const entries = Object.entries(payload)
      .filter(([key, value]) => !shouldSkipLogField(key, value))
      .sort(([a], [b]) => {
        const aIndex = priority.indexOf(a);
        const bIndex = priority.indexOf(b);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      })
      .slice(0, limit);

    return entries.map(([key, value]) => ({
      label: renderLogFieldLabel(key),
      value: renderLogFieldValue(key, value),
    }));
  }

  function shouldSkipLogField(key, value) {
    if (value == null || value === "") {
      return true;
    }
    return [
      "id",
      "created_at",
      "updated_at",
      "remark",
      "nodes",
      "calculation_steps",
      "before_customer",
      "proposed_customer",
      "attachment_html",
      "attachment_text",
      "body_text",
    ].includes(String(key || ""));
  }

  function renderLogFieldLabel(key) {
    const labels = {
      request_no: tr("申请单号"),
      approval_no: tr("审批单号"),
      quote_no: tr("报价单号"),
      customer_name: tr("客户名称"),
      customer_code: tr("客户编码"),
      sku: tr("SKU"),
      product_name: tr("产品名称"),
      final_quote_price: tr("客户报价"),
      db_rate: tr("DB (F)"),
      customer_margin: tr("客户Margin (G)"),
      service_fee: tr("Service Fee (H)"),
      default_mkt_funding: tr("默认 联合营销 / MKT Funding"),
      mkt_funding: tr("联合营销 / MKT Funding"),
      mkt_funding_rate: tr("联合营销占比"),
      stk_buffer: tr("STKbuffer (I)"),
      front_margin: tr("Front Margin (J)"),
      vat: tr("VAT (K)"),
      ura: tr("URA (L)"),
      approval_status: tr("审批状态"),
      request_status: tr("申请状态"),
      finance_cc_status: tr("财务抄送"),
      status: tr("状态"),
      role: tr("账号角色"),
      permission_summary: tr("核心权限"),
      summary: tr("审批摘要"),
      generated_at: tr("操作时间"),
      html_filename: tr("附件文件"),
      generated_password: tr("临时密码"),
      temp_password: tr("临时密码"),
    };
    return labels[String(key || "")] || formatLogFieldKey(key);
  }

  function renderLogFieldValue(key, value) {
    const normalizedKey = String(key || "");
    if (normalizedKey === "role") {
      return renderRoleLabel(String(value || ""));
    }
    if (/(status|warning_level)$/i.test(normalizedKey)) {
      return renderPlainStatus(value);
    }
    if (/(generated_password|temp_password)/i.test(normalizedKey)) {
      return "******";
    }
    if (/(db_rate|customer_margin|service_fee|mkt_funding_rate|front_margin|vat)/i.test(normalizedKey)) {
      return formatPercent(value);
    }
    if (/(mkt_funding|stk_buffer|ura|price|cost|amount)/i.test(normalizedKey)) {
      return formatMoney(value);
    }
    if (/_at$/i.test(normalizedKey)) {
      return formatDateTime(value);
    }
    if (Array.isArray(value)) {
      return value.slice(0, 2).map((item) => String(item)).join(", ");
    }
    if (value && typeof value === "object") {
      return tr("已更新");
    }
    return String(value);
  }

  function formatLogFieldKey(key) {
    return String(key || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function renderDeviceSummary(value) {
    const text = String(value || "").trim();
    if (!text) {
      return tr("Browser");
    }
    const browser = /firefox/i.test(text)
      ? "Firefox"
      : /edg/i.test(text)
        ? "Edge"
        : /chrome/i.test(text) && !/edg/i.test(text)
          ? "Chrome"
          : /safari/i.test(text) && !/chrome/i.test(text)
            ? "Safari"
            : tr("Browser");
    const os = /Mac OS X|Macintosh/i.test(text)
      ? "macOS"
      : /Windows/i.test(text)
        ? "Windows"
        : /Android/i.test(text)
          ? "Android"
          : /iPhone|iPad|iOS/i.test(text)
            ? "iOS"
            : "";
    return os ? `${browser} / ${os}` : browser;
  }

  function exportCurrentQuotes() {
    const records = getFilteredQuotes();
    const referenceMonth = getQuoteReferenceMonthFromDom();
    state.ui.filteredQuotes = records;
    if (records.length === 0) {
      setAlert(dom.quoteQueryAlert, tr("当前筛选条件下没有可导出的价格结果。"), "warn");
      return;
    }
    const header = ["quote_no", "customer_name", "customer_code", "product_series", "sku", "product_name", "msrp"];
    if (canViewFob()) {
      header.push("cost_price");
    }
    header.push("db_rate", "customer_margin", "service_fee", "mkt_funding", "mkt_funding_rate", "stk_buffer", "front_margin", "vat", "ura", "final_quote_price");
    if (canViewGrossProfit()) {
      header.push("gross_profit");
    }
    if (canViewGrossMargin()) {
      header.push("gross_margin");
    }
    header.push("warning_level", "approval_status", "quote_status", "effective_month", "created_by_name", "created_at");
    const lines = [header.join(",")].concat(
      records.map((quote) =>
        header
          .map((key) => {
            const value =
              key === "quote_status"
                ? getQuoteLifecycleStatus(quote, referenceMonth)
                : typeof quote[key] === "number"
                  ? String(quote[key])
                  : quote[key];
            return escapeCsvValue(value);
          })
          .join(",")
      )
    );
    downloadTextFile(`quotes-export-${compactNow()}.csv`, lines.join("\n"));
    setAlert(dom.quoteQueryAlert, tr("当前价格结果已导出为 CSV。"), "success");
  }

  function downloadCurrentQuotesPriceSheet() {
    const records = getFilteredQuotes();
    state.ui.filteredQuotes = records;
    const approvedQuotes = records.filter((quote) => quote.approval_status === "APPROVED");
    if (approvedQuotes.length === 0) {
      setAlert(dom.quoteQueryAlert, tr("当前没有可下载的已审批价格。"), "warn");
      return;
    }
    const bundle = buildCurrentQuotesPriceSheetPdf(approvedQuotes);
    downloadBlobFile(bundle.filename, bundle.blob);
    setAlert(dom.quoteQueryAlert, tt("details.mailDownloadPdf", { filename: bundle.filename }), "success");
  }

  function buildCurrentQuotesPriceSheet(records) {
    const generatedAt = nowIso();
    const customerNames = Array.from(new Set(records.map((item) => String(item.customer_name || "").trim()).filter(Boolean)));
    const customerLabel = customerNames.length === 1 ? customerNames[0] : tr("多个客户");
    const effectiveMonthLabel = resolveCurrentQuoteQueryEffectiveLabel(records);
    const title = tr("客户价格表");
    const summaryText =
      customerNames.length === 1 ? tr("以下为当前客户的已审批价格，请查收。") : tr("以下为当前筛选结果中的已审批价格，请查收。");
    const tableRows = records
      .map(
        (quote) => `
          <tr>
            <td>${escapeHtml(quote.customer_name)}</td>
            <td>${escapeHtml(quote.product_name)}</td>
            <td>${escapeHtml(quote.sku)}</td>
            <td>${escapeHtml(quote.product_series)}</td>
            <td>${escapeHtml(quote.effective_month)}</td>
            <td>${escapeHtml(formatMoney(quote.msrp))}</td>
            <td>${escapeHtml(formatMoney(quote.final_quote_price))}</td>
          </tr>
        `
      )
      .join("");
    const attachmentHtml = `<!DOCTYPE html>
<html lang="${escapeHtml(document.documentElement.lang || "zh-CN")}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
      }
      body {
        margin: 0;
        background: #f4f7fb;
        color: #182433;
        font: 14px/1.6 "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
      }
      .sheet {
        max-width: 960px;
        margin: 32px auto;
        padding: 32px;
        background: #ffffff;
        border: 1px solid #d8e0ea;
        border-radius: 20px;
        box-shadow: 0 12px 28px rgba(19, 34, 62, 0.08);
      }
      .eyebrow {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 999px;
        background: #eaf2ff;
        color: #1858c8;
        font-size: 12px;
        letter-spacing: 0.04em;
      }
      h1 {
        margin: 12px 0 8px;
        font-size: 28px;
      }
      p {
        margin: 0 0 16px;
        color: #66758a;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
        margin: 24px 0;
      }
      .summary-card {
        padding: 14px 16px;
        border: 1px solid #d8e0ea;
        border-radius: 16px;
        background: #f8fafc;
      }
      .summary-card span {
        display: block;
        margin-bottom: 6px;
        color: #66758a;
        font-size: 12px;
      }
      .summary-card strong {
        font-size: 18px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 24px 0;
      }
      th,
      td {
        padding: 12px 14px;
        border: 1px solid #d8e0ea;
        text-align: left;
        vertical-align: top;
      }
      th {
        background: #f8fafc;
        color: #66758a;
        font-weight: 600;
      }
      .footer {
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid #d8e0ea;
        color: #66758a;
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <span class="eyebrow">${escapeHtml(tr("客户价格表"))}</span>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(summaryText)}</p>
      <div class="summary-grid">
        <div class="summary-card">
          <span>${escapeHtml(tr("客户名称"))}</span>
          <strong>${escapeHtml(customerLabel)}</strong>
        </div>
        <div class="summary-card">
          <span>${escapeHtml(tr("查询月份"))}</span>
          <strong>${escapeHtml(effectiveMonthLabel)}</strong>
        </div>
        <div class="summary-card">
          <span>${escapeHtml(tr("报价记录"))}</span>
          <strong>${escapeHtml(String(records.length))}</strong>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>${escapeHtml(tr("客户名称"))}</th>
            <th>${escapeHtml(tr("产品名称"))}</th>
            <th>${escapeHtml(tr("SKU"))}</th>
            <th>${escapeHtml(tr("产品系列"))}</th>
            <th>${escapeHtml(tr("生效月份"))}</th>
            <th>${escapeHtml(tr("RRP"))}</th>
            <th>${escapeHtml(tr("客户报价"))}</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div class="footer">
        <div>${escapeHtml(tt("details.systemGeneratedAt", { time: formatDateTime(generatedAt) }))}</div>
      </div>
    </div>
  </body>
</html>`;
    return {
      filename: buildCurrentQuotesPriceSheetFilename(customerNames),
      html: attachmentHtml,
    };
  }

  function buildCurrentQuotesPriceSheetPdf(records) {
    const generatedAt = nowIso();
    const customerNames = Array.from(new Set(records.map((item) => String(item.customer_name || "").trim()).filter(Boolean)));
    const customerLabel = customerNames.length === 1 ? customerNames[0] : tr("多个客户");
    const effectiveMonthLabel = resolveCurrentQuoteQueryEffectiveLabel(records);
    const summaryText =
      customerNames.length === 1 ? tr("以下为当前客户的已审批价格，请查收。") : tr("以下为当前筛选结果中的已审批价格，请查收。");
    const pdfBundle = buildPdfTableReport({
      filename: buildCurrentQuotesPriceSheetFilename(customerNames, "pdf"),
      title: tr("客户价格表"),
      subtitle: summaryText,
      summaryCards: [
        { label: tr("客户名称"), value: customerLabel },
        { label: tr("查询月份"), value: effectiveMonthLabel },
        { label: tr("报价记录"), value: String(records.length) },
      ],
      tableHeaders: [tr("客户名称"), tr("产品名称"), tr("SKU"), tr("产品系列"), tr("生效月份"), tr("RRP"), tr("客户报价")],
      columnRatios: [1.45, 1.7, 1.2, 1.2, 1.05, 1, 1.1],
      tableRows: records.map((quote) => [
        quote.customer_name,
        quote.product_name,
        quote.sku,
        quote.product_series,
        quote.effective_month,
        formatMoney(quote.msrp),
        formatMoney(quote.final_quote_price),
      ]),
      footerLines: [tt("details.systemGeneratedAt", { time: formatDateTime(generatedAt) })],
    });
    return pdfBundle;
  }

  function resolveCurrentQuoteQueryEffectiveLabel(records) {
    const selectedMonth = normalizeMonthValue(dom.queryEffectiveMonth?.value || "");
    if (selectedMonth) {
      return selectedMonth;
    }
    return getCurrentMonthValue();
  }

  function buildCurrentQuotesPriceSheetFilename(customerNames, extension = "html") {
    const baseName = customerNames.length === 1 ? sanitizeFilename(customerNames[0]) : compactToday();
    return `${baseName}-${tt("mail.listFileBase")}.${extension}`;
  }

  function downloadCustomerPriceSheet(quote, alertContainer) {
    const customerQuoteSheet = ensureCustomerQuoteSheet(quote, { force: true });
    if (!customerQuoteSheet) {
      setAlert(alertContainer, tr("当前报价尚未审批通过，暂时不能下载客户价格表。"), "warn");
      return false;
    }
    const pdfBundle = buildCustomerQuoteSheetPdf(quote, customerQuoteSheet);
    downloadBlobFile(pdfBundle.filename, pdfBundle.blob);
    setAlert(alertContainer, tt("details.mailDownloadPdf", { filename: pdfBundle.filename }), "success");
    return true;
  }

  function applyQuoteFilters(quote) {
    if (!quote || !dom.quoteQueryForm) {
      return;
    }
    setInputValue(dom.queryCustomerName, quote.customer_name);
    setInputValue(dom.queryCustomerCode, quote.customer_code);
    setInputValue(dom.querySku, quote.sku);
    setInputValue(dom.queryProductName, quote.product_name);
    setInputValue(dom.queryProductSeries, quote.product_series);
    setInputValue(dom.queryEffectiveMonth, quote.effective_month);
    setInputValue(dom.queryQuoteStatus, getQuoteLifecycleStatus(quote, quote.effective_month));
    setInputValue(dom.queryApprovalStatus, quote.approval_status);
    setInputValue(dom.queryFormulaVersion, quote.formula_version);
  }

  function writeLog(actionType, targetName, beforeData, afterData, operator) {
    state.data.logs.unshift({
      id: buildId("log"),
      action_type: actionType,
      target_name: targetName,
      before_data: beforeData,
      after_data: afterData,
      operator_id: operator.id,
      operator_name: operator.display_name,
      operated_at: nowIso(),
      device_info: navigator.userAgent || "Browser",
    });
  }

  function buildVirtualOperator(displayName) {
    return {
      id: "virtual_guest",
      display_name: displayName,
    };
  }

  function getActiveUsers() {
    return state.data.users.filter((item) => item.status === "ACTIVE");
  }

  function getActiveCustomers() {
    return state.data.customers.filter((item) => item.status === "ACTIVE");
  }

  function getActiveProducts() {
    return state.data.products.filter((item) => item.status === "ACTIVE");
  }

  function getActiveFormulas() {
    return state.data.formulas.filter((item) => item.status === "ACTIVE");
  }

  function ensureApprovedCustomerQuoteSheets() {
    let changed = false;
    state.data.quotes.forEach((quote) => {
      if (quote.approval_status !== "APPROVED") {
        return;
      }
      const previousVersion = quote.customer_quote_sheet?.version || 0;
      const customerQuoteSheet = ensureCustomerQuoteSheet(quote);
      if (customerQuoteSheet && previousVersion !== customerQuoteSheet.version) {
        changed = true;
      }
    });
    if (changed) {
      persistData();
    }
  }

  function ensureCustomerQuoteSheet(quote, options = {}) {
    if (!quote || quote.approval_status !== "APPROVED") {
      return null;
    }
    const approval = getApprovalByQuoteId(quote.id);
    const existingSheet = quote.customer_quote_sheet;
    const shouldRefresh = Boolean(
      options.force ||
      !existingSheet ||
      existingSheet.version !== CUSTOMER_QUOTE_SHEET_VERSION ||
      existingSheet.language !== getCurrentLanguage()
    );
    if (shouldRefresh) {
      quote.customer_quote_sheet = buildCustomerQuoteSheet(quote, approval, options.generatedAt || approval?.approved_at || quote.updated_at || nowIso());
    }
    return quote.customer_quote_sheet;
  }

  function getCurrentOperator() {
    return getUserById(state.ui.selectedOperatorId);
  }

  function getCurrentOperatorRole() {
    return getCurrentOperator()?.role || "";
  }

  function buildDefaultPermissionsForRole(role) {
    const isAdmin = ADMIN_ROLES.has(String(role || "").toUpperCase());
    if (isAdmin) {
      return {
        [CORE_PERMISSION_KEYS.CREATE_CUSTOMER]: true,
        [CORE_PERMISSION_KEYS.CREATE_PRODUCT]: true,
        [CORE_PERMISSION_KEYS.VIEW_FOB]: true,
        [CORE_PERMISSION_KEYS.VIEW_GROSS_MARGIN]: true,
        [CORE_PERMISSION_KEYS.VIEW_GROSS_PROFIT]: true,
      };
    }
    if (role === "SALES_ENTRY") {
      return {
        [CORE_PERMISSION_KEYS.CREATE_CUSTOMER]: true,
        [CORE_PERMISSION_KEYS.CREATE_PRODUCT]: false,
        [CORE_PERMISSION_KEYS.VIEW_FOB]: false,
        [CORE_PERMISSION_KEYS.VIEW_GROSS_MARGIN]: false,
        [CORE_PERMISSION_KEYS.VIEW_GROSS_PROFIT]: false,
      };
    }
    return {
      [CORE_PERMISSION_KEYS.CREATE_CUSTOMER]: false,
      [CORE_PERMISSION_KEYS.CREATE_PRODUCT]: false,
      [CORE_PERMISSION_KEYS.VIEW_FOB]: false,
      [CORE_PERMISSION_KEYS.VIEW_GROSS_MARGIN]: false,
      [CORE_PERMISSION_KEYS.VIEW_GROSS_PROFIT]: false,
    };
  }

  function normalizeUserPermissions(role, permissions) {
    const defaults = buildDefaultPermissionsForRole(role);
    const raw = permissions && typeof permissions === "object" ? permissions : {};
    return {
      [CORE_PERMISSION_KEYS.CREATE_CUSTOMER]: Boolean(raw[CORE_PERMISSION_KEYS.CREATE_CUSTOMER] ?? defaults[CORE_PERMISSION_KEYS.CREATE_CUSTOMER]),
      [CORE_PERMISSION_KEYS.CREATE_PRODUCT]: Boolean(raw[CORE_PERMISSION_KEYS.CREATE_PRODUCT] ?? defaults[CORE_PERMISSION_KEYS.CREATE_PRODUCT]),
      [CORE_PERMISSION_KEYS.VIEW_FOB]: Boolean(raw[CORE_PERMISSION_KEYS.VIEW_FOB] ?? defaults[CORE_PERMISSION_KEYS.VIEW_FOB]),
      [CORE_PERMISSION_KEYS.VIEW_GROSS_MARGIN]: Boolean(raw[CORE_PERMISSION_KEYS.VIEW_GROSS_MARGIN] ?? defaults[CORE_PERMISSION_KEYS.VIEW_GROSS_MARGIN]),
      [CORE_PERMISSION_KEYS.VIEW_GROSS_PROFIT]: Boolean(raw[CORE_PERMISSION_KEYS.VIEW_GROSS_PROFIT] ?? defaults[CORE_PERMISSION_KEYS.VIEW_GROSS_PROFIT]),
    };
  }

  function getPermissionsForUser(user = getCurrentOperator()) {
    return normalizeUserPermissions(user?.role || "", user?.permissions);
  }

  function getCurrentPermissions() {
    return getPermissionsForUser(getCurrentOperator());
  }

  function hasCorePermission(permissionKey, user = getCurrentOperator()) {
    return Boolean(getPermissionsForUser(user)[permissionKey]);
  }

  function canCreateCustomer(user = getCurrentOperator()) {
    return hasCorePermission(CORE_PERMISSION_KEYS.CREATE_CUSTOMER, user);
  }

  function canCreateProduct(user = getCurrentOperator()) {
    return hasCorePermission(CORE_PERMISSION_KEYS.CREATE_PRODUCT, user);
  }

  function canViewFob(user = getCurrentOperator()) {
    return hasCorePermission(CORE_PERMISSION_KEYS.VIEW_FOB, user);
  }

  function canViewGrossMargin(user = getCurrentOperator()) {
    return hasCorePermission(CORE_PERMISSION_KEYS.VIEW_GROSS_MARGIN, user);
  }

  function canViewGrossProfit(user = getCurrentOperator()) {
    return hasCorePermission(CORE_PERMISSION_KEYS.VIEW_GROSS_PROFIT, user);
  }

  function canDeleteLogs(user = getCurrentOperator()) {
    return String(user?.role || "") === "SYSTEM_ADMIN";
  }

  function canViewAnySensitivePrice(user = getCurrentOperator()) {
    return canViewFob(user) || canViewGrossMargin(user) || canViewGrossProfit(user);
  }

  function getAccessiblePages(role = getCurrentOperatorRole(), user = getCurrentOperator()) {
    const pages = new Set(PAGE_ACCESS_MAP[role] || PAGE_ACCESS_MAP.SALES_ENTRY);
    const permissions = normalizeUserPermissions(role, user?.permissions);
    if (permissions[CORE_PERMISSION_KEYS.CREATE_PRODUCT]) {
      pages.add("productPage");
    }
    if (permissions[CORE_PERMISSION_KEYS.CREATE_CUSTOMER]) {
      pages.add("customerPage");
    }
    if (!canManageAccounts(user)) {
      pages.delete("accountPage");
    }
    return Array.from(pages);
  }

  function getPreferredHomePage(pages = getAccessiblePages()) {
    const allowedPages = Array.isArray(pages) ? pages.filter(Boolean) : [];
    return allowedPages.find((pageId) => pageId !== "quoteQueryPage") || allowedPages[0] || "quoteCreatePage";
  }

  function canAccessPage(pageId, role = getCurrentOperatorRole(), user = getCurrentOperator()) {
    return getAccessiblePages(role, user).includes(pageId);
  }

  function hasAdministratorAccess(role = getCurrentOperatorRole()) {
    return ADMIN_ROLES.has(role);
  }

  function canManageAccounts(user = getCurrentOperator()) {
    return isPrimaryAdministratorUser(user);
  }

  function getUserById(id) {
    return state.data.users.find((item) => item.id === id) || null;
  }

  function getUserByUserName(userName) {
    return state.data.users.find((item) => String(item.user_name || "").toLowerCase() === String(userName || "").toLowerCase()) || null;
  }

  function getCustomerById(id) {
    return state.data.customers.find((item) => item.id === id) || null;
  }

  function getProductById(id) {
    return state.data.products.find((item) => item.id === id) || null;
  }

  function getFormulaById(id) {
    return state.data.formulas.find((item) => item.id === id) || null;
  }

  function getQuoteById(id) {
    return state.data.quotes.find((item) => item.id === id) || null;
  }

  function getLogById(id) {
    return state.data.logs.find((item) => item.id === id) || null;
  }

  function getApprovalById(id) {
    return state.data.approvals.find((item) => item.id === id) || null;
  }

  function getApprovalByQuoteId(quoteId) {
    return state.data.approvals.find((item) => item.quote_id === quoteId) || null;
  }

  function getCustomerRequestById(id) {
    return state.data.customer_requests.find((item) => item.id === id) || null;
  }

  function getAccountRequestById(id) {
    return state.data.account_requests.find((item) => item.id === id) || null;
  }

  function findCustomerByCode(code) {
    return state.data.customers.find((item) => String(item.customer_code || "").toLowerCase() === String(code || "").toLowerCase()) || null;
  }

  function findCustomerByName(name) {
    return state.data.customers.find((item) => String(item.customer_name || "").toLowerCase() === String(name || "").toLowerCase()) || null;
  }

  function findProductBySku(sku) {
    return state.data.products.find((item) => String(item.sku || "").toLowerCase() === String(sku || "").toLowerCase()) || null;
  }

  function findFormulaByCode(code) {
    return state.data.formulas.find((item) => String(item.formula_code || "").toLowerCase() === String(code || "").toLowerCase()) || null;
  }

  function findFirstAdministratorUser() {
    return getActiveUsers().find((item) => hasAdministratorAccess(item.role)) || null;
  }

  function findPrimaryAdministratorUser() {
    return getUserByUserName(PRIMARY_ADMIN_USER_NAME) || getActiveUsers().find((item) => item.role === "SYSTEM_ADMIN") || findFirstAdministratorUser();
  }

  function countAdministratorUsers(users = state.data.users) {
    return (users || []).filter((item) => hasAdministratorAccess(item.role)).length;
  }

  function isFormulaReferenced(formulaId) {
    return state.data.products.some((item) => item.default_formula_id === formulaId) || state.data.quotes.some((item) => item.formula_id === formulaId);
  }

  function isProductReferenced(productId) {
    return state.data.quotes.some(
      (item) => item.product_id === productId && String(item.approval_status || "").toUpperCase() === "IN_PROGRESS"
    );
  }

  function isCustomerReferenced(customerId) {
    return (
      state.data.quotes.some((item) => item.customer_id === customerId && String(item.approval_status || "").toUpperCase() === "IN_PROGRESS") ||
      state.data.customer_requests.some((item) => item.approval_status === "IN_PROGRESS" && item.target_customer_id === customerId)
    );
  }

  function isUserReferenced(userId) {
    return (
      state.data.customers.some((item) => item.default_approver_id === userId) ||
      state.data.approvals.some((item) => item.approval_status === "IN_PROGRESS" && item.approver_id === userId) ||
      state.data.customer_requests.some((item) => item.approval_status === "IN_PROGRESS" && item.approver_id === userId) ||
      state.data.account_requests.some((item) => item.approval_status === "PENDING" && item.approver_id === userId)
    );
  }

  function canDeleteQuote(quote, operator = getCurrentOperator()) {
    if (!quote || !operator) {
      return false;
    }
    return hasAdministratorAccess(operator.role) || quote.created_by === operator.id;
  }

  function deleteQuote(quote, operator = getCurrentOperator()) {
    if (!quote) {
      return;
    }
    if (!canDeleteQuote(quote, operator)) {
      setAlert(dom.quoteQueryAlert, tr("当前账号无删除报价权限。"), "warn");
      return;
    }
    const confirmed = window.confirm(tt("confirm.quoteDelete", { quoteNo: quote.quote_no }));
    if (!confirmed) {
      return;
    }
    const approval = getApprovalByQuoteId(quote.id);
    if (approval) {
      removeItem(state.data.approvals, approval.id);
    }
    removeItem(state.data.quotes, quote.id);
    if (state.ui.activeQuoteId === quote.id) {
      state.ui.activeQuoteId = "";
    }
    if (state.ui.detailNotice?.quoteId === quote.id) {
      state.ui.detailNotice = null;
    }
    writeLog("DELETE_QUOTE", quote.quote_no, quote, approval ? { approval_no: approval.approval_no } : null, operator);
    persistData();
    renderAll();
    setAlert(dom.quoteQueryAlert, tt("alerts.quoteDeleted", { quoteNo: quote.quote_no }), "success");
  }

  function canDeleteCustomerRequest(request, operator = getCurrentOperator()) {
    if (!request || !operator) {
      return false;
    }
    return hasAdministratorAccess(operator.role) || request.initiated_by === operator.id;
  }

  function extractCustomerCodePrefix(name) {
    const normalized = String(name || "").trim();
    const latin = normalized.replace(/[^a-zA-Z]/g, "").toUpperCase();
    if (latin.length >= 2) {
      return latin.slice(0, 2);
    }
    const compact = normalized.replace(/\s+/g, "").toUpperCase();
    return compact.slice(0, 2);
  }

  function normalizeCustomerCodeMonth(value) {
    const text = String(value || "").trim();
    if (!text) {
      return "";
    }
    const match = text.match(/^(\d{4})-(\d{2})/);
    return match ? `${match[1]}${match[2]}` : "";
  }

  function generateCustomerCode(name, formalDate) {
    const prefix = extractCustomerCodePrefix(name);
    const month = normalizeCustomerCodeMonth(formalDate);
    if (!prefix || prefix.length < 2 || !month) {
      return "";
    }
    return `${prefix}${month}`;
  }

  function syncCustomerCodeFromRule(force = false) {
    if (!dom.customerCode) {
      return "";
    }
    const generated = generateCustomerCode(dom.customerName?.value, dom.customerFormalDate?.value);
    if (!generated) {
      if (force || !String(dom.customerName?.value || "").trim() || !String(dom.customerFormalDate?.value || "").trim()) {
        setInputValue(dom.customerCode, "");
      }
      return "";
    }
    setInputValue(dom.customerCode, generated);
    return generated;
  }

  function selectBestFormula(customer, product) {
    return (
      getActiveFormulas().find((formula) => {
        const customerMatch =
          !customer || formula.applicable_customer_type === "ALL" || formula.applicable_customer_type === customer.customer_type;
        const productMatch =
          !product || formula.applicable_product_series === "ALL" || formula.applicable_product_series === product.product_series;
        const channelMatch =
          !customer || formula.applicable_channel_type === "ALL" || formula.applicable_channel_type === customer.channel_type;
        return customerMatch && productMatch && channelMatch;
      }) || getActiveFormulas()[0] || null
    );
  }

  function findFirstUserByRole(role) {
    return getActiveUsers().find((item) => item.role === role) || null;
  }

  function canCurrentOperatorProcessApproval(approval, operator) {
    if (!approval || !operator || approval.approval_status !== "IN_PROGRESS") {
      return false;
    }
    return hasAdministratorAccess(operator.role) || approval.approver_id === operator.id;
  }

  function createDraftCustomerFromImportRow(row) {
    const now = nowIso();
    return {
      id: buildId("customer"),
      customer_name: String(row.customer_name || "待补充客户").trim(),
      customer_code: String(row.customer_code || buildBusinessNo("CUST", state.data.customers)).trim(),
      customer_level: "C",
      customer_type: "RETAIL",
      channel_type: "OFFLINE",
      region: "待补充",
      default_db_rate: 0,
      default_customer_margin: 0,
      default_service_fee: 0,
      default_mkt_funding: 0,
      default_stk_buffer: 0,
      default_front_margin: 0,
      default_vat: 0.2,
      default_ura: 0,
      default_approver_id: getDefaultCustomerApproverUser()?.id || "",
      status: "ACTIVE",
      remark: "导入自动创建的客户草稿",
      created_at: now,
      updated_at: now,
    };
  }

  function createDraftProductFromImportRow(row, formulaId) {
    const now = nowIso();
    return {
      id: buildId("product"),
      product_name: String(row.product_name || row.sku || "待补充产品").trim(),
      sku: String(row.sku || buildBusinessNo("SKU", state.data.products)).trim().toUpperCase(),
      product_series: String(row.product_series || "未分类").trim(),
      product_model: String(row.product_model || "").trim(),
      variant: String(row.variant || "").trim(),
      launch_date: "",
      default_msrp: roundMoney(row.rrp ?? row.msrp ?? 0),
      default_cost: roundMoney(row.cost_price || 0),
      default_formula_id: formulaId || getActiveFormulas()[0]?.id || "",
      status: "ACTIVE",
      remark: "导入自动创建的产品草稿",
      created_at: now,
      updated_at: now,
    };
  }

  function replaceItem(collection, id, nextItem) {
    const index = collection.findIndex((item) => item.id === id);
    if (index >= 0) {
      collection.splice(index, 1, nextItem);
    }
  }

  function removeItem(collection, id) {
    const index = collection.findIndex((item) => item.id === id);
    if (index >= 0) {
      collection.splice(index, 1);
    }
  }

  function buildId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function buildBusinessNo(prefix, collection) {
    const date = compactToday();
    const count = (collection || [])
      .filter((item) => String(item.quote_no || item.approval_no || item.request_no || item.customer_code || item.sku || "").includes(date))
      .length + 1;
    return `${prefix}${date}-${String(count).padStart(3, "0")}`;
  }

  function closestDataButton(event, dataName) {
    const target = normalizeEventTarget(event);
    if (!(target instanceof HTMLElement)) {
      return null;
    }
    const attr = camelToDash(dataName);
    const selector = `[data-${attr}]`;
    const button = target.closest(selector);
    return button instanceof HTMLElement ? button : null;
  }

  function normalizeEventTarget(event) {
    const target = event?.target;
    if (target instanceof HTMLElement) {
      return target;
    }
    if (target instanceof Text) {
      return target.parentElement;
    }
    return null;
  }

  function camelToDash(value) {
    return String(value || "").replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  }

  function setAlert(container, message, type) {
    if (!container) {
      return;
    }
    if (!message) {
      container.innerHTML = "";
      return;
    }
    container.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
  }

  function buildDetailItem(label, value) {
    return `<div class="detail-item"><span>${escapeHtml(label)}</span><strong>${typeof value === "string" ? value : escapeHtml(String(value || ""))}</strong></div>`;
  }

  function setDetailNotice(quoteId, text, type) {
    state.ui.detailNotice = {
      quoteId,
      text,
      type,
    };
  }

  function setAccountPermissionInputs(permissions) {
    const normalized = normalizeUserPermissions(dom.accountRole?.value || "SALES_ENTRY", permissions);
    if (dom.accountPermCreateCustomer) {
      dom.accountPermCreateCustomer.checked = normalized[CORE_PERMISSION_KEYS.CREATE_CUSTOMER];
    }
    if (dom.accountPermCreateProduct) {
      dom.accountPermCreateProduct.checked = normalized[CORE_PERMISSION_KEYS.CREATE_PRODUCT];
    }
    if (dom.accountPermViewFob) {
      dom.accountPermViewFob.checked = normalized[CORE_PERMISSION_KEYS.VIEW_FOB];
    }
    if (dom.accountPermViewGrossMargin) {
      dom.accountPermViewGrossMargin.checked = normalized[CORE_PERMISSION_KEYS.VIEW_GROSS_MARGIN];
    }
    if (dom.accountPermViewGrossProfit) {
      dom.accountPermViewGrossProfit.checked = normalized[CORE_PERMISSION_KEYS.VIEW_GROSS_PROFIT];
    }
  }

  function collectAccountPermissionsFromForm(role = String(dom.accountRole?.value || "SALES_ENTRY")) {
    return normalizeUserPermissions(role, {
      [CORE_PERMISSION_KEYS.CREATE_CUSTOMER]: Boolean(dom.accountPermCreateCustomer?.checked),
      [CORE_PERMISSION_KEYS.CREATE_PRODUCT]: Boolean(dom.accountPermCreateProduct?.checked),
      [CORE_PERMISSION_KEYS.VIEW_FOB]: Boolean(dom.accountPermViewFob?.checked),
      [CORE_PERMISSION_KEYS.VIEW_GROSS_MARGIN]: Boolean(dom.accountPermViewGrossMargin?.checked),
      [CORE_PERMISSION_KEYS.VIEW_GROSS_PROFIT]: Boolean(dom.accountPermViewGrossProfit?.checked),
    });
  }

  function buildPermissionSummary(permissions) {
    const normalized = normalizeUserPermissions("", permissions);
    const labels = [];
    if (normalized[CORE_PERMISSION_KEYS.CREATE_CUSTOMER]) {
      labels.push(tr("新增客户"));
    }
    if (normalized[CORE_PERMISSION_KEYS.CREATE_PRODUCT]) {
      labels.push(tr("新增产品"));
    }
    if (normalized[CORE_PERMISSION_KEYS.VIEW_FOB]) {
      labels.push(tr("查看 FOB"));
    }
    if (normalized[CORE_PERMISSION_KEYS.VIEW_GROSS_MARGIN]) {
      labels.push(tr("查看毛利率"));
    }
    if (normalized[CORE_PERMISSION_KEYS.VIEW_GROSS_PROFIT]) {
      labels.push(tr("查看毛利额"));
    }
    return labels.length > 0 ? labels.join("、") : tr("未授予核心权限");
  }

  function buildSensitivePermissionSummary() {
    const labels = [];
    if (canViewFob()) {
      labels.push(tr("查看 FOB"));
    }
    if (canViewGrossMargin()) {
      labels.push(tr("查看毛利率"));
    }
    if (canViewGrossProfit()) {
      labels.push(tr("查看毛利额"));
    }
    return labels.length > 0 ? labels.join("、") : tr("未授予敏感价格查看权限");
  }

  function getSensitivePermissionKeyFromLabel(label) {
    const text = String(label || "").trim();
    if (!text) {
      return "";
    }
    if (/(内部成本参考|成本价|FOP|FOB|Cost|Kosten)/i.test(text)) {
      return CORE_PERMISSION_KEYS.VIEW_FOB;
    }
    if (/(毛利额|Gross Profit|Bruttogewinn)/i.test(text)) {
      return CORE_PERMISSION_KEYS.VIEW_GROSS_PROFIT;
    }
    if (/(毛利率|Gross Margin|Bruttomarge)/i.test(text)) {
      return CORE_PERMISSION_KEYS.VIEW_GROSS_MARGIN;
    }
    return "";
  }

  function getSensitivePermissionKeyFromText(text) {
    const value = String(text || "").trim();
    if (!value) {
      return "";
    }
    if (/(成本|FOP|FOB|cost|kosten)/i.test(value)) {
      return CORE_PERMISSION_KEYS.VIEW_FOB;
    }
    if (/(毛利额|gross[ _]profit|bruttogewinn)/i.test(value)) {
      return CORE_PERMISSION_KEYS.VIEW_GROSS_PROFIT;
    }
    if (/(毛利率|gross[ _]margin|bruttomarge)/i.test(value)) {
      return CORE_PERMISSION_KEYS.VIEW_GROSS_MARGIN;
    }
    return "";
  }

  function canViewCalculationStep(label) {
    const permissionKey = getSensitivePermissionKeyFromLabel(label);
    return !permissionKey || hasCorePermission(permissionKey);
  }

  function renderProtectedMoney(value, permissionKey) {
    return hasCorePermission(permissionKey) ? formatMoney(value) : tr("已按权限隔离");
  }

  function renderProtectedPercent(value, permissionKey) {
    return hasCorePermission(permissionKey) ? formatPercent(value) : tr("已按权限隔离");
  }

  function applyManagementIsolation() {
    const canManageProduct = canCreateProduct();
    [
      dom.productName,
      dom.productSku,
      dom.productSeries,
      dom.productModel,
      dom.productVariant,
      dom.productLaunchDate,
      dom.productDefaultMsrp,
      dom.productDefaultCost,
      dom.productFormulaId,
      dom.productRemark,
    ].forEach((element) => {
      if (!element) {
        return;
      }
      element.disabled = !canManageProduct;
    });
    if (dom.autoCreateCustomerDraft) {
      dom.autoCreateCustomerDraft.disabled = !canCreateCustomer();
      if (dom.autoCreateCustomerDraft.disabled) {
        dom.autoCreateCustomerDraft.checked = false;
      }
    }
    if (dom.autoCreateProductDraft) {
      dom.autoCreateProductDraft.disabled = !canManageProduct;
      if (dom.autoCreateProductDraft.disabled) {
        dom.autoCreateProductDraft.checked = false;
      }
    }
  }

  function applyPresentationIsolation() {
    document.querySelectorAll("[data-permission-key]").forEach((element) => {
      const permissionKey = String(element.getAttribute("data-permission-key") || "");
      element.classList.toggle("role-hidden", !hasCorePermission(permissionKey));
    });
    if (dom.quoteCostPrice) {
      dom.quoteCostPrice.readOnly = !canViewFob();
      dom.quoteCostPrice.tabIndex = canViewFob() ? 0 : -1;
    }
    if (dom.productDefaultCost) {
      dom.productDefaultCost.readOnly = !canViewFob();
      dom.productDefaultCost.tabIndex = canViewFob() ? 0 : -1;
    }
    if (dom.trialCost) {
      dom.trialCost.readOnly = !canViewFob();
      dom.trialCost.tabIndex = canViewFob() ? 0 : -1;
    }
  }

  function updatePermissionIsolationHint() {
    if (!dom.permissionIsolationHint) {
      return;
    }
    const roleLabel = renderRoleLabel(getCurrentOperatorRole());
    dom.permissionIsolationHint.textContent = tt("permission.scope", {
      role: roleLabel,
      scope: getRoleScopeHint(),
      permissions: buildSensitivePermissionSummary(),
    });
    dom.permissionIsolationHint.className = "permission-note";
  }

  function getRoleScopeHint(role = getCurrentOperatorRole()) {
    const hints = {
      SALES_ENTRY: tr("可调整点位、自动试算、确认导入与提交审批。"),
      SALES_MANAGER: tr("可查阅业务信息与审批任务，不可维护系统账号。"),
      BUSINESS_HEAD: tr("具备管理员级权限，可管理全部页面、账号、权限与系统配置。"),
      FINANCE_HEAD: tr("具备管理员级权限，可管理全部页面、账号、权限与系统配置。"),
      SYSTEM_ADMIN: tr("可管理全部页面、账号、权限与系统配置。"),
    };
    return hints[role] || tr("按当前账号权限访问对应页面。");
  }

  function getVisibleWarningMessage(message) {
    const text = String(message || "").trim();
    if (!text) {
      return "";
    }
    const permissionKey = getSensitivePermissionKeyFromText(text);
    if (permissionKey && !hasCorePermission(permissionKey)) {
      return tr("当前报价触发敏感价格预警，需要进入对应审批流。");
    }
    return text;
  }

  function buildCustomerQuoteSheet(quote, approval, generatedAt) {
    const generated = generatedAt || nowIso();
    const previewFields = [
      { label: tr("客户名称"), value: quote.customer_name },
      { label: tr("产品名称"), value: quote.product_name },
      { label: tr("SKU"), value: quote.sku },
      { label: tr("产品系列"), value: quote.product_series },
      { label: tr("RRP"), value: formatMoney(quote.msrp) },
      { label: tr("客户报价"), value: formatMoney(quote.final_quote_price) },
      { label: tr("生效月份"), value: quote.effective_month || "-" },
    ];
    const subject = tt("mail.subject", {
      customerName: quote.customer_name,
      productName: quote.product_name,
      effectiveMonth: quote.effective_month || "",
    }).trim();
    const bodyText = [
      tt("mail.greeting", { customerName: quote.customer_name }),
      "",
      tt("mail.intro"),
      "",
      ...previewFields.map((item) => `${item.label}：${item.value}`),
      "",
      tt("mail.replyHint"),
      "",
      tt("details.salesContact", { name: quote.created_by_name }),
      tt("details.systemGeneratedAt", { time: formatDateTime(generated) }),
    ].join("\n");
    const attachmentText = [
      tr("客户价格表"),
      "====================",
      ...previewFields.map((item) => `${item.label}：${item.value}`),
      "",
      tt("details.systemGeneratedAt", { time: formatDateTime(generated) }),
    ].join("\n");
    const attachmentHtml = `<!DOCTYPE html>
<html lang="${escapeHtml(document.documentElement.lang || "zh-CN")}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
    <style>
      :root {
        color-scheme: light;
      }
      body {
        margin: 0;
        background: #f4f7fb;
        color: #182433;
        font: 14px/1.6 "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
      }
      .sheet {
        max-width: 860px;
        margin: 32px auto;
        padding: 32px;
        background: #ffffff;
        border: 1px solid #d8e0ea;
        border-radius: 20px;
        box-shadow: 0 12px 28px rgba(19, 34, 62, 0.08);
      }
      .eyebrow {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 999px;
        background: #eaf2ff;
        color: #1858c8;
        font-size: 12px;
        letter-spacing: 0.04em;
      }
      h1 {
        margin: 12px 0 8px;
        font-size: 28px;
      }
      p {
        margin: 0 0 16px;
        color: #66758a;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 24px 0;
      }
      th,
      td {
        padding: 12px 14px;
        border: 1px solid #d8e0ea;
        text-align: left;
        vertical-align: top;
      }
      th {
        width: 180px;
        background: #f8fafc;
        color: #66758a;
        font-weight: 600;
      }
      .quote-price {
        color: #1858c8;
        font-size: 30px;
        font-weight: 700;
      }
      .footer {
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid #d8e0ea;
        color: #66758a;
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <span class="eyebrow">${escapeHtml(tr("客户价格表"))}</span>
      <h1>${escapeHtml(tr("客户价格表"))}</h1>
      <p>${escapeHtml(tr("本价格表由系统在审批通过后自动生成，可直接用于邮件发送与客户确认。"))}</p>
      <div class="quote-price">${escapeHtml(formatMoney(quote.final_quote_price))}</div>
      <table>
        <tbody>
          ${previewFields
            .map(
              (item) => `
                <tr>
                  <th>${escapeHtml(item.label)}</th>
                  <td>${escapeHtml(item.value)}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
      <p>${escapeHtml(tr("如需确认、回签或进一步沟通，请直接回复原邮件。"))}</p>
      <div class="footer">
        <div>${escapeHtml(tt("details.salesContact", { name: quote.created_by_name }))}</div>
        <div>${escapeHtml(tt("details.systemGeneratedAt", { time: formatDateTime(generated) }))}</div>
      </div>
    </div>
  </body>
</html>`;
    return {
      version: CUSTOMER_QUOTE_SHEET_VERSION,
      language: getCurrentLanguage(),
      generated_at: generated,
      subject,
      body_text: bodyText,
      attachment_text: attachmentText,
      attachment_html: attachmentHtml,
      html_filename: `${quote.quote_no}-${tt("mail.fileBase")}.html`,
      txt_filename: `${quote.quote_no}-${tt("mail.fileBase")}.txt`,
      preview_fields: previewFields,
    };
  }

  function buildCustomerQuoteSheetPdf(quote, customerQuoteSheet) {
    const previewFields = Array.isArray(customerQuoteSheet?.preview_fields) ? customerQuoteSheet.preview_fields : [];
    const generatedAt = customerQuoteSheet?.generated_at || nowIso();
    return buildPdfTableReport({
      filename: `${quote.quote_no}-${tt("mail.fileBase")}.pdf`,
      title: tr("客户价格表"),
      subtitle: tt("mail.subject", {
        customerName: quote.customer_name,
        productName: quote.product_name,
        effectiveMonth: quote.effective_month || "",
      }).trim(),
      highlightLabel: tr("客户报价"),
      highlightValue: formatMoney(quote.final_quote_price),
      detailPairs: previewFields.map((item) => ({
        label: item.label,
        value: item.value,
      })),
      footerLines: [
        tt("details.salesContact", { name: quote.created_by_name }),
        tt("details.systemGeneratedAt", { time: formatDateTime(generatedAt) }),
      ],
    });
  }

  function buildPdfTableReport(config) {
    const pages = [];
    let page = startPdfReportPage(config, pages.length + 1, true);
    pages.push(page);
    let currentY = page.contentTop;

    if (config.highlightValue) {
      currentY = drawPdfHighlight(page.ctx, config.highlightLabel || "", config.highlightValue, currentY, page.layout);
    }
    if (Array.isArray(config.summaryCards) && config.summaryCards.length > 0) {
      currentY = drawPdfSummaryCards(page.ctx, config.summaryCards, currentY, page.layout);
    }
    if (Array.isArray(config.detailPairs) && config.detailPairs.length > 0) {
      currentY = drawPdfDetailPairs(pages, page, currentY, config.detailPairs, config);
    }
    if (Array.isArray(config.tableHeaders) && config.tableHeaders.length > 0 && Array.isArray(config.tableRows)) {
      drawPdfTableRows(pages, page, currentY, config);
    }

    pages.forEach((item, index) => {
      drawPdfFooter(item.ctx, config.footerLines || [], item.layout, index + 1, pages.length);
    });

    return {
      filename: String(config.filename || `report-${compactNow()}.pdf`),
      blob: buildPdfBlobFromCanvases(pages.map((item) => item.canvas)),
    };
  }

  function startPdfReportPage(config, pageNumber, isFirstPage) {
    const canvas = document.createElement("canvas");
    canvas.width = 1240;
    canvas.height = 1754;
    const ctx = canvas.getContext("2d");
    const layout = {
      width: canvas.width,
      height: canvas.height,
      pageWidthPt: 595.28,
      pageHeightPt: 841.89,
      marginX: 88,
      marginTop: 92,
      marginBottom: 128,
      contentWidth: canvas.width - 176,
    };

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f4f7fb";
    ctx.fillRect(0, 0, canvas.width, 180);

    let currentY = layout.marginTop;
    currentY = drawPdfPageHeader(ctx, config.title || tr("客户价格表"), isFirstPage ? config.subtitle : "", currentY, layout, pageNumber);

    return {
      canvas,
      ctx,
      layout,
      contentTop: currentY,
    };
  }

  function drawPdfPageHeader(ctx, title, subtitle, startY, layout, pageNumber) {
    const badgeHeight = 42;
    drawRoundedRect(ctx, layout.marginX, startY, 170, badgeHeight, 20, "#eaf2ff", "#eaf2ff");
    ctx.fillStyle = "#1858c8";
    ctx.font = '600 20px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
    ctx.textBaseline = "middle";
    ctx.fillText(tr("客户价格表"), layout.marginX + 18, startY + badgeHeight / 2);

    ctx.fillStyle = "#182433";
    ctx.font = '700 48px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
    ctx.textBaseline = "alphabetic";
    ctx.fillText(String(title || ""), layout.marginX, startY + 102);

    let currentY = startY + 138;
    if (subtitle) {
      currentY = drawWrappedCanvasText(
        ctx,
        String(subtitle || ""),
        layout.marginX,
        currentY,
        layout.contentWidth,
        26,
        "#66758a",
        '400 24px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif'
      );
      currentY += 8;
    }

    ctx.fillStyle = "#66758a";
    ctx.font = '500 20px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
    ctx.textAlign = "right";
    ctx.fillText(tt("pdf.pageNo", { page: String(pageNumber) }), layout.width - layout.marginX, startY + badgeHeight / 2 + 2);
    ctx.textAlign = "left";
    return currentY + 14;
  }

  function drawPdfHighlight(ctx, label, value, startY, layout) {
    const boxHeight = 132;
    drawRoundedRect(ctx, layout.marginX, startY, layout.contentWidth, boxHeight, 24, "#f8fbff", "#d8e0ea");
    ctx.fillStyle = "#66758a";
    ctx.font = '500 22px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
    ctx.fillText(String(label || ""), layout.marginX + 28, startY + 42);
    ctx.fillStyle = "#1858c8";
    ctx.font = '700 58px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
    ctx.fillText(String(value || "--"), layout.marginX + 28, startY + 96);
    return startY + boxHeight + 20;
  }

  function drawPdfSummaryCards(ctx, cards, startY, layout) {
    const gap = 16;
    const columns = Math.min(3, Math.max(1, cards.length));
    const cardWidth = (layout.contentWidth - gap * (columns - 1)) / columns;
    const rows = [];
    for (let index = 0; index < cards.length; index += columns) {
      rows.push(cards.slice(index, index + columns));
    }

    let currentY = startY;
    rows.forEach((row) => {
      let rowHeight = 112;
      const rendered = row.map((card, columnIndex) => {
        const x = layout.marginX + columnIndex * (cardWidth + gap);
        ctx.font = '600 30px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
        const valueLines = wrapCanvasText(ctx, card.value, cardWidth - 32);
        const cardHeight = Math.max(112, 72 + valueLines.length * 36);
        rowHeight = Math.max(rowHeight, cardHeight);
        return { card, x, valueLines };
      });
      rendered.forEach(({ card, x, valueLines }) => {
        drawRoundedRect(ctx, x, currentY, cardWidth, rowHeight, 22, "#f8fafc", "#d8e0ea");
        ctx.fillStyle = "#66758a";
        ctx.font = '500 20px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
        ctx.fillText(String(card.label || ""), x + 16, currentY + 34);
        ctx.fillStyle = "#182433";
        ctx.font = '600 30px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
        drawTextLines(ctx, valueLines, x + 16, currentY + 74, 36);
      });
      currentY += rowHeight + gap;
    });
    return currentY + 4;
  }

  function drawPdfDetailPairs(pages, page, startY, detailPairs, config) {
    const labelWidth = 250;
    const valueWidth = page.layout.contentWidth - labelWidth;
    let currentY = startY;
    let currentPage = page;

    detailPairs.forEach((item) => {
      const rowHeight = measurePdfDetailRowHeight(currentPage.ctx, item, valueWidth);
      if (currentY + rowHeight > currentPage.layout.height - currentPage.layout.marginBottom - 26) {
        currentPage = startPdfReportPage(config, pages.length + 1, false);
        pages.push(currentPage);
        currentY = currentPage.contentTop;
      }
      drawPdfDetailRow(currentPage.ctx, item, currentY, currentPage.layout, labelWidth, valueWidth, rowHeight);
      currentY += rowHeight;
    });

    return currentY + 14;
  }

  function drawPdfTableRows(pages, page, startY, config) {
    const ratios = Array.isArray(config.columnRatios) && config.columnRatios.length === config.tableHeaders.length
      ? config.columnRatios
      : new Array(config.tableHeaders.length).fill(1);
    let currentPage = page;
    let currentY = startY;

    const drawHeader = () => {
      const headerHeight = 58;
      const widths = getPdfColumnWidths(currentPage.layout.contentWidth, ratios);
      drawPdfTableHeader(currentPage.ctx, config.tableHeaders, currentY, currentPage.layout.marginX, widths, headerHeight);
      currentY += headerHeight;
      return widths;
    };

    let widths = drawHeader();
    config.tableRows.forEach((row) => {
      const rowHeight = measurePdfTableRowHeight(currentPage.ctx, row, widths);
      if (currentY + rowHeight > currentPage.layout.height - currentPage.layout.marginBottom - 20) {
        currentPage = startPdfReportPage(config, pages.length + 1, false);
        pages.push(currentPage);
        currentY = currentPage.contentTop;
        widths = drawHeader();
      }
      drawPdfTableRow(currentPage.ctx, row, currentY, currentPage.layout.marginX, widths, rowHeight);
      currentY += rowHeight;
    });
  }

  function drawPdfTableHeader(ctx, headers, startY, startX, widths, headerHeight) {
    let offsetX = startX;
    headers.forEach((header, index) => {
      drawRoundedRect(ctx, offsetX, startY, widths[index], headerHeight, 0, "#eff5ff", "#d8e0ea");
      ctx.fillStyle = "#182433";
      ctx.font = '600 20px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
      drawTextLines(ctx, wrapCanvasText(ctx, header, widths[index] - 20), offsetX + 10, startY + 34, 24);
      offsetX += widths[index];
    });
  }

  function drawPdfTableRow(ctx, row, startY, startX, widths, rowHeight) {
    let offsetX = startX;
    row.forEach((value, index) => {
      drawRoundedRect(ctx, offsetX, startY, widths[index], rowHeight, 0, "#ffffff", "#d8e0ea");
      ctx.fillStyle = "#182433";
      ctx.font = '400 19px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
      const lines = wrapCanvasText(ctx, value, widths[index] - 20);
      drawTextLines(ctx, lines, offsetX + 10, startY + 30, 24);
      offsetX += widths[index];
    });
  }

  function measurePdfTableRowHeight(ctx, row, widths) {
    ctx.font = '400 19px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
    const maxLines = row.reduce((count, value, index) => Math.max(count, wrapCanvasText(ctx, value, widths[index] - 20).length), 1);
    return Math.max(54, 18 + maxLines * 24);
  }

  function measurePdfDetailRowHeight(ctx, item, valueWidth) {
    ctx.font = '600 24px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
    const valueLines = wrapCanvasText(ctx, item.value, valueWidth - 40);
    return Math.max(68, 28 + valueLines.length * 34);
  }

  function drawPdfDetailRow(ctx, item, startY, layout, labelWidth, valueWidth, rowHeight) {
    drawRoundedRect(ctx, layout.marginX, startY, labelWidth, rowHeight, 0, "#f8fafc", "#d8e0ea");
    drawRoundedRect(ctx, layout.marginX + labelWidth, startY, valueWidth, rowHeight, 0, "#ffffff", "#d8e0ea");
    ctx.fillStyle = "#66758a";
    ctx.font = '500 20px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
    ctx.fillText(String(item.label || ""), layout.marginX + 18, startY + 40);
    ctx.fillStyle = "#182433";
    ctx.font = '600 24px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
    drawTextLines(ctx, wrapCanvasText(ctx, item.value, valueWidth - 40), layout.marginX + labelWidth + 20, startY + 40, 34);
  }

  function drawPdfFooter(ctx, lines, layout, pageNumber, totalPages) {
    const topY = layout.height - layout.marginBottom + 24;
    ctx.strokeStyle = "#d8e0ea";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(layout.marginX, topY - 18);
    ctx.lineTo(layout.width - layout.marginX, topY - 18);
    ctx.stroke();

    ctx.fillStyle = "#66758a";
    ctx.font = '400 18px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
    drawTextLines(ctx, lines.filter(Boolean), layout.marginX, topY + 4, 26);
    ctx.textAlign = "right";
    ctx.fillText(tt("pdf.pageCount", { page: String(pageNumber), total: String(totalPages) }), layout.width - layout.marginX, topY + 4);
    ctx.textAlign = "left";
  }

  function drawWrappedCanvasText(ctx, text, startX, startY, maxWidth, lineHeight, color, font) {
    ctx.fillStyle = color;
    ctx.font = font;
    const lines = wrapCanvasText(ctx, text, maxWidth);
    drawTextLines(ctx, lines, startX, startY, lineHeight);
    return startY + lines.length * lineHeight;
  }

  function drawTextLines(ctx, lines, startX, startY, lineHeight) {
    (lines || []).forEach((line, index) => {
      ctx.fillText(String(line || ""), startX, startY + index * lineHeight);
    });
  }

  function wrapCanvasText(ctx, value, maxWidth) {
    const text = String(value == null ? "" : value);
    if (!text) {
      return ["-"];
    }
    const paragraphs = text.split(/\r?\n/);
    const lines = [];
    paragraphs.forEach((paragraph) => {
      const source = paragraph || " ";
      let current = "";
      Array.from(source).forEach((char) => {
        const next = `${current}${char}`;
        if (current && ctx.measureText(next).width > maxWidth) {
          lines.push(current);
          current = char;
        } else {
          current = next;
        }
      });
      lines.push(current || " ");
    });
    return lines;
  }

  function getPdfColumnWidths(totalWidth, ratios) {
    const ratioSum = ratios.reduce((sum, item) => sum + item, 0) || ratios.length || 1;
    const widths = ratios.map((ratio) => Math.floor((totalWidth * ratio) / ratioSum));
    const diff = totalWidth - widths.reduce((sum, item) => sum + item, 0);
    widths[widths.length - 1] += diff;
    return widths;
  }

  function drawRoundedRect(ctx, x, y, width, height, radius, fillColor, strokeColor) {
    const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function buildPdfBlobFromCanvases(canvases) {
    const images = canvases.map((canvas) => ({
      width: canvas.width,
      height: canvas.height,
      bytes: dataUrlToUint8Array(canvas.toDataURL("image/jpeg", 0.92)),
    }));
    const encoder = new TextEncoder();
    const objectCount = 2 + images.length * 3;
    const pageIds = [];
    const imageIds = [];
    const contentIds = [];
    let nextObjectId = 3;
    images.forEach(() => {
      pageIds.push(nextObjectId++);
      imageIds.push(nextObjectId++);
      contentIds.push(nextObjectId++);
    });

    const chunks = [];
    const pushChunk = (chunk) => {
      chunks.push(chunk);
      return chunk.length;
    };

    let offset = 0;
    offset += pushChunk(new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52, 10, 37, 226, 227, 207, 211, 10]));
    const offsets = new Array(objectCount + 1).fill(0);

    const writeObject = (objectId, parts) => {
      offsets[objectId] = offset;
      offset += pushChunk(encoder.encode(`${objectId} 0 obj\n`));
      parts.forEach((part) => {
        offset += pushChunk(part);
      });
      offset += pushChunk(encoder.encode("\nendobj\n"));
    };

    writeObject(1, [encoder.encode(`<< /Type /Catalog /Pages 2 0 R >>`)]);
    writeObject(2, [encoder.encode(`<< /Type /Pages /Count ${images.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`)]);

    images.forEach((image, index) => {
      writeObject(pageIds[index], [
        encoder.encode(
          `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${imageIds[index]} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`
        ),
      ]);
      writeObject(imageIds[index], [
        encoder.encode(
          `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n`
        ),
        image.bytes,
        encoder.encode("\nendstream"),
      ]);
      const content = encoder.encode(`q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ`);
      writeObject(contentIds[index], [
        encoder.encode(`<< /Length ${content.length} >>\nstream\n`),
        content,
        encoder.encode("\nendstream"),
      ]);
    });

    const xrefOffset = offset;
    offset += pushChunk(encoder.encode(`xref\n0 ${objectCount + 1}\n`));
    offset += pushChunk(encoder.encode("0000000000 65535 f \n"));
    for (let index = 1; index <= objectCount; index += 1) {
      offset += pushChunk(encoder.encode(`${String(offsets[index]).padStart(10, "0")} 00000 n \n`));
    }
    offset += pushChunk(encoder.encode(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`));
    return new Blob(chunks, { type: "application/pdf" });
  }

  function dataUrlToUint8Array(dataUrl) {
    const base64 = String(dataUrl || "").split(",")[1] || "";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  function getVisibleLogPayload(payload) {
    return sanitizeSensitivePayload(payload);
  }

  function sanitizeSensitivePayload(value) {
    if (Array.isArray(value)) {
      return value.map((item) => sanitizeSensitivePayload(item));
    }
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => {
          const permissionKey = getSensitivePermissionKeyFromText(key);
          return [key, permissionKey && !hasCorePermission(permissionKey) ? "已按权限隔离" : sanitizeSensitivePayload(item)];
        })
      );
    }
    return value;
  }

  function renderBadge(level) {
    const className = level === "RED" ? "badge-red" : level === "YELLOW" ? "badge-yellow" : level === "APPROVED" ? "badge-green" : "badge-none";
    return `<span class="badge ${className}">${escapeHtml(renderPlainStatus(level))}</span>`;
  }

  function renderStatusBadge(status) {
    const upper = String(status || "").toUpperCase();
    const className =
      upper === "APPROVED" || upper === "ACTIVE"
        ? "badge-green"
        : upper === "REJECTED" || upper === "REJECTED_PENDING_EDIT"
          ? "badge-red"
          : upper === "IN_PROGRESS" || upper === "PENDING" || upper === "PENDING_APPROVAL" || upper === "PENDING_EFFECTIVE"
            ? "badge-yellow"
            : "badge-none";
    return `<span class="badge ${className}">${escapeHtml(renderPlainStatus(status))}</span>`;
  }

  function renderLogActionType(actionType) {
    const map = {
      CREATE_QUOTE: "创建报价",
      APPROVE: "审批通过",
      REJECT: "审批驳回",
      GENERATE_CUSTOMER_QUOTE_SHEET: "生成客户价格表",
      CREATE_FORMULA: "创建公式",
      UPDATE_FORMULA: "更新公式",
      DELETE_FORMULA: "删除公式",
      TOGGLE_FORMULA: "切换公式状态",
      CREATE_PRODUCT: "创建产品",
      UPDATE_PRODUCT: "更新产品",
      DELETE_PRODUCT: "删除产品",
      TOGGLE_PRODUCT: "切换产品状态",
      CREATE_CUSTOMER: "创建客户",
      UPDATE_CUSTOMER: "更新客户",
      DELETE_CUSTOMER: "删除客户",
      DELETE_QUOTE: "删除报价",
      DELETE_CUSTOMER_REQUEST: "删除客户申请",
      TOGGLE_CUSTOMER: "切换客户状态",
      SUBMIT_NEW_CUSTOMER_REQUEST: "提交新增客户申请",
      SUBMIT_CUSTOMER_POLICY_REQUEST: "提交客户政策变更申请",
      APPROVE_CUSTOMER_REQUEST: "批准客户申请",
      REJECT_CUSTOMER_REQUEST: "驳回客户申请",
      APPLY_CUSTOMER_POLICY: "生效客户政策",
      CREATE_CUSTOMER_FROM_REQUEST: "由申请创建客户",
      SUBMIT_ACCOUNT_REQUEST: "提交账号申请",
      CREATE_ACCOUNT: "创建账号",
      UPDATE_ACCOUNT: "更新账号",
      APPROVE_ACCOUNT_REQUEST: "批准账号申请",
      REJECT_ACCOUNT_REQUEST: "驳回账号申请",
      DELETE_ACCOUNT_REQUEST: "删除账号申请",
      RESET_ACCOUNT_PASSWORD: "重置账号密码",
      DELETE_ACCOUNT: "删除账号",
      TOGGLE_ACCOUNT: "切换账号状态",
    };
    return tr(map[String(actionType || "").toUpperCase()] || String(actionType || "-"));
  }

  function renderPlainStatus(status) {
    const map = {
      NONE: tr("无预警"),
      YELLOW: tr("黄色预警"),
      RED: tr("红色预警"),
      IN_PROGRESS: tr("审批中"),
      APPROVED: tr("已批准"),
      REJECTED: tr("已驳回"),
      ACTIVE: tr("已生效"),
      PENDING: tr("待审批"),
      PENDING_APPROVAL: tr("待审批"),
      PENDING_EFFECTIVE: tr("待生效"),
      REJECTED_PENDING_EDIT: tr("驳回待修改"),
      INACTIVE: tr("已删除"),
    };
    return map[String(status || "").toUpperCase()] || String(status || "-");
  }

  function renderWarningText(level) {
    return renderPlainStatus(level);
  }

  function renderRoleLabel(role) {
    const labels = {
      SALES_ENTRY: tr("客户经理"),
      SALES_MANAGER: tr("电商负责人"),
      BUSINESS_HEAD: tr("总经理"),
      FINANCE_HEAD: tr("财务总监"),
      SYSTEM_ADMIN: tr("超级管理员"),
    };
    return labels[role] || role;
  }

  function formatMoney(value) {
    if (!Number.isFinite(Number(value))) {
      return "--";
    }
    return Number(value).toLocaleString(getNumberLocale(), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatPercent(value) {
    if (!Number.isFinite(Number(value))) {
      return "--";
    }
    return `${(Number(value) * 100).toLocaleString(getNumberLocale(), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}%`;
  }

  function formatFactor(value) {
    if (!Number.isFinite(Number(value))) {
      return "--";
    }
    return Number(value).toLocaleString(getNumberLocale(), {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  }

  function formatDateTime(value) {
    if (!value) {
      return "--";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value).replace("T", " ").slice(0, 16);
    }
    return new Intl.DateTimeFormat(getDateLocale(), {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  function getDateInputValue(value) {
    if (!value) {
      return "";
    }
    const normalized = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return normalized;
    }
    const directMatch = normalized.match(/(\d{4})[/-](\d{2})[/-](\d{2})/);
    if (directMatch) {
      return `${directMatch[1]}-${directMatch[2]}-${directMatch[3]}`;
    }
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function stringifyLogData(value) {
    if (!value) {
      return "-";
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      return String(value);
    }
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function getCurrentMonthValue() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  function normalizeMonthValue(value) {
    const text = String(value || "").trim();
    const match = text.match(/^(\d{4})[-/](\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
    return "";
  }

  function compareMonthValue(left, right) {
    const normalizedLeft = normalizeMonthValue(left);
    const normalizedRight = normalizeMonthValue(right);
    if (!normalizedLeft && !normalizedRight) {
      return 0;
    }
    if (!normalizedLeft) {
      return -1;
    }
    if (!normalizedRight) {
      return 1;
    }
    return normalizedLeft.localeCompare(normalizedRight, "zh-CN");
  }

  function addMonthsToMonthValue(value, offset) {
    const normalized = normalizeMonthValue(value) || getCurrentMonthValue();
    const [year, month] = normalized.split("-").map((item) => Number(item || 0));
    const date = new Date(year, Math.max(month - 1, 0), 1);
    date.setMonth(date.getMonth() + Number(offset || 0));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function nextMonthValue() {
    return addMonthsToMonthValue(getCurrentMonthValue(), 1);
  }

  function compactToday() {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  }

  function compactNow() {
    const now = new Date();
    return `${compactToday()}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  }

  function roundMoney(value) {
    return Number(toNumber(value, 0).toFixed(2));
  }

  function roundRatio(value) {
    return Number(toNumber(value, 0).toFixed(4));
  }

  function toNumber(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function toRateInput(value, fallback) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return fallback;
    }
    return Math.abs(numeric) > 1 ? numeric / 100 : numeric;
  }

  function setInputValue(input, value) {
    if (input) {
      input.value = value == null ? "" : String(value);
    }
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeCsvValue(value) {
    const text = String(value == null ? "" : value);
    if (/[,"\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  function sanitizeFilename(value) {
    return String(value == null ? "" : value)
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || compactToday();
  }

  async function copyTextToClipboard(text) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        // Fall back to execCommand for local-file contexts where clipboard permission may be restricted.
      }
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "readonly");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    textarea.style.left = "-1000px";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    let success = false;
    try {
      success = Boolean(document.execCommand("copy"));
    } catch (error) {
      success = false;
    }
    textarea.remove();
    return success;
  }

  function openCustomerQuoteMailDraft(customerQuoteSheet) {
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(customerQuoteSheet.subject)}&body=${encodeURIComponent(customerQuoteSheet.body_text)}`;
    window.location.href = mailtoUrl;
  }

  function downloadBlobFile(filename, blob) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    downloadBlobFile(filename, blob);
  }

  function downloadTextFile(filename, content) {
    downloadFile(filename, content, "text/csv;charset=utf-8");
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file, "utf-8");
    });
  }

  function parseCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((line) => line.trim());
    if (lines.length <= 1) {
      return [];
    }
    const headers = parseCsvLine(lines[0]).map((item) => String(item || "").trim());
    return lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      return Object.fromEntries(headers.map((header, index) => [header, String(values[index] || "").trim()]));
    });
  }

  function parseCsvLine(line) {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];
      if (char === '"' && inQuotes && next === '"') {
        current += '"';
        index += 1;
        continue;
      }
      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
        continue;
      }
      current += char;
    }
    values.push(current);
    return values;
  }
})();
