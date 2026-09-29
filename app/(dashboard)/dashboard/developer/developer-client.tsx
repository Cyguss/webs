"use client";

import { useState, useEffect } from "react";
import {
  KeyRound,
  Webhook,
  Activity,
  Code2,
  Plus,
  Trash2,
  Copy,
  Check,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Terminal,
  ExternalLink,
  ChevronRight,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/components/toast-context";

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

interface WebhookItem {
  id: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

interface WebhookLogItem {
  id: string;
  event: string;
  responseStatus: number | null;
  responseBody: string | null;
  durationMs: number | null;
  success: boolean;
  createdAt: string;
}

export function DeveloperClient({ shop }: { shop: any }) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"keys" | "webhooks" | "logs" | "docs">("keys");

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [newKeyModalOpen, setNewKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKeyData, setCreatedKeyData] = useState<{ fullKey: string; keyPrefix: string; name: string } | null>(null);
  const [creatingKey, setCreatingKey] = useState(false);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLogItem[]>([]);
  const [webhooksLoading, setWebhooksLoading] = useState(true);
  const [newWebhookModalOpen, setNewWebhookModalOpen] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "order.completed",
    "stock.low",
    "product.created",
  ]);
  const [creatingWebhook, setCreatingWebhook] = useState(false);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});

  // Docs state
  const [docsLang, setDocsLang] = useState<"curl" | "node" | "python">("node");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const fetchApiKeys = async () => {
    try {
      const res = await fetch(`/api/developer/api-keys?shopId=${encodeURIComponent(shop.id)}`);
      const data = await res.json();
      if (res.ok) {
        setApiKeys(data.keys || []);
      }
    } catch (err) {
      console.error("Failed to load API keys:", err);
    } finally {
      setKeysLoading(false);
    }
  };

  const fetchWebhooks = async () => {
    try {
      const res = await fetch(`/api/developer/webhooks?shopId=${encodeURIComponent(shop.id)}`);
      const data = await res.json();
      if (res.ok) {
        setWebhooks(data.endpoints || []);
        setWebhookLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to load webhooks:", err);
    } finally {
      setWebhooksLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
    fetchWebhooks();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "webhooks") {
        setActiveTab("webhooks");
      }
      if (params.get("createWebhook") === "true") {
        setActiveTab("webhooks");
        setNewWebhookModalOpen(true);
      }
    }
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success("Copied", `${label} copied to clipboard`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setCreatingKey(true);
    try {
      const res = await fetch("/api/developer/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim(), shopId: shop.id }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create API key");

      setCreatedKeyData(data.key);
      setNewKeyName("");
      toast.success("API Key Created", "Save your secret key now. It will not be shown again!");
      fetchApiKeys();
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to create API key");
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? Applications using it will lose access immediately.")) {
      return;
    }

    try {
      const res = await fetch("/api/developer/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId, shopId: shop.id }),
      });

      if (!res.ok) throw new Error("Failed to revoke key");

      toast.success("Key Revoked", "API key was permanently deactivated.");
      setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to revoke key");
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl.trim()) return;

    if (selectedEvents.length === 0) {
      toast.error("Events Required", "Please select at least one event type to receive.");
      return;
    }

    setCreatingWebhook(true);
    try {
      const res = await fetch("/api/developer/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newWebhookUrl.trim(),
          events: selectedEvents,
          shopId: shop.id,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create webhook");

      setNewWebhookModalOpen(false);
      setNewWebhookUrl("");
      setSelectedEvents(["order.completed", "stock.low", "product.created"]);
      toast.success("Webhook Registered", "Your webhook endpoint is now receiving configured live events.");
      fetchWebhooks();
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to create webhook");
    } finally {
      setCreatingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (endpointId: string) => {
    if (!confirm("Are you sure you want to delete this webhook endpoint?")) return;

    try {
      const res = await fetch("/api/developer/webhooks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpointId, shopId: shop.id }),
      });

      if (!res.ok) throw new Error("Failed to delete webhook");

      toast.success("Webhook Removed", "Endpoint successfully deleted.");
      setWebhooks((prev) => prev.filter((w) => w.id !== endpointId));
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to delete webhook");
    }
  };

  const handleTestWebhook = async (endpointId: string) => {
    setTestingWebhookId(endpointId);
    try {
      const res = await fetch("/api/developer/webhooks/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpointId, shopId: shop.id }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Ping Sent", `Received HTTP ${data.status} response in ${data.durationMs}ms`);
      } else {
        toast.error("Ping Failed", `Server returned HTTP ${data.status || 0}: ${data.responseBody || "Connection error"}`);
      }
      fetchWebhooks();
    } catch (err: any) {
      toast.error("Test Error", err.message || "Failed to send test ping");
    } finally {
      setTestingWebhookId(null);
    }
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 999,
                background: "rgba(99, 102, 241, 0.12)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                color: "#818cf8",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              <Terminal size={13} /> Developer Ecosystem
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "var(--color-foreground)", letterSpacing: "-0.02em" }}>
            Developer & API Center
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--color-muted-foreground)" }}>
            Connect custom bots, Discord servers, license verification systems, and real-time order webhooks.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => {
              setCreatedKeyData(null);
              setNewKeyModalOpen(true);
            }}
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600 }}
          >
            <Plus size={16} /> Generate API Key
          </button>
          <button
            onClick={() => setNewWebhookModalOpen(true)}
            className="btn btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600 }}
          >
            <Webhook size={16} /> Add Webhook
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          borderBottom: "1px solid var(--color-border)",
          marginBottom: 24,
        }}
      >
        {[
          { id: "keys", label: "API Keys", icon: KeyRound, count: apiKeys.length },
          { id: "webhooks", label: "Webhooks", icon: Webhook, count: webhooks.length },
          { id: "logs", label: "Delivery Logs", icon: Activity, count: webhookLogs.length },
          { id: "docs", label: "API Quickstart", icon: Code2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 18px",
                background: "transparent",
                border: "none",
                borderBottom: isActive ? "2px solid var(--color-primary)" : "2px solid transparent",
                color: isActive ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                fontWeight: isActive ? 700 : 500,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.15s ease",
                marginBottom: -1,
              }}
            >
              <Icon size={16} color={isActive ? "var(--color-primary)" : undefined} />
              {tab.label}
              {typeof tab.count === "number" && (
                <span
                  style={{
                    padding: "2px 7px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    background: isActive ? "rgba(99, 102, 241, 0.18)" : "rgba(255,255,255,0.06)",
                    color: isActive ? "var(--color-primary)" : "var(--color-muted-foreground)",
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: API KEYS */}
      {activeTab === "keys" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
            {keysLoading ? (
              <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--color-muted-foreground)" }}>
                Loading API keys...
              </div>
            ) : apiKeys.length === 0 ? (
              <div
                className="card"
                style={{
                  padding: 48,
                  textAlign: "center",
                  border: "1px dashed var(--color-border)",
                  borderRadius: 14,
                  background: "rgba(255, 255, 255, 0.01)",
                }}
              >
                <KeyRound size={36} color="#6366f1" style={{ margin: "0 auto 14px", opacity: 0.8 }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px", color: "var(--color-foreground)" }}>
                  No API Keys Generated Yet
                </h3>
                <p style={{ fontSize: 14, color: "var(--color-muted-foreground)", maxWidth: 450, margin: "0 auto 20px" }}>
                  Create an API key to securely query order details, verify customer licenses from Discord bots, and automate your store.
                </p>
                <button
                  onClick={() => setNewKeyModalOpen(true)}
                  className="btn btn-primary"
                  style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600 }}
                >
                  <Plus size={16} /> Generate First API Key
                </button>
              </div>
            ) : (
              apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "18px 22px",
                    borderRadius: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        background: "rgba(99, 102, 241, 0.12)",
                        border: "1px solid rgba(99, 102, 241, 0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#818cf8",
                      }}
                    >
                      <KeyRound size={20} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
                          {key.name}
                        </h4>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: "rgba(34, 197, 94, 0.12)",
                            color: "#22c55e",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          ACTIVE
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4 }}>
                        <code
                          style={{
                            fontFamily: "monospace",
                            fontSize: 12,
                            color: "var(--color-muted-foreground)",
                            background: "rgba(0,0,0,0.3)",
                            padding: "2px 6px",
                            borderRadius: 4,
                          }}
                        >
                          {key.keyPrefix}••••••••••••••••
                        </code>
                        <span style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
                          Created: {new Date(key.createdAt).toLocaleDateString()}
                        </span>
                        {key.lastUsedAt && (
                          <span style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
                            Last used: {new Date(key.lastUsedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      onClick={() => handleRevokeApiKey(key.id)}
                      className="btn btn-secondary"
                      style={{
                        color: "#ef4444",
                        border: "1px solid rgba(239, 68, 68, 0.25)",
                        background: "rgba(239, 68, 68, 0.06)",
                        padding: "8px 14px",
                        fontSize: 12,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Trash2 size={14} /> Revoke Key
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WEBHOOKS */}
      {activeTab === "webhooks" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
            {webhooksLoading ? (
              <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--color-muted-foreground)" }}>
                Loading webhooks...
              </div>
            ) : webhooks.length === 0 ? (
              <div
                className="card"
                style={{
                  padding: 48,
                  textAlign: "center",
                  border: "1px dashed var(--color-border)",
                  borderRadius: 14,
                  background: "rgba(255, 255, 255, 0.01)",
                }}
              >
                <Webhook size={36} color="#6366f1" style={{ margin: "0 auto 14px", opacity: 0.8 }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px", color: "var(--color-foreground)" }}>
                  No Outbound Webhooks Registered
                </h3>
                <p style={{ fontSize: 14, color: "var(--color-muted-foreground)", maxWidth: 450, margin: "0 auto 20px" }}>
                  Webhooks send real-time HTTP POST notifications with HMAC-SHA256 signatures to your server whenever orders complete.
                </p>
                <button
                  onClick={() => setNewWebhookModalOpen(true)}
                  className="btn btn-primary"
                  style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600 }}
                >
                  <Plus size={16} /> Add Webhook Endpoint
                </button>
              </div>
            ) : (
              webhooks.map((wh) => {
                const isSecretRevealed = !!revealedSecrets[wh.id];
                return (
                  <div
                    key={wh.id}
                    className="card"
                    style={{
                      padding: "20px 24px",
                      borderRadius: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: "rgba(99, 102, 241, 0.12)",
                            border: "1px solid rgba(99, 102, 241, 0.25)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#818cf8",
                          }}
                        >
                          <Webhook size={20} />
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <code
                              style={{
                                fontFamily: "monospace",
                                fontSize: 14,
                                fontWeight: 700,
                                color: "var(--color-foreground)",
                              }}
                            >
                              {wh.url}
                            </code>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: 6,
                                background: "rgba(34, 197, 94, 0.12)",
                                color: "#22c55e",
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              LISTENING
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                            {wh.events.map((ev) => (
                              <span
                                key={ev}
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  background: "rgba(255, 255, 255, 0.05)",
                                  fontSize: 11,
                                  color: "#818cf8",
                                  fontFamily: "monospace",
                                }}
                              >
                                {ev}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          onClick={() => handleTestWebhook(wh.id)}
                          disabled={testingWebhookId === wh.id}
                          className="btn btn-secondary"
                          style={{
                            padding: "7px 14px",
                            fontSize: 12,
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {testingWebhookId === wh.id ? (
                            <RefreshCw size={13} className="spin" />
                          ) : (
                            <Send size={13} />
                          )}
                          Send Test Ping
                        </button>
                        <button
                          onClick={() => handleDeleteWebhook(wh.id)}
                          className="btn btn-secondary"
                          style={{
                            color: "#ef4444",
                            border: "1px solid rgba(239, 68, 68, 0.25)",
                            background: "rgba(239, 68, 68, 0.06)",
                            padding: "7px 12px",
                            fontSize: 12,
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Secret Key Bar */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 14px",
                        borderRadius: 8,
                        background: "rgba(0, 0, 0, 0.35)",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Shield size={14} color="#818cf8" />
                        <span style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
                          HMAC Signature Secret:
                        </span>
                        <code
                          style={{
                            fontFamily: "monospace",
                            fontSize: 12,
                            color: isSecretRevealed ? "#38bdf8" : "var(--color-muted-foreground)",
                          }}
                        >
                          {isSecretRevealed ? wh.secret : `${wh.secret.slice(0, 10)}••••••••••••••••••••••••`}
                        </code>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button
                          onClick={() =>
                            setRevealedSecrets((prev) => ({ ...prev, [wh.id]: !prev[wh.id] }))
                          }
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--color-muted-foreground)",
                            cursor: "pointer",
                            padding: 4,
                          }}
                        >
                          {isSecretRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => handleCopy(wh.secret, "Webhook Secret")}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--color-muted-foreground)",
                            cursor: "pointer",
                            padding: 4,
                          }}
                        >
                          {copiedText === wh.secret ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LOGS */}
      {activeTab === "logs" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
                Recent Webhook Deliveries (Last 20)
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--color-muted-foreground)" }}>
                Audited dispatch logs, HTTP status codes, and execution latencies.
              </p>
            </div>
            <button
              onClick={fetchWebhooks}
              className="btn btn-secondary"
              style={{ padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {webhookLogs.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--color-muted-foreground)" }}>
              No webhook deliveries recorded yet. Trigger a test ping or complete a store purchase.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--color-border)" }}>
                    <th style={{ padding: "12px 18px", color: "var(--color-muted-foreground)", fontWeight: 600 }}>Status</th>
                    <th style={{ padding: "12px 18px", color: "var(--color-muted-foreground)", fontWeight: 600 }}>Event</th>
                    <th style={{ padding: "12px 18px", color: "var(--color-muted-foreground)", fontWeight: 600 }}>Duration</th>
                    <th style={{ padding: "12px 18px", color: "var(--color-muted-foreground)", fontWeight: 600 }}>Response Snippet</th>
                    <th style={{ padding: "12px 18px", color: "var(--color-muted-foreground)", fontWeight: 600 }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {webhookLogs.map((log) => {
                    const isSuccess = log.success;
                    return (
                      <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "14px 18px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "2px 8px",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 700,
                              background: isSuccess ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)",
                              color: isSuccess ? "#22c55e" : "#ef4444",
                            }}
                          >
                            {isSuccess ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                            {log.responseStatus || "ERR"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <code style={{ fontFamily: "monospace", color: "#818cf8", fontSize: 12 }}>
                            {log.event}
                          </code>
                        </td>
                        <td style={{ padding: "14px 18px", color: "var(--color-muted-foreground)" }}>
                          {log.durationMs !== null ? `${log.durationMs}ms` : "-"}
                        </td>
                        <td style={{ padding: "14px 18px", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--color-muted-foreground)" }}>
                            {log.responseBody ? log.responseBody.slice(0, 60) : "(empty response)"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 18px", color: "var(--color-muted-foreground)", fontSize: 12 }}>
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DOCS */}
      {activeTab === "docs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
                  REST API & Verification Quickstart
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>
                  Base URL: <code style={{ color: "#c4b5fd" }}>{typeof window !== "undefined" ? window.location.origin : "https://krypt.market"}/api/v1</code>
                </p>
              </div>

              <div style={{ display: "flex", background: "rgba(0,0,0,0.3)", padding: 3, borderRadius: 8, border: "1px solid var(--color-border)" }}>
                {(["curl", "node", "python"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setDocsLang(lang)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 6,
                      border: "none",
                      background: docsLang === lang ? "var(--color-primary)" : "transparent",
                      color: docsLang === lang ? "#fff" : "var(--color-muted-foreground)",
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: "pointer",
                      textTransform: "uppercase",
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Box */}
            <div
              style={{
                background: "#08090d",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 16px",
                  background: "rgba(255,255,255,0.03)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-muted-foreground)" }}>
                  Verify License Key (e.g. In Discord Bot or Desktop Application)
                </span>
                <button
                  onClick={() =>
                    handleCopy(
                      docsLang === "curl"
                        ? `curl -X POST "${typeof window !== "undefined" ? window.location.origin : "https://krypt.market"}/api/v1/licenses/verify" \\\n  -H "Authorization: Bearer kpt_live_YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"key": "CYBER-KEY-1111"}'`
                        : docsLang === "node"
                        ? `const res = await fetch("${typeof window !== "undefined" ? window.location.origin : "https://krypt.market"}/api/v1/licenses/verify", {\n  method: "POST",\n  headers: {\n    "Authorization": "Bearer kpt_live_YOUR_KEY",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify({ key: "CYBER-KEY-1111" })\n});\nconst data = await res.json();\nconsole.log(data.valid);`
                        : `import requests\n\nres = requests.post(\n  "${typeof window !== "undefined" ? window.location.origin : "https://krypt.market"}/api/v1/licenses/verify",\n  headers={"Authorization": "Bearer kpt_live_YOUR_KEY"},\n  json={"key": "CYBER-KEY-1111"}\n)\nprint(res.json())`,
                      "Code Snippet"
                    )
                  }
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--color-muted-foreground)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  <Copy size={13} /> Copy Code
                </button>
              </div>

              <pre
                style={{
                  margin: 0,
                  padding: "16px 20px",
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "#e2e8f0",
                  fontFamily: "monospace",
                  overflowX: "auto",
                }}
              >
                {docsLang === "curl" && (
                  `curl -X POST "${typeof window !== "undefined" ? window.location.origin : "https://krypt.market"}/api/v1/licenses/verify" \\
  -H "Authorization: Bearer kpt_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"key": "CYBER-KEY-1111"}'`
                )}

                {docsLang === "node" && (
                  `// Node.js 18+ (Fetch API)
const response = await fetch("${typeof window !== "undefined" ? window.location.origin : "https://krypt.market"}/api/v1/licenses/verify", {
  method: "POST",
  headers: {
    "Authorization": "Bearer kpt_live_YOUR_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ key: "CYBER-KEY-1111" })
});

const result = await response.json();
if (result.valid) {
  console.log("Customer has valid license for:", result.product.title);
} else {
  console.log("Invalid key reason:", result.reason);
}`
                )}

                {docsLang === "python" && (
                  `# Python 3
import requests

response = requests.post(
    "${typeof window !== "undefined" ? window.location.origin : "https://krypt.market"}/api/v1/licenses/verify",
    headers={"Authorization": "Bearer kpt_live_YOUR_KEY"},
    json={"key": "CYBER-KEY-1111"}
)

data = response.json()
if data.get("valid"):
    print(f"Valid license for: {data['product']['title']}")`
                )}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GENERATE API KEY */}
      {newKeyModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 520,
              width: "100%",
              padding: 28,
              borderRadius: 16,
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            {createdKeyData ? (
              <div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "rgba(34, 197, 94, 0.15)",
                    color: "#22c55e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <CheckCircle2 size={24} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px", color: "var(--color-foreground)" }}>
                  API Key Created Successfully
                </h3>
                <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", margin: "0 0 16px", lineHeight: 1.5 }}>
                  Please copy and safely store your secret key now. For your security, this key will <strong style={{ color: "#ef4444" }}>never be displayed again</strong>.
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    background: "#08090d",
                    border: "1px solid rgba(99, 102, 241, 0.4)",
                    borderRadius: 8,
                    marginBottom: 20,
                  }}
                >
                  <code style={{ fontFamily: "monospace", fontSize: 13, color: "#38bdf8", wordBreak: "break-all" }}>
                    {createdKeyData.fullKey}
                  </code>
                  <button
                    onClick={() => handleCopy(createdKeyData.fullKey, "API Key")}
                    className="btn btn-secondary"
                    style={{ padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
                  >
                    {copiedText === createdKeyData.fullKey ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                    Copy
                  </button>
                </div>

                <button
                  onClick={() => {
                    setNewKeyModalOpen(false);
                    setCreatedKeyData(null);
                  }}
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "12px 0", fontWeight: 700 }}
                >
                  I Have Saved My Secret Key
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateApiKey}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "rgba(99, 102, 241, 0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#818cf8",
                    }}
                  >
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
                      Create Merchant API Key
                    </h3>
                    <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", margin: "2px 0 0" }}>
                      Generate high-entropy credentials for your bot or backend
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label className="label" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    Key Description / Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Discord Bot, License Server, Desktop Loader"
                    className="input"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    style={{ width: "100%", fontSize: 14 }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setNewKeyModalOpen(false)}
                    className="btn btn-secondary"
                    style={{ padding: "10px 18px", fontSize: 13 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingKey}
                    className="btn btn-primary"
                    style={{ padding: "10px 20px", fontSize: 13, fontWeight: 700 }}
                  >
                    {creatingKey ? "Generating..." : "Generate Key"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD WEBHOOK */}
      {newWebhookModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.78)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 580,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 28,
              borderRadius: 16,
              boxShadow: "0 25px 60px rgba(0,0,0,0.7)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <form onSubmit={handleCreateWebhook}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "rgba(99, 102, 241, 0.12)",
                    border: "1px solid rgba(99, 102, 241, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#818cf8",
                    flexShrink: 0,
                  }}
                >
                  <Webhook size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
                    Register Webhook Endpoint
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", margin: "3px 0 0" }}>
                    Configure target endpoint and customize which real-time events to dispatch
                  </p>
                </div>
              </div>

              {/* URL Input */}
              <div style={{ marginBottom: 18 }}>
                <label className="label" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Target HTTPS URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://discord.com/api/webhooks/... or https://api.myserver.com/webhook"
                  className="input"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  style={{ width: "100%", fontSize: 14 }}
                />
                {newWebhookUrl.includes("discord.com/api/webhooks") ||
                newWebhookUrl.includes("discordapp.com/api/webhooks") ? (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "rgba(88, 101, 242, 0.12)",
                      border: "1px solid rgba(88, 101, 242, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#818cf8",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <span>🎮</span>
                    <span>
                      Discord Webhook Detected — KRYPT will automatically format notifications as rich Discord embeds with color badges!
                    </span>
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "6px 0 0" }}>
                    KRYPT will dispatch JSON payloads signed with your unique HMAC secret in the{" "}
                    <code style={{ color: "#c4b5fd" }}>X-Krypt-Signature</code> header.
                  </p>
                )}
              </div>

              {/* Customizable Events to Send */}
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <label className="label" style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
                    Select Events to Dispatch ({selectedEvents.length} selected)
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedEvents([
                          "order.completed",
                          "order.created",
                          "stock.low",
                          "product.created",
                          "review.created",
                        ])
                      }
                      style={{
                        background: "none",
                        border: "none",
                        color: "#818cf8",
                        fontSize: 12,
                        cursor: "pointer",
                        fontWeight: 600,
                        padding: 0,
                      }}
                    >
                      Select All
                    </button>
                    <span style={{ color: "var(--color-muted-foreground)", fontSize: 12 }}>•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedEvents([])}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--color-muted-foreground)",
                        fontSize: 12,
                        cursor: "pointer",
                        fontWeight: 600,
                        padding: 0,
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    {
                      id: "order.completed",
                      title: "🎉 New Orders & Completed Payments",
                      desc: "Dispatched when a buyer pays for an order and digital items/keys are delivered.",
                      badge: "Sale",
                      color: "#10b981",
                    },
                    {
                      id: "order.created",
                      title: "🛒 Checkout Started",
                      desc: "Dispatched when a customer initiates checkout for products.",
                      badge: "Checkout",
                      color: "#3b82f6",
                    },
                    {
                      id: "stock.low",
                      title: "⚠️ Low Stock / Depleted Alert",
                      desc: "Dispatched when serial key inventory drops below safety threshold.",
                      badge: "Inventory",
                      color: "#ef4444",
                    },
                    {
                      id: "product.created",
                      title: "✨ Product Published",
                      desc: "Dispatched when a new digital product is added to your store.",
                      badge: "Catalog",
                      color: "#8b5cf6",
                    },
                    {
                      id: "review.created",
                      title: "⭐ Customer Reviews",
                      desc: "Dispatched when a verified buyer posts a customer review.",
                      badge: "Feedback",
                      color: "#f59e0b",
                    },
                  ].map((item) => {
                    const isChecked = selectedEvents.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedEvents((prev) =>
                            isChecked ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                          );
                        }}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: isChecked
                            ? "1px solid rgba(99, 102, 241, 0.4)"
                            : "1px solid rgba(255, 255, 255, 0.08)",
                          background: isChecked
                            ? "rgba(99, 102, 241, 0.08)"
                            : "rgba(255, 255, 255, 0.02)",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by container onClick
                          style={{
                            marginTop: 3,
                            accentColor: "#6366f1",
                            cursor: "pointer",
                            width: 16,
                            height: 16,
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: isChecked ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                              }}
                            >
                              {item.title}
                            </span>
                            <span
                              style={{
                                padding: "1px 6px",
                                borderRadius: 4,
                                background: `${item.color}22`,
                                color: item.color,
                                fontSize: 10,
                                fontWeight: 700,
                              }}
                            >
                              {item.badge}
                            </span>
                          </div>
                          <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "2px 0 0" }}>
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setNewWebhookModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: "10px 18px", fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingWebhook || selectedEvents.length === 0}
                  className="btn btn-primary"
                  style={{ padding: "10px 20px", fontSize: 13, fontWeight: 700 }}
                >
                  {creatingWebhook ? "Registering..." : `Add Endpoint (${selectedEvents.length} events)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
