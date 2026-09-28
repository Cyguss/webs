"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wallet,
  Palette,
  Settings,
  LogOut,
  ExternalLink,
  BarChart3,
  LifeBuoy,
  Search,
  Bell,
  Menu,
  X,
  ShieldAlert,
  ChevronDown,
  Plus,
  Check,
  Store,
  Loader2,
  Terminal,
  Tag,
  ArrowRight,
  Inbox,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/components/toast-context";
import { DashboardLoadingView } from "./dashboard-loading-view";

function getApprovalStatusInfo(status?: string) {
  if (status === "approved") {
    return {
      color: "#22c55e",
      label: "Site approved",
    };
  }
  if (status === "rejected") {
    return {
      color: "#ef4444",
      label: "Rejected",
    };
  }
  return {
    color: "#f59e0b",
    label: "Waiting for approval",
  };
}

function DiscordIcon({ size = 16, color = "#5865F2" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}

const mainNavItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/products", label: "Products & Stock", icon: Package },
  { href: "/dashboard/orders", label: "Orders & Fulfillment", icon: ShoppingCart },
  { href: "/dashboard/coupons", label: "Discounts & Coupons", icon: Tag },
  { href: "/dashboard/earnings", label: "Earnings & Payouts", icon: Wallet },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
];

const secondaryNavItems = [
  { href: "/dashboard/tickets", label: "Support & Help", icon: LifeBuoy },
  { href: "/dashboard/developer", label: "Developer & API", icon: Terminal },
  { href: "/dashboard/storefront", label: "Storefront & Branding", icon: Palette },
  { href: "/dashboard/settings", label: "Security & Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const toast = useToast();

  useEffect(() => {
    if (!sessionPending && !session) {
      router.replace("/login");
    }
  }, [session, sessionPending, router]);

  const [activeShop, setActiveShop] = useState<{ id: string; name: string; slug: string; approvalStatus?: string } | null>(null);
  const [allShops, setAllShops] = useState<Array<{ id: string; name: string; slug: string; approvalStatus?: string }>>([]);
  const [unreadNotifs, setUnreadNotifs] = useState<number>(0);
  const [userRole, setUserRole] = useState<string>("user");
  const [hasDiscord, setHasDiscord] = useState<boolean>(false);
  const [discordUsername, setDiscordUsername] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [isNavigatingExiting, setIsNavigatingExiting] = useState(false);
  const [activeTargetPath, setActiveTargetPath] = useState<string | null>(null);

  useEffect(() => {
    if (navigatingTo) {
      setIsNavigatingExiting(true);
      const timer = setTimeout(() => {
        setNavigatingTo(null);
        setIsNavigatingExiting(false);
      }, 220);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Fallback safety timeout if server navigation hangs
  useEffect(() => {
    if (!navigatingTo) return;
    const timer = setTimeout(() => {
      setNavigatingTo(null);
      setIsNavigatingExiting(false);
    }, 15000);
    return () => clearTimeout(timer);
  }, [navigatingTo]);

  // Global fast-response click & hover capture for any link leading to /dashboard/*
  const handleGlobalClick = (e: React.MouseEvent<HTMLElement>) => {
    const anchor = (e.target as HTMLElement).closest("a");
    if (anchor && anchor.href && anchor.href.startsWith(window.location.origin + "/dashboard")) {
      const targetPath = anchor.pathname;
      if (targetPath !== pathname) {
        setActiveTargetPath(targetPath);
        setIsNavigatingExiting(false);
        setNavigatingTo(targetPath);
      }
    }
  };

  const handleGlobalMouseOver = (e: React.MouseEvent<HTMLElement>) => {
    const anchor = (e.target as HTMLElement).closest("a");
    if (anchor && anchor.href && anchor.href.startsWith(window.location.origin + "/dashboard")) {
      try {
        router.prefetch(anchor.pathname);
      } catch {}
    }
  };

  // New Store Creation Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreSlug, setNewStoreSlug] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Global Command Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{ products: any[]; orders: any[] }>({ products: [], orders: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchShopData() {
      if (!session) return;
      try {
        const res = await fetch("/api/storefront");
        if (res.ok) {
          const data = await res.json();
          if (data.role) {
            setUserRole(data.role);
          }
          setHasDiscord(Boolean(data.hasDiscordConnected));
          if (data.discordUsername) {
            setDiscordUsername(data.discordUsername);
          }
          if (data.shop) {
            setActiveShop({
              ...data.shop,
              approvalStatus: data.shop.approvalStatus || data.approvalStatus,
            });
          } else {
            router.replace("/onboarding");
          }
          if (Array.isArray(data.shops) && data.shops.length > 0) {
            setAllShops(data.shops);
          } else if (data.shop) {
            setAllShops([data.shop]);
          }
        }

        // Fetch unread notifications count
        try {
          const notifRes = await fetch("/api/notifications");
          if (notifRes.ok) {
            const notifData = await notifRes.json();
            setUnreadNotifs(notifData.unreadCount || 0);
          }
        } catch {}
      } catch (err) {
        console.error("Failed to fetch shop:", err);
      }
    }
    fetchShopData();
  }, [session, router]);

  // Refresh notifications count on route change & live background polling
  useEffect(() => {
    let isMounted = true;
    async function checkNotifs() {
      if (!session) return;
      try {
        const notifRes = await fetch("/api/notifications");
        if (notifRes.ok && isMounted) {
          const notifData = await notifRes.json();
          setUnreadNotifs(notifData.unreadCount || 0);
        }
      } catch {}
    }
    checkNotifs();

    const handleNotifsUpdated = () => checkNotifs();
    window.addEventListener("notifications-updated", handleNotifsUpdated);
    const pollTimer = setInterval(checkNotifs, 10000);

    return () => {
      isMounted = false;
      window.removeEventListener("notifications-updated", handleNotifsUpdated);
      clearInterval(pollTimer);
    };
  }, [pathname, session]);

  // Close mobile menu & dropdown on outside click or route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setStoreDropdownOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Global Search keyboard shortcuts (Ctrl+K / Cmd+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setStoreDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch search results on debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ products: [], orders: [] });
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Search query error", err);
      } finally {
        setSearchLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  function handleSelectShop(shop: { id: string; name: string; slug: string }) {
    document.cookie = `vlt_active_shop_id=${shop.id}; path=/; max-age=31536000; SameSite=Lax`;
    setActiveShop(shop);
    setStoreDropdownOpen(false);
    toast.success(`Switched active workspace to ${shop.name}`);
    window.location.reload();
  }

  async function handleCreateStore(e: React.FormEvent) {
    e.preventDefault();
    if (!newStoreName.trim() || !newStoreSlug.trim()) {
      toast.error("Please fill in both store name and sub-slug.");
      return;
    }

    setCreateLoading(true);
    try {
      const res = await fetch("/api/storefront", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStoreName.trim(),
          slug: newStoreSlug.trim().toLowerCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create store");
        setCreateLoading(false);
        return;
      }

      toast.success(`Store "${data.shop.name}" created successfully!`);
      document.cookie = `vlt_active_shop_id=${data.shop.id}; path=/; max-age=31536000; SameSite=Lax`;
      setShowCreateModal(false);
      setNewStoreName("");
      setNewStoreSlug("");
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.message || "Network error while creating store");
      setCreateLoading(false);
    }
  }

  const liveStoreUrl = activeShop ? `/${activeShop.slug}` : "#";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-background)" }}>
      {/* Top Instant Navigation Progress Bar */}
      {navigatingTo && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 2.5,
            zIndex: 99999,
            background: "linear-gradient(90deg, var(--color-border), var(--color-foreground), var(--color-border))",
            backgroundSize: "200% 100%",
            animation: "topProgress 1s ease-in-out infinite",
            boxShadow: "0 0 10px var(--color-primary-glow)",
          }}
        />
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 45,
            backdropFilter: "blur(6px)",
          }}
          className="md:hidden"
        />
      )}

      {/* Black Market Minimalist Glass Sidebar */}
      <aside
        className={`sidebar-desktop-only ${mobileMenuOpen ? "!display-flex !translate-x-0" : "max-md:-translate-x-full"}`}
        style={{
          width: 260,
          height: "100vh",
          maxHeight: "100vh",
          overflow: "hidden",
          flexShrink: 0,
          background: "var(--sidebar-bg)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Brand Header — Clicking KRYPT goes to Home ('/') */}
        <div
          style={{
            padding: "20px 18px 16px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            title="Return to KRYPT Market Home"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-sm)",
                background: "rgba(55, 44, 102, 0.4)",
                border: "1px solid rgba(139, 92, 246, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#c4b5fd",
                boxShadow: "0 0 10px rgba(55, 44, 102, 0.3)",
              }}
            >
              <Terminal size={17} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontWeight: 900,
                  fontSize: 16,
                  color: "var(--color-foreground)",
                  letterSpacing: "0.04em",
                  lineHeight: 1.1,
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                KRYPT
              </span>
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: "#c4b5fd",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                OPS // PROTOCOL
              </span>
            </div>
          </Link>

          <button
            className="md:hidden p-1 text-[var(--color-muted-foreground)]"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Store Switcher Dropdown (Expansion Ready) */}
        <div ref={dropdownRef} style={{ padding: "12px 14px", borderBottom: "1px solid var(--color-border)", position: "relative" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--color-muted-foreground)",
              }}
            >
              Selected Store
            </div>
            {activeShop && (() => {
              const info = getApprovalStatusInfo(activeShop.approvalStatus);
              return (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 4,
                    background:
                      info.label === "Site approved"
                        ? "rgba(34, 197, 94, 0.15)"
                        : info.label === "Rejected"
                        ? "rgba(239, 68, 68, 0.15)"
                        : "rgba(245, 158, 11, 0.15)",
                    color: info.color,
                  }}
                  title={info.label}
                >
                  {info.label}
                </span>
              );
            })()}
          </div>
          <button
            onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 12px",
              borderRadius: "var(--radius-md)",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--color-border)",
              color: "var(--color-foreground)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9, overflow: "hidden" }}>
              {(() => {
                const info = getApprovalStatusInfo(activeShop?.approvalStatus);
                return (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: info.color,
                      boxShadow: `0 0 6px ${info.color}`,
                      flexShrink: 0,
                    }}
                    title={info.label}
                  />
                );
              })()}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {activeShop ? activeShop.name : "Select Store"}
              </span>
            </div>
            <ChevronDown size={14} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />
          </button>

          {/* Store Switcher Dropdown Menu */}
          {storeDropdownOpen && (
            <div
              className="dropdown-fly-in"
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 14,
                right: 14,
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--card-shadow, 0 16px 36px rgba(0, 0, 0, 0.5))",
                zIndex: 60,
                padding: "6px",
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              <div
                style={{
                  padding: "6px 8px 4px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--color-muted-foreground)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Active Storefronts
              </div>

              {allShops.map((s) => {
                const isCurrent = activeShop?.id === s.id;
                const sInfo = getApprovalStatusInfo(s.approvalStatus);
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectShop(s)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      background: isCurrent ? "var(--color-surface-2)" : "transparent",
                      color: isCurrent ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: isCurrent ? 600 : 500,
                      transition: "background 0.12s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: sInfo.color,
                          boxShadow: `0 0 4px ${sInfo.color}`,
                          flexShrink: 0,
                        }}
                        title={sInfo.label}
                      />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.name}
                      </span>
                    </div>
                    {isCurrent && <Check size={14} style={{ color: "var(--color-foreground)" }} />}
                  </div>
                );
              })}

              <div style={{ height: 1, background: "var(--color-border)", margin: "4px 0" }} />

              <button
                onClick={() => {
                  setStoreDropdownOpen(false);
                  setShowCreateModal(true);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  background: "transparent",
                  border: "none",
                  color: "var(--color-foreground)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <Plus size={14} />
                <span>+ Create New Store</span>
              </button>
            </div>
          )}
        </div>

        {/* Main Navigation in Clean English */}
        <nav style={{ flex: 1, minHeight: 0, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
          {/* Section 1: Merchant Suite */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-muted-foreground)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 10px 8px" }}>
              Merchant Suite
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {mainNavItems.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                const isItemNavigating = navigatingTo === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onMouseEnter={() => {
                      try { router.prefetch(item.href); } catch {}
                    }}
                    onClick={() => {
                      if (pathname !== item.href) {
                        setNavigatingTo(item.href);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md)",
                      textDecoration: "none",
                      fontSize: 13,
                      fontWeight: active ? 600 : 500,
                      transition: "all 0.12s ease",
                      background: active ? "var(--color-primary)" : "transparent",
                      color: active ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <item.icon size={17} color={active ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)"} />
                      <span>{item.label}</span>
                    </div>
                    {isItemNavigating && (
                      <Loader2 size={14} className="animate-spin" style={{ color: active ? "var(--color-primary-foreground)" : "#818cf8" }} />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Section 2: Store Operations */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-muted-foreground)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 10px 8px" }}>
              Store Operations
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                {
                  href: "/dashboard/inbox",
                  label: "Inbox",
                  icon: Inbox,
                  badge: unreadNotifs > 0 ? String(unreadNotifs) : undefined,
                  badgeBg: "#ef4444",
                },
                ...secondaryNavItems,
              ].map((item: any) => {
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const isItemNavigating = navigatingTo === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onMouseEnter={() => {
                      try { router.prefetch(item.href); } catch {}
                    }}
                    onClick={() => {
                      if (pathname !== item.href) {
                        setNavigatingTo(item.href);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md)",
                      textDecoration: "none",
                      fontSize: 13,
                      fontWeight: active ? 600 : 500,
                      transition: "all 0.12s ease",
                      background: active ? "var(--color-primary)" : "transparent",
                      color: active ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <item.icon size={17} color={active ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)"} />
                      <span>{item.label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {isItemNavigating && (
                        <Loader2 size={14} className="animate-spin" style={{ color: active ? "var(--color-primary-foreground)" : "#818cf8" }} />
                      )}
                      {item.badge && (
                        <span
                          style={{
                            minWidth: 20,
                            height: 20,
                            padding: "0 6px",
                            borderRadius: 999,
                            background: item.badgeBg || "#ef4444",
                            color: "#ffffff",
                            fontSize: 10,
                            fontWeight: 800,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 0 8px rgba(239, 68, 68, 0.6)",
                            lineHeight: 1,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Pinned Bottom Actions & User Account Bar */}
        <div style={{ flexShrink: 0, borderTop: "1px solid var(--color-border)", background: "var(--sidebar-bg)", display: "flex", flexDirection: "column", padding: "12px 14px" }}>
          {/* Special Admin Panel or Discord Connect Link */}
          {userRole === "admin" ? (
            <div style={{ marginBottom: 10 }}>
              <Link
                href="/admin"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  borderRadius: "var(--radius-md)",
                  textDecoration: "none",
                  fontSize: 12.5,
                  fontWeight: 600,
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#f87171",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ShieldAlert size={15} />
                  <span>Admin Portal</span>
                </div>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    padding: "2px 5px",
                    borderRadius: 4,
                    background: "#ef4444",
                    color: "#ffffff",
                    letterSpacing: "0.05em",
                  }}
                >
                  ADMIN
                </span>
              </Link>
            </div>
          ) : (
            <div style={{ marginBottom: 10 }}>
              <Link
                href="/dashboard/settings"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  borderRadius: "var(--radius-md)",
                  textDecoration: "none",
                  fontSize: 12.5,
                  fontWeight: 600,
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-foreground)",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <DiscordIcon size={15} />
                  <span>{hasDiscord ? `@${discordUsername || "Discord"}` : "Connect Discord"}</span>
                </div>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    padding: "2px 5px",
                    borderRadius: 4,
                    background: hasDiscord ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 255, 255, 0.08)",
                    color: hasDiscord ? "#22c55e" : "var(--color-muted-foreground)",
                  }}
                >
                  {hasDiscord ? "LINKED" : "CONNECT"}
                </span>
              </Link>
            </div>
          )}

          {/* User Account Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px", borderRadius: "var(--radius-md)", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--color-foreground)",
                  flexShrink: 0,
                }}
              >
                {session?.user?.name?.[0]?.toUpperCase() || "M"}
              </div>
              <div style={{ overflow: "hidden", flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {session?.user?.name || "Merchant"}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {session?.user?.email || "merchant@krypt.market"}
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <button
            onClick={handleSignOut}
            className="btn btn-ghost"
            style={{ width: "100%", justifyContent: "flex-start", padding: "8px 12px", fontSize: 13, color: "var(--color-danger)" }}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="main-with-sidebar" style={{ marginLeft: 260, flex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Top Header Bar */}
        <header
          style={{
            height: 64,
            borderBottom: "1px solid var(--color-border)",
            background: "var(--header-bg)",
            backdropFilter: "blur(16px)",
            position: "sticky",
            top: 0,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
          }}
        >
          {/* Quick Search Bar with Global Command Palette */}
          <div ref={searchContainerRef} style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
            <button className="md:hidden p-2 text-[var(--color-muted-foreground)]" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={20} />
            </button>
            <div style={{ position: "relative", width: 340 }} className="hidden sm:block">
              <Search size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--color-muted-foreground)" }} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                placeholder="Search products, orders, pages... (Ctrl+K)"
                className="input"
                style={{ paddingLeft: 38, paddingRight: 50, fontSize: 13, height: 38, background: "var(--color-surface)" }}
              />
              <span
                style={{
                  position: "absolute",
                  right: 10,
                  top: 9,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 5px",
                  borderRadius: 4,
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-muted-foreground)",
                }}
              >
                ⌘K
              </span>

              {/* Live Search & Command Dropdown */}
              {searchOpen && (
                <div
                  className="dropdown-fly-in"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    width: 440,
                    maxHeight: 460,
                    overflowY: "auto",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
                    zIndex: 100,
                    padding: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {/* Quick Page Links */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-muted-foreground)", padding: "4px 8px" }}>
                      Pages & Shortcuts
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {[
                        { title: "Add New Product", href: "/dashboard/products/new", icon: Plus, desc: "Add product with license keys" },
                        { title: "Products & Stock", href: "/dashboard/products", icon: Package, desc: "Manage catalog and inventory" },
                        { title: "Discounts & Coupons", href: "/dashboard/coupons", icon: Tag, desc: "Promo codes & discounts" },
                        { title: "Storefront & Branding", href: "/dashboard/storefront", icon: Palette, desc: "Theme, banners, and socials" },
                        { title: "Orders & Fulfillment", href: "/dashboard/orders", icon: ShoppingCart, desc: "Track delivered orders" },
                        { title: "Earnings & Payouts", href: "/dashboard/earnings", icon: Wallet, desc: "Balance and cashouts" },
                        { title: "Security & Settings", href: "/dashboard/settings", icon: Settings, desc: "Two-factor auth and credentials" },
                      ]
                        .filter(
                          (item) =>
                            !searchQuery.trim() ||
                            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.desc.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .slice(0, 4)
                        .map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSearchOpen(false)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "7px 10px",
                              borderRadius: 6,
                              textDecoration: "none",
                              color: "var(--color-foreground)",
                              fontSize: 13,
                              transition: "background 0.1s ease",
                            }}
                            className="search-item-hover"
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <item.icon size={15} color="var(--color-primary-light)" />
                              <div>
                                <div style={{ fontWeight: 600 }}>{item.title}</div>
                                <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>{item.desc}</div>
                              </div>
                            </div>
                            <ArrowRight size={12} color="var(--color-muted-foreground)" />
                          </Link>
                        ))}
                    </div>
                  </div>

                  {/* Matched Products */}
                  {searchResults.products && searchResults.products.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-muted-foreground)", padding: "4px 8px" }}>
                        Products ({searchResults.products.length})
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {searchResults.products.map((p) => (
                          <Link
                            key={p.id}
                            href={`/dashboard/products/${p.id}/edit`}
                            onClick={() => setSearchOpen(false)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "7px 10px",
                              borderRadius: 6,
                              textDecoration: "none",
                              color: "var(--color-foreground)",
                              fontSize: 13,
                            }}
                            className="search-item-hover"
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Package size={14} color="#818cf8" />
                              <div>
                                <div style={{ fontWeight: 600 }}>{p.title}</div>
                                <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>${p.price} USD</div>
                              </div>
                            </div>
                            <span className="badge badge-neutral" style={{ fontSize: 10 }}>Edit</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matched Orders */}
                  {searchResults.orders && searchResults.orders.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-muted-foreground)", padding: "4px 8px" }}>
                        Orders ({searchResults.orders.length})
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {searchResults.orders.map((o) => (
                          <Link
                            key={o.id}
                            href="/dashboard/orders"
                            onClick={() => setSearchOpen(false)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "7px 10px",
                              borderRadius: 6,
                              textDecoration: "none",
                              color: "var(--color-foreground)",
                              fontSize: 13,
                            }}
                            className="search-item-hover"
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <ShoppingCart size={14} color="#34d399" />
                              <div>
                                <div style={{ fontWeight: 600 }}>Order #{o.id.slice(0, 8)}</div>
                                <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>{o.buyerEmail} • ${o.totalAmount}</div>
                              </div>
                            </div>
                            <span className="badge badge-success" style={{ fontSize: 10 }}>{o.status}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchLoading && (
                    <div style={{ padding: 8, textAlign: "center", fontSize: 12, color: "var(--color-muted-foreground)" }}>
                      <Loader2 size={14} className="animate-spin" style={{ display: "inline-block", marginRight: 6 }} />
                      Searching inventory...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Top Header Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Live Storefront Link with Approval Status Dot */}
            {activeShop && (() => {
              const info = getApprovalStatusInfo(activeShop.approvalStatus);
              return (
                <a
                  href={liveStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary hidden sm:flex"
                  style={{ padding: "7px 14px", fontSize: 12, gap: 8 }}
                  title={`${activeShop.name} • ${info.label}`}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: info.color,
                      boxShadow: `0 0 6px ${info.color}`,
                      flexShrink: 0,
                    }}
                  />
                  <span>Visit /{activeShop.slug}</span>
                  <ExternalLink size={13} color="var(--color-muted-foreground)" />
                </a>
              );
            })()}

            {/* Notifications Bell -> Links to Inbox */}
            <Link
              href="/dashboard/inbox"
              style={{
                width: 38,
                height: 38,
                borderRadius: "var(--radius-md)",
                background: pathname === "/dashboard/inbox" ? "var(--color-surface-2)" : "var(--btn-ghost-bg)",
                border: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: pathname === "/dashboard/inbox" ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                cursor: "pointer",
                position: "relative",
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
              title={unreadNotifs > 0 ? `${unreadNotifs} unread notifications` : "Inbox"}
            >
              <Bell size={16} />
              {unreadNotifs > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    minWidth: 19,
                    height: 19,
                    padding: "0 4px",
                    borderRadius: 999,
                    background: "#ef4444",
                    color: "#ffffff",
                    fontSize: 10,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 10px rgba(239, 68, 68, 0.75)",
                    border: "2px solid var(--color-background)",
                    lineHeight: 1,
                  }}
                >
                  {unreadNotifs > 9 ? "9+" : unreadNotifs}
                </span>
              )}
            </Link>

            <ThemeToggle style={{ width: 38, height: 38 }} />
          </div>
        </header>

        {/* Page Content Viewport */}
        <main
          onClickCapture={handleGlobalClick}
          onMouseOverCapture={handleGlobalMouseOver}
          style={{ flex: 1, padding: "28px", position: "relative", minHeight: "calc(100vh - 64px)" }}
        >
          {/* Instant Client Transition with Spinning Wheel and Loading Data Message */}
          {navigatingTo && (
            <div
              className={isNavigatingExiting ? "page-fly-out" : "page-fly-in"}
              style={{
                position: "absolute",
                inset: 0,
                background: "var(--loading-overlay-bg)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                zIndex: 60,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                paddingTop: 40,
                borderRadius: "var(--radius-lg, 12px)",
                overflowY: "auto",
                pointerEvents: isNavigatingExiting ? "none" : "auto",
              }}
            >
              <DashboardLoadingView targetPath={activeTargetPath || navigatingTo} />
            </div>
          )}

          <div
            key={pathname}
            className="page-fly-in"
            style={{
              opacity: navigatingTo && !isNavigatingExiting ? 0.3 : 1,
              transition: "opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
              pointerEvents: navigatingTo && !isNavigatingExiting ? "none" : "auto",
            }}
          >
            {children}
          </div>
        </main>
      </div>

      {/* CREATE NEW STORE MODAL */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(8px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            className="card modal-fly-in"
            style={{
              maxWidth: 460,
              width: "100%",
              padding: 32,
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-foreground)",
                  }}
                >
                  <Store size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Create New Storefront</h3>
                  <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: 0 }}>
                    Add another storefront under your merchant account
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--color-muted-foreground)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStore} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--color-muted-foreground)" }}>
                  Store Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Digital Marketplace"
                  className="input"
                  value={newStoreName}
                  onChange={(e) => {
                    setNewStoreName(e.target.value);
                    if (!newStoreSlug || newStoreSlug === newStoreName.toLowerCase().replace(/[^a-z0-9-]/g, "")) {
                      setNewStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-"));
                    }
                  }}
                  required
                  autoFocus
                  style={{ height: 42, fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--color-muted-foreground)" }}>
                  Subdomain Slug
                </label>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ padding: "0 10px", fontSize: 13, color: "var(--color-muted-foreground)", background: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)", borderRight: "none", height: 42, display: "flex", alignItems: "center", borderRadius: "var(--radius-sm) 0 0 var(--radius-sm)", fontFamily: "var(--font-mono, monospace)" }}>
                    krypt.market/
                  </span>
                  <input
                    type="text"
                    placeholder="apex-digital"
                    className="input"
                    value={newStoreSlug}
                    onChange={(e) => setNewStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    required
                    style={{ height: 42, fontSize: 14, borderRadius: "0 var(--radius-sm) var(--radius-sm) 0", fontFamily: "var(--font-mono, monospace)" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, height: 44, fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !newStoreName.trim() || !newStoreSlug.trim()}
                  className="btn btn-primary"
                  style={{ flex: 1.5, height: 44, fontSize: 13 }}
                >
                  {createLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  <span>{createLoading ? "Deploying..." : "Create Storefront"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
