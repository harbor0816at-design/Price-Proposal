(function () {
  const LANGUAGE_STORAGE_KEY = "customer_quote_management_web_language_v1";
  const DEFAULT_LANGUAGE = "zh";
  const TRANSLATABLE_ATTRIBUTES = ["placeholder", "title", "aria-label"];
  const TEXT_WRAP_RE = /^(\s*)(.*?)(\s*)$/s;

  const LANGUAGES = {
    zh: { code: "zh", htmlLang: "zh-CN", label: "中文", numberLocale: "zh-CN", dateLocale: "zh-CN" },
    en: { code: "en", htmlLang: "en", label: "English", numberLocale: "en-US", dateLocale: "en-US" },
    de: { code: "de", htmlLang: "de", label: "Deutsch", numberLocale: "de-DE", dateLocale: "de-DE" },
  };

  const I18N = {
    zh: {
      portal: { admin: "B2B管理后台", pricingCenter: "价格与报价中台", customerTitle: "B2B合作伙伴订购门户", signedInAccount: "当前登录账号", signOut: "退出登录", refreshData: "刷新数据", language: "界面语言", notSignedIn: "未登录", signInFirst: "请先登录" },
      menu: {
        workspace: { title: "管理工作台", overview: "业务总览", tasks: "我的待办", risks: "风险提醒" },
        trade: { title: "交易管理", quoteManagement: "报价管理", orderManagement: "订单管理", approvalManagement: "审批管理", invoiceManagement: "发票管理", shipmentManagement: "发货管理" },
        customer: { title: "客户管理", profiles: "客户档案", registrationReview: "客户注册审批", accounts: "客户账号", pricingPolicies: "价格政策", creditTerms: "信用额度 / 账期" },
        inventory: { title: "商品与库存", catalog: "商品档案", inventoryManagement: "库存管理", inventoryLocks: "库存锁定", lowStockAlerts: "低库存预警" },
        system: { title: "系统配置", formulaManagement: "公式管理", batchImport: "批量导入", companyInvoiceSettings: "公司与发票设置", permissionManagement: "权限管理", operationLogs: "操作日志" },
      },
      order: { table: { orderNo: "订单号", customer: "客户", skuSummary: "SKU摘要", amount: "金额", orderStatus: "订单状态", approvalStatus: "审批状态", invoiceStatus: "发票状态", shipmentStatus: "发货状态", createdAt: "创建时间", actions: "操作" } },
      status: { DRAFT: "草稿", SUBMITTED: "已提交", PENDING_APPROVAL: "待审批", IN_APPROVAL: "审批中", APPROVED: "已批准", REJECTED: "已驳回", INVOICE_GENERATED: "已生成发票", AWAITING_PAYMENT: "待付款", PAYMENT_CONFIRMED: "付款已确认", READY_TO_SHIP: "待发货", SHIPPED: "已发货", COMPLETED: "已完成", CANCELLED: "已取消", NOT_REQUIRED: "无需审批", NOT_GENERATED: "未生成", PI_GENERATED: "PI已生成", GENERATED: "已生成", SENT: "已发送", PAID: "已付款", NOT_READY: "未就绪", PENDING: "待处理", DELIVERED: "已送达", PARTIAL_PAID: "部分付款", CREDIT_TERM_CONFIRMED: "账期已确认", ACTIVE: "已生效", INACTIVE: "已停用" },
      customer: {
        registration: {
          title: "B2B合作伙伴注册", eyebrow: "合作伙伴注册", intro: "申请成为Rfriend Services GmbH / OPPO Austria授权B2B合作伙伴。提交后，我们的销售与财务团队将审核您的公司信息、VAT资料、合作意向和信用条件。审核通过后，您将获得B2B客户门户账号，用于查看专属价格、可销售库存、订单、发票和发货状态。", submit: "提交合作伙伴申请", success: "您的B2B合作伙伴注册申请已提交。申请编号：{requestNo}。我们的销售与财务团队将进行审核。", requiredHint: "带 * 的字段为必填项。", confirmation: "我确认以上信息真实有效，并同意 Rfriend Services GmbH 使用这些信息进行B2B合作伙伴审核。", validationRequired: "请填写所有必填字段并确认信息真实有效。",
          steps: { company: "公司信息", billing: "开票与收货信息", contact: "联系人信息", intention: "合作意向", documents: "文件与确认" },
          descriptions: { company: "请填写法人主体与商业类型，用于客户主档和VAT审核。", billing: "这些信息将用于报价、形式发票、商业发票和发货指令。", contact: "我们会通过以下联系人完成开户注册和后续商务沟通。", intention: "帮助销售团队判断合作范围、价格政策和信用条件。", documents: "可先填写文件名称或链接，正式审核时销售团队会跟进原件。" },
          fields: { companyName: "公司名称 *", countryRegion: "国家 / 地区 *", companyNo: "公司注册号 *", vatId: "VAT ID *", website: "公司网站", businessType: "业务类型 *", channelType: "渠道类型 *", registeredAddress: "注册地址 *", billingAddress: "开票地址 *", shippingAddress: "收货地址 *", invoiceEmail: "发票邮箱 *", deliveryContactName: "收货联系人 *", deliveryContactPhone: "收货联系电话 *", contactName: "联系人姓名 *", jobTitle: "职位", email: "邮箱 *", phone: "电话 *", preferredLanguage: "首选语言", productCategories: "感兴趣的产品类别 *", monthlyVolume: "预计月采购量 *", targetSalesChannel: "目标销售渠道 *", existingCooperation: "是否已有OPPO合作", applicationReason: "申请原因 *", businessLicense: "营业执照 / 公司注册文件", vatCertificate: "VAT证书", additionalDocuments: "其他文件" },
        },
      },
    },
    en: {
      portal: { admin: "B2B Admin Portal", pricingCenter: "Pricing & Quotation Center", customerTitle: "B2B Partner Ordering Portal", signedInAccount: "Signed-in Account", signOut: "Sign Out", refreshData: "Refresh Data", language: "Language", notSignedIn: "Not Signed In", signInFirst: "Please sign in first" },
      menu: {
        workspace: { title: "Management Workspace", overview: "Business Overview", tasks: "My Tasks", risks: "Risk Alerts" },
        trade: { title: "Trade Management", quoteManagement: "Quotation Management", orderManagement: "Order Management", approvalManagement: "Approval Management", invoiceManagement: "Invoice Management", shipmentManagement: "Shipment Management" },
        customer: { title: "Customer Management", profiles: "Customer Profiles", registrationReview: "Customer Registration Review", accounts: "Customer Accounts", pricingPolicies: "Pricing Policies", creditTerms: "Credit Limit / Payment Terms" },
        inventory: { title: "Products & Inventory", catalog: "Product Catalog", inventoryManagement: "Inventory Management", inventoryLocks: "Inventory Locks", lowStockAlerts: "Low Stock Alerts" },
        system: { title: "System Settings", formulaManagement: "Formula Management", batchImport: "Batch Import", companyInvoiceSettings: "Company & Invoice Settings", permissionManagement: "Permission Management", operationLogs: "Operation Logs" },
      },
      order: { table: { orderNo: "Order No.", customer: "Customer", skuSummary: "SKU Summary", amount: "Amount", orderStatus: "Order Status", approvalStatus: "Approval Status", invoiceStatus: "Invoice Status", shipmentStatus: "Shipment Status", createdAt: "Created At", actions: "Actions" } },
      status: { DRAFT: "Draft", SUBMITTED: "Submitted", PENDING_APPROVAL: "Pending Approval", IN_APPROVAL: "In Approval", APPROVED: "Approved", REJECTED: "Rejected", INVOICE_GENERATED: "Invoice Generated", AWAITING_PAYMENT: "Awaiting Payment", PAYMENT_CONFIRMED: "Payment Confirmed", READY_TO_SHIP: "Ready to Ship", SHIPPED: "Shipped", COMPLETED: "Completed", CANCELLED: "Cancelled", NOT_REQUIRED: "Not Required", NOT_GENERATED: "Not Generated", PI_GENERATED: "PI Generated", GENERATED: "Generated", SENT: "Sent", PAID: "Paid", NOT_READY: "Not Ready", PENDING: "Pending", DELIVERED: "Delivered", PARTIAL_PAID: "Partial Paid", CREDIT_TERM_CONFIRMED: "Credit Term Confirmed", ACTIVE: "Active", INACTIVE: "Inactive" },
      customer: {
        registration: {
          title: "B2B Partner Registration", eyebrow: "Partner Registration", intro: "Apply to become an authorized B2B partner of Rfriend Services GmbH / OPPO Austria. After submission, our sales and finance teams will review your company information, VAT details, business intention, and payment conditions. Once approved, you will receive access to the B2B Partner Portal to view your dedicated prices, available stock, orders, invoices, and shipment status.", submit: "Submit Partner Application", success: "Your B2B partner registration has been submitted. Request No.: {requestNo}. Our sales and finance teams will review it.", requiredHint: "Fields marked with * are required.", confirmation: "I confirm that the information provided is accurate and authorize Rfriend Services GmbH to use it for B2B partner review.", validationRequired: "Please complete all required fields and confirm that the information is accurate.",
          steps: { company: "Company Information", billing: "Billing & Shipping Information", contact: "Contact Person", intention: "Business Intention", documents: "Documents & Confirmation" },
          descriptions: { company: "Provide the legal entity and business profile for customer master data and VAT review.", billing: "These details are used for quotations, Proforma Invoices, Commercial Invoices, and delivery instructions.", contact: "We will use this contact for onboarding and commercial communication.", intention: "This helps sales review the cooperation scope, pricing policy, and credit conditions.", documents: "You may enter document names or links first; our sales team will follow up for originals if needed." },
          fields: { companyName: "Company Name *", countryRegion: "Country / Region *", companyNo: "Company Registration No. *", vatId: "VAT ID *", website: "Company Website", businessType: "Business Type *", channelType: "Channel Type *", registeredAddress: "Registered Address *", billingAddress: "Billing Address *", shippingAddress: "Shipping Address *", invoiceEmail: "Invoice Email *", deliveryContactName: "Delivery Contact Name *", deliveryContactPhone: "Delivery Contact Phone *", contactName: "Contact Name *", jobTitle: "Job Title", email: "Email *", phone: "Phone *", preferredLanguage: "Preferred Language", productCategories: "Interested Product Categories *", monthlyVolume: "Expected Monthly Purchase Volume *", targetSalesChannel: "Target Sales Channel *", existingCooperation: "Existing OPPO Cooperation", applicationReason: "Application Reason *", businessLicense: "Business License / Company Registration Document", vatCertificate: "VAT Certificate", additionalDocuments: "Additional Documents" },
        },
      },
    },
    de: {
      portal: { admin: "B2B-Admin-Portal", pricingCenter: "Preis- und Angebotszentrale", customerTitle: "B2B-Partner-Bestellportal", signedInAccount: "Angemeldetes Konto", signOut: "Abmelden", refreshData: "Daten aktualisieren", language: "Sprache", notSignedIn: "Nicht angemeldet", signInFirst: "Bitte zuerst anmelden" },
      menu: {
        workspace: { title: "Management-Arbeitsbereich", overview: "Geschäftsübersicht", tasks: "Meine Aufgaben", risks: "Risikohinweise" },
        trade: { title: "Transaktionsmanagement", quoteManagement: "Angebotsverwaltung", orderManagement: "Auftragsverwaltung", approvalManagement: "Freigabeverwaltung", invoiceManagement: "Rechnungsverwaltung", shipmentManagement: "Versandverwaltung" },
        customer: { title: "Kundenverwaltung", profiles: "Kundenprofile", registrationReview: "Prüfung der Kundenregistrierung", accounts: "Kundenkonten", pricingPolicies: "Preisrichtlinien", creditTerms: "Kreditlimit / Zahlungsbedingungen" },
        inventory: { title: "Produkte & Bestand", catalog: "Produktkatalog", inventoryManagement: "Bestandsverwaltung", inventoryLocks: "Bestandsreservierungen", lowStockAlerts: "Warnungen bei niedrigem Bestand" },
        system: { title: "Systemeinstellungen", formulaManagement: "Formelverwaltung", batchImport: "Massenimport", companyInvoiceSettings: "Unternehmens- & Rechnungseinstellungen", permissionManagement: "Berechtigungsverwaltung", operationLogs: "Aktivitätsprotokolle" },
      },
      order: { table: { orderNo: "Auftragsnr.", customer: "Kunde", skuSummary: "SKU-Zusammenfassung", amount: "Betrag", orderStatus: "Auftragsstatus", approvalStatus: "Freigabestatus", invoiceStatus: "Rechnungsstatus", shipmentStatus: "Versandstatus", createdAt: "Erstellt am", actions: "Aktionen" } },
      status: { DRAFT: "Entwurf", SUBMITTED: "Eingereicht", PENDING_APPROVAL: "Freigabe ausstehend", IN_APPROVAL: "In Freigabe", APPROVED: "Freigegeben", REJECTED: "Abgelehnt", INVOICE_GENERATED: "Rechnung erstellt", AWAITING_PAYMENT: "Zahlung ausstehend", PAYMENT_CONFIRMED: "Zahlung bestätigt", READY_TO_SHIP: "Versandbereit", SHIPPED: "Versendet", COMPLETED: "Abgeschlossen", CANCELLED: "Storniert", NOT_REQUIRED: "Nicht erforderlich", NOT_GENERATED: "Nicht erstellt", PI_GENERATED: "PI erstellt", GENERATED: "Erstellt", SENT: "Gesendet", PAID: "Bezahlt", NOT_READY: "Nicht bereit", PENDING: "Ausstehend", DELIVERED: "Zugestellt", PARTIAL_PAID: "Teilweise bezahlt", CREDIT_TERM_CONFIRMED: "Zahlungsziel bestätigt", ACTIVE: "Aktiv", INACTIVE: "Inaktiv" },
      customer: {
        registration: {
          title: "B2B-Partnerregistrierung", eyebrow: "Partnerregistrierung", intro: "Beantragen Sie die Registrierung als autorisierter B2B-Partner von Rfriend Services GmbH / OPPO Austria. Nach der Einreichung prüfen unser Vertriebs- und Finanzteam Ihre Unternehmensdaten, USt-IdNr., Geschäftsabsicht und Zahlungsbedingungen. Nach der Freigabe erhalten Sie Zugang zum B2B-Partnerportal, um Ihre individuellen Preise, verfügbaren Bestände, Aufträge, Rechnungen und Versandstatus einzusehen.", submit: "Partnerantrag einreichen", success: "Ihre B2B-Partnerregistrierung wurde eingereicht. Antragsnr.: {requestNo}. Unser Vertriebs- und Finanzteam wird den Antrag prüfen.", requiredHint: "Mit * gekennzeichnete Felder sind Pflichtfelder.", confirmation: "Ich bestätige, dass die angegebenen Informationen korrekt sind, und ermächtige Rfriend Services GmbH, diese für die Prüfung als B2B-Partner zu verwenden.", validationRequired: "Bitte füllen Sie alle Pflichtfelder aus und bestätigen Sie die Richtigkeit der Angaben.",
          steps: { company: "Unternehmensinformationen", billing: "Rechnungs- und Lieferinformationen", contact: "Ansprechpartner", intention: "Geschäftsabsicht", documents: "Dokumente & Bestätigung" },
          descriptions: { company: "Bitte geben Sie Rechtsträger und Geschäftsprofil für Kundenstamm und USt-Prüfung an.", billing: "Diese Angaben werden für Angebote, Proforma-Rechnungen, Handelsrechnungen und Lieferanweisungen verwendet.", contact: "Diesen Kontakt nutzen wir für Onboarding und geschäftliche Abstimmung.", intention: "Dies hilft dem Vertrieb, Kooperationsumfang, Preisrichtlinie und Kreditbedingungen zu prüfen.", documents: "Sie können zunächst Dokumentnamen oder Links angeben; unser Vertrieb fordert bei Bedarf Originale an." },
          fields: { companyName: "Firmenname *", countryRegion: "Land / Region *", companyNo: "Handelsregisternr. *", vatId: "USt-IdNr. *", website: "Unternehmenswebsite", businessType: "Geschäftstyp *", channelType: "Vertriebskanal *", registeredAddress: "Registrierte Adresse *", billingAddress: "Rechnungsadresse *", shippingAddress: "Lieferadresse *", invoiceEmail: "Rechnungs-E-Mail *", deliveryContactName: "Lieferkontakt *", deliveryContactPhone: "Telefon Lieferkontakt *", contactName: "Name des Ansprechpartners *", jobTitle: "Position", email: "E-Mail *", phone: "Telefon *", preferredLanguage: "Bevorzugte Sprache", productCategories: "Interessierte Produktkategorien *", monthlyVolume: "Erwartetes monatliches Einkaufsvolumen *", targetSalesChannel: "Ziel-Vertriebskanal *", existingCooperation: "Bestehende OPPO-Kooperation", applicationReason: "Antragsbegründung *", businessLicense: "Gewerbeschein / Handelsregisterdokument", vatCertificate: "USt-Zertifikat", additionalDocuments: "Weitere Dokumente" },
        },
      },
    },
  };

  const PHRASES = {
    "界面语言": { en: "Language", de: "Sprache" },
    "Account Login": { zh: "账号登录", de: "Kontoanmeldung" },
    "Account Request": { zh: "申请账号", de: "Kontoantrag" },
    "Quote Workflow": { zh: "报价流程", de: "Angebotsworkflow" },
    "Mobile / CE": { zh: "手机 / 消电", de: "Mobile / CE" },
    "账号登录": { en: "Account Login", de: "Kontoanmeldung" },
    "不同账号登录后，将自动进入对应的权限范围。": {
      en: "After signing in with different accounts, the system automatically opens the corresponding permission scope.",
      de: "Nach der Anmeldung mit unterschiedlichen Konten öffnet das System automatisch den entsprechenden Berechtigungsbereich.",
    },
    "登录账号": { en: "Login ID", de: "Anmeldekonto" },
    "登录密码": { en: "Password", de: "Passwort" },
    "登录系统": { en: "Sign In", de: "Anmelden" },
    "演示账号": { en: "Demo Accounts", de: "Demokonten" },
    "超级管理员 `harbor / harbor123`。其他账号需由 harbor 审批或生成。": {
      en: "Super Admin `harbor / harbor123`. All other accounts must be approved or generated by harbor.",
      de: "Super-Admin `harbor / harbor123`. Alle weiteren Konten müssen von harbor genehmigt oder erstellt werden.",
    },
    "申请账号": { en: "Account Request", de: "Kontoantrag" },
    "账号申请提交后，由管理员审批并生成登录账号。": {
      en: "After submission, an administrator reviews the request and generates the login account.",
      de: "Nach dem Einreichen prüft ein Administrator den Antrag und erstellt das Anmeldekonto.",
    },
    "申请人姓名": { en: "Applicant Name", de: "Name des Antragstellers" },
    "申请账号": { en: "Requested Login ID", de: "Beantragtes Anmeldekonto" },
    "申请密码": { en: "Requested Password", de: "Beantragtes Passwort" },
    "申请角色": { en: "Requested Role", de: "Beantragte Rolle" },
    "岗位": { en: "Position", de: "Position" },
    "账号申请提交后，由管理员审批并生成登录账号。申请密码仅申请人本人知晓，系统不会在审批过程中展示。": {
      en: "After submission, an administrator reviews the request and generates the login account. The requested password is known only to the applicant and is not shown during approval.",
      de: "Nach dem Einreichen prüft ein Administrator den Antrag und erstellt das Anmeldekonto. Das beantragte Passwort ist nur dem Antragsteller bekannt und wird während der Freigabe nicht angezeigt.",
    },
    "密码规则：必须同时包含英文字母和数字，且只能由申请人本人知晓。": {
      en: "Password rule: it must contain both English letters and numbers, and only the applicant should know it.",
      de: "Passwortregel: Es muss sowohl englische Buchstaben als auch Zahlen enthalten, und nur der Antragsteller sollte es kennen.",
    },
    "客户经理": { en: "Customer Manager", de: "Kundenmanager" },
    "业务员": { en: "Sales Rep", de: "Vertriebsmitarbeiter" },
    "业务主管": { en: "Sales Manager", de: "Vertriebsleiter" },
    "电商负责人": { en: "E-commerce Lead", de: "E-Commerce-Leitung" },
    "业务负责人": { zh: "总经理", en: "General Manager", de: "Geschäftsführer" },
    "总经理": { en: "General Manager", de: "Geschäftsführer" },
    "财务人员": { en: "Finance", de: "Finanzmitarbeiter" },
    "财务总监": { en: "Finance Director", de: "Finanzdirektor" },
    "超级管理员": { en: "Super Admin", de: "Super-Administrator" },
    "管理员": { en: "Administrator", de: "Administrator" },
    "核心权限": { en: "Core Permissions", de: "Kernberechtigungen" },
    "查看 FOB": { en: "View FOB", de: "FOB anzeigen" },
    "查看毛利率": { en: "View Gross Margin", de: "Bruttomarge anzeigen" },
    "查看毛利额": { en: "View Gross Profit", de: "Bruttogewinn anzeigen" },
    "所属团队": { en: "Team", de: "Team" },
    "申请原因": { en: "Reason", de: "Begründung" },
    "提交账号申请": { en: "Submit Account Request", de: "Kontoantrag senden" },
    "清空审批脏数据": { en: "Clear Approval Dirty Data", de: "Freigabe-Altdaten leeren" },
    "清空全部日志": { en: "Clear All Logs", de: "Alle Protokolle leeren" },
    "确认清空审批中心中的脏数据？关联的报价审批、客户申请、账号申请将一并删除。": {
      en: "Clear dirty data from the approval center? Related quote approvals, customer requests, and account requests will be deleted together.",
      de: "Verschmutzte Daten im Freigabecenter leeren? Zugehörige Angebotsfreigaben, Kundenanträge und Kontoanträge werden ebenfalls gelöscht.",
    },
    "确认清空全部操作日志？清空后不可恢复。": {
      en: "Clear all operation logs? This action cannot be undone.",
      de: "Alle Aktionsprotokolle leeren? Dieser Vorgang kann nicht rückgängig gemacht werden.",
    },
    "仅超级管理员 harbor 可以删除审批脏数据。": {
      en: "Only super admin harbor can delete dirty approval data.",
      de: "Nur der Super-Admin harbor kann verschmutzte Freigabedaten löschen.",
    },
    "仅超级管理员 harbor 可以清空审批脏数据。": {
      en: "Only super admin harbor can clear dirty approval data.",
      de: "Nur der Super-Admin harbor kann verschmutzte Freigabedaten leeren.",
    },
    "仅超级管理员 harbor 可以清空操作日志。": {
      en: "Only super admin harbor can clear operation logs.",
      de: "Nur der Super-Admin harbor kann Aktionsprotokolle leeren.",
    },
    "客户报价管理系统": { en: "Customer Quote Management System", de: "Kundenangebotsverwaltung" },
    "面向手机/消费电子行业的报价、审批与预警后台原型": {
      en: "Quotation, approval, and warning workflow prototype for the mobile and consumer electronics business.",
      de: "Workflow-Prototyp für Angebot, Freigabe und Warnhinweise im Mobile- und Consumer-Electronics-Geschäft.",
    },
    "报价查询": { en: "Quote Query", de: "Angebotsabfrage" },
    "批量查询关键词": { en: "Batch Query Keywords", de: "Stapelabfrage-Schlagwörter" },
    "批量查询关键词（支持客户 / 产品 / 时间模糊查询）": {
      en: "Batch Query Keywords (supports fuzzy matching for customer / product / month)",
      de: "Stapelabfrage-Schlagwörter (unterstützt unscharfe Suche für Kunde / Produkt / Monat)",
    },
    "价格查询结果": { en: "Price Query Results", de: "Preisabfrage-Ergebnisse" },
    "最新零售价": { en: "Latest Retail Price", de: "Neuester Verkaufspreis" },
    "最新 FOB": { en: "Latest FOB", de: "Neuester FOB" },
    "报价生成": { en: "Create Quote", de: "Angebot erstellen" },
    "批量导入": { en: "Bulk Import", de: "Massenimport" },
    "公式管理": { en: "Formula Management", de: "Formelverwaltung" },
    "产品管理": { en: "Product Management", de: "Produktverwaltung" },
    "SKU CODE": { en: "SKU CODE", de: "SKU-CODE" },
    "EAN 13": { en: "EAN 13", de: "EAN 13" },
    "CPH": { en: "CPH", de: "CPH" },
    "Net Weight (g)": { en: "Net Weight (g)", de: "Nettogewicht (g)" },
    "Gross Weight (g)": { en: "Gross Weight (g)", de: "Bruttogewicht (g)" },
    "Phone Dimensions (L*B*H)": { en: "Phone Dimensions (L*B*H)", de: "Geräteabmessungen (L*B*H)" },
    "Color Box Dimensions (L*B*H)": { en: "Color Box Dimensions (L*B*H)", de: "Farbkarton-Abmessungen (L*B*H)" },
    "Inner Carton Dimensions (L*B*H)": { en: "Inner Carton Dimensions (L*B*H)", de: "Innenkarton-Abmessungen (L*B*H)" },
    "Units per Carton": { en: "Units per Carton", de: "Einheiten pro Karton" },
    "Carton Weight (KG)": { en: "Carton Weight (KG)", de: "Kartongewicht (KG)" },
    "客户管理": { en: "Customer Management", de: "Kundenverwaltung" },
    "审批中心": { en: "Approval Center", de: "Freigabecenter" },
    "账号管理": { en: "Account Management", de: "Kontoverwaltung" },
    "操作日志": { en: "Operation Logs", de: "Aktionsprotokolle" },
    "当前报价页已同步产品最新零售价与 FOB。": {
      en: "The current quote page has been synchronized with the latest retail price and FOB.",
      de: "Die aktuelle Angebotsseite wurde mit dem neuesten Verkaufspreis und FOB synchronisiert.",
    },
    "当前筛选条件下没有价格结果。": {
      en: "No price results match the current filters.",
      de: "Keine Preisergebnisse passen zu den aktuellen Filtern.",
    },
    "报价公式结果无效，无法生成报价。": {
      en: "The quote formula result is invalid and the quote cannot be generated.",
      de: "Das Ergebnis der Angebotsformel ist ungültig und das Angebot kann nicht erstellt werden.",
    },
    "当前筛选条件下没有可导出的价格结果。": {
      en: "There are no price results to export under the current filters.",
      de: "Unter den aktuellen Filtern gibt es keine Preisergebnisse zum Exportieren.",
    },
    "当前价格结果已导出为 CSV。": {
      en: "The current price results have been exported as CSV.",
      de: "Die aktuellen Preisergebnisse wurden als CSV exportiert.",
    },
    "日志筛选": { en: "Log Filters", de: "Protokollfilter" },
    "操作对象/关键词": { en: "Target / Keyword", de: "Objekt / Stichwort" },
    "开始日期": { en: "Start Date", de: "Startdatum" },
    "结束日期": { en: "End Date", de: "Enddatum" },
    "查询日志": { en: "Search Logs", de: "Protokolle suchen" },
    "重置筛选": { en: "Reset Filters", de: "Filter zurücksetzen" },
    "展开": { en: "Expand", de: "Aufklappen" },
    "收起": { en: "Collapse", de: "Einklappen" },
    "展开页面": { en: "Expand Page", de: "Seite aufklappen" },
    "收起页面": { en: "Collapse Page", de: "Seite einklappen" },
    "日志详情": { en: "Log Details", de: "Protokolldetails" },
    "暂无符合条件的日志": { en: "No logs match the current filters", de: "Keine Protokolle passen zu den aktuellen Filtern" },
    "页面会按当前角色自动隔离敏感价格与可见模块。": {
      en: "Sensitive price fields and visible modules are isolated automatically by the current role.",
      de: "Sensible Preisfelder und sichtbare Module werden automatisch entsprechend der aktuellen Rolle getrennt.",
    },
    "当前登录账号": { en: "Signed-in Account", de: "Aktuelles Konto" },
    "未登录": { en: "Not Signed In", de: "Nicht angemeldet" },
    "请先登录": { en: "Please sign in first", de: "Bitte zuerst anmelden" },
    "退出登录": { en: "Sign Out", de: "Abmelden" },
    "刷新数据": { en: "Refresh Data", de: "Daten aktualisieren" },
    "全部": { en: "All", de: "Alle" },
    "筛选条件": { en: "Filters", de: "Filter" },
    "客户名称": { en: "Customer Name", de: "Kundenname" },
    "客户编码": { en: "Customer Code", de: "Kundencode" },
    "正式合作日期": { en: "Formal Cooperation Date", de: "Offizielles Kooperationsdatum" },
    "SKU": { en: "SKU", de: "SKU" },
    "产品名称": { en: "Product Name", de: "Produktname" },
    "产品系列": { en: "Product Series", de: "Produktserie" },
    "生效月份": { en: "Effective Month", de: "Gültigkeitsmonat" },
    "查询月份": { en: "Query Month", de: "Abfragemonat" },
    "报价状态": { en: "Quote Status", de: "Angebotsstatus" },
    "审批状态": { en: "Approval Status", de: "Freigabestatus" },
    "公式版本": { en: "Formula Version", de: "Formelversion" },
    "查询报价": { en: "Search Quotes", de: "Angebote suchen" },
    "一键下载价格表": { en: "Download Price Sheet", de: "Preisliste herunterladen" },
    "导出当前列表 CSV": { en: "Export Current List CSV", de: "Aktuelle Liste als CSV exportieren" },
    "报价记录": { en: "Quote Records", de: "Angebotsliste" },
    "加载中...": { en: "Loading...", de: "Wird geladen..." },
    "RRP": { en: "RRP", de: "UVP" },
    "零售价": { en: "MSRP", de: "UVP" },
    "成本价 / FOP": { zh: "成本价 / FOB", en: "Cost / FOB", de: "Kosten / FOB" },
    "成本价 / FOB": { en: "Cost / FOB", de: "Kosten / FOB" },
    "DB (F)": { en: "DB (F)", de: "DB (F)" },
    "客户Margin (G)": { en: "Customer Margin (G)", de: "Kundenmarge (G)" },
    "Service Fee (H)": { en: "Service Fee (H)", de: "Servicegebühr (H)" },
    "联合营销 / MKT Funding": { en: "MKT Funding", de: "MKT Funding" },
    "联合营销占比": { en: "MKT Funding Rate", de: "MKT-Funding-Satz" },
    "STKbuffer (I)": { en: "STKbuffer (I)", de: "STKbuffer (I)" },
    "Front Margin (J)": { en: "Front Margin (J)", de: "Front Margin (J)" },
    "VAT (K)": { en: "VAT (K)", de: "MwSt. (K)" },
    "URA (L)": { en: "URA (L)", de: "URA (L)" },
    "原始客户报价": { en: "Raw Customer Quote", de: "Rohes Kundenangebot" },
    "客户点位": { en: "Customer Factor", de: "Kundenfaktor" },
    "特殊点位": { en: "Special Discount", de: "Sonderrabatt" },
    "返利": { en: "Rebate", de: "Bonus" },
    "临时支持": { en: "Temporary Support", de: "Temporäre Unterstützung" },
    "客户报价": { en: "Customer Quote", de: "Kundenangebot" },
    "客户报价（含税）": { en: "Customer Quote (Tax Included)", de: "Kundenangebot (inkl. Steuer)" },
    "下载价格表": { en: "Download Price Sheet", de: "Preisliste herunterladen" },
    "客户价格表": { en: "Customer Price Sheet", de: "Kundenpreisliste" },
    "报价单": { en: "Quotation", de: "Angebot" },
    "报价单 / QUOTATION": { en: "Quotation / QUOTATION", de: "Angebot / QUOTATION" },
    "报价日期": { en: "Quotation Date", de: "Angebotsdatum" },
    "有效期至": { en: "Valid Until", de: "Gueltig bis" },
    "联系人": { en: "Contact Person", de: "Ansprechpartner" },
    "联系电话": { en: "Phone", de: "Telefon" },
    "邮箱": { en: "Email", de: "E-Mail" },
    "地址": { en: "Address", de: "Adresse" },
    "币种": { en: "Currency", de: "Waehrung" },
    "数量": { en: "Quantity", de: "Menge" },
    "单位": { en: "Unit", de: "Einheit" },
    "RRP（含税）": { en: "RRP (Tax Included)", de: "UVP (inkl. Steuer)" },
    "小计（含税）": { en: "Subtotal (Tax Included)", de: "Zwischensumme (inkl. Steuer)" },
    "客户信息": { en: "Customer Information", de: "Kundeninformationen" },
    "基本报价信息": { en: "Quotation Summary", de: "Angebotsgrunddaten" },
    "产品报价": { en: "Product Quotation", de: "Produktangebot" },
    "新窗口预览": { en: "Open Preview", de: "Vorschau öffnen" },
    "打印报价单": { en: "Print Quotation", de: "Angebot drucken" },
    "下载报价单 PDF": { en: "Download Quotation PDF", de: "Angebot als PDF herunterladen" },
    "下载报价单 HTML": { en: "Download Quotation HTML", de: "Angebot als HTML herunterladen" },
    "下载报价单 TXT": { en: "Download Quotation TXT", de: "Angebot als TXT herunterladen" },
    "客户报价单预览": { en: "Customer Quotation Preview", de: "Kundenangebotsvorschau" },
    "多个客户": { en: "Multiple Customers", de: "Mehrere Kunden" },
    "当前筛选结果": { en: "Current Filter Result", de: "Aktuelles Filterergebnis" },
    "以下为当前客户的已审批价格，请查收。": {
      en: "Please find the approved prices for the current customer below.",
      de: "Nachfolgend finden Sie die freigegebenen Preise des aktuellen Kunden.",
    },
    "以下为当前筛选结果中的已审批价格，请查收。": {
      en: "Please find the approved prices from the current filter result below.",
      de: "Nachfolgend finden Sie die freigegebenen Preise aus dem aktuellen Filterergebnis.",
    },
    "当前没有可下载的已审批价格。": {
      en: "There are no approved prices available for download in the current result.",
      de: "Im aktuellen Ergebnis stehen keine freigegebenen Preise zum Download bereit.",
    },
    "当前报价尚未审批通过，暂时不能下载客户价格表。": {
      en: "This quote has not been approved yet, so the customer price sheet cannot be downloaded.",
      de: "Dieses Angebot ist noch nicht freigegeben, daher kann die Kundenpreisliste noch nicht heruntergeladen werden.",
    },
    "当前报价尚未审批通过，暂时不能下载客户报价单。": {
      en: "This quote has not been approved yet, so the customer quotation cannot be downloaded.",
      de: "Dieses Angebot ist noch nicht freigegeben, daher kann das Kundenangebot noch nicht heruntergeladen werden.",
    },
    "审批通过后自动生成，可直接预览、导出、打印并发送给客户。": {
      en: "Generated automatically after approval and ready for preview, export, print, and direct customer delivery.",
      de: "Wird nach der Freigabe automatisch erstellt und kann direkt angesehen, exportiert, gedruckt und an den Kunden gesendet werden.",
    },
    "当前报价尚未审批通过。审批完成后，系统会自动生成一份客户可发送版本，并提供预览、打印与下载入口。": {
      en: "This quote has not been approved yet. After approval, the system will generate a customer-ready version with preview, print, and download entry points.",
      de: "Dieses Angebot ist noch nicht freigegeben. Nach der Freigabe erstellt das System automatisch eine versandfähige Version mit Vorschau-, Druck- und Download-Zugängen.",
    },
    "请查收附件报价单。以下为本次报价摘要：": {
      en: "Please find the attached quotation. Below is the quotation summary for this issue:",
      de: "Bitte finden Sie das beigefügte Angebot. Nachfolgend die Zusammenfassung dieses Angebots:",
    },
    "已打开报价单预览窗口。": {
      en: "The quotation preview window has been opened.",
      de: "Das Vorschaufenster für das Angebot wurde geöffnet.",
    },
    "已尝试打开报价单打印窗口。": {
      en: "The quotation print window has been opened.",
      de: "Das Druckfenster für das Angebot wurde geöffnet.",
    },
    "打开预览窗口失败，请检查浏览器弹窗权限。": {
      en: "Failed to open the preview window. Please check the browser popup permission.",
      de: "Das Vorschaufenster konnte nicht geöffnet werden. Bitte prüfen Sie die Popup-Berechtigung des Browsers.",
    },
    "打开打印窗口失败，请检查浏览器弹窗权限。": {
      en: "Failed to open the print window. Please check the browser popup permission.",
      de: "Das Druckfenster konnte nicht geöffnet werden. Bitte prüfen Sie die Popup-Berechtigung des Browsers.",
    },
    "毛利额": { en: "Gross Profit", de: "Bruttogewinn" },
    "毛利率": { en: "Gross Margin", de: "Bruttomarge" },
    "预警": { en: "Warning", de: "Warnung" },
    "创建人": { en: "Created By", de: "Erstellt von" },
    "创建时间": { en: "Created At", de: "Erstellt am" },
    "操作": { en: "Actions", de: "Aktionen" },
    "报价详情": { en: "Quote Details", de: "Angebotsdetails" },
    "点击“查看明细”后展示公式版本、计算过程、审批轨迹和日志。": {
      en: 'Click "View Details" to display formula version, calculation steps, approval trail, and logs.',
      de: 'Klicken Sie auf "Details anzeigen", um Formelversion, Berechnung, Freigabeverlauf und Protokolle anzuzeigen.',
    },
    "客户": { en: "Customer", de: "Kunde" },
    "产品 SKU": { en: "Product SKU", de: "Produkt-SKU" },
    "零售价 MSRP": { en: "MSRP", de: "UVP" },
    "内部成本参考": { en: "Internal Cost Reference", de: "Interne Kostenreferenz" },
    "客户点位/折扣系数": { en: "Customer Factor / Discount", de: "Kundenfaktor / Rabatt" },
    "返利值": { en: "Rebate Value", de: "Bonuswert" },
    "返利类型": { en: "Rebate Type", de: "Bonustyp" },
    "固定金额": { en: "Fixed Amount", de: "Fester Betrag" },
    "比例": { en: "Rate", de: "Satz" },
    "渠道系数": { en: "Channel Factor", de: "Kanalfaktor" },
    "税率（可选）": { en: "Tax Rate (Optional)", de: "Steuersatz (optional)" },
    "备注": { en: "Remark", de: "Bemerkung" },
    "实时试算": { en: "Live Preview", de: "Live-Vorschau" },
    "生成报价并发起审批": { en: "Create Quote and Start Approval", de: "Angebot erstellen und Freigabe starten" },
    "请先选择当前产品后再执行批量生成。": {
      en: "Please select the current product before running the batch generation.",
      de: "Bitte waehlen Sie zuerst das aktuelle Produkt, bevor Sie die Stapelerstellung starten.",
    },
    "请先选择当前客户后再执行批量生成。": {
      en: "Please select the current customer before running the batch generation.",
      de: "Bitte waehlen Sie zuerst den aktuellen Kunden, bevor Sie die Stapelerstellung starten.",
    },
    "当前没有可批量生成报价的客户。": {
      en: "There are no customers available for batch quote generation.",
      de: "Es stehen keine Kunden fuer die Stapelerstellung von Angeboten zur Verfuegung.",
    },
    "当前没有可批量生成报价的产品。": {
      en: "There are no products available for batch quote generation.",
      de: "Es stehen keine Produkte fuer die Stapelerstellung von Angeboten zur Verfuegung.",
    },
    "批量生成失败。": {
      en: "Batch quote creation failed.",
      de: "Die Stapelerstellung von Angeboten ist fehlgeschlagen.",
    },
    "当前产品生成各客户报价": {
      en: "Create Quotes for All Customers by Current Product",
      de: "Mit aktuellem Produkt Angebote fuer alle Kunden erzeugen",
    },
    "当前客户生成各产品报价": {
      en: "Create Quotes for All Products by Current Customer",
      de: "Mit aktuellem Kunden Angebote fuer alle Produkte erzeugen",
    },
    "计算过程明细": { en: "Calculation Details", de: "Berechnungsdetails" },
    "选择客户、产品并录入参数后点击“实时试算”。": {
      en: 'Select a customer and product, enter parameters, then click "Live Preview".',
      de: 'Wählen Sie Kunde und Produkt, geben Sie die Parameter ein und klicken Sie dann auf "Live-Vorschau".',
    },
    "步骤": { en: "Step", de: "Schritt" },
    "公式/说明": { en: "Formula / Description", de: "Formel / Beschreibung" },
    "结果": { en: "Result", de: "Ergebnis" },
    "批量导入报价": { en: "Bulk Quote Import", de: "Angebote im Massenimport" },
    "下载标准导入模板": { en: "Download Import Template", de: "Importvorlage herunterladen" },
    "客户不存在时自动创建客户草稿": {
      en: "Create a draft customer automatically when the customer does not exist",
      de: "Kundenentwurf automatisch anlegen, wenn der Kunde nicht existiert",
    },
    "产品不存在时自动创建产品草稿": {
      en: "Create a draft product automatically when the product does not exist",
      de: "Produktentwurf automatisch anlegen, wenn das Produkt nicht existiert",
    },
    "当前原型支持 CSV 文件；Excel 解析位已预留，可后续接入解析器。": {
      en: "The current prototype supports CSV files. An Excel parsing hook is reserved for future integration.",
      de: "Der aktuelle Prototyp unterstützt CSV-Dateien. Eine Schnittstelle für Excel-Parsing ist für spätere Integration reserviert.",
    },
    "预校验": { en: "Pre-check", de: "Vorprüfung" },
    "确认批量生成报价": { en: "Confirm Bulk Quote Creation", de: "Massenangebot bestätigen" },
    "请选择文件后先执行预校验。": { en: "Please select a file and run the pre-check first.", de: "Bitte wählen Sie zuerst eine Datei aus und führen Sie die Vorprüfung aus." },
    "行号": { en: "Line", de: "Zeile" },
    "状态": { en: "Status", de: "Status" },
    "客户": { en: "Customer", de: "Kunde" },
    "试算结果": { en: "Preview Result", de: "Vorschauergebnis" },
    "失败原因": { en: "Failure Reason", de: "Fehlergrund" },
    "公式名称": { en: "Formula Name", de: "Formelname" },
    "公式编码": { en: "Formula Code", de: "Formelcode" },
    "适用客户类型": { en: "Applicable Customer Type", de: "Kundentyp" },
    "适用产品线": { en: "Applicable Product Line", de: "Produktlinie" },
    "适用渠道": { en: "Applicable Channel", de: "Gültiger Kanal" },
    "公式表达式": { en: "Formula Expression", de: "Formelausdruck" },
    "允许击穿成本生成草稿": { en: "Allow Below-cost Draft", de: "Entwurf unter Kosten zulassen" },
    "否": { en: "No", de: "Nein" },
    "是": { en: "Yes", de: "Ja" },
    "启用": { en: "Active", de: "Aktiv" },
    "停用": { en: "Inactive", de: "Inaktiv" },
    "删除": { en: "Delete", de: "Löschen" },
    "保存公式": { en: "Save Formula", de: "Formel speichern" },
    "清空表单": { en: "Clear Form", de: "Formular leeren" },
    "公式试算": { en: "Formula Trial", de: "Formeltest" },
    "折扣系数": { en: "Discount Factor", de: "Rabattfaktor" },
    "试算公式": { en: "Run Trial", de: "Test ausführen" },
    "试算结果将在这里展示。": { en: "Trial results will appear here.", de: "Testergebnisse werden hier angezeigt." },
    "公式列表": { en: "Formula List", de: "Formelliste" },
    "名称": { en: "Name", de: "Name" },
    "编码": { en: "Code", de: "Code" },
    "版本": { en: "Version", de: "Version" },
    "允许击穿草稿": { en: "Below-cost Draft", de: "Entwurf unter Kosten" },
    "产品型号": { en: "Product Model", de: "Produktmodell" },
    "颜色/版本": { en: "Color / Variant", de: "Farbe / Variante" },
    "上市时间": { en: "Launch Date", de: "Markteinführung" },
    "默认零售价": { en: "Default MSRP", de: "Standard-UVP" },
    "默认成本价 / FOP": { zh: "默认成本价 / FOB", en: "Default Cost / FOB", de: "Standardkosten / FOB" },
    "默认成本价 / FOB": { en: "Default Cost / FOB", de: "Standardkosten / FOB" },
    "默认公式模板": { en: "Default Formula", de: "Standardformel" },
    "默认渠道系数": { en: "Default Channel Factor", de: "Standard-Kanalfaktor" },
    "默认 DB (F)": { en: "Default DB (F)", de: "Standard DB (F)" },
    "默认 客户Margin (G)": { en: "Default Customer Margin (G)", de: "Standard-Kundenmarge (G)" },
    "默认 Service Fee (H)": { en: "Default Service Fee (H)", de: "Standard-Servicegebühr (H)" },
    "默认 联合营销 / MKT Funding": { en: "Default MKT Funding", de: "Standard-MKT-Funding" },
    "默认 STKbuffer (I)": { en: "Default STKbuffer (I)", de: "Standard-STKbuffer (I)" },
    "默认 Front Margin (J)": { en: "Default Front Margin (J)", de: "Standard-Front-Marge (J)" },
    "默认 VAT (K)": { en: "Default VAT (K)", de: "Standard-MwSt. (K)" },
    "默认 URA (L)": { en: "Default URA (L)", de: "Standard-URA (L)" },
    "保存产品": { en: "Save Product", de: "Produkt speichern" },
    "产品列表": { en: "Product List", de: "Produktliste" },
    "系列": { en: "Series", de: "Serie" },
    "型号": { en: "Model", de: "Modell" },
    "默认公式": { en: "Default Formula", de: "Standardformel" },
    "新增客户或客户政策变更提交后，将流转给业务负责人审批，并抄送财务。": {
      zh: "新增客户或客户政策变更提交后，将流转给总经理审批，并抄送财务。",
      en: "After a new customer or customer policy change is submitted, it is routed to the general manager for approval and copied to finance.",
      de: "Nach dem Einreichen eines neuen Kunden oder einer Kundenrichtlinienänderung wird der Vorgang an den Geschäftsführer zur Freigabe weitergeleitet und an die Finanzabteilung in Kopie gesendet.",
    },
    "关联已有客户（可选）": { en: "Base on Existing Customer (Optional)", de: "Mit vorhandenem Kunden verknüpfen (optional)" },
    "客户等级": { en: "Customer Level", de: "Kundenstufe" },
    "客户类型": { en: "Customer Type", de: "Kundentyp" },
    "渠道类型": { en: "Channel Type", de: "Kanaltyp" },
    "区域": { en: "Region", de: "Region" },
    "默认点位": { en: "Default Factor", de: "Standardfaktor" },
    "默认返利值": { en: "Default Rebate", de: "Standardbonus" },
    "默认返利类型": { en: "Default Rebate Type", de: "Standard-Bonustyp" },
    "默认审批人": { en: "Default Approver", de: "Standard-Freigeber" },
    "保存客户": { en: "Save Customer", de: "Kunde speichern" },
    "客户列表": { en: "Customer List", de: "Kundenliste" },
    "申请单号": { en: "Request No.", de: "Antragsnummer" },
    "申请类型": { en: "Request Type", de: "Antragstyp" },
    "政策摘要": { en: "Policy Summary", de: "Richtlinienzusammenfassung" },
    "发起人": { en: "Requester", de: "Antragsteller" },
    "业务审批": { en: "Business Approval", de: "Geschäftsfreigabe" },
    "财务抄送": { en: "Finance CC", de: "Finanz-Kopie" },
    "申请状态": { en: "Request Status", de: "Antragsstatus" },
    "对象名称": { en: "Object Name", de: "Objektname" },
    "对象编码": { en: "Object Code", de: "Objektcode" },
    "对象 / 摘要": { en: "Object / Summary", de: "Objekt / Zusammenfassung" },
    "价格摘要": { en: "Price Summary", de: "Preisübersicht" },
    "审批摘要": { en: "Approval Summary", de: "Freigabezusammenfassung" },
    "报价金额": { en: "Quote Amount", de: "Angebotsbetrag" },
    "预警 / 政策": { en: "Warning / Policy", de: "Warnung / Richtlinie" },
    "当前审批节点": { en: "Current Node", de: "Aktueller Knoten" },
    "流程": { en: "Flow", de: "Ablauf" },
    "账号生成": { en: "Create Account", de: "Konto erstellen" },
    "管理员角色可直接创建或维护账号": {
      en: "Administrator roles can create or maintain accounts directly.",
      de: "Administratorrollen können Konten direkt erstellen oder pflegen.",
    },
    "显示名称": { en: "Display Name", de: "Anzeigename" },
    "账号角色": { en: "Account Role", de: "Kontorolle" },
    "账号状态": { en: "Account Status", de: "Kontostatus" },
    "生成 / 保存账号": { en: "Create / Save Account", de: "Konto erstellen / speichern" },
    "账号审批申请": { en: "Account Approval Requests", de: "Konto-Freigabeanträge" },
    "管理员审批后自动生成账号": {
      en: "The account is generated automatically after administrator approval.",
      de: "Das Konto wird nach Freigabe durch einen Administrator automatisch erstellt.",
    },
    "申请人": { en: "Applicant", de: "Antragsteller" },
    "生成结果": { en: "Generated Result", de: "Ergebnis" },
    "支持新建、删除、权限变更、重置密码": {
      en: "Supports creation, deletion, permission changes, and password resets.",
      de: "Unterstützt Erstellung, Löschung, Rollenänderungen und Passwort-Reset.",
    },
    "最近登录": { en: "Last Login", de: "Letzte Anmeldung" },
    "账号来源": { en: "Account Source", de: "Kontoquelle" },
    "变更前": { en: "Before", de: "Vorher" },
    "变更后": { en: "After", de: "Nachher" },
    "变更摘要": { en: "Change Summary", de: "Änderungsübersicht" },
    "操作人": { en: "Operator", de: "Bearbeiter" },
    "操作时间": { en: "Operation Time", de: "Zeitpunkt" },
    "设备信息": { en: "Device Info", de: "Geräteinfo" },
    "查看明细": { en: "View Details", de: "Details anzeigen" },
    "客户邮件版": { en: "Customer Mail Copy", de: "Kundenmail-Version" },
    "复制到生成页": { en: "Copy to Create Page", de: "Zur Erstellungsseite kopieren" },
    "计算过程": { en: "Calculation Steps", de: "Berechnung" },
    "审批轨迹": { en: "Approval Trail", de: "Freigabeverlauf" },
    "客户邮件报价单": { en: "Customer Mail Quote", de: "Kunden-Mail-Angebot" },
    "审批通过后自动生成，可直接复制、下载并发送给客户": {
      en: "Generated automatically after approval. It can be copied, downloaded, and sent to the customer directly.",
      de: "Wird nach der Freigabe automatisch erstellt und kann direkt kopiert, heruntergeladen und an den Kunden gesendet werden.",
    },
    "复制邮件正文": { en: "Copy Mail Body", de: "Mailtext kopieren" },
    "复制邮件主题": { en: "Copy Mail Subject", de: "Mailbetreff kopieren" },
    "下载价格表 PDF": { en: "Download Price Sheet PDF", de: "Preisliste als PDF laden" },
    "下载价格表 HTML": { en: "Download Price Sheet HTML", de: "Preisliste als HTML laden" },
    "下载价格表 TXT": { en: "Download Price Sheet TXT", de: "Preisliste als TXT laden" },
    "打开邮件草稿": { en: "Open Mail Draft", de: "Mailentwurf öffnen" },
    "邮件内容预览": { en: "Mail Preview", de: "Mailvorschau" },
    "相关日志": { en: "Related Logs", de: "Zugehörige Protokolle" },
    "最近 8 条": { en: "Latest 8 Items", de: "Letzte 8 Einträge" },
    "查看": { en: "View", de: "Anzeigen" },
    "复制为新申请": { en: "Copy as New Request", de: "Als neuen Antrag kopieren" },
    "载入": { en: "Load", de: "Laden" },
    "批准生成": { en: "Approve and Generate", de: "Freigeben und erzeugen" },
    "驳回": { en: "Reject", de: "Ablehnen" },
    "编辑": { en: "Edit", de: "Bearbeiten" },
    "重置密码": { en: "Reset Password", de: "Passwort zurücksetzen" },
    "邮件报价单": { en: "Mail Quote", de: "Mail-Angebot" },
    "生成客户价格表": { en: "Generate Customer Price Sheet", de: "Kundenpreisliste erzeugen" },
    "批准": { en: "Approve", de: "Freigeben" },
    "审批完成": { en: "Approval Completed", de: "Freigabe abgeschlossen" },
    "审批驳回": { en: "Approval Rejected", de: "Freigabe abgelehnt" },
    "待配置审批人": { en: "Approver Not Configured", de: "Freigeber nicht konfiguriert" },
    "待配置": { en: "Pending Setup", de: "Noch nicht konfiguriert" },
    "待当前节点处理": { en: "Waiting for the current node", de: "Wartet auf den aktuellen Knoten" },
    "等待流转": { en: "Waiting for routing", de: "Wartet auf Weiterleitung" },
    "敏感价格口径": { en: "Sensitive Pricing Scope", de: "Sensible Preislogik" },
    "已按权限隔离": { en: "Hidden by permission", de: "Durch Berechtigung ausgeblendet" },
    "未生成审批": { en: "Approval Not Created", de: "Freigabe nicht erstellt" },
    "当前报价尚未审批通过。审批完成后，系统会自动生成一份客户可发送版本，并提供下载与复制入口。": {
      en: "This quote has not been approved yet. After approval, the system generates a customer-ready version automatically and provides download and copy actions.",
      de: "Dieses Angebot ist noch nicht freigegeben. Nach der Freigabe erstellt das System automatisch eine versandfähige Kundenfassung mit Download- und Kopierfunktionen.",
    },
    "暂无日志": { en: "No logs yet", de: "Noch keine Protokolle" },
    "暂无价格结果": { en: "No price results", de: "Keine Preisergebnisse" },
    "暂无数据": { en: "No data", de: "Keine Daten" },
    "暂无客户申请记录": { en: "No customer requests", de: "Keine Kundenanträge" },
    "暂无账号申请": { en: "No account requests", de: "Keine Kontoanträge" },
    "暂无审批数据": { en: "No approval records", de: "Keine Freigabedaten" },
    "暂无报价记录": { en: "No quotes", de: "Keine Angebote" },
    "新增客户": { en: "New Customer", de: "Neukunde" },
    "新增产品": { en: "New Product", de: "Neues Produkt" },
    "未授予核心权限": { en: "No core permissions granted", de: "Keine Kernberechtigungen vergeben" },
    "未授予敏感价格查看权限": { en: "No sensitive price visibility granted", de: "Keine Sichtbarkeit fuer sensible Preisfelder vergeben" },
    "客户政策变更": { en: "Customer Policy Change", de: "Änderung der Kundenrichtlinie" },
    "当前账号无新增客户权限": {
      en: "The current account does not have customer creation permission.",
      de: "Das aktuelle Konto hat keine Berechtigung zum Anlegen von Kunden.",
    },
    "当前账号无新增客户权限。": {
      en: "The current account does not have customer creation permission.",
      de: "Das aktuelle Konto hat keine Berechtigung zum Anlegen von Kunden.",
    },
    "当前账号无新增产品权限": {
      en: "The current account does not have product creation permission.",
      de: "Das aktuelle Konto hat keine Berechtigung zum Anlegen von Produkten.",
    },
    "当前账号无新增产品权限。": {
      en: "The current account does not have product creation permission.",
      de: "Das aktuelle Konto hat keine Berechtigung zum Anlegen von Produkten.",
    },
    "当前账号无删除报价权限。": {
      en: "The current account does not have permission to delete quotes.",
      de: "Das aktuelle Konto hat keine Berechtigung zum Loeschen von Angeboten.",
    },
    "当前角色仅可查看申请详情，审批请在审批中心处理。": {
      en: "The current role can only view request details. Please process approvals in the approval center.",
      de: "Die aktuelle Rolle kann nur die Antragsdetails sehen. Bitte bearbeiten Sie Freigaben im Freigabecenter.",
    },
    "当前表单加载的是历史申请详情，如需再次提报，请点击“复制为新申请”后再提交。": {
      en: 'The current form is showing a historical request. To submit again, click "Copy as New Request" first.',
      de: 'Das aktuelle Formular zeigt einen historischen Antrag. Für eine erneute Einreichung klicken Sie zuerst auf "Als neuen Antrag kopieren".',
    },
    "请完整填写客户名称和客户编码。": { en: "Please complete customer name and customer code.", de: "Bitte Kundenname und Kundencode vollständig ausfüllen." },
    "请先填写客户名称和正式合作日期，系统会自动生成客户编码。": {
      en: "Please fill in the customer name and formal cooperation date first. The system will generate the customer code automatically.",
      de: "Bitte zuerst Kundenname und offizielles Kooperationsdatum eingeben. Das System erzeugt den Kundencode automatisch.",
    },
    "客户主数据已更新。": { en: "Customer master data has been updated.", de: "Die Kundenstammdaten wurden aktualisiert." },
    "客户主数据已新增。": { en: "Customer master data has been created.", de: "Die Kundenstammdaten wurden angelegt." },
    "系统尚未配置业务负责人，无法提交客户申请。": {
      zh: "系统尚未配置总经理，无法提交客户申请。",
      en: "No general manager is configured yet, so the customer request cannot be submitted.",
      de: "Es ist noch kein Geschäftsführer konfiguriert, daher kann der Kundenantrag nicht eingereicht werden.",
    },
    "系统尚未配置财务负责人，无法完成财务抄送配置。": {
      en: "No finance approver is configured yet, so finance copy routing cannot be completed.",
      de: "Es ist noch kein Finanzverantwortlicher konfiguriert, daher kann die Finanz-Kopie nicht eingerichtet werden.",
    },
    "系统管理员可维护已生效客户主数据。": {
      en: "The system administrator can maintain active customer master data.",
      de: "Der Systemadministrator kann aktive Kundenstammdaten pflegen.",
    },
    "当前账号可查看客户主数据，但没有新增或删除客户的权限。": {
      en: "The current account can view customer master data, but cannot create or delete customers.",
      de: "Das aktuelle Konto kann Kundenstammdaten ansehen, aber keine Kunden anlegen oder loeschen.",
    },
    "此页用于查看客户申请详情，审批动作请在审批中心完成，审批通过后自动抄送财务。": {
      en: "This page is for viewing customer request details. Approval actions are completed in the approval center and finance is copied automatically after approval.",
      de: "Diese Seite dient zur Ansicht von Kundenanträgen. Freigaben erfolgen im Freigabecenter und die Finanzabteilung wird nach der Freigabe automatisch informiert.",
    },
    "新增客户或客户政策变更需要先提交审批，审批通过后自动生效并抄送财务。": {
      en: "New customers and customer policy changes must be submitted for approval first. They take effect automatically and are copied to finance after approval.",
      de: "Neue Kunden und Änderungen der Kundenrichtlinie müssen zuerst zur Freigabe eingereicht werden. Nach der Freigabe werden sie automatisch wirksam und an die Finanzabteilung in Kopie gesendet.",
    },
    "当前账号可查看客户申请记录，但没有新增或删除客户的权限。": {
      en: "The current account can view customer requests, but cannot create or delete customers.",
      de: "Das aktuelle Konto kann Kundenantraege ansehen, aber keine Kunden anlegen oder loeschen.",
    },
    "客户主数据管理": { en: "Customer Master Data", de: "Kundenstammdaten" },
    "客户申请查看": { en: "Customer Request Review", de: "Kundenanträge ansehen" },
    "客户申请": { en: "Customer Request", de: "Kundenantrag" },
    "客户申请记录": { en: "Customer Request Records", de: "Kundenanträge" },
    "审批请在审批中心处理": { en: "Process in Approval Center", de: "Im Freigabecenter bearbeiten" },
    "提交客户申请": { en: "Submit Customer Request", de: "Kundenantrag senden" },
    "当前账号权限决定客户/产品维护与敏感价格展示。": {
      en: "The current account permissions determine customer and product maintenance as well as sensitive price visibility.",
      de: "Die aktuellen Kontoberechtigungen steuern Kunden- und Produktpflege sowie die Sichtbarkeit sensibler Preisfelder.",
    },
    "仅管理员角色可查看账号审批数据": {
      en: "Only administrator roles can view account approval data.",
      de: "Nur Administratorrollen können Kontofreigaben einsehen.",
    },
    "仅超级管理员 harbor 可查看账号审批数据": {
      en: "Only super admin harbor can view account approval data.",
      de: "Nur der Super-Admin harbor kann Kontofreigaben einsehen.",
    },
    "仅管理员角色可查看账号列表": {
      en: "Only administrator roles can view the account list.",
      de: "Nur Administratorrollen können die Kontoliste einsehen.",
    },
    "仅超级管理员 harbor 可查看账号列表": {
      en: "Only super admin harbor can view the account list.",
      de: "Nur der Super-Admin harbor kann die Kontoliste einsehen.",
    },
    "账号不存在，请检查登录账号或先提交账号申请。": {
      en: "The account does not exist. Please check the login ID or submit an account request first.",
      de: "Das Konto existiert nicht. Bitte prüfen Sie das Anmeldekonto oder stellen Sie zuerst einen Kontoantrag.",
    },
    "该账号当前不可用，请联系管理员。": {
      en: "This account is currently unavailable. Please contact an administrator.",
      de: "Dieses Konto ist derzeit nicht verfügbar. Bitte wenden Sie sich an einen Administrator.",
    },
    "登录密码错误，请重新输入。": {
      en: "Incorrect password. Please try again.",
      de: "Falsches Passwort. Bitte erneut eingeben.",
    },
    "请完整填写申请人、申请账号、申请密码、团队和申请原因。": {
      en: "Please complete applicant name, requested login ID, requested password, team, and reason.",
      de: "Bitte Antragsteller, beantragtes Anmeldekonto, beantragtes Passwort, Team und Begründung vollständig ausfüllen.",
    },
    "申请密码必须同时包含英文字母和数字，且只能使用英文字母与数字。": {
      en: "The requested password must contain both English letters and numbers, and may use only letters and numbers.",
      de: "Das beantragte Passwort muss sowohl englische Buchstaben als auch Zahlen enthalten und darf nur Buchstaben und Zahlen verwenden.",
    },
    "该申请未包含有效密码，请通知申请人重新提交账号申请。": {
      en: "This request does not contain a valid password. Please ask the applicant to submit the account request again.",
      de: "Dieser Antrag enthält kein gültiges Passwort. Bitte fordern Sie den Antragsteller auf, den Kontoantrag erneut einzureichen.",
    },
    "该登录账号已存在，请更换申请账号。": {
      en: "This login ID already exists. Please choose another requested login ID.",
      de: "Dieses Anmeldekonto existiert bereits. Bitte wählen Sie ein anderes beantragtes Konto.",
    },
    "只有管理员角色可以生成或维护账号。": {
      en: "Only administrator roles can create or maintain accounts.",
      de: "Nur Administratorrollen können Konten erstellen oder pflegen.",
    },
    "仅超级管理员 harbor 可以生成或维护账号。": {
      en: "Only super admin harbor can create or maintain accounts.",
      de: "Nur der Super-Admin harbor kann Konten erstellen oder pflegen.",
    },
    "请完整填写显示名称、登录账号和所属团队。": {
      en: "Please complete display name, login ID, and team.",
      de: "Bitte Anzeigename, Anmeldekonto und Team vollständig ausfüllen.",
    },
    "新账号必须设置初始密码。": { en: "A new account must have an initial password.", de: "Für ein neues Konto muss ein Startpasswort gesetzt werden." },
    "当前登录的管理员账号不能被降权。": {
      en: "The currently signed-in administrator account cannot be downgraded.",
      de: "Das aktuell angemeldete Administratorkonto kann nicht herabgestuft werden.",
    },
    "Harbor 超级管理员账号必须保留 SYSTEM_ADMIN 角色与固定登录名。": {
      en: "The Harbor super admin account must keep the SYSTEM_ADMIN role and the fixed login ID.",
      de: "Das Harbor-Super-Admin-Konto muss die Rolle SYSTEM_ADMIN und den festen Login-Namen behalten.",
    },
    "只有管理员角色可以审批账号申请。": {
      en: "Only administrator roles can approve account requests.",
      de: "Nur Administratorrollen können Kontoanträge freigeben.",
    },
    "仅超级管理员 harbor 可以审批账号申请。": {
      en: "Only super admin harbor can approve account requests.",
      de: "Nur der Super-Admin harbor kann Kontoanträge genehmigen.",
    },
    "只有管理员角色可以维护账号。": {
      en: "Only administrator roles can maintain accounts.",
      de: "Nur Administratorrollen können Konten pflegen.",
    },
    "仅超级管理员 harbor 可以维护账号。": {
      en: "Only super admin harbor can maintain accounts.",
      de: "Nur der Super-Admin harbor kann Konten pflegen.",
    },
    "不能删除当前正在登录的管理员账号。": {
      en: "The administrator account that is currently signed in cannot be deleted.",
      de: "Das aktuell angemeldete Administratorkonto kann nicht gelöscht werden.",
    },
    "Harbor 超级管理员账号不能删除。": {
      en: "The Harbor super admin account cannot be deleted.",
      de: "Das Harbor-Super-Admin-Konto kann nicht gelöscht werden.",
    },
    "至少保留一个管理员账号。": {
      en: "At least one administrator account must be retained.",
      de: "Mindestens ein Administratorkonto muss erhalten bleiben.",
    },
    "公式已被产品或报价引用，暂不能删除。": {
      en: "This formula is referenced by products or quotes and cannot be deleted yet.",
      de: "Diese Formel wird von Produkten oder Angeboten verwendet und kann derzeit nicht gelöscht werden.",
    },
    "产品已被报价引用，暂不能删除。": {
      en: "This product is referenced by quotes and cannot be deleted yet.",
      de: "Dieses Produkt wird von Angeboten verwendet und kann derzeit nicht gelöscht werden.",
    },
    "产品仍存在审批中的报价，暂不能删除。": {
      en: "This product still has quotes in approval and cannot be deleted yet.",
      de: "Für dieses Produkt gibt es noch Angebote im Freigabeprozess; es kann derzeit nicht gelöscht werden.",
    },
    "客户已被报价或客户申请引用，暂不能删除。": {
      en: "This customer is referenced by quotes or customer requests and cannot be deleted yet.",
      de: "Dieser Kunde wird von Angeboten oder Kundenanträgen verwendet und kann derzeit nicht gelöscht werden.",
    },
    "客户仍存在审批中的报价或客户申请，暂不能删除。": {
      en: "This customer still has quotes or customer requests in approval and cannot be deleted yet.",
      de: "Für diesen Kunden gibt es noch Angebote oder Kundenanträge im Freigabeprozess; er kann derzeit nicht gelöscht werden.",
    },
    "该账号仍被客户审批人、账号申请或审批流程引用，暂不能删除。": {
      en: "This account is still referenced by customer approvers, account requests, or approval flows and cannot be deleted yet.",
      de: "Dieses Konto wird noch von Kundenfreigebern, Kontoanträgen oder Freigabeprozessen verwendet und kann derzeit nicht gelöscht werden.",
    },
    "产品名称和 SKU 不能为空。": {
      en: "Product name and SKU cannot be empty.",
      de: "Produktname und SKU dürfen nicht leer sein.",
    },
    "产品主数据已更新。": {
      en: "Product master data has been updated.",
      de: "Die Produktstammdaten wurden aktualisiert.",
    },
    "产品主数据已新增。": {
      en: "Product master data has been created.",
      de: "Die Produktstammdaten wurden neu angelegt.",
    },
    "可调整点位、自动试算、确认导入与提交审批，不可查阅 FOB、毛利额和毛利率。": {
      en: "Can adjust points, run automatic calculations, confirm imports, and submit approvals, but cannot view FOB, gross profit, or gross margin.",
      de: "Kann Punkte anpassen, automatische Berechnungen ausführen, Importe bestätigen und Freigaben einreichen, darf jedoch FOB, Bruttogewinn und Bruttomarge nicht einsehen.",
    },
    "可查阅业务信息与审批任务，不可维护系统账号和敏感价格配置。": {
      en: "Can view business information and approval tasks, but cannot maintain system accounts or sensitive price settings.",
      de: "Kann Geschäftsinformationen und Freigabeaufgaben einsehen, jedoch keine Systemkonten oder sensiblen Preiseinstellungen pflegen.",
    },
    "具备管理员级权限，可管理全部页面、账号、权限与系统配置。": {
      en: "Has administrator-level access and can manage all pages, accounts, permissions, and system settings.",
      de: "Verfügt über Administratorrechte und kann alle Seiten, Konten, Berechtigungen und Systemeinstellungen verwalten.",
    },
    "系统初始化": { en: "System Seed", de: "Systeminitialisierung" },
    "账号申请生成": { en: "Generated from Request", de: "Aus Antrag erzeugt" },
    "管理员直接生成": { en: "Created by Admin", de: "Direkt vom Administrator erstellt" },
    "当前操作人不是该客户申请的处理人。": {
      en: "The current operator is not the handler for this customer request.",
      de: "Der aktuelle Benutzer ist nicht für diesen Kundenantrag zuständig.",
    },
    "当前操作人不是该审批节点的处理人。": {
      en: "The current operator is not the handler for this approval node.",
      de: "Der aktuelle Benutzer ist nicht für diesen Freigabeknoten zuständig.",
    },
    "当前报价触发敏感价格预警，需要进入对应审批流。": {
      en: "This quote triggered a sensitive pricing warning and must enter the corresponding approval flow.",
      de: "Dieses Angebot hat eine sensible Preiswarnung ausgelöst und muss in den entsprechenden Freigabeprozess gehen.",
    },
    "报价单号": { en: "Quote No.", de: "Angebotsnr." },
    "审批完成时间": { en: "Approval Completed At", de: "Freigabe abgeschlossen am" },
    "客户报价单": { en: "Customer Quote Sheet", de: "Kundenangebot" },
    "本价格表由系统在审批通过后自动生成，可直接用于邮件发送与客户确认。": {
      en: "This price sheet is generated automatically after approval and can be sent directly by email to the customer.",
      de: "Diese Preisliste wird nach der Freigabe automatisch erstellt und kann direkt per E-Mail an den Kunden gesendet werden.",
    },
    "本报价单由系统在审批通过后自动生成，可直接用于邮件发送与客户确认。": {
      en: "This quote sheet is generated automatically after approval and can be sent directly by email to the customer.",
      de: "Dieses Angebotsblatt wird nach der Freigabe automatisch erstellt und kann direkt per E-Mail an den Kunden gesendet werden.",
    },
    "如需确认、回签或进一步沟通，请直接回复原邮件。": {
      en: "For confirmation, countersignature, or further discussion, please reply directly to the original email.",
      de: "Für Bestätigung, Gegenzeichnung oder weitere Abstimmung antworten Sie bitte direkt auf die ursprüngliche E-Mail.",
    },
    "无": { en: "None", de: "Keine" },
    "待抄送": { en: "Pending CC", de: "Kopie ausstehend" },
    "已抄送": { en: "CC Sent", de: "In Kopie versendet" },
    "新客户 / 独立申请": { en: "New Customer / Independent Request", de: "Neukunde / Eigenständiger Antrag" },
    "请先登录后进入系统": { en: "Please sign in before entering the system", de: "Bitte vor dem Systemzugang anmelden" },
    "请先选择客户、产品和公式版本。": {
      en: "Please select a customer, product, and formula version first.",
      de: "Bitte zuerst Kunde, Produkt und Formelversion auswählen.",
    },
    "生成报价失败。": { en: "Failed to create quote.", de: "Angebot konnte nicht erstellt werden." },
    "请先选择 CSV 文件。": { en: "Please choose a CSV file first.", de: "Bitte zuerst eine CSV-Datei auswählen." },
    "文件为空或没有有效数据。": { en: "The file is empty or contains no valid data.", de: "Die Datei ist leer oder enthält keine gültigen Daten." },
    "没有可导入的有效行，请先预校验。": {
      en: "There are no valid rows to import. Please run the pre-check first.",
      de: "Es gibt keine gültigen Zeilen für den Import. Bitte zuerst die Vorprüfung ausführen.",
    },
    "公式名称和公式编码不能为空。": { en: "Formula name and code cannot be empty.", de: "Formelname und Formelcode dürfen nicht leer sein." },
    "公式不存在，无法生成报价。": { en: "The formula does not exist and the quote cannot be generated.", de: "Die Formel existiert nicht. Das Angebot kann nicht erstellt werden." },
    "客户不存在，无法生成报价。": { en: "The customer does not exist and the quote cannot be generated.", de: "Der Kunde existiert nicht. Das Angebot kann nicht erstellt werden." },
    "产品不存在，无法生成报价。": { en: "The product does not exist and the quote cannot be generated.", de: "Das Produkt existiert nicht. Das Angebot kann nicht erstellt werden." },
    "报价计算未通过校验。": { en: "Quote calculation validation failed.", de: "Die Angebotsberechnung hat die Prüfung nicht bestanden." },
    "生效月份不能为空。": { en: "Effective month cannot be empty.", de: "Der Gültigkeitsmonat darf nicht leer sein." },
    "零售价必须大于 0。": { en: "MSRP must be greater than 0.", de: "Die UVP muss größer als 0 sein." },
    "成本价必须大于 0。": { en: "Cost must be greater than 0.", de: "Die Kosten müssen größer als 0 sein." },
    "客户点位/折扣系数必须大于 0。": { en: "Customer factor / discount must be greater than 0.", de: "Kundenfaktor / Rabatt muss größer als 0 sein." },
    "渠道系数必须大于 0。": { en: "Channel factor must be greater than 0.", de: "Der Kanalfaktor muss größer als 0 sein." },
    "点位与费率不能为负数。": { en: "Point and rate fields cannot be negative.", de: "Punkt- und Ratenfelder dürfen nicht negativ sein." },
    "点位、费率与联合营销金额不能为负数。": {
      en: "Point, rate, and MKT funding fields cannot be negative.",
      de: "Punkt-, Raten- und MKT-Funding-Felder dürfen nicht negativ sein.",
    },
    "VAT 不能使分母小于等于 0。": { en: "VAT cannot make the denominator less than or equal to 0.", de: "Die MwSt. darf den Nenner nicht kleiner oder gleich 0 machen." },
    "DB、客户Margin 与 Service Fee 合计不能大于等于 100%。": {
      en: "DB, customer margin, and service fee cannot total 100% or more.",
      de: "DB, Kundenmarge und Servicegebühr dürfen zusammen nicht 100 % oder mehr betragen.",
    },
    "DB、客户Margin、Service Fee 与联合营销占比合计不能大于等于 100%。": {
      en: "DB, customer margin, service fee, and the MKT funding rate cannot total 100% or more.",
      de: "DB, Kundenmarge, Servicegebühr und der MKT-Funding-Satz dürfen zusammen nicht 100 % oder mehr betragen.",
    },
    "零售价低于成本价，系统直接拦截。": {
      en: "MSRP is lower than cost, so the system blocks the quote immediately.",
      de: "Die UVP liegt unter den Kosten, daher blockiert das System das Angebot sofort.",
    },
    "报价公式结果小于等于 0，无法生成报价。": {
      en: "The formula result is less than or equal to 0, so the quote cannot be created.",
      de: "Das Formelergebnis ist kleiner oder gleich 0, daher kann das Angebot nicht erstellt werden.",
    },
    "当前报价已击穿成本价，需要走特批审批。": {
      en: "The quote is already below cost and requires special approval.",
      de: "Das Angebot liegt bereits unter den Kosten und erfordert eine Sonderfreigabe.",
    },
    "报价正常，可走标准审批。": {
      en: "The quote is normal and can go through the standard approval flow.",
      de: "Das Angebot ist unkritisch und kann den Standard-Freigabeprozess durchlaufen.",
    },
    "客户报价": { en: "Customer Quote", de: "Kundenangebot" },
    "预警级别": { en: "Warning Level", de: "Warnstufe" },
    "审批流": { en: "Approval Flow", de: "Freigabefluss" },
    "标准审批": { en: "Standard Approval", de: "Standardfreigabe" },
    "加强审批": { en: "Escalated Approval", de: "Erweiterte Freigabe" },
    "当前报价尚未审批通过，暂时不能生成客户邮件报价单。": {
      en: "The current quote has not been approved yet, so the customer mail quote cannot be generated for now.",
      de: "Das aktuelle Angebot ist noch nicht freigegeben, daher kann die Kunden-Mail-Fassung derzeit nicht erzeugt werden.",
    },
    "邮件正文已复制，可直接粘贴到邮件中。": {
      en: "The mail body has been copied and can be pasted into an email directly.",
      de: "Der Mailtext wurde kopiert und kann direkt in eine E-Mail eingefügt werden.",
    },
    "复制失败，请检查浏览器剪贴板权限。": {
      en: "Copy failed. Please check clipboard permissions in the browser.",
      de: "Kopieren fehlgeschlagen. Bitte prüfen Sie die Zwischenablage-Berechtigung im Browser.",
    },
    "邮件主题已复制。": { en: "The mail subject has been copied.", de: "Der Mailbetreff wurde kopiert." },
    "已尝试打开本机默认邮件客户端草稿。": {
      en: "Tried to open a draft in the default local mail client.",
      de: "Es wurde versucht, einen Entwurf im Standard-Mailprogramm zu öffnen.",
    },
    "系统会在这里展示来源价格主数据、参考成本、已发生销售和审批口径，方便确认报价不是孤立数据。": {
      en: "The system shows source pricing master data, reference cost, actual sales, and approval scope here so the quote can be checked as linked business data.",
      de: "Das System zeigt hier Preisstammdaten, Referenzkosten, realisierte Verkäufe und die Freigabelogik, damit das Angebot als verknüpfte Geschäftsdaten geprüft werden kann.",
    },
    "系统会在这里展示公式版本、计算过程、审批轨迹和日志。": {
      en: "The system shows formula version, calculation steps, approval trail, and logs here.",
      de: "Das System zeigt hier Formelversion, Berechnung, Freigabeverlauf und Protokolle.",
    },
    "待补充客户": { en: "Customer Draft", de: "Kundenentwurf" },
    "待补充": { en: "To Be Completed", de: "Noch ergänzen" },
    "导入自动创建的客户草稿": {
      en: "Customer draft created automatically from import",
      de: "Beim Import automatisch erzeugter Kundenentwurf",
    },
    "待补充产品": { en: "Product Draft", de: "Produktentwurf" },
    "未分类": { en: "Uncategorized", de: "Nicht klassifiziert" },
    "导入自动创建的产品草稿": {
      en: "Product draft created automatically from import",
      de: "Beim Import automatisch erzeugter Produktentwurf",
    },
    "业务负责人审批": { zh: "总经理审批", en: "General Manager Approval", de: "Freigabe durch Geschäftsführer" },
    "直属上级负责人审批": { en: "Direct Manager Approval", de: "Freigabe durch direkten Vorgesetzten" },
    "销售/经营负责人审批": { en: "Business / Sales Head Approval", de: "Freigabe durch Vertriebs- / Geschäftsleitung" },
    "财务负责人审批": { en: "Finance Approval", de: "Freigabe durch Finanzen" },
    "公式计算失败：": { en: "Formula calculation failed: ", de: "Formelberechnung fehlgeschlagen: " },
    "未知错误": { en: "Unknown error", de: "Unbekannter Fehler" },
    "成本价 Cost": { en: "Cost", de: "Kosten" },
    "参考字段，不参与当前公式": { en: "Reference field, not used in the current formula", de: "Referenzfeld, nicht Teil der aktuellen Formel" },
    "返利折算值": { en: "Rebate Conversion", de: "Bonusumrechnung" },
    "税率（扩展位）": { en: "Tax Rate (Reserved)", de: "Steuersatz (reserviert)" },
    "最终报价": { en: "Final Quote", de: "Endgültiges Angebot" },
    "可调整点位、自动试算、确认导入与提交审批。": {
      en: "Can adjust points, run automatic calculations, confirm imports, and submit approvals.",
      de: "Kann Punkte anpassen, automatische Berechnungen ausfuehren, Importe bestaetigen und Freigaben einreichen.",
    },
    "可查阅业务信息与审批任务，不可维护系统账号。": {
      en: "Can view business information and approval tasks, but cannot maintain system accounts.",
      de: "Kann Geschaeftsinformationen und Freigabeaufgaben einsehen, aber keine Systemkonten verwalten.",
    },
    "可查询数据并发起报价、客户等申请，不能审批和管理账号。": {
      en: "You can query data and initiate quote or customer requests, but you cannot approve or manage accounts.",
      de: "Sie können Daten abfragen und Angebots- oder Kundenanträge stellen, aber keine Freigaben oder Konten verwalten.",
    },
    "可管理业务数据并处理审批，不能管理系统账号。": {
      en: "You can manage business data and process approvals, but you cannot manage system accounts.",
      de: "Sie können Geschäftsdaten verwalten und Freigaben bearbeiten, aber keine Systemkonten verwalten.",
    },
    "可查看经营范围数据并参与高级审批，不能管理账号。": {
      en: "You can view business scope data and join higher-level approvals, but you cannot manage accounts.",
      de: "Sie können Geschäftsdaten einsehen und an erweiterten Freigaben teilnehmen, aber keine Konten verwalten.",
    },
    "可查询数据并处理财务审批，不能管理账号。": {
      en: "You can query data and process finance approvals, but you cannot manage accounts.",
      de: "Sie können Daten abfragen und Finanzfreigaben bearbeiten, aber keine Konten verwalten.",
    },
    "可管理全部页面、账号、权限与系统配置。": {
      en: "You can manage all pages, accounts, permissions, and system settings.",
      de: "Sie können alle Seiten, Konten, Berechtigungen und Systemeinstellungen verwalten.",
    },
    "按当前账号权限访问对应页面。": {
      en: "The visible pages depend on the current account permissions.",
      de: "Die sichtbaren Seiten hängen von den Berechtigungen des aktuellen Kontos ab.",
    },
    "试算报价": { en: "Trial Quote", de: "Testangebot" },
    "报价加强审批": { en: "Escalated Quote Approval", de: "Erweiterte Angebotsfreigabe" },
    "报价标准审批": { en: "Standard Quote Approval", de: "Standard-Angebotsfreigabe" },
    "审批通过": { en: "Approved", de: "Freigegeben" },
    "审批驳回": { en: "Rejected", de: "Abgelehnt" },
    "审批中": { en: "In Approval", de: "In Freigabe" },
    "已批准": { en: "Approved", de: "Freigegeben" },
    "已驳回": { en: "Rejected", de: "Abgelehnt" },
    "已生效": { en: "Active", de: "Aktiv" },
    "已删除": { en: "Deleted", de: "Gelöscht" },
    "待审批": { en: "Pending Approval", de: "Freigabe ausstehend" },
    "待生效": { en: "Pending Effective", de: "Wartet auf Wirksamkeit" },
    "驳回待修改": { en: "Rejected Pending Update", de: "Abgelehnt, Änderung erforderlich" },
    "无预警": { en: "No Warning", de: "Keine Warnung" },
    "黄色预警": { en: "Yellow Warning", de: "Gelbe Warnung" },
    "红色预警": { en: "Red Warning", de: "Rote Warnung" },
    "业务负责人审批通过": { zh: "总经理审批通过", en: "Approved by general manager", de: "Durch Geschäftsführer freigegeben" },
    "业务负责人审批驳回": { zh: "总经理审批驳回", en: "Rejected by general manager", de: "Durch Geschäftsführer abgelehnt" },
    "创建报价": { en: "Create Quote", de: "Angebot erstellen" },
    "删除报价": { en: "Delete Quote", de: "Angebot loeschen" },
    "生成客户邮件报价单": { en: "Generate Customer Mail Quote", de: "Kunden-Mail-Angebot erzeugen" },
    "创建公式": { en: "Create Formula", de: "Formel erstellen" },
    "更新公式": { en: "Update Formula", de: "Formel aktualisieren" },
    "删除公式": { en: "Delete Formula", de: "Formel löschen" },
    "切换公式状态": { en: "Toggle Formula Status", de: "Formelstatus wechseln" },
    "创建产品": { en: "Create Product", de: "Produkt erstellen" },
    "更新产品": { en: "Update Product", de: "Produkt aktualisieren" },
    "删除产品": { en: "Delete Product", de: "Produkt löschen" },
    "切换产品状态": { en: "Toggle Product Status", de: "Produktstatus wechseln" },
    "创建客户": { en: "Create Customer", de: "Kunde erstellen" },
    "更新客户": { en: "Update Customer", de: "Kunde aktualisieren" },
    "删除客户": { en: "Delete Customer", de: "Kunde löschen" },
    "切换客户状态": { en: "Toggle Customer Status", de: "Kundenstatus wechseln" },
    "提交新增客户申请": { en: "Submit New Customer Request", de: "Neukundenantrag einreichen" },
    "提交客户政策变更申请": { en: "Submit Customer Policy Change", de: "Änderung der Kundenrichtlinie einreichen" },
    "批准客户申请": { en: "Approve Customer Request", de: "Kundenantrag freigeben" },
    "驳回客户申请": { en: "Reject Customer Request", de: "Kundenantrag ablehnen" },
    "删除客户申请": { en: "Delete Customer Request", de: "Kundenantrag loeschen" },
    "生效客户政策": { en: "Apply Customer Policy", de: "Kundenrichtlinie anwenden" },
    "由申请创建客户": { en: "Create Customer from Request", de: "Kunde aus Antrag erstellen" },
    "提交账号申请": { en: "Submit Account Request", de: "Kontoantrag senden" },
    "创建账号": { en: "Create Account", de: "Konto erstellen" },
    "更新账号": { en: "Update Account", de: "Konto aktualisieren" },
    "批准账号申请": { en: "Approve Account Request", de: "Kontoantrag freigeben" },
    "驳回账号申请": { en: "Reject Account Request", de: "Kontoantrag ablehnen" },
    "删除账号申请": { en: "Delete Account Request", de: "Kontoantrag loeschen" },
    "重置账号密码": { en: "Reset Account Password", de: "Kontopasswort zurücksetzen" },
    "删除账号": { en: "Delete Account", de: "Konto löschen" },
    "切换账号状态": { en: "Toggle Account Status", de: "Kontostatus wechseln" },
    "等级": { en: "Level", de: "Stufe" },
    "渠道": { en: "Channel", de: "Kanal" },
    "默认返利": { en: "Default Rebate", de: "Standardbonus" },
    "报价正常，可走标准审批。": {
      en: "The quote is valid and can proceed through the standard approval flow.",
      de: "Das Angebot ist gültig und kann im Standard-Freigabeprozess weiterlaufen.",
    },
    "没有可导入的有效行，请先预校验。": {
      en: "There are no valid rows to import. Please run the pre-check first.",
      de: "Es gibt keine gültigen Zeilen für den Import. Bitte zuerst die Vorprüfung ausführen.",
    },
    "新增客户申请": { en: "New Customer Request", de: "Neukundenantrag" },
    "备注已调整": { en: "Remark updated", de: "Bemerkung geändert" },
    "未检测到核心政策差异，按当前填写内容重新提报审批。": {
      en: "No major policy difference was detected. Approval is resubmitted based on the current content.",
      de: "Es wurde keine wesentliche Richtlinienänderung erkannt. Die Freigabe wird auf Basis des aktuellen Inhalts erneut eingereicht.",
    },
    "提交客户申请": { en: "Submit Customer Request", de: "Kundenantrag senden" },
    "处理审批": { en: "Process Approval", de: "Freigabe bearbeiten" },
    "Browser": { zh: "浏览器", de: "Browser" },
    "附件文件": { en: "Attachment File", de: "Anhangdatei" },
    "临时密码": { en: "Temporary Password", de: "Temporäres Passwort" },
    "已更新": { en: "Updated", de: "Aktualisiert" },
  };

  const TEMPLATES = {
    "permission.scope": {
      zh: "当前角色：{role}。{scope} 敏感字段权限：{permissions}。",
      en: "Current role: {role}. {scope} Sensitive field permissions: {permissions}.",
      de: "Aktuelle Rolle: {role}. {scope} Berechtigungen fuer sensible Felder: {permissions}.",
    },
    "operator.meta": {
      zh: "{userName} / {role}",
      en: "{userName} / {role}",
      de: "{userName} / {role}",
    },
    "quotes.summary": {
      zh: "共 {count} 条报价，合计报价金额 {amount}",
      en: "{count} quotes, total quote amount {amount}",
      de: "{count} Angebote, Gesamtsumme {amount}",
    },
    "price.querySummary": {
      zh: "共 {count} 条价格结果，合计报价金额 {amount}",
      en: "{count} price results, total quoted amount {amount}",
      de: "{count} Preisergebnisse, gesamter Angebotsbetrag {amount}",
    },
    "logs.summary": {
      zh: "共 {total} 条日志，当前筛选 {count} 条",
      en: "{count} logs shown out of {total}",
      de: "{count} von {total} Protokollen werden angezeigt",
    },
    "logs.beforeCount": {
      zh: "变更前 {count} 项",
      en: "{count} fields before",
      de: "{count} Felder vorher",
    },
    "logs.afterCount": {
      zh: "变更后 {count} 项",
      en: "{count} fields after",
      de: "{count} Felder nachher",
    },
    "import.summary": {
      zh: "共 {rows} 行，校验通过 {passed} 行，失败 {failed} 行。",
      en: "{rows} rows in total, {passed} passed, {failed} failed.",
      de: "{rows} Zeilen insgesamt, {passed} bestanden, {failed} fehlgeschlagen.",
    },
    "import.created": {
      zh: "已成功批量生成 {count} 条报价。",
      en: "{count} quotes have been generated successfully in bulk.",
      de: "{count} Angebote wurden erfolgreich im Massenlauf erzeugt.",
    },
    "formula.saved": {
      zh: "公式 {code} 已保存。",
      en: "Formula {code} has been saved.",
      de: "Die Formel {code} wurde gespeichert.",
    },
    "warnings.lowMargin": {
      zh: "当前毛利率 {margin} 低于 {threshold}，将进入加强审批。",
      en: "The current gross margin {margin} is below {threshold}, so escalated approval is required.",
      de: "Die aktuelle Bruttomarge {margin} liegt unter {threshold}, daher ist eine erweiterte Freigabe erforderlich.",
    },
    "confirm.formulaDelete": {
      zh: "确认删除公式 {code}？删除后不可恢复。",
      en: "Delete formula {code}? This action cannot be undone.",
      de: "Formel {code} löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.",
    },
    "confirm.productDelete": {
      zh: "确认删除产品 {sku}？删除后不可恢复。",
      en: "Delete product {sku}? This action cannot be undone.",
      de: "Produkt {sku} löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.",
    },
    "confirm.quoteDelete": {
      zh: "确认删除报价 {quoteNo}？关联审批记录也会一并移除。",
      en: "Delete quote {quoteNo}? The related approval record will be removed as well.",
      de: "Angebot {quoteNo} loeschen? Der zugehoerige Freigabeeintrag wird ebenfalls entfernt.",
    },
    "confirm.customerDelete": {
      zh: "确认删除客户 {customerCode}？删除后不可恢复。",
      en: "Delete customer {customerCode}? This action cannot be undone.",
      de: "Kunde {customerCode} löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.",
    },
    "confirm.customerRequestDelete": {
      zh: "确认删除客户申请 {requestNo}？删除后不可恢复。",
      en: "Delete customer request {requestNo}? This action cannot be undone.",
      de: "Kundenantrag {requestNo} loeschen? Dieser Vorgang kann nicht rueckgaengig gemacht werden.",
    },
    "confirm.accountDelete": {
      zh: "确认删除账号 {userName}？删除后不可恢复。",
      en: "Delete account {userName}? This action cannot be undone.",
      de: "Konto {userName} löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.",
    },
    "confirm.accountRequestDelete": {
      zh: "确认删除账号申请 {requestNo}？删除后不可恢复。",
      en: "Delete account request {requestNo}? This action cannot be undone.",
      de: "Kontoantrag {requestNo} loeschen? Dieser Vorgang kann nicht rueckgaengig gemacht werden.",
    },
    "confirm.logDelete": {
      zh: "确认删除日志记录 {target}？删除后不可恢复。",
      en: "Delete log record {target}? This action cannot be undone.",
      de: "Protokolleintrag {target} loeschen? Dieser Vorgang kann nicht rueckgaengig gemacht werden.",
    },
    "confirm.approvalDirtyDelete": {
      zh: "确认删除审批脏数据 {target}？删除后不可恢复。",
      en: "Delete dirty approval data {target}? This action cannot be undone.",
      de: "Verschmutzte Freigabedaten {target} löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.",
    },
    "alerts.pendingAccountRequest": {
      zh: "该账号已存在待审批申请 {requestNo}。",
      en: "This login ID already has a pending request {requestNo}.",
      de: "Für dieses Anmeldekonto existiert bereits ein offener Antrag {requestNo}.",
    },
    "alerts.accountRequestSubmitted": {
      zh: "账号申请 {requestNo} 已提交，已流转至 harbor 审批中心等待处理。",
      en: "Account request {requestNo} has been submitted and routed to harbor's approval center for processing.",
      de: "Der Kontoantrag {requestNo} wurde eingereicht und an das Freigabecenter von harbor zur Bearbeitung weitergeleitet.",
    },
    "alerts.quoteCreated": {
      zh: "报价 {quoteNo} 已生成，并已自动发起{approvalType}审批。",
      en: "Quote {quoteNo} has been created and {approvalType} approval has been started automatically.",
      de: "Angebot {quoteNo} wurde erstellt und die {approvalType} wurde automatisch gestartet.",
    },
    "alerts.quoteLoaded": {
      zh: "已载入 {quoteNo}，可在此基础上生成新版本报价。",
      en: "{quoteNo} has been loaded. You can create a new quote version based on it.",
      de: "{quoteNo} wurde geladen. Darauf basierend kann eine neue Angebotsversion erstellt werden.",
    },
    "alerts.quoteLoadedLatestPrice": {
      zh: "已载入 {quoteNo}，零售价与 FOB 已自动更新为最新价格。",
      en: "{quoteNo} has been loaded, and retail price plus FOB have been updated automatically to the latest values.",
      de: "{quoteNo} wurde geladen, und Verkaufspreis sowie FOB wurden automatisch auf die neuesten Werte aktualisiert.",
    },
    "alerts.quoteMonthDuplicate": {
      zh: "{customerName} / {sku} 在 {month} 已存在报价申请 {quoteNo}，后续月份会默认沿用当前价格，如需调整请使用新的生效月份重新申请。",
      en: "{customerName} / {sku} already has quote request {quoteNo} for {month}. Later months inherit the current price by default, so submit a new request only when a new effective month is needed.",
      de: "Fuer {customerName} / {sku} existiert fuer {month} bereits der Angebotsantrag {quoteNo}. Spaetere Monate uebernehmen den aktuellen Preis standardmaessig; reichen Sie nur fuer einen neuen Wirksamkeitsmonat einen neuen Antrag ein.",
    },
    "alerts.quoteDeleted": {
      zh: "报价 {quoteNo} 已删除。",
      en: "Quote {quoteNo} has been deleted.",
      de: "Angebot {quoteNo} wurde geloescht.",
    },
    "alerts.customerPendingRequest": {
      zh: "客户 {customerCode} 已存在待审批申请 {requestNo}，请等待当前审批完成后再提交。",
      en: "Customer {customerCode} already has a pending request {requestNo}. Please wait until it is completed before submitting again.",
      de: "Für den Kunden {customerCode} existiert bereits der offene Antrag {requestNo}. Bitte warten Sie bis zum Abschluss, bevor Sie erneut einreichen.",
    },
    "alerts.customerRequestSubmitted": {
      zh: "{requestNo} 已提交，已流转至总经理审批，并将在通过后自动抄送财务。",
      en: "{requestNo} has been submitted, routed to the general manager for approval, and will be copied to finance automatically after approval.",
      de: "{requestNo} wurde eingereicht, an den Geschäftsführer zur Freigabe weitergeleitet und nach der Freigabe automatisch an Finanzen in Kopie gesendet.",
    },
    "alerts.customerPolicyLoaded": {
      zh: "已载入 {customerCode} 当前政策，你可以在此基础上提交政策变更申请。",
      en: "The current policy for {customerCode} has been loaded. You can submit a policy change request based on it.",
      de: "Die aktuelle Richtlinie für {customerCode} wurde geladen. Darauf basierend kann eine Änderungsanfrage eingereicht werden.",
    },
    "alerts.customerRequestLoadedNew": {
      zh: "已载入 {requestNo}，你可以基于这份申请重新提交新的客户申请。",
      en: "{requestNo} has been loaded. You can submit a new customer request based on it.",
      de: "{requestNo} wurde geladen. Darauf basierend kann ein neuer Kundenantrag eingereicht werden.",
    },
    "alerts.customerRequestLoadedStatus": {
      zh: "{requestNo} 详情已加载。当前状态：{status}。",
      en: "{requestNo} details have been loaded. Current status: {status}.",
      de: "Die Details von {requestNo} wurden geladen. Aktueller Status: {status}.",
    },
    "alerts.customerRequestDeleted": {
      zh: "客户申请 {requestNo} 已删除。",
      en: "Customer request {requestNo} has been deleted.",
      de: "Der Kundenantrag {requestNo} wurde geloescht.",
    },
    "alerts.customerMasterLoaded": {
      zh: "已载入 {customerCode} 主数据。",
      en: "Customer master data {customerCode} has been loaded.",
      de: "Die Kundenstammdaten {customerCode} wurden geladen.",
    },
    "alerts.formulaDeleted": {
      zh: "公式 {code} 已删除。",
      en: "Formula {code} has been deleted.",
      de: "Die Formel {code} wurde gelöscht.",
    },
    "alerts.productDeleted": {
      zh: "产品 {sku} 已删除。",
      en: "Product {sku} has been deleted.",
      de: "Das Produkt {sku} wurde gelöscht.",
    },
    "alerts.customerDeleted": {
      zh: "客户 {customerCode} 已删除。",
      en: "Customer {customerCode} has been deleted.",
      de: "Der Kunde {customerCode} wurde gelöscht.",
    },
    "alerts.accountExists": {
      zh: "登录账号 {userName} 已存在，请更换。",
      en: "Login ID {userName} already exists. Please choose another one.",
      de: "Das Anmeldekonto {userName} existiert bereits. Bitte wählen Sie ein anderes.",
    },
    "alerts.accountUpdated": {
      zh: "账号 {userName} 已更新。",
      en: "Account {userName} has been updated.",
      de: "Das Konto {userName} wurde aktualisiert.",
    },
    "alerts.accountCreated": {
      zh: "账号 {userName} 已生成。",
      en: "Account {userName} has been created.",
      de: "Das Konto {userName} wurde erstellt.",
    },
    "alerts.accountPasswordReset": {
      zh: "账号 {userName} 已重置为临时密码 {password}。",
      en: "Account {userName} has been reset to temporary password {password}.",
      de: "Das Konto {userName} wurde auf das temporäre Passwort {password} zurückgesetzt.",
    },
    "alerts.accountDeleted": {
      zh: "账号 {userName} 已删除。",
      en: "Account {userName} has been deleted.",
      de: "Das Konto {userName} wurde gelöscht.",
    },
    "alerts.accountStatusUpdated": {
      zh: "账号 {userName} 状态已更新。",
      en: "The status of account {userName} has been updated.",
      de: "Der Status des Kontos {userName} wurde aktualisiert.",
    },
    "alerts.accountLoaded": {
      zh: "已载入账号 {userName}。",
      en: "Account {userName} has been loaded.",
      de: "Das Konto {userName} wurde geladen.",
    },
    "alerts.accountRequestLoaded": {
      zh: "已载入 {requestNo}，可以调整后直接生成账号。",
      en: "{requestNo} has been loaded. You can adjust it and generate the account directly.",
      de: "{requestNo} wurde geladen. Sie können den Antrag anpassen und das Konto direkt erstellen.",
    },
    "alerts.accountRequestProcessed": {
      zh: "申请 {requestNo} 已处理，无需重复审批。",
      en: "Request {requestNo} has already been processed. No duplicate approval is needed.",
      de: "Der Antrag {requestNo} wurde bereits bearbeitet. Eine erneute Freigabe ist nicht erforderlich.",
    },
    "alerts.accountRequestDuplicateUser": {
      zh: "登录账号 {userName} 已存在，无法重复生成。",
      en: "Login ID {userName} already exists and cannot be generated again.",
      de: "Das Anmeldekonto {userName} existiert bereits und kann nicht erneut erstellt werden.",
    },
    "alerts.accountRequestApproved": {
      zh: "申请 {requestNo} 已批准，账号 {userName} 已生成，并沿用申请人提交的密码。",
      en: "Request {requestNo} has been approved and account {userName} has been generated with the applicant's submitted password.",
      de: "Der Antrag {requestNo} wurde freigegeben und das Konto {userName} wurde mit dem vom Antragsteller eingereichten Passwort erstellt.",
    },
    "alerts.accountRequestProcessedReject": {
      zh: "申请 {requestNo} 已处理，无需重复驳回。",
      en: "Request {requestNo} has already been processed. No duplicate rejection is needed.",
      de: "Der Antrag {requestNo} wurde bereits bearbeitet. Eine erneute Ablehnung ist nicht erforderlich.",
    },
    "alerts.accountRequestRejected": {
      zh: "申请 {requestNo} 已驳回。",
      en: "Request {requestNo} has been rejected.",
      de: "Der Antrag {requestNo} wurde abgelehnt.",
    },
    "alerts.accountRequestDeleted": {
      zh: "账号申请 {requestNo} 已删除。",
      en: "Account request {requestNo} has been deleted.",
      de: "Der Kontoantrag {requestNo} wurde geloescht.",
    },
    "alerts.approvalDirtyDeleted": {
      zh: "审批脏数据 {target} 已删除。",
      en: "Dirty approval data {target} has been deleted.",
      de: "Verschmutzte Freigabedaten {target} wurden gelöscht.",
    },
    "alerts.approvalDirtyCleared": {
      zh: "审批中心脏数据已清空，共处理 {count} 条。",
      en: "Dirty approval data has been cleared from the approval center. {count} records were processed.",
      de: "Verschmutzte Freigabedaten wurden aus dem Freigabecenter entfernt. {count} Datensätze wurden verarbeitet.",
    },
    "alerts.logsCleared": {
      zh: "操作日志已清空，共处理 {count} 条。",
      en: "Operation logs have been cleared. {count} records were processed.",
      de: "Aktionsprotokolle wurden geleert. {count} Datensätze wurden verarbeitet.",
    },
    "remarks.fromAccountRequest": {
      zh: "来自账号申请 {requestNo}",
      en: "From account request {requestNo}",
      de: "Aus Kontoantrag {requestNo}",
    },
    "remarks.generatedFromAccountRequest": {
      zh: "由账号申请 {requestNo} 自动生成",
      en: "Generated automatically from account request {requestNo}",
      de: "Automatisch aus Kontoantrag {requestNo} erzeugt",
    },
    "account.requestResultApproved": {
      zh: "已生成账号 {userName}",
      en: "Account {userName} has been generated",
      de: "Das Konto {userName} wurde erstellt",
    },
    "details.currentNode": {
      zh: "当前节点：{node}",
      en: "Current node: {node}",
      de: "Aktueller Knoten: {node}",
    },
    "details.approver": {
      zh: "审批人：{name}",
      en: "Approver: {name}",
      de: "Freigeber: {name}",
    },
    "details.mailSubject": {
      zh: "邮件主题：{subject}",
      en: "Mail subject: {subject}",
      de: "Mailbetreff: {subject}",
    },
    "details.generatedAt": {
      zh: "自动生成时间：{time}",
      en: "Generated at: {time}",
      de: "Erstellt am: {time}",
    },
    "details.salesContact": {
      zh: "销售联系人：{name}",
      en: "Sales contact: {name}",
      de: "Vertriebskontakt: {name}",
    },
    "details.systemGeneratedAt": {
      zh: "系统生成时间：{time}",
      en: "System generated at: {time}",
      de: "System erstellt am: {time}",
    },
    "details.mailDownloadHtml": {
      zh: "已下载 {filename}，可直接作为客户价格表附件发送。",
      en: "{filename} has been downloaded and can be sent directly as the customer price sheet attachment.",
      de: "{filename} wurde heruntergeladen und kann direkt als Anhang der Kundenpreisliste versendet werden.",
    },
    "details.mailDownloadPdf": {
      zh: "已下载 {filename}，可直接以 PDF 形式发送给客户。",
      en: "{filename} has been downloaded and can be sent to the customer as a PDF.",
      de: "{filename} wurde heruntergeladen und kann als PDF an den Kunden gesendet werden.",
    },
    "details.mailDownloadTxt": {
      zh: "已下载 {filename}，方便以纯文本方式发送价格。",
      en: "{filename} has been downloaded for sending the price list as plain text.",
      de: "{filename} wurde heruntergeladen, um die Preisliste als Klartext zu versenden.",
    },
    "alerts.batchQuotesByProductCreated": {
      zh: "已按 {label} 为 {success} 个客户生成报价，失败 {failed} 条。",
      en: "{success} quotes were created by product {label}; {failed} items failed.",
      de: "Fuer Produkt {label} wurden {success} Angebote erstellt; {failed} Vorgänge sind fehlgeschlagen.",
    },
    "alerts.batchQuotesByCustomerCreated": {
      zh: "已按 {label} 为 {success} 个产品生成报价，失败 {failed} 条。",
      en: "{success} quotes were created by customer {label}; {failed} items failed.",
      de: "Fuer Kunde {label} wurden {success} Angebote erstellt; {failed} Vorgänge sind fehlgeschlagen.",
    },
    "alerts.batchQuotesFirstError": {
      zh: "首个失败原因：{reason}",
      en: "First failure reason: {reason}",
      de: "Erster Fehlergrund: {reason}",
    },
    "pdf.pageNo": {
      zh: "第 {page} 页",
      en: "Page {page}",
      de: "Seite {page}",
    },
    "pdf.pageCount": {
      zh: "第 {page} / {total} 页",
      en: "Page {page} / {total}",
      de: "Seite {page} / {total}",
    },
    "finance.ccStatus": {
      zh: "{name} / {status}",
      en: "{name} / {status}",
      de: "{name} / {status}",
    },
    "mail.subject": {
      zh: "【客户价格表】{customerName} {productName} {effectiveMonth}",
      en: "[Customer Price Sheet] {customerName} {productName} {effectiveMonth}",
      de: "[Kundenpreisliste] {customerName} {productName} {effectiveMonth}",
    },
    "mail.greeting": {
      zh: "尊敬的{customerName}团队，您好：",
      en: "Dear {customerName} team,",
      de: "Liebes Team von {customerName},",
    },
    "mail.intro": {
      zh: "现将已审批通过的客户价格表发送给您，请查收。",
      en: "Please find the approved customer price sheet below.",
      de: "Anbei erhalten Sie die freigegebene Kundenpreisliste.",
    },
    "mail.replyHint": {
      zh: "如需确认、回签或进一步沟通，请直接回复本邮件。",
      en: "If you need to confirm, countersign, or discuss further, please reply directly to this email.",
      de: "Wenn Sie bestätigen, gegenzeichnen oder weiter abstimmen möchten, antworten Sie bitte direkt auf diese E-Mail.",
    },
    "mail.attachmentTitle": {
      zh: "客户价格表",
      en: "Customer Price Sheet",
      de: "Kundenpreisliste",
    },
    "mail.fileBase": {
      zh: "客户价格表",
      en: "customer-price-sheet",
      de: "kundenpreisliste",
    },
    "mail.listFileBase": {
      zh: "客户价格表汇总",
      en: "customer-price-sheet-list",
      de: "kundenpreisliste-uebersicht",
    },
  };

  function readI18nPath(language, key) {
    return String(key || "")
      .split(".")
      .filter(Boolean)
      .reduce((value, segment) => (value && typeof value === "object" ? value[segment] : undefined), I18N[language]);
  }

  function flattenI18nKeys(source = I18N.zh, prefix = "", result = {}) {
    Object.entries(source || {}).forEach(([key, value]) => {
      const nextKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === "object") {
        flattenI18nKeys(value, nextKey, result);
        return;
      }
      result[nextKey] = {
        zh: readI18nPath("zh", nextKey) || "",
        en: readI18nPath("en", nextKey) || readI18nPath("zh", nextKey) || "",
        de: readI18nPath("de", nextKey) || readI18nPath("zh", nextKey) || "",
      };
    });
    return result;
  }

  function registerStructuredPhrases(entries) {
    Object.values(entries).forEach((entry) => {
      const base = entry.zh;
      if (!base || PHRASES[base]) {
        return;
      }
      PHRASES[base] = { zh: entry.zh, en: entry.en, de: entry.de };
    });
  }

  const STRUCTURED_TEMPLATES = flattenI18nKeys();
  const EXTRA_TEMPLATES = {
    "portal.customerMenu.dashboard": { zh: "首页", en: "Dashboard", de: "Übersicht" },
    "portal.customerMenu.products": { zh: "产品", en: "Products", de: "Produkte" },
    "portal.customerMenu.cart": { zh: "购物车", en: "Cart", de: "Warenkorb" },
    "portal.customerMenu.orders": { zh: "我的订单", en: "My Orders", de: "Meine Aufträge" },
    "portal.customerMenu.invoices": { zh: "我的发票", en: "My Invoices", de: "Meine Rechnungen" },
    "portal.customerMenu.shipments": { zh: "发货状态", en: "Shipment Status", de: "Versandstatus" },
    "portal.customerMenu.account": { zh: "账户", en: "Account", de: "Konto" },
    "auth.loginHint": { zh: "不同账号登录后，将自动进入对应的权限范围。", en: "After signing in with different accounts, the system automatically opens the corresponding permission scope.", de: "Nach der Anmeldung mit unterschiedlichen Konten öffnet das System automatisch den entsprechenden Berechtigungsbereich." },
    "auth.loginUser": { zh: "登录账号", en: "Login ID", de: "Anmeldekonto" },
    "auth.loginPassword": { zh: "登录密码", en: "Password", de: "Passwort" },
    "auth.signIn": { zh: "登录系统", en: "Sign In", de: "Anmelden" },
    "auth.demoAccounts": { zh: "演示账号", en: "Demo Accounts", de: "Demokonten" },
    "portal.customerAccount": { zh: "客户门户账号", en: "Customer Portal Account", de: "Kundenportalkonto" },
    "role.SALES_ENTRY": { zh: "客户经理", en: "Customer Manager", de: "Kundenmanager" },
    "role.SALES_MANAGER": { zh: "电商负责人", en: "E-commerce Lead", de: "E-Commerce-Leitung" },
    "role.BUSINESS_HEAD": { zh: "总经理", en: "General Manager", de: "Geschäftsführer" },
    "role.FINANCE_HEAD": { zh: "财务总监", en: "Finance Director", de: "Finanzdirektor" },
    "role.SYSTEM_ADMIN": { zh: "超级管理员", en: "Super Admin", de: "Super-Administrator" },
    "role.CUSTOMER_ADMIN": { zh: "客户公司管理员", en: "Customer Company Admin", de: "Kundenadministrator" },
    "role.CUSTOMER_BUYER": { zh: "客户采购人员", en: "Customer Buyer", de: "Kundeneinkäufer" },
    "role.CUSTOMER_VIEWER": { zh: "客户只读账号", en: "Customer Viewer", de: "Kundenbetrachter" },
    "status.NONE": { zh: "无预警", en: "No Warning", de: "Keine Warnung" },
    "status.YELLOW": { zh: "黄色预警", en: "Yellow Warning", de: "Gelbe Warnung" },
    "status.RED": { zh: "红色预警", en: "Red Warning", de: "Rote Warnung" },
    "status.PENDING_EFFECTIVE": { zh: "待生效", en: "Pending Effective", de: "Wartet auf Wirksamkeit" },
    "status.REJECTED_PENDING_EDIT": { zh: "驳回待修改", en: "Rejected Pending Update", de: "Abgelehnt, Änderung erforderlich" },
    "status.COMMERCIAL_GENERATED": { zh: "正式发票已生成", en: "Commercial Invoice Generated", de: "Handelsrechnung erstellt" },
    "status.LOCKED": { zh: "已锁定", en: "Locked", de: "Gesperrt" },
    "status.CONVERTED_TO_ORDER": { zh: "已转订单", en: "Converted to Order", de: "In Auftrag umgewandelt" },
    "status.UNPAID": { zh: "未付款", en: "Unpaid", de: "Unbezahlt" },
    "action.view": { zh: "查看", en: "View", de: "Anzeigen" },
    "action.edit": { zh: "编辑", en: "Edit", de: "Bearbeiten" },
    "action.save": { zh: "保存", en: "Save", de: "Speichern" },
    "action.cancel": { zh: "取消", en: "Cancel", de: "Abbrechen" },
    "action.submit": { zh: "提交", en: "Submit", de: "Einreichen" },
    "action.approve": { zh: "审批", en: "Approve", de: "Freigeben" },
    "action.reject": { zh: "拒绝", en: "Reject", de: "Ablehnen" },
    "action.download": { zh: "下载", en: "Download", de: "Herunterladen" },
    "action.downloadPdf": { zh: "下载PDF", en: "Download PDF", de: "PDF herunterladen" },
    "action.refreshData": { zh: "刷新数据", en: "Refresh Data", de: "Daten aktualisieren" },
    "action.signOut": { zh: "退出登录", en: "Sign Out", de: "Abmelden" },
    "action.createQuote": { zh: "新建报价", en: "Create Quote", de: "Angebot erstellen" },
    "action.processApproval": { zh: "处理审批", en: "Process Approval", de: "Freigabe bearbeiten" },
    "action.generateCollectPayment": { zh: "生成 / 收款", en: "Generate / Collect Payment", de: "Erstellen / Zahlung erfassen" },
    "action.orderCenter": { zh: "订单中心", en: "Order Center", de: "Auftragszentrum" },
    "action.shipmentInstruction": { zh: "发货指令", en: "Shipment Instruction", de: "Versandanweisung" },
    "action.addToCart": { zh: "加入购物车", en: "Add to Cart", de: "In den Warenkorb" },
    "action.add": { zh: "加入", en: "Add", de: "Hinzufügen" },
    "action.submitOrder": { zh: "提交订单", en: "Submit Order", de: "Auftrag einreichen" },
    "action.updateQuantity": { zh: "更新数量", en: "Update Quantity", de: "Menge aktualisieren" },
    "action.remove": { zh: "移除", en: "Remove", de: "Entfernen" },
    "action.generatePi": { zh: "生成 PI", en: "Generate PI", de: "PI erstellen" },
    "action.markAsSent": { zh: "标记已发送", en: "Mark as Sent", de: "Als gesendet markieren" },
    "action.markAsPaid": { zh: "标记已付款", en: "Mark as Paid", de: "Als bezahlt markieren" },
    "action.confirmCreditTerm": { zh: "确认账期", en: "Confirm Credit Term", de: "Zahlungsziel bestätigen" },
    "action.createCommercialInvoice": { zh: "生成商业发票", en: "Create Commercial Invoice", de: "Handelsrechnung erstellen" },
    "action.createCreditNote": { zh: "生成贷项通知单", en: "Create Credit Note", de: "Gutschrift erstellen" },
    "action.generateDeliveryInstruction": { zh: "生成发货指令", en: "Generate Shipment Instruction", de: "Versandanweisung erstellen" },
    "action.queryInvoices": { zh: "查询发票", en: "Search Invoices", de: "Rechnungen suchen" },
    "action.resetFilters": { zh: "重置筛选", en: "Reset Filters", de: "Filter zurücksetzen" },
    "dashboard.title": { zh: "业务总览", en: "Business Overview", de: "Geschäftsübersicht" },
    "dashboard.roleHint.default": { zh: "按当前权限展示可处理事项。", en: "Shows actionable items based on current permissions.", de: "Zeigt bearbeitbare Vorgänge gemäß aktueller Berechtigung." },
    "dashboard.roleHint.SALES_ENTRY": { zh: "优先查看客户报价、客户提交订单和需要补资料的客户事项。", en: "Prioritize customer quotations, submitted orders, and customer items requiring more information.", de: "Priorisieren Sie Kundenangebote, eingereichte Aufträge und Kundenvorgänge mit fehlenden Angaben." },
    "dashboard.roleHint.SALES_MANAGER": { zh: "优先处理订单 / 客户审批，关注价格和客户政策风险。", en: "Prioritize order and customer approvals, with attention to pricing and customer policy risks.", de: "Priorisieren Sie Auftrags- und Kundenfreigaben sowie Preis- und Kundenrichtlinienrisiken." },
    "dashboard.roleHint.BUSINESS_HEAD": { zh: "优先看全链路阻塞、异常审批和低库存风险。", en: "Prioritize workflow blockers, exceptional approvals, and low-stock risks.", de: "Priorisieren Sie Prozessblockaden, Sonderfreigaben und Risiken durch niedrige Bestände." },
    "dashboard.roleHint.FINANCE_HEAD": { zh: "优先处理发票、付款状态和可发货订单。", en: "Prioritize invoices, payment status, and orders ready to ship.", de: "Priorisieren Sie Rechnungen, Zahlungsstatus und versandbereite Aufträge." },
    "dashboard.roleHint.SYSTEM_ADMIN": { zh: "可查看全链路待办，同时维护账号、公式与系统日志。", en: "Can view all workflow tasks and maintain accounts, formulas, and system logs.", de: "Kann alle Workflow-Aufgaben einsehen sowie Konten, Formeln und Systemprotokolle verwalten." },
    "dashboard.roleHintText": { zh: "{role}：{hint}", en: "{role}: {hint}", de: "{role}: {hint}" },
    "dashboard.cards.myTasks": { zh: "我的待办", en: "My Tasks", de: "Meine Aufgaben" },
    "dashboard.cards.myTasksHint": { zh: "需要当前角色处理", en: "Requires action by current role", de: "Erfordert Aktion der aktuellen Rolle" },
    "dashboard.cards.pendingPi": { zh: "待生成 PI", en: "Pending PI", de: "Ausstehende PI" },
    "dashboard.cards.pendingPiHint": { zh: "审批通过但未开票", en: "Approved but not invoiced", de: "Freigegeben, aber noch nicht fakturiert" },
    "dashboard.cards.pendingPayment": { zh: "待收款 / 账期确认", en: "Pending Payment / Credit Term Confirmation", de: "Ausstehende Zahlung / Zahlungszielbestätigung" },
    "dashboard.cards.pendingPaymentHint": { zh: "阻塞发货", en: "Blocking shipment", de: "Blockiert Versand" },
    "dashboard.cards.lowStockSkus": { zh: "低库存 SKU", en: "Low Stock SKUs", de: "SKUs mit niedrigem Bestand" },
    "dashboard.cards.lowStockHint": { zh: "可销售库存低于阈值", en: "Available stock below threshold", de: "Verfügbarer Bestand unter Schwellenwert" },
    "dashboard.pipeline.quotation": { zh: "报价", en: "Quotations", de: "Angebote" },
    "dashboard.pipeline.order": { zh: "订单", en: "Orders", de: "Aufträge" },
    "dashboard.pipeline.approval": { zh: "审批", en: "Approvals", de: "Freigaben" },
    "dashboard.pipeline.invoice": { zh: "发票", en: "Invoices", de: "Rechnungen" },
    "dashboard.pipeline.shipment": { zh: "发货", en: "Shipments", de: "Versand" },
    "dashboard.pipeline.quotationHint": { zh: "价格与报价中心", en: "Pricing & Quotation Center", de: "Preis- und Angebotszentrale" },
    "dashboard.pipeline.orderHint": { zh: "客户提交 / 内部订单", en: "Customer submitted / internal orders", de: "Von Kunden eingereichte / interne Aufträge" },
    "dashboard.pipeline.approvalHint": { zh: "订单待审批", en: "Orders pending approval", de: "Aufträge zur Freigabe" },
    "dashboard.pipeline.invoiceHint": { zh: "PI / 收款待处理", en: "PI / payment pending", de: "PI / Zahlung ausstehend" },
    "dashboard.pipeline.shipmentHint": { zh: "付款后可生成发货指令", en: "Generate shipment instruction after payment", de: "Versandanweisung nach Zahlung erstellen" },
    "dashboard.todo.summary": { zh: "{count} 个事项等待 {role} 处理", en: "{count} task(s) awaiting {role}", de: "{count} Aufgabe(n) warten auf {role}" },
    "dashboard.todo.emptySummary": { zh: "当前角色暂无阻塞性待办", en: "No blocking tasks for the current role", de: "Keine blockierenden Aufgaben für die aktuelle Rolle" },
    "dashboard.todo.empty": { zh: "暂无待办。可以从左侧交易管理进入报价、订单或发票模块。", en: "No tasks yet. Use Trade Management on the left to open quotations, orders, or invoices.", de: "Keine Aufgaben. Öffnen Sie Angebote, Aufträge oder Rechnungen über das Transaktionsmanagement links." },
    "dashboard.todo.generatePi": { zh: "生成 PI · {customer}", en: "Generate PI · {customer}", de: "PI erstellen · {customer}" },
    "dashboard.todo.confirmPayment": { zh: "确认付款 · {customer}", en: "Confirm Payment · {customer}", de: "Zahlung bestätigen · {customer}" },
    "dashboard.todo.generateShipment": { zh: "生成发货指令 · {customer}", en: "Generate Shipment Instruction · {customer}", de: "Versandanweisung erstellen · {customer}" },
    "dashboard.risk.summary": { zh: "{count} 条风险需要关注", en: "{count} risk alert(s) need attention", de: "{count} Risiko-Hinweis(e) erfordern Aufmerksamkeit" },
    "dashboard.risk.emptySummary": { zh: "当前没有明显风险", en: "No visible risk alerts", de: "Keine sichtbaren Risiko-Hinweise" },
    "dashboard.risk.empty": { zh: "暂无风险提醒。", en: "No risk alerts.", de: "Keine Risiko-Hinweise." },
    "dashboard.risk.staticHint": { zh: "库存、付款、发票、客户资料异常", en: "Inventory, payment, invoice, and customer data exceptions", de: "Ausnahmen bei Bestand, Zahlung, Rechnung und Kundendaten" },
    "dashboard.risk.lowStock": { zh: "低库存 · {sku}", en: "Low Stock · {sku}", de: "Niedriger Bestand · {sku}" },
    "dashboard.risk.lowStockMeta": { zh: "可销售 {available} / 安全库存 {safety}", en: "Available {available} / Safety stock {safety}", de: "Verfügbar {available} / Sicherheitsbestand {safety}" },
    "dashboard.risk.overdueInvoice": { zh: "发票逾期 · {invoiceNo}", en: "Overdue Invoice · {invoiceNo}", de: "Überfällige Rechnung · {invoiceNo}" },
    "dashboard.risk.approvedNoPi": { zh: "已审批未开 PI · {orderNo}", en: "Approved without PI · {orderNo}", de: "Freigegeben ohne PI · {orderNo}" },
    "dashboard.risk.paidReadyShipment": { zh: "付款后待发货 · {orderNo}", en: "Paid and awaiting shipment · {orderNo}", de: "Bezahlt und versandbereit · {orderNo}" },
    "dashboard.risk.missingBilling": { zh: "开票资料待补 · {customer}", en: "Billing data incomplete · {customer}", de: "Rechnungsdaten unvollständig · {customer}" },
    "dashboard.orders.empty": { zh: "暂无待处理订单", en: "No pending orders", de: "Keine ausstehenden Aufträge" },
    "order.centerTitle": { zh: "订单中心", en: "Order Center", de: "Auftragszentrum" },
    "order.summary.empty": { zh: "暂无订单", en: "No orders", de: "Keine Aufträge" },
    "order.summary.count": { zh: "共 {count} 个订单", en: "{count} orders", de: "{count} Aufträge" },
    "order.message.approved": { zh: "{orderNo} 已审批通过。", en: "{orderNo} approved.", de: "{orderNo} wurde freigegeben." },
    "order.message.rejected": { zh: "{orderNo} 已驳回并释放库存。", en: "{orderNo} rejected and inventory released.", de: "{orderNo} wurde abgelehnt und Bestand freigegeben." },
    "order.table.status": { zh: "状态", en: "Status", de: "Status" },
    "order.table.total": { zh: "总计", en: "Total", de: "Gesamt" },
    "order.table.items": { zh: "商品", en: "Items", de: "Positionen" },
    "approval.type.order": { zh: "订单审批", en: "Order Approval", de: "Auftragsfreigabe" },
    "approval.type.accountRequest": { zh: "申请账号", en: "Account Request", de: "Kontoantrag" },
    "customerPortal.dashboard.partnerDashboard": { zh: "合作伙伴首页", en: "Partner Dashboard", de: "Partnerübersicht" },
    "customerPortal.dashboard.paymentTermsPending": { zh: "账期待确认", en: "Payment terms pending", de: "Zahlungsbedingungen ausstehend" },
    "customerPortal.dashboard.cartItems": { zh: "购物车商品", en: "Cart Items", de: "Warenkorbpositionen" },
    "customerPortal.dashboard.pendingOrders": { zh: "待处理订单", en: "Pending Orders", de: "Ausstehende Aufträge" },
    "customerPortal.dashboard.approvedOrders": { zh: "已审批订单", en: "Approved Orders", de: "Freigegebene Aufträge" },
    "customerPortal.dashboard.creditAvailable": { zh: "可用信用额度", en: "Credit Available", de: "Verfügbarer Kreditrahmen" },
    "customerPortal.dashboard.recentOrders": { zh: "最近订单", en: "Recent Orders", de: "Neueste Aufträge" },
    "customerPortal.dashboard.scopedOrdersHint": { zh: "仅显示本客户订单", en: "Only this customer's orders are visible", de: "Nur Aufträge dieses Kunden sind sichtbar" },
    "customerPortal.products.title": { zh: "产品与价格", en: "Products & Prices", de: "Produkte & Preise" },
    "customerPortal.products.hint": { zh: "您的价格由价格引擎基于已批准政策和产品默认价格计算。", en: "Your price is calculated by the Pricing Engine from approved policies and product defaults.", de: "Ihr Preis wird von der Pricing Engine aus freigegebenen Richtlinien und Produktstandardpreisen berechnet." },
    "customerPortal.products.notLinked": { zh: "客户账号未绑定客户档案。", en: "Customer account is not linked.", de: "Kundenkonto ist nicht verknüpft." },
    "customerPortal.products.empty": { zh: "当前没有可在门户销售的产品。", en: "No sellable products are available for the portal.", de: "Keine verkaufbaren Produkte für das Portal verfügbar." },
    "customerPortal.products.productImage": { zh: "产品图片", en: "Product Image", de: "Produktbild" },
    "customerPortal.products.productName": { zh: "产品名称", en: "Product Name", de: "Produktname" },
    "customerPortal.products.series": { zh: "产品系列", en: "Series", de: "Serie" },
    "customerPortal.products.variant": { zh: "颜色 / 版本", en: "Variant", de: "Variante" },
    "customerPortal.products.yourPrice": { zh: "客户专属价", en: "Your Price", de: "Ihr Preis" },
    "customerPortal.products.moq": { zh: "MOQ", en: "MOQ", de: "MOQ" },
    "customerPortal.products.availableStock": { zh: "可销售库存", en: "Available Stock", de: "Verfügbarer Bestand" },
    "customerPortal.products.availableStockExact": { zh: "可销售库存：{count} 件", en: "Available Stock: {count} pcs", de: "Verfügbarer Bestand: {count} Stk." },
    "customerPortal.products.inStock": { zh: "有货", en: "In Stock", de: "Auf Lager" },
    "customerPortal.products.limitedStock": { zh: "库存有限", en: "Limited Stock", de: "Begrenzter Bestand" },
    "customerPortal.products.outOfStock": { zh: "缺货", en: "Out of Stock", de: "Nicht auf Lager" },
    "customerPortal.products.quantity": { zh: "数量", en: "Quantity", de: "Menge" },
    "customerPortal.cart.title": { zh: "购物车", en: "Cart", de: "Warenkorb" },
    "customerPortal.cart.hint": { zh: "提交订单前会重新校验价格和库存。", en: "Prices and stock are revalidated before order submission.", de: "Preise und Bestand werden vor Auftragseinreichung erneut geprüft." },
    "customerPortal.cart.empty": { zh: "购物车为空。", en: "Cart is empty.", de: "Der Warenkorb ist leer." },
    "customerPortal.cart.unitPrice": { zh: "单价", en: "Unit Price", de: "Einzelpreis" },
    "customerPortal.cart.subtotal": { zh: "小计", en: "Subtotal", de: "Zwischensumme" },
    "customerPortal.cart.priceValidUntil": { zh: "价格有效期", en: "Price Valid Until", de: "Preis gültig bis" },
    "customerPortal.cart.total": { zh: "总计：{amount}", en: "Total: {amount}", de: "Gesamt: {amount}" },
    "customerPortal.cart.vatIncluded": { zh: "订单总额含VAT：{amount}", en: "VAT included in order total: {amount}", de: "MwSt. im Auftragsgesamtbetrag enthalten: {amount}" },
    "customerPortal.orders.title": { zh: "我的订单", en: "My Orders", de: "Meine Aufträge" },
    "customerPortal.orders.scopeHint": { zh: "订单数据仅限 {customer}。", en: "Order data is scoped to {customer}.", de: "Auftragsdaten sind auf {customer} beschränkt." },
    "customerPortal.orders.yourCompany": { zh: "本公司", en: "your company", de: "Ihr Unternehmen" },
    "customerPortal.invoices.title": { zh: "我的发票", en: "My Invoices", de: "Meine Rechnungen" },
    "customerPortal.invoices.scopeHint": { zh: "仅显示 {customer} 的发票。", en: "Only invoices for {customer} are visible.", de: "Nur Rechnungen für {customer} sind sichtbar." },
    "customerPortal.invoices.filterPlaceholder": { zh: "发票号 / 订单号", en: "Invoice / Order No.", de: "Rechnung / Auftrag Nr." },
    "customerPortal.invoices.allPaymentStatus": { zh: "全部付款状态", en: "All payment status", de: "Alle Zahlungsstatus" },
    "customerPortal.invoices.empty": { zh: "暂无发票。", en: "No invoices yet.", de: "Keine Rechnungen vorhanden." },
    "customerPortal.invoices.viewOnly": { zh: "仅查看", en: "View only", de: "Nur anzeigen" },
    "customerPortal.shipments.title": { zh: "发货状态", en: "Shipment Status", de: "Versandstatus" },
    "customerPortal.shipments.hint": { zh: "仓库更新发货后显示物流信息。", en: "Tracking information appears after warehouse shipment update.", de: "Sendungsverfolgung erscheint nach Aktualisierung durch das Lager." },
    "customerPortal.account.title": { zh: "账户", en: "Account", de: "Konto" },
    "customerPortal.account.company": { zh: "公司", en: "Company", de: "Unternehmen" },
    "customerPortal.account.customerCode": { zh: "客户编码", en: "Customer Code", de: "Kundencode" },
    "customerPortal.account.paymentTerms": { zh: "账期", en: "Payment Terms", de: "Zahlungsbedingungen" },
    "customerPortal.account.billingAddress": { zh: "开票地址", en: "Billing Address", de: "Rechnungsadresse" },
    "customerPortal.account.shippingAddress": { zh: "收货地址", en: "Shipping Address", de: "Lieferadresse" },
    "customerPortal.account.invoiceEmail": { zh: "发票邮箱", en: "Invoice Email", de: "Rechnungs-E-Mail" },
    "customerPortal.account.deliveryContact": { zh: "收货联系人", en: "Delivery Contact", de: "Lieferkontakt" },
    "empty.noOrders": { zh: "暂无订单。", en: "No orders yet.", de: "Keine Aufträge vorhanden." },
    "empty.noShipments": { zh: "暂无发货数据。", en: "No shipment data yet.", de: "Keine Versanddaten vorhanden." },
    "invoice.title": { zh: "发票中心", en: "Invoice Center", de: "Rechnungszentrum" },
    "invoice.hint": { zh: "发票必须基于已审批订单和锁价快照生成", en: "Invoices must be generated from approved orders and locked price snapshots.", de: "Rechnungen müssen aus freigegebenen Aufträgen und gesperrten Preis-Snapshots erstellt werden." },
    "invoice.readyOrdersTitle": { zh: "待生成形式发票（PI）的订单", en: "Orders Ready for Proforma Invoice", de: "Aufträge bereit für Proforma-Rechnung" },
    "invoice.readyOrdersHint": { zh: "订单审批通过且报价快照已锁定后可生成 PI", en: "PI can be generated after order approval and locked quotation snapshot.", de: "PI kann nach Auftragsfreigabe und gesperrtem Angebotssnapshot erstellt werden." },
    "invoice.detailTitle": { zh: "发票详情", en: "Invoice Details", de: "Rechnungsdetails" },
    "invoice.detailHint": { zh: "点击查看卖方、客户、明细、金额、付款信息和备注。", en: "Click View to see seller, customer, line items, amounts, payment information, and notes.", de: "Klicken Sie auf Anzeigen, um Verkäufer, Kunde, Positionen, Beträge, Zahlungsinformationen und Hinweise zu sehen." },
    "invoice.noDetail": { zh: "暂无发票详情", en: "No invoice details", de: "Keine Rechnungsdetails" },
    "invoice.noInvoices": { zh: "暂无符合条件的发票", en: "No invoices match the filters", de: "Keine Rechnungen passen zu den Filtern" },
    "invoice.noReadyOrders": { zh: "暂无可生成 PI 的订单", en: "No orders ready for PI", de: "Keine Aufträge bereit für PI" },
    "invoice.type.PROFORMA_INVOICE": { zh: "形式发票", en: "Proforma Invoice", de: "Proforma-Rechnung" },
    "invoice.type.COMMERCIAL_INVOICE": { zh: "商业发票", en: "Commercial Invoice", de: "Handelsrechnung" },
    "invoice.type.CREDIT_NOTE": { zh: "贷项通知单", en: "Credit Note", de: "Gutschrift" },
    "invoice.table.invoiceNo": { zh: "发票号", en: "Invoice No.", de: "Rechnungsnr." },
    "invoice.table.orderNo": { zh: "订单号", en: "Order No.", de: "Auftragsnr." },
    "invoice.table.customer": { zh: "客户", en: "Customer", de: "Kunde" },
    "invoice.table.invoiceType": { zh: "发票类型", en: "Invoice Type", de: "Rechnungstyp" },
    "invoice.table.subtotalNet": { zh: "未税小计", en: "Subtotal Net", de: "Zwischensumme netto" },
    "invoice.table.vat": { zh: "VAT", en: "VAT", de: "MwSt." },
    "invoice.table.totalGross": { zh: "含税总额", en: "Total Gross", de: "Gesamt brutto" },
    "invoice.table.currency": { zh: "币种", en: "Currency", de: "Währung" },
    "invoice.table.invoiceStatus": { zh: "发票状态", en: "Invoice Status", de: "Rechnungsstatus" },
    "invoice.table.paymentStatus": { zh: "付款状态", en: "Payment Status", de: "Zahlungsstatus" },
    "invoice.table.dateOfIssue": { zh: "开票日期", en: "Date of Issue", de: "Ausstellungsdatum" },
    "invoice.table.dueDate": { zh: "到期日", en: "Due Date", de: "Fälligkeitsdatum" },
    "form.dateFrom": { zh: "开始日期", en: "Date From", de: "Datum von" },
    "form.dateTo": { zh: "结束日期", en: "Date To", de: "Datum bis" },
    "invoice.detail.sellerInfo": { zh: "卖方信息", en: "Seller Information", de: "Verkäuferinformationen" },
    "invoice.detail.customerInfo": { zh: "客户信息", en: "Customer Information", de: "Kundeninformationen" },
    "invoice.detail.invoiceInfo": { zh: "发票信息", en: "Invoice Information", de: "Rechnungsinformationen" },
    "invoice.detail.orderReference": { zh: "订单参考", en: "Order Reference", de: "Auftragsreferenz" },
    "invoice.detail.companyNo": { zh: "公司注册号", en: "Company No.", de: "Handelsregisternr." },
    "invoice.detail.commercialCourt": { zh: "商业法院", en: "Commercial Court", de: "Handelsgericht" },
    "invoice.detail.address": { zh: "地址", en: "Address", de: "Adresse" },
    "invoice.detail.email": { zh: "邮箱", en: "Email", de: "E-Mail" },
    "invoice.detail.country": { zh: "国家", en: "Country", de: "Land" },
    "invoice.detail.description": { zh: "描述", en: "Description", de: "Beschreibung" },
    "invoice.detail.unitPriceNet": { zh: "未税单价", en: "Unit Price Net", de: "Einzelpreis netto" },
    "invoice.detail.netAmount": { zh: "未税金额", en: "Net Amount", de: "Nettobetrag" },
    "invoice.detail.bundleFoc": { zh: "Bundle / 免费", en: "Bundle / FOC", de: "Bundle / kostenlos" },
    "invoice.detail.freeOfCharge": { zh: "免费", en: "Free of charge", de: "Kostenlos" },
    "invoice.detail.bundle": { zh: "Bundle", en: "Bundle", de: "Bundle" },
    "invoice.detail.bundleFreeOfChargeSuffix": { zh: "（Bundle item – free of charge）", en: "(Bundle item – free of charge)", de: "(Bundle-Artikel – kostenlos)" },
    "invoice.detail.amountSummary": { zh: "金额汇总", en: "Amount Summary", de: "Betragsübersicht" },
    "invoice.detail.paymentInformation": { zh: "付款信息", en: "Payment Information", de: "Zahlungsinformationen" },
    "invoice.detail.notes": { zh: "备注", en: "Notes", de: "Hinweise" },
    "invoice.detail.operationLog": { zh: "操作日志", en: "Operation Log", de: "Aktivitätsprotokoll" },
    "invoice.detail.bankName": { zh: "银行名称", en: "Bank Name", de: "Bankname" },
    "invoice.detail.accountHolder": { zh: "账户持有人", en: "Account Holder", de: "Kontoinhaber" },
    "invoice.detail.paymentDueBy": { zh: "付款到期日", en: "Payment due by", de: "Zahlbar bis" },
    "invoice.notes.noAdditional": { zh: "无其他备注。", en: "No additional notes.", de: "Keine zusätzlichen Hinweise." },
    "invoice.notes.reverseCharge": { zh: "Reverse charge according to § 19 Abs. 1e lit. b UStG.", en: "Reverse charge according to § 19 Abs. 1e lit. b UStG.", de: "Reverse Charge gemäß § 19 Abs. 1e lit. b UStG." },
    "invoice.notes.smvIntro": { zh: "单价已包含奥地利私人复制税（Speichermedienvergütung, SMV），符合适用法规：", en: "Unit prices include the Austrian private copying levy (Speichermedienvergütung, SMV) in accordance with applicable regulations:", de: "Die Einzelpreise enthalten die österreichische Speichermedienvergütung (SMV) gemäß den geltenden Vorschriften:" },
    "invoice.notes.smvPhoneTablet": { zh: "手机和平板：每台 EUR 5.50", en: "Mobile phones and tablets: EUR 5.50 per device", de: "Mobiltelefone und Tablets: EUR 5,50 pro Gerät" },
    "invoice.notes.smvSmartwatch": { zh: "智能手表：每台 EUR 1.30", en: "Smartwatches: EUR 1.30 per device", de: "Smartwatches: EUR 1,30 pro Gerät" },
    "invoice.message.generated": { zh: "{invoiceNo} 已生成。", en: "{invoiceNo} generated.", de: "{invoiceNo} wurde erstellt." },
    "invoice.message.sent": { zh: "{invoiceNo} 已标记为已发送。", en: "{invoiceNo} marked as sent.", de: "{invoiceNo} wurde als gesendet markiert." },
    "invoice.message.paid": { zh: "{invoiceNo} 已标记付款。", en: "{invoiceNo} marked as paid.", de: "{invoiceNo} wurde als bezahlt markiert." },
    "invoice.message.creditTerm": { zh: "{invoiceNo} 已确认账期。", en: "{invoiceNo} credit term confirmed.", de: "Zahlungsziel für {invoiceNo} wurde bestätigt." },
    "invoice.message.cancelled": { zh: "{invoiceNo} 已取消。", en: "{invoiceNo} cancelled.", de: "{invoiceNo} wurde storniert." },
    "invoice.prompt.cancelReason": { zh: "请输入取消原因", en: "Please enter the cancellation reason", de: "Bitte geben Sie den Stornierungsgrund ein" },
    "invoice.error.operationFailed": { zh: "发票操作失败。", en: "Invoice operation failed.", de: "Rechnungsvorgang fehlgeschlagen." },
    "invoice.error.generateFailed": { zh: "生成发票失败。", en: "Invoice generation failed.", de: "Rechnungserstellung fehlgeschlagen." },
    "validation.invoice.orderMissing": { zh: "订单不存在。", en: "Order does not exist.", de: "Auftrag existiert nicht." },
    "validation.invoice.orderNotApproved": { zh: "订单尚未审批通过。", en: "Order has not been approved.", de: "Auftrag wurde noch nicht freigegeben." },
    "validation.invoice.lockedQuotationMissing": { zh: "缺少已锁定的报价快照。", en: "Locked quotation snapshot is missing.", de: "Gesperrter Angebotssnapshot fehlt." },
    "validation.invoice.alreadyExists": { zh: "该订单已存在同类型未取消发票。", en: "Invoice already exists for this order.", de: "Für diesen Auftrag existiert bereits eine Rechnung dieses Typs." },
    "validation.invoice.missingVatId": { zh: "缺少客户 VAT ID。请先补全客户开票信息。", en: "Missing customer VAT ID. Please complete customer billing information before generating invoice.", de: "Kunden-USt-IdNr. fehlt. Bitte vervollständigen Sie die Rechnungsdaten des Kunden vor der Rechnungserstellung." },
    "validation.invoice.missingBillingAddress": { zh: "缺少开票地址。", en: "Billing address is missing.", de: "Rechnungsadresse fehlt." },
    "validation.invoice.missingCountry": { zh: "缺少客户国家。", en: "Customer country is missing.", de: "Kundenland fehlt." },
    "validation.invoice.missingInvoiceEmail": { zh: "缺少发票邮箱。请先补全客户开票信息。", en: "Invoice email is missing. Please complete customer billing information before generating invoice.", de: "Rechnungs-E-Mail fehlt. Bitte vervollständigen Sie die Rechnungsdaten des Kunden vor der Rechnungserstellung." },
    "validation.invoice.itemMissing": { zh: "缺少订单明细。", en: "Order item is missing.", de: "Auftragsposition fehlt." },
    "validation.invoice.quantityInvalid": { zh: "{sku} 数量必须大于 0。", en: "{sku} quantity must be greater than 0.", de: "{sku}-Menge muss größer als 0 sein." },
    "validation.invoice.priceSnapshotMissing": { zh: "缺少订单明细价格快照。", en: "Order item price snapshot is missing.", de: "Preis-Snapshot der Auftragsposition fehlt." },
    "validation.invoice.totalMismatch": { zh: "发票金额与订单总额不一致。", en: "Invoice total does not match order total.", de: "Rechnungsbetrag stimmt nicht mit Auftragssumme überein." },
    "validation.invoice.noPaymentPermission": { zh: "当前账号无权标记付款状态。", en: "Current account cannot update payment status.", de: "Das aktuelle Konto darf den Zahlungsstatus nicht ändern." },
    "validation.invoice.noCancelPermission": { zh: "当前账号无权取消发票。", en: "Current account cannot cancel invoices.", de: "Das aktuelle Konto darf Rechnungen nicht stornieren." },
    "validation.invoice.notFound": { zh: "发票不存在。", en: "Invoice does not exist.", de: "Rechnung existiert nicht." },
    "shipment.title": { zh: "发货中心", en: "Shipment Center", de: "Versandzentrum" },
    "shipment.hint": { zh: "付款或账期确认后可生成发货指令并跟踪物流。", en: "Generate shipment instructions and track logistics after payment or credit term confirmation.", de: "Erstellen Sie Versandanweisungen und verfolgen Sie die Logistik nach Zahlungs- oder Zahlungszielbestätigung." },
    "shipment.noData": { zh: "暂无可发货数据", en: "No shippable data", de: "Keine versandfähigen Daten" },
    "shipment.table.shipmentNo": { zh: "发货单号", en: "Shipment No.", de: "Versandnr." },
    "shipment.table.warehouse": { zh: "仓库", en: "Warehouse", de: "Lager" },
    "shipment.table.carrier": { zh: "物流公司", en: "Carrier", de: "Spediteur" },
    "shipment.table.trackingNo": { zh: "Tracking No.", en: "Tracking No.", de: "Tracking-Nr." },
    "shipment.table.updatedAt": { zh: "更新时间", en: "Updated At", de: "Aktualisiert am" },
    "shipment.error.generateFailed": { zh: "生成发货指令失败。", en: "Failed to generate shipment instruction.", de: "Versandanweisung konnte nicht erstellt werden." },
    "shipment.error.notReady": { zh: "当前订单未满足发货指令生成条件。", en: "The current order does not meet the shipment instruction prerequisites.", de: "Der aktuelle Auftrag erfüllt die Voraussetzungen für die Versandanweisung nicht." },
    "legacy.filters": { zh: "筛选条件", en: "Filters", de: "Filter" },
    "legacy.batchKeywords": { zh: "批量查询关键词（支持客户 / 产品 / 时间模糊查询）", en: "Batch query keywords (customer / product / month fuzzy search)", de: "Suchbegriffe für Massenabfrage (Kunde / Produkt / Monat)" },
    "legacy.customerName": { zh: "客户名称", en: "Customer Name", de: "Kundenname" },
    "legacy.customerCode": { zh: "客户编码", en: "Customer Code", de: "Kundencode" },
    "legacy.productName": { zh: "产品名称", en: "Product Name", de: "Produktname" },
    "legacy.productSeries": { zh: "产品系列", en: "Product Series", de: "Produktserie" },
    "legacy.effectiveMonth": { zh: "生效月份", en: "Effective Month", de: "Gültigkeitsmonat" },
    "legacy.formulaVersion": { zh: "公式版本", en: "Formula Version", de: "Formelversion" },
    "legacy.searchQuotes": { zh: "查询报价", en: "Search Quotes", de: "Angebote suchen" },
    "legacy.downloadPriceSheet": { zh: "一键下载价格表", en: "Download Price Sheet", de: "Preisliste herunterladen" },
    "legacy.exportCsv": { zh: "导出当前列表 CSV", en: "Export Current List CSV", de: "Aktuelle Liste als CSV exportieren" },
    "legacy.priceResults": { zh: "价格查询结果", en: "Price Query Results", de: "Preisabfrage-Ergebnisse" },
    "legacy.latestRrp": { zh: "最新零售价", en: "Latest Retail Price", de: "Neuester Verkaufspreis" },
    "legacy.latestQuote": { zh: "最新报价", en: "Latest Quote", de: "Neuestes Angebot" },
    "legacy.grossProfit": { zh: "毛利额", en: "Gross Profit", de: "Bruttogewinn" },
    "legacy.grossMargin": { zh: "毛利率", en: "Gross Margin", de: "Bruttomarge" },
    "legacy.updatedAt": { zh: "更新时间", en: "Updated At", de: "Aktualisiert am" },
    "legacy.quoteCreate": { zh: "报价生成", en: "Create Quote", de: "Angebot erstellen" },
    "legacy.customer": { zh: "客户", en: "Customer", de: "Kunde" },
    "legacy.productSku": { zh: "产品 SKU", en: "Product SKU", de: "Produkt-SKU" },
    "legacy.quantity": { zh: "数量", en: "Quantity", de: "Menge" },
    "legacy.unit": { zh: "单位", en: "Unit", de: "Einheit" },
    "legacy.remarks": { zh: "备注", en: "Remarks", de: "Bemerkungen" },
    "legacy.previewQuote": { zh: "实时试算", en: "Live Preview", de: "Live-Vorschau" },
    "legacy.createQuoteApproval": { zh: "生成报价并发起审批", en: "Create Quote and Start Approval", de: "Angebot erstellen und Freigabe starten" },
    "legacy.createByProduct": { zh: "当前产品生成各客户报价", en: "Generate Customer Quotes for Current Product", de: "Kundenangebote für aktuelles Produkt erstellen" },
    "legacy.createByCustomer": { zh: "当前客户生成各产品报价", en: "Generate Product Quotes for Current Customer", de: "Produktangebote für aktuellen Kunden erstellen" },
    "legacy.calcDetails": { zh: "计算过程明细", en: "Calculation Details", de: "Berechnungsdetails" },
    "legacy.step": { zh: "步骤", en: "Step", de: "Schritt" },
    "legacy.formulaDescription": { zh: "公式/说明", en: "Formula / Description", de: "Formel / Beschreibung" },
    "legacy.result": { zh: "结果", en: "Result", de: "Ergebnis" },
    "legacy.inventoryCenter": { zh: "库存中心", en: "Inventory Center", de: "Bestandszentrum" },
    "legacy.inventoryHint": { zh: "客户前台只读取可销售库存，内部可查看锁定结构", en: "Customer portal reads sellable stock only; internal users can view lock details.", de: "Das Kundenportal liest nur verkaufbaren Bestand; intern sind Reservierungsdetails sichtbar." },
    "legacy.product": { zh: "产品", en: "Product", de: "Produkt" },
    "legacy.warehouse": { zh: "仓库", en: "Warehouse", de: "Lager" },
    "legacy.totalStock": { zh: "总库存", en: "Total Stock", de: "Gesamtbestand" },
    "legacy.availableStock": { zh: "可销售库存", en: "Available Stock", de: "Verfügbarer Bestand" },
    "legacy.reservedStock": { zh: "临时锁定", en: "Reserved Stock", de: "Reservierter Bestand" },
    "legacy.lockedStock": { zh: "正式锁定", en: "Locked Stock", de: "Gesperrter Bestand" },
    "legacy.safetyStock": { zh: "安全库存", en: "Safety Stock", de: "Sicherheitsbestand" },
    "legacy.importQuotes": { zh: "批量导入报价", en: "Batch Import Quotes", de: "Angebote per Massenimport" },
    "legacy.downloadImportTemplate": { zh: "下载标准导入模板", en: "Download Standard Import Template", de: "Standard-Importvorlage herunterladen" },
    "legacy.autoCreateCustomer": { zh: "客户不存在时自动创建客户草稿", en: "Create customer draft automatically if missing", de: "Kundenentwurf automatisch erstellen, wenn Kunde fehlt" },
    "legacy.autoCreateProduct": { zh: "产品不存在时自动创建产品草稿", en: "Create product draft automatically if missing", de: "Produktentwurf automatisch erstellen, wenn Produkt fehlt" },
    "legacy.preValidate": { zh: "预校验", en: "Pre-validate", de: "Vorab prüfen" },
    "legacy.confirmBatch": { zh: "确认批量生成报价", en: "Confirm Batch Quote Creation", de: "Massenerstellung von Angeboten bestätigen" },
    "legacy.rowNo": { zh: "行号", en: "Row No.", de: "Zeilennr." },
    "legacy.trialResult": { zh: "试算结果", en: "Preview Result", de: "Vorschauergebnis" },
    "legacy.failureReason": { zh: "失败原因", en: "Failure Reason", de: "Fehlergrund" },
    "legacy.formulaName": { zh: "公式名称", en: "Formula Name", de: "Formelname" },
    "legacy.formulaCode": { zh: "公式编码", en: "Formula Code", de: "Formelcode" },
    "legacy.customerTypeScope": { zh: "适用客户类型", en: "Customer Type Scope", de: "Gültige Kundentypen" },
    "legacy.productLineScope": { zh: "适用产品线", en: "Product Line Scope", de: "Gültige Produktlinie" },
    "legacy.channelScope": { zh: "适用渠道", en: "Channel Scope", de: "Gültiger Kanal" },
    "legacy.formulaExpression": { zh: "公式表达式", en: "Formula Expression", de: "Formelausdruck" },
    "legacy.allowBelowCostDraft": { zh: "允许击穿成本生成草稿", en: "Allow Draft Below Cost", de: "Entwurf unter Kosten erlauben" },
    "legacy.yes": { zh: "是", en: "Yes", de: "Ja" },
    "legacy.no": { zh: "否", en: "No", de: "Nein" },
    "legacy.enabled": { zh: "启用", en: "Enabled", de: "Aktiviert" },
    "legacy.disabled": { zh: "停用", en: "Disabled", de: "Deaktiviert" },
    "legacy.saveFormula": { zh: "保存公式", en: "Save Formula", de: "Formel speichern" },
    "legacy.clearForm": { zh: "清空表单", en: "Clear Form", de: "Formular leeren" },
    "legacy.formulaTrial": { zh: "公式试算", en: "Formula Trial", de: "Formeltest" },
    "legacy.formulaList": { zh: "公式列表", en: "Formula List", de: "Formelliste" },
    "legacy.name": { zh: "名称", en: "Name", de: "Name" },
    "legacy.code": { zh: "编码", en: "Code", de: "Code" },
    "legacy.version": { zh: "版本", en: "Version", de: "Version" },
    "legacy.allowBelowCost": { zh: "允许击穿草稿", en: "Allow Below-Cost Draft", de: "Entwurf unter Kosten erlauben" },
    "legacy.action": { zh: "操作", en: "Actions", de: "Aktionen" },
    "legacy.productManagement": { zh: "产品管理", en: "Product Management", de: "Produktverwaltung" },
    "legacy.productModel": { zh: "产品型号", en: "Product Model", de: "Produktmodell" },
    "legacy.colorVariant": { zh: "颜色/版本", en: "Color / Variant", de: "Farbe / Variante" },
    "legacy.launchDate": { zh: "上市时间", en: "Launch Date", de: "Einführungsdatum" },
    "legacy.defaultRrp": { zh: "默认零售价", en: "Default RRP", de: "Standard-UVP" },
    "legacy.defaultCostFob": { zh: "默认成本价 / FOB", en: "Default Cost / FOB", de: "Standardkosten / FOB" },
    "legacy.defaultFormula": { zh: "默认公式模板", en: "Default Formula Template", de: "Standard-Formelvorlage" },
    "legacy.saveProduct": { zh: "保存产品", en: "Save Product", de: "Produkt speichern" },
    "legacy.productList": { zh: "产品列表", en: "Product List", de: "Produktliste" },
    "legacy.series": { zh: "系列", en: "Series", de: "Serie" },
    "legacy.customerManagement": { zh: "客户管理", en: "Customer Management", de: "Kundenverwaltung" },
    "legacy.linkExistingCustomer": { zh: "关联已有客户（可选）", en: "Link Existing Customer (Optional)", de: "Bestehenden Kunden verknüpfen (optional)" },
    "legacy.formalDate": { zh: "正式合作日期", en: "Formal Cooperation Date", de: "Offizielles Kooperationsdatum" },
    "legacy.customerLevel": { zh: "客户等级", en: "Customer Level", de: "Kundenstufe" },
    "legacy.customerType": { zh: "客户类型", en: "Customer Type", de: "Kundentyp" },
    "legacy.channelType": { zh: "渠道类型", en: "Channel Type", de: "Kanaltyp" },
    "legacy.region": { zh: "区域", en: "Region", de: "Region" },
    "legacy.contact": { zh: "联系人", en: "Contact Person", de: "Ansprechpartner" },
    "legacy.phone": { zh: "联系电话", en: "Phone", de: "Telefon" },
    "legacy.email": { zh: "邮箱", en: "Email", de: "E-Mail" },
    "legacy.address": { zh: "地址", en: "Address", de: "Adresse" },
    "legacy.defaultApprover": { zh: "默认审批人", en: "Default Approver", de: "Standard-Freigeber" },
    "legacy.saveCustomer": { zh: "保存客户", en: "Save Customer", de: "Kunde speichern" },
    "legacy.customerList": { zh: "客户列表", en: "Customer List", de: "Kundenliste" },
    "legacy.approvalCenter": { zh: "审批中心", en: "Approval Center", de: "Freigabecenter" },
    "legacy.clearDirtyApprovals": { zh: "清空审批脏数据", en: "Clear Dirty Approval Data", de: "Freigabe-Altdaten leeren" },
    "legacy.approvalNo": { zh: "审批单号", en: "Approval No.", de: "Freigabenr." },
    "legacy.approvalType": { zh: "审批类型", en: "Approval Type", de: "Freigabetyp" },
    "legacy.targetSummary": { zh: "对象 / 摘要", en: "Target / Summary", de: "Objekt / Zusammenfassung" },
    "legacy.priceSummary": { zh: "价格摘要", en: "Price Summary", de: "Preisübersicht" },
    "legacy.warningPolicy": { zh: "预警 / 政策", en: "Warning / Policy", de: "Warnung / Richtlinie" },
    "legacy.workflow": { zh: "流程", en: "Workflow", de: "Ablauf" },
    "legacy.approvalStatus": { zh: "审批状态", en: "Approval Status", de: "Freigabestatus" },
    "legacy.accountCreate": { zh: "账号生成", en: "Account Creation", de: "Kontoerstellung" },
    "legacy.displayName": { zh: "显示名称", en: "Display Name", de: "Anzeigename" },
    "legacy.loginAccount": { zh: "登录账号", en: "Login ID", de: "Anmeldekonto" },
    "legacy.accountRole": { zh: "账号角色", en: "Account Role", de: "Kontorolle" },
    "legacy.team": { zh: "所属团队", en: "Team", de: "Team" },
    "legacy.accountType": { zh: "账号类型", en: "Account Type", de: "Kontotyp" },
    "legacy.internalAccount": { zh: "内部账号", en: "Internal Account", de: "Internes Konto" },
    "legacy.customerPortalAccount": { zh: "客户门户账号", en: "Customer Portal Account", de: "Kundenportalkonto" },
    "legacy.linkedCustomer": { zh: "绑定客户", en: "Linked Customer", de: "Verknüpfter Kunde" },
    "legacy.portalEnabled": { zh: "门户启用", en: "Portal Enabled", de: "Portal aktiviert" },
    "legacy.loginPassword": { zh: "登录密码", en: "Password", de: "Passwort" },
    "legacy.accountStatus": { zh: "账号状态", en: "Account Status", de: "Kontostatus" },
    "legacy.corePermissions": { zh: "核心权限", en: "Core Permissions", de: "Kernberechtigungen" },
    "legacy.createCustomer": { zh: "新增客户", en: "Create Customer", de: "Kunde erstellen" },
    "legacy.createProduct": { zh: "新增产品", en: "Create Product", de: "Produkt erstellen" },
    "legacy.viewFob": { zh: "查看 FOB", en: "View FOB", de: "FOB anzeigen" },
    "legacy.viewGrossMargin": { zh: "查看毛利率", en: "View Gross Margin", de: "Bruttomarge anzeigen" },
    "legacy.viewGrossProfit": { zh: "查看毛利额", en: "View Gross Profit", de: "Bruttogewinn anzeigen" },
    "legacy.saveAccount": { zh: "生成 / 保存账号", en: "Generate / Save Account", de: "Konto erstellen / speichern" },
    "legacy.accountRequests": { zh: "账号审批申请", en: "Account Approval Requests", de: "Kontofreigabeanträge" },
    "legacy.requestNo": { zh: "申请单号", en: "Request No.", de: "Antragsnr." },
    "legacy.applicant": { zh: "申请人", en: "Applicant", de: "Antragsteller" },
    "legacy.requestedAccount": { zh: "申请账号", en: "Requested Login ID", de: "Beantragtes Anmeldekonto" },
    "legacy.reason": { zh: "申请原因", en: "Reason", de: "Begründung" },
    "legacy.requestStatus": { zh: "申请状态", en: "Request Status", de: "Antragsstatus" },
    "legacy.generatedResult": { zh: "生成结果", en: "Generated Result", de: "Erstellungsergebnis" },
    "legacy.accountList": { zh: "账号列表", en: "Account List", de: "Kontoliste" },
    "legacy.lastLogin": { zh: "最近登录", en: "Last Login", de: "Letzte Anmeldung" },
    "legacy.accountSource": { zh: "账号来源", en: "Account Source", de: "Kontoquelle" },
    "legacy.operationLogs": { zh: "操作日志", en: "Operation Logs", de: "Aktivitätsprotokolle" },
    "legacy.clearLogs": { zh: "清空全部日志", en: "Clear All Logs", de: "Alle Protokolle leeren" },
    "legacy.collapsePage": { zh: "收起页面", en: "Collapse Page", de: "Seite einklappen" },
    "legacy.logActionType": { zh: "操作类型", en: "Action Type", de: "Aktionstyp" },
    "legacy.targetKeyword": { zh: "操作对象/关键词", en: "Target / Keyword", de: "Objekt / Stichwort" },
    "legacy.operator": { zh: "操作人", en: "Operator", de: "Bearbeiter" },
    "legacy.startDate": { zh: "开始日期", en: "Start Date", de: "Startdatum" },
    "legacy.endDate": { zh: "结束日期", en: "End Date", de: "Enddatum" },
    "legacy.queryLogs": { zh: "查询日志", en: "Search Logs", de: "Protokolle suchen" },
    "legacy.changeSummary": { zh: "变更摘要", en: "Change Summary", de: "Änderungsübersicht" },
    "legacy.operationTime": { zh: "操作时间", en: "Operation Time", de: "Aktionszeit" },
    "legacy.deviceInfo": { zh: "设备信息", en: "Device Info", de: "Geräteinfo" },
    "businessName.germanCoreChainA": { zh: "德国核心连锁A", en: "German Core Chain A", de: "Deutsche Kernkette A" },
    "businessName.europeEcommerceB": { zh: "欧洲电商客户B", en: "European E-commerce Customer B", de: "Europäischer E-Commerce-Kunde B" },
    "message.addedToCart": { zh: "已加入购物车。", en: "Added to cart.", de: "In den Warenkorb gelegt." },
    "message.cartUpdated": { zh: "购物车数量已更新。", en: "Cart quantity updated.", de: "Warenkorbmenge aktualisiert." },
    "message.cartItemRemoved": { zh: "商品已移除。", en: "Item removed.", de: "Position entfernt." },
    "message.orderSubmitted": { zh: "订单 {orderNo} 已提交。", en: "Order {orderNo} submitted.", de: "Auftrag {orderNo} eingereicht." },
    "operator.customerDownload": { zh: "客户下载", en: "Customer Download", de: "Kundendownload" },
    "error.invoiceUnavailable": { zh: "发票不可用。", en: "Invoice is not available.", de: "Rechnung ist nicht verfügbar." },
    "error.customerCannotDownloadInvoice": { zh: "当前客户角色不能下载发票。", en: "Current customer role cannot download invoices.", de: "Die aktuelle Kundenrolle darf keine Rechnungen herunterladen." },
    "error.operationFailed": { zh: "操作失败。", en: "Operation failed.", de: "Vorgang fehlgeschlagen." },
  };
  Object.assign(TEMPLATES, STRUCTURED_TEMPLATES);
  Object.assign(TEMPLATES, EXTRA_TEMPLATES);
  registerStructuredPhrases(STRUCTURED_TEMPLATES);
  registerStructuredPhrases(EXTRA_TEMPLATES);

  let currentLanguage = loadLanguage();
  const textNodeBaseMap = new WeakMap();
  const attributeBaseMap = new WeakMap();

  function loadLanguage() {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return LANGUAGES[stored] ? stored : DEFAULT_LANGUAGE;
  }

  function persistLanguage() {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
  }

  function translatePhrase(text) {
    const normalized = String(text == null ? "" : text);
    const entry = PHRASES[normalized];
    if (!entry) {
      return normalized;
    }
    if (currentLanguage === "zh") {
      return entry.zh || normalized;
    }
    return entry[currentLanguage] || entry.zh || normalized;
  }

  function getKnownTranslations(text) {
    const normalized = String(text == null ? "" : text);
    const entry = PHRASES[normalized];
    if (!entry) {
      return [normalized];
    }
    return Array.from(new Set([normalized, entry.zh, entry.en, entry.de].filter(Boolean)));
  }

  function translateTextNodeValue(value) {
    const match = TEXT_WRAP_RE.exec(String(value || ""));
    if (!match) {
      return value;
    }
    const translated = translatePhrase(match[2]);
    return `${match[1]}${translated}${match[3]}`;
  }

  function resolveBaseTextNodeValue(node) {
    const currentValue = String(node.nodeValue || "");
    const storedValue = textNodeBaseMap.get(node);
    if (!storedValue) {
      textNodeBaseMap.set(node, currentValue);
      return currentValue;
    }
    const storedMatch = TEXT_WRAP_RE.exec(storedValue) || ["", "", "", ""];
    const currentMatch = TEXT_WRAP_RE.exec(currentValue) || ["", "", "", ""];
    const knownTranslations = getKnownTranslations(storedMatch[2]);
    if (!knownTranslations.includes(currentMatch[2])) {
      textNodeBaseMap.set(node, currentValue);
      return currentValue;
    }
    return storedValue;
  }

  function interpolate(template, vars) {
    return String(template || "").replace(/\{(\w+)\}/g, (_, key) => String(vars?.[key] == null ? "" : vars[key]));
  }

  function t(key, vars) {
    const entry = TEMPLATES[key];
    if (!entry) {
      return `[missing: ${key}]`;
    }
    const template = currentLanguage === "zh" ? entry.zh : entry[currentLanguage] || entry.zh || "";
    return interpolate(template, vars);
  }

  function translateKey(key, vars) {
    return t(key, vars);
  }

  function updateLanguageButtons() {
    document.querySelectorAll("[data-language]").forEach((button) => {
      const isActive = button instanceof HTMLElement && button.dataset.language === currentLanguage;
      button.classList.toggle("is-active", Boolean(isActive));
      if (button instanceof HTMLButtonElement) {
        button.disabled = Boolean(isActive);
      }
    });
  }

  function translateTree(root = document.body) {
    if (!root) {
      return;
    }
    root.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.getAttribute("data-i18n");
      if (key) {
        element.textContent = translateKey(key);
      }
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      const key = element.getAttribute("data-i18n-placeholder");
      if (key) {
        element.setAttribute("placeholder", translateKey(key));
      }
    });
    root.querySelectorAll("[data-i18n-title]").forEach((element) => {
      const key = element.getAttribute("data-i18n-title");
      if (key) {
        element.setAttribute("title", translateKey(key));
      }
    });
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || ["SCRIPT", "STYLE"].includes(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return String(node.nodeValue || "").trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    const textNodes = [];
    let currentNode = walker.nextNode();
    while (currentNode) {
      textNodes.push(currentNode);
      currentNode = walker.nextNode();
    }
    textNodes.forEach((node) => {
      const baseText = resolveBaseTextNodeValue(node);
      const translated = translateTextNodeValue(baseText);
      if (translated !== node.nodeValue) {
        node.nodeValue = translated;
      }
    });
    root.querySelectorAll("*").forEach((element) => {
      let attributeMap = attributeBaseMap.get(element);
      if (!attributeMap) {
        attributeMap = {};
        attributeBaseMap.set(element, attributeMap);
      }
      TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
        if (!element.hasAttribute(attribute)) {
          return;
        }
        const original = attributeMap[attribute] || element.getAttribute(attribute) || "";
        attributeMap[attribute] = original;
        const translated = translatePhrase(original);
        if (translated !== element.getAttribute(attribute)) {
          element.setAttribute(attribute, translated);
        }
      });
    });
  }

  function refresh(root = document.body) {
    document.documentElement.lang = LANGUAGES[currentLanguage].htmlLang;
    document.title = translatePhrase("客户报价管理系统");
    updateLanguageButtons();
    translateTree(root);
  }

  function setLanguage(language) {
    if (!LANGUAGES[language] || language === currentLanguage) {
      return;
    }
    currentLanguage = language;
    persistLanguage();
    refresh();
    window.dispatchEvent(
      new CustomEvent("customer-quote-language-change", {
        detail: { language },
      })
    );
  }

  function bindEvents() {
    document.querySelectorAll("[data-language]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button instanceof HTMLElement) {
          setLanguage(button.dataset.language || DEFAULT_LANGUAGE);
        }
      });
    });
  }

  function getLanguage() {
    return currentLanguage;
  }

  function getNumberLocale() {
    return LANGUAGES[currentLanguage].numberLocale;
  }

  function getDateLocale() {
    return LANGUAGES[currentLanguage].dateLocale;
  }

  bindEvents();
  refresh();

  window.customerQuoteI18n = {
    getLanguage,
    setLanguage,
    refresh,
    tr: translatePhrase,
    t,
    key: translateKey,
    getNumberLocale,
    getDateLocale,
  };
})();
