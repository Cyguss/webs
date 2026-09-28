/**
 * Discord Bot & Logging Webhook Platform Defaults
 * Safe for use in Server & Client Components
 */

export const DEFAULT_BOT_CONFIG: Record<string, string> = {
  bot_guild_id: "",
  bot_admin_role_id: "",
  bot_staff_role_id: "",
  bot_client_id: "",
  bot_token: "",
  webhook_approval_log: "",
  webhook_order_log: "",
  webhook_payout_log: "",
  webhook_activity_log: "",
  support_email: "support@krypt.market",
};

export const BOT_CONFIG_KEYS = Object.keys(DEFAULT_BOT_CONFIG);
