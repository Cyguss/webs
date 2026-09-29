import {
  mysqlTable,
  varchar,
  text,
  int,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/mysql-core";

// ─── Better Auth Tables ───────────────────────────────────────────────────────

export const user = mysqlTable("user", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorMethod: varchar("two_factor_method", { length: 20 }).default("email"),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  discordId: varchar("discord_id", { length: 64 }),
  discordUsername: varchar("discord_username", { length: 100 }),
  discordRoles: text("discord_roles"),
  adminPermissionsActive: boolean("admin_permissions_active").notNull().default(true),
  adminPermissions: text("admin_permissions"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = mysqlTable("session", {
  id: varchar("id", { length: 36 }).primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = mysqlTable("account", {
  id: varchar("id", { length: 36 }).primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = mysqlTable("verification", {
  id: varchar("id", { length: 36 }).primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const twoFactor = mysqlTable("two_factor", {
  id: varchar("id", { length: 36 }).primaryKey(),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  verified: boolean("verified").default(false),
  failedVerificationCount: int("failed_verification_count").default(0),
  lockedUntil: timestamp("locked_until"),
});

// Backward-compatible aliases
export const users = user;
export const sessions = session;
export const accounts = account;
export const verifications = verification;

// ─── Platform Core: Storefronts & Catalog ────────────────────────────────────

export const shops = mysqlTable(
  "shops",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    logoUrl: text("logo_url"),
    bannerUrl: text("banner_url"),
    backgroundColor: varchar("background_color", { length: 20 }).default("#0f0f0f"),
    accentColor: varchar("accent_color", { length: 20 }).default("#6366f1"),
    fontStyle: varchar("font_style", { length: 50 }).default("inter"),
    customDomain: varchar("custom_domain", { length: 255 }),
    twitterUrl: text("twitter_url"),
    discordUrl: text("discord_url"),
    youtubeUrl: text("youtube_url"),
    trustpilotUrl: text("trustpilot_url"),
    telegramUrl: text("telegram_url"),
    discordWebhookUrl: text("discord_webhook_url"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    customFontUrl: text("custom_font_url"),
    textColor: varchar("text_color", { length: 20 }),
    mutedTextColor: varchar("muted_text_color", { length: 20 }),
    cardColor: varchar("card_color", { length: 20 }),
    borderColor: varchar("border_color", { length: 20 }),
    themeMode: varchar("theme_mode", { length: 20 }).default("dark"),
    supportEmail: varchar("support_email", { length: 255 }),
    contactInfo: text("contact_info"),
    termsOfService: text("terms_of_service"),
    // Deprecated raw injection fields (eliminated for security)
    customCss: text("custom_css"),
    customHtml: text("custom_html"),
    isActive: boolean("is_active").notNull().default(true),
    // Approval system: stores are private until admin accepts them
    isAccepted: boolean("is_accepted").notNull().default(false),
    categories: text("categories"), // JSON array of custom categories: [{ id, name, icon, description }]
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("shops_user_id_idx").on(table.userId),
    index("shops_slug_idx").on(table.slug),
  ]
);

// ─── Shop Approval Requests ───────────────────────────────────────────────────

export const shopApprovalRequests = mysqlTable(
  "shop_approval_requests",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    shopId: varchar("shop_id", { length: 36 })
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Status: pending | approved | rejected
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    adminNote: text("admin_note"),
    processedBy: varchar("processed_by", { length: 100 }),
    // Track webhook sends for spam protection (1 per 24h per shop)
    webhookSentAt: timestamp("webhook_sent_at"),
    requestedAt: timestamp("requested_at").notNull().defaultNow(),
    processedAt: timestamp("processed_at"),
  },
  (table) => [
    index("shop_reqs_shop_id_idx").on(table.shopId),
    index("shop_reqs_user_id_idx").on(table.userId),
    index("shop_reqs_status_idx").on(table.status),
  ]
);

export const products = mysqlTable(
  "products",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    shopId: varchar("shop_id", { length: 36 })
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }), // category slug or name (e.g. "softwares", "scripts", or custom)
    type: varchar("type", { length: 50 }).notNull(), // "key" | "service" | "file"
    price: varchar("price", { length: 32 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("USD"),
    stockLimit: int("stock_limit"),
    isUnlimitedStock: boolean("is_unlimited_stock").notNull().default(false),
    thumbnailUrl: text("thumbnail_url"),
    images: text("images"),
    youtubeUrl: text("youtube_url"), // Showcase video URL (YouTube, Streamable, etc.)
    isActive: boolean("is_active").notNull().default(true),
    receiptNote: text("receipt_note"),
    duration: varchar("duration", { length: 50 }).notNull().default("lifetime"),
    durationDays: int("duration_days").notNull().default(0),
    customDurationLabel: varchar("custom_duration_label", { length: 100 }),
    variants: text("variants"), // JSON array of variants: [{ id, label, duration, durationDays, price }]
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("products_shop_id_idx").on(table.shopId),
    index("products_is_active_idx").on(table.isActive),
    index("products_category_idx").on(table.category),
  ]
);

export const inventoryKeys = mysqlTable(
  "inventory_keys",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    productId: varchar("product_id", { length: 36 })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: varchar("variant_id", { length: 50 }),
    keyValue: text("key_value").notNull(),
    duration: varchar("duration", { length: 50 }).default("lifetime"),
    durationDays: int("duration_days").default(0),
    customDurationLabel: varchar("custom_duration_label", { length: 100 }),
    isUsed: boolean("is_used").notNull().default(false),
    usedAt: timestamp("used_at"),
    orderId: varchar("order_id", { length: 36 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("inv_keys_prod_used_idx").on(table.productId, table.isUsed),
    index("inv_keys_order_idx").on(table.orderId),
  ]
);

export const coupons = mysqlTable(
  "coupons",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    shopId: varchar("shop_id", { length: 36 })
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 100 }).notNull(),
    discountPercent: int("discount_percent"),
    discountAmount: varchar("discount_amount", { length: 32 }),
    maxUses: int("max_uses"),
    usedCount: int("used_count").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("coupons_shop_code_idx").on(table.shopId, table.code),
  ]
);

export const reviews = mysqlTable(
  "reviews",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    productId: varchar("product_id", { length: 36 })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    orderId: varchar("order_id", { length: 36 }),
    buyerEmail: varchar("buyer_email", { length: 255 }).notNull(),
    rating: int("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("reviews_product_id_idx").on(table.productId),
    index("reviews_order_id_idx").on(table.orderId),
  ]
);

// ─── Orders & Delivery ───────────────────────────────────────────────────────

export const orders = mysqlTable(
  "orders",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    shopId: varchar("shop_id", { length: 36 })
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    productId: varchar("product_id", { length: 36 })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    couponId: varchar("coupon_id", { length: 36 }),
    buyerEmail: varchar("buyer_email", { length: 255 }).notNull(),
    quantity: int("quantity").notNull().default(1),
    unitPrice: varchar("unit_price", { length: 32 }).notNull(),
    totalAmount: varchar("total_amount", { length: 32 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("USD"),
    paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
    paymentStatus: varchar("payment_status", { length: 50 }).notNull().default("pending"),
    stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
    cryptoPaymentId: varchar("crypto_payment_id", { length: 255 }),
    accessSecretHash: varchar("access_secret_hash", { length: 64 }),
    fulfilledAt: timestamp("fulfilled_at"),
    variantId: varchar("variant_id", { length: 50 }),
    keyDuration: varchar("key_duration", { length: 50 }),
    keyDurationDays: int("key_duration_days"),
    keyExpiresAt: timestamp("key_expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("orders_shop_id_idx").on(table.shopId),
    index("orders_product_id_idx").on(table.productId),
    index("orders_created_at_idx").on(table.createdAt),
    index("orders_payment_status_idx").on(table.paymentStatus),
    index("orders_secret_hash_idx").on(table.accessSecretHash),
  ]
);

export const orderDeliveries = mysqlTable(
  "order_deliveries",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    orderId: varchar("order_id", { length: 36 })
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    deliveryType: varchar("delivery_type", { length: 50 }).notNull(),
    deliveryValue: text("delivery_value"),
    deliveredAt: timestamp("delivered_at").notNull().defaultNow(),
  },
  (table) => [
    index("order_deliv_order_id_idx").on(table.orderId),
  ]
);

// ─── Financials & Payouts ────────────────────────────────────────────────────

export const sellerBalances = mysqlTable(
  "seller_balances",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    availableBalance: varchar("available_balance", { length: 32 }).notNull().default("0"),
    pendingBalance: varchar("pending_balance", { length: 32 }).notNull().default("0"),
    reserveBalance: varchar("reserve_balance", { length: 32 }).notNull().default("0"),
    totalEarned: varchar("total_earned", { length: 32 }).notNull().default("0"),
    totalWithdrawn: varchar("total_withdrawn", { length: 32 }).notNull().default("0"),
    currency: varchar("currency", { length: 10 }).notNull().default("USD"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("seller_bal_user_id_idx").on(table.userId),
  ]
);

export const balanceTransactions = mysqlTable(
  "balance_transactions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    orderId: varchar("order_id", { length: 36 }),
    type: varchar("type", { length: 50 }).notNull(),
    amount: varchar("amount", { length: 32 }).notNull(),
    feeAmount: varchar("fee_amount", { length: 32 }).notNull().default("0"),
    netAmount: varchar("net_amount", { length: 32 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("USD"),
    provider: varchar("provider", { length: 50 }),
    providerPaymentId: varchar("provider_payment_id", { length: 255 }),
    externalEventId: varchar("external_event_id", { length: 255 }),
    description: text("description"),
    isReleased: boolean("is_released").notNull().default(false),
    releasedAt: timestamp("released_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("bal_tx_user_id_idx").on(table.userId),
    index("bal_tx_created_at_idx").on(table.createdAt),
    index("bal_tx_rel_idx").on(table.userId, table.isReleased, table.type),
    index("bal_tx_order_id_idx").on(table.orderId),
    index("bal_tx_ext_event_idx").on(table.provider, table.externalEventId),
  ]
);

export const processedWebhookEvents = mysqlTable(
  "processed_webhook_events",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    provider: varchar("provider", { length: 50 }).notNull(),
    eventId: varchar("event_id", { length: 255 }).notNull(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    orderId: varchar("order_id", { length: 36 }),
    merchantId: varchar("merchant_id", { length: 36 }),
    amount: varchar("amount", { length: 32 }),
    currency: varchar("currency", { length: 10 }).default("USD"),
    status: varchar("status", { length: 50 }).notNull().default("processed"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("proc_wh_prov_ev_idx").on(table.provider, table.eventId),
    index("proc_wh_order_idx").on(table.orderId),
  ]
);

export const payoutRequests = mysqlTable(
  "payout_requests",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    amountRequested: varchar("amount_requested", { length: 32 }).notNull(),
    feeAmount: varchar("fee_amount", { length: 32 }).notNull(),
    amountSent: varchar("amount_sent", { length: 32 }),
    method: varchar("method", { length: 50 }).notNull(),
    destinationAddress: text("destination_address").notNull(),
    cryptoCurrency: varchar("crypto_currency", { length: 20 }),
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    adminNote: text("admin_note"),
    processedAt: timestamp("processed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("payout_req_user_id_idx").on(table.userId),
    index("payout_req_status_idx").on(table.status),
  ]
);

// ─── Customer Support ────────────────────────────────────────────────────────

export const tickets = mysqlTable(
  "tickets",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    shopId: varchar("shop_id", { length: 36 })
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    orderId: varchar("order_id", { length: 36 }),
    buyerEmail: varchar("buyer_email", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    status: varchar("status", { length: 50 }).notNull().default("open"),
    priority: varchar("priority", { length: 50 }).notNull().default("normal"),
    accessSecretHash: varchar("access_secret_hash", { length: 64 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("tickets_shop_id_idx").on(table.shopId),
    index("tickets_status_idx").on(table.status),
    index("tickets_secret_hash_idx").on(table.accessSecretHash),
  ]
);

export const ticketMessages = mysqlTable(
  "ticket_messages",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    ticketId: varchar("ticket_id", { length: 36 })
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    senderType: varchar("sender_type", { length: 20 }).notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("ticket_msgs_ticket_id_idx").on(table.ticketId),
  ]
);

// ─── Platform Settings (Super-Admin config, kill-switch, bot config) ───────────

export const platformSettings = mysqlTable("platform_settings", {
  settingKey: varchar("setting_key", { length: 100 }).primaryKey(),
  settingValue: text("setting_value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── User Notifications & Inbox ─────────────────────────────────────────────

export const notifications = mysqlTable(
  "notifications",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    shopId: varchar("shop_id", { length: 36 }),
    type: varchar("type", { length: 50 }).notNull().default("general"), // 'store_approved' | 'store_rejected' | 'order_received' | 'system'
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    reason: text("reason"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("notif_user_read_idx").on(table.userId, table.isRead),
  ]
);

// ─── Developer & Webhooks Ecosystem ──────────────────────────────────────────

export const apiKeys = mysqlTable(
  "api_keys",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    shopId: varchar("shop_id", { length: 36 })
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    keyPrefix: varchar("key_prefix", { length: 16 }).notNull(),
    keyHash: varchar("key_hash", { length: 64 }).notNull().unique(),
    permissions: text("permissions").notNull(), // JSON array: ["orders:read", "licenses:verify", "products:read"]
    isActive: boolean("is_active").notNull().default(true),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_api_keys_shop_id").on(table.shopId),
    index("idx_api_keys_key_hash").on(table.keyHash),
  ]
);

export const webhookEndpoints = mysqlTable(
  "webhook_endpoints",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    shopId: varchar("shop_id", { length: 36 })
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    secret: varchar("secret", { length: 64 }).notNull(),
    events: text("events").notNull(), // JSON array: ["order.completed", "order.refunded", "product.created"]
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_webhook_endpoints_shop_id").on(table.shopId),
  ]
);

export const webhookLogs = mysqlTable(
  "webhook_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    webhookEndpointId: varchar("webhook_endpoint_id", { length: 36 })
      .notNull()
      .references(() => webhookEndpoints.id, { onDelete: "cascade" }),
    shopId: varchar("shop_id", { length: 36 }).notNull(),
    event: varchar("event", { length: 50 }).notNull(),
    payload: text("payload").notNull(),
    responseStatus: int("response_status"),
    responseBody: text("response_body"),
    durationMs: int("duration_ms"),
    success: boolean("success").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_webhook_logs_endpoint").on(table.webhookEndpointId),
    index("idx_webhook_logs_shop").on(table.shopId),
  ]
);


