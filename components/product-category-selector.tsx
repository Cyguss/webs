"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Layers,
  Plus,
  Check,
  X,
  Code,
  FileCode,
  User,
  Sliders,
  Zap,
  Gamepad2,
  Terminal,
  Cpu,
  Sparkles,
  Bot,
  Wrench,
  Shield,
  HelpCircle,
  Tag,
  FolderPlus,
  Loader2,
} from "lucide-react";

export interface CategoryOption {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

export const PRESET_CATEGORIES: CategoryOption[] = [
  { id: "softwares", name: "Softwares", icon: "Code", description: "Software applications, injectors & executables" },
  { id: "scripts", name: "Scripts", icon: "FileCode", description: "Lua, Python, and custom game scripts" },
  { id: "accounts", name: "Accounts", icon: "User", description: "Full access and verified accounts" },
  { id: "configs", name: "Configs & Tools", icon: "Sliders", description: "Custom configurations and utility tools" },
  { id: "services", name: "Services", icon: "Zap", description: "Boosting, setup, and premium assistance" },
  { id: "gaming", name: "Gaming & Mods", icon: "Gamepad2", description: "Game enhancements, mod menus & assets" },
];

export function getCategoryIcon(iconName?: string, size = 16) {
  switch (iconName?.toLowerCase()) {
    case "code":
      return <Code size={size} />;
    case "filecode":
    case "file-code":
      return <FileCode size={size} />;
    case "user":
      return <User size={size} />;
    case "sliders":
    case "settings":
      return <Sliders size={size} />;
    case "zap":
      return <Zap size={size} />;
    case "gamepad2":
    case "gamepad":
      return <Gamepad2 size={size} />;
    case "terminal":
      return <Terminal size={size} />;
    case "cpu":
      return <Cpu size={size} />;
    case "sparkles":
      return <Sparkles size={size} />;
    case "bot":
      return <Bot size={size} />;
    case "wrench":
      return <Wrench size={size} />;
    case "shield":
      return <Shield size={size} />;
    default:
      return <Layers size={size} />;
  }
}

interface ProductCategorySelectorProps {
  value: string | null;
  onChange: (category: string | null) => void;
  accentColor?: string;
}

export function ProductCategorySelector({
  value,
  onChange,
  accentColor = "var(--color-primary, #6366f1)",
}: ProductCategorySelectorProps) {
  const [categories, setCategories] = useState<CategoryOption[]>(PRESET_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("Code");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  // Fetch shop categories
  useEffect(() => {
    let mounted = true;
    async function loadShopCategories() {
      try {
        setLoading(true);
        const res = await fetch("/api/shops/categories");
        if (res.ok) {
          const data = await res.json();
          if (mounted && Array.isArray(data.categories) && data.categories.length > 0) {
            // Merge with presets
            const mergedMap = new Map<string, CategoryOption>();
            for (const p of PRESET_CATEGORIES) {
              mergedMap.set(p.id.toLowerCase(), p);
            }
            for (const c of data.categories) {
              mergedMap.set(c.id.toLowerCase(), c);
            }
            setCategories(Array.from(mergedMap.values()));
          }
        }
      } catch (err) {
        console.error("Error loading categories:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadShopCategories();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedCategory = useMemo(() => {
    if (!value) return null;
    const lower = value.toLowerCase().trim();
    const found = categories.find((c) => c.id.toLowerCase() === lower || c.name.toLowerCase() === lower);
    if (found) return found;
    return {
      id: lower,
      name: value,
      icon: "Layers",
    };
  }, [value, categories]);

  async function handleCreateCategory() {
    if (!newCatName.trim()) return;
    try {
      setSavingCategory(true);
      const res = await fetch("/api/shops/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          icon: newCatIcon,
          description: newCatDesc.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.category) {
          setCategories((prev) => {
            const next = prev.filter((c) => c.id !== data.category.id);
            return [...next, data.category];
          });
          onChange(data.category.id);
          setShowCreateModal(false);
          setNewCatName("");
          setNewCatDesc("");
        }
      } else {
        // Fallback local addition
        const cleanId = newCatName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
        const newCat: CategoryOption = {
          id: cleanId,
          name: newCatName.trim(),
          icon: newCatIcon,
          description: newCatDesc.trim() || undefined,
        };
        setCategories((prev) => [...prev, newCat]);
        onChange(newCat.id);
        setShowCreateModal(false);
        setNewCatName("");
      }
    } catch (e) {
      console.error(e);
      const cleanId = newCatName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      const newCat: CategoryOption = {
        id: cleanId,
        name: newCatName.trim(),
        icon: newCatIcon,
      };
      setCategories((prev) => [...prev, newCat]);
      onChange(newCat.id);
      setShowCreateModal(false);
    } finally {
      setSavingCategory(false);
    }
  }

  const iconOptions = [
    { name: "Code", label: "Software / Code" },
    { name: "FileCode", label: "Script / File" },
    { name: "User", label: "Account / User" },
    { name: "Sliders", label: "Configs / Settings" },
    { name: "Zap", label: "Service / Fast" },
    { name: "Gamepad2", label: "Gaming / Mod" },
    { name: "Terminal", label: "Terminal / Tool" },
    { name: "Shield", label: "Security / Anti-Cheat" },
    { name: "Bot", label: "Bot / Automation" },
    { name: "Sparkles", label: "Special / Premium" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Preset / Custom Category Chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {/* Uncategorized / None */}
        <button
          type="button"
          onClick={() => onChange(null)}
          className="interactive-pill"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            background: !value ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)",
            border: !value ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
            color: !value ? "#fff" : "rgba(255,255,255,0.6)",
          }}
        >
          <Layers size={13} style={{ opacity: !value ? 1 : 0.6 }} />
          <span>General (None)</span>
        </button>

        {/* Existing Categories Chips */}
        {categories.map((cat) => {
          const isSelected = selectedCategory?.id.toLowerCase() === cat.id.toLowerCase();
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onChange(cat.id)}
              className="interactive-pill"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: isSelected ? `${accentColor}25` : "rgba(255,255,255,0.03)",
                border: isSelected ? `1px solid ${accentColor}80` : "1px solid rgba(255,255,255,0.08)",
                color: isSelected ? "#fff" : "rgba(255,255,255,0.75)",
                boxShadow: isSelected ? `0 0 12px ${accentColor}30` : "none",
                transform: isSelected ? "scale(1.02)" : "scale(1)",
              }}
            >
              <span style={{ color: isSelected ? accentColor : "rgba(255,255,255,0.6)", transition: "color 0.15s ease" }}>
                {getCategoryIcon(cat.icon, 13)}
              </span>
              <span>{cat.name}</span>
              {isSelected && <span className="animate-checkmark"><Check size={12} style={{ color: accentColor, marginLeft: 2 }} /></span>}
            </button>
          );
        })}

        {/* Add New Custom Category Button */}
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="interactive-pill"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "6px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            background: "rgba(99,102,241,0.1)",
            border: "1px dashed rgba(99,102,241,0.4)",
            color: "#818cf8",
          }}
        >
          <Plus size={13} />
          <span>+ Custom Category</span>
        </button>
      </div>

      {/* Selected Category Summary Helper */}
      {selectedCategory && (
        <div
          className="animate-slide-up interactive-card"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            fontSize: 12,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          <span style={{ color: accentColor }}>{getCategoryIcon(selectedCategory.icon, 14)}</span>
          <span>
            Assigned to: <strong style={{ color: "#fff" }}>{selectedCategory.name}</strong>
            {selectedCategory.description ? ` — ${selectedCategory.description}` : ""}
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
              padding: 2,
              display: "flex",
              transition: "transform 0.15s ease, color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#f87171";
              e.currentTarget.style.transform = "scale(1.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.4)";
              e.currentTarget.style.transform = "scale(1)";
            }}
            title="Remove category"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Create Custom Category Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateModal(false);
          }}
        >
          <div
            className="modal-fly-in"
            style={{
              width: "100%",
              maxWidth: 440,
              background: "#12141c",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "rgba(99,102,241,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#818cf8",
                  }}
                >
                  <FolderPlus size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#fff" }}>
                    Create Custom Category
                  </h3>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0 }}>
                    Add a new category filter for your store products
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "none",
                  borderRadius: 6,
                  color: "rgba(255,255,255,0.6)",
                  padding: 6,
                  cursor: "pointer",
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
              >
                <X size={16} />
              </button>
            </div>

            {/* Category Name Input */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
                Category Name *
              </label>
              <input
                type="text"
                placeholder="e.g. FiveM Softwares, Valorant Tools, Discord Bots"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#fff",
                  fontSize: 13,
                  outline: "none",
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateCategory();
                  }
                }}
              />
            </div>

            {/* Icon Picker */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
                Category Icon
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                {iconOptions.map((ico) => {
                  const isIcoSelected = newCatIcon === ico.name;
                  return (
                    <button
                      key={ico.name}
                      type="button"
                      onClick={() => setNewCatIcon(ico.name)}
                      title={ico.label}
                      className="interactive-pill"
                      style={{
                        padding: "8px 4px",
                        borderRadius: 8,
                        background: isIcoSelected ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)",
                        border: isIcoSelected ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.06)",
                        color: isIcoSelected ? "#818cf8" : "rgba(255,255,255,0.6)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        cursor: "pointer",
                        transform: isIcoSelected ? "scale(1.05)" : "scale(1)",
                      }}
                    >
                      {getCategoryIcon(ico.name, 18)}
                      <span style={{ fontSize: 9, opacity: 0.8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%", textAlign: "center" }}>
                        {ico.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Description */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
                Description (Optional)
              </label>
              <input
                type="text"
                placeholder="Short tagline shown under category title"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#fff",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="interactive-pill"
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={!newCatName.trim() || savingCategory}
                className="interactive-pill"
                style={{
                  padding: "8px 20px",
                  borderRadius: 8,
                  background: "#6366f1",
                  border: "none",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: !newCatName.trim() || savingCategory ? "not-allowed" : "pointer",
                  opacity: !newCatName.trim() || savingCategory ? 0.5 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
                }}
              >
                {savingCategory ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>Add Category</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
