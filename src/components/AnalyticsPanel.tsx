"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MousePointerClick,
  Users,
  BarChart3,
  Loader2,
  X,
  TrendingUp,
  Zap,
  Globe,
  MessageCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

interface AnalyticsData {
  totalClicks: number;
  uniqueClicks: number;
  sources: { source: string; count: number }[];
}

// ── Platform colour + icon map ────────────────────────────────────────────────
const PLATFORM_META: Record<
  string,
  { emoji: string; color: string; bg: string; border: string }
> = {
  Instagram: {
    emoji: "📸",
    color: "#e1306c",
    bg: "rgba(225,48,108,0.08)",
    border: "rgba(225,48,108,0.20)",
  },
  LinkedIn: {
    emoji: "💼",
    color: "#0a66c2",
    bg: "rgba(10,102,194,0.08)",
    border: "rgba(10,102,194,0.20)",
  },
  WhatsApp: {
    emoji: "💬",
    color: "#25d366",
    bg: "rgba(37,211,102,0.08)",
    border: "rgba(37,211,102,0.20)",
  },
  Discord: {
    emoji: "🎮",
    color: "#5865f2",
    bg: "rgba(88,101,242,0.08)",
    border: "rgba(88,101,242,0.20)",
  },
  "Twitter / X": {
    emoji: "𝕏",
    color: "#000",
    bg: "rgba(0,0,0,0.06)",
    border: "rgba(0,0,0,0.14)",
  },
  Facebook: {
    emoji: "👥",
    color: "#1877f2",
    bg: "rgba(24,119,242,0.08)",
    border: "rgba(24,119,242,0.20)",
  },
  Reddit: {
    emoji: "🔴",
    color: "#ff4500",
    bg: "rgba(255,69,0,0.08)",
    border: "rgba(255,69,0,0.20)",
  },
  Telegram: {
    emoji: "✈️",
    color: "#2aabee",
    bg: "rgba(42,171,238,0.08)",
    border: "rgba(42,171,238,0.20)",
  },
  YouTube: {
    emoji: "▶️",
    color: "#ff0000",
    bg: "rgba(255,0,0,0.08)",
    border: "rgba(255,0,0,0.20)",
  },
  GitHub: {
    emoji: "🐙",
    color: "#24292e",
    bg: "rgba(36,41,46,0.07)",
    border: "rgba(36,41,46,0.16)",
  },
  Google: {
    emoji: "🔍",
    color: "#4285f4",
    bg: "rgba(66,133,244,0.08)",
    border: "rgba(66,133,244,0.20)",
  },
  Slack: {
    emoji: "💼",
    color: "#4a154b",
    bg: "rgba(74,21,75,0.07)",
    border: "rgba(74,21,75,0.16)",
  },
  Gmail: {
    emoji: "📧",
    color: "#ea4335",
    bg: "rgba(234,67,53,0.08)",
    border: "rgba(234,67,53,0.20)",
  },
  Outlook: {
    emoji: "📧",
    color: "#0078d4",
    bg: "rgba(0,120,212,0.08)",
    border: "rgba(0,120,212,0.20)",
  },
  Direct: {
    emoji: "🔗",
    color: "#64748b",
    bg: "rgba(100,116,139,0.08)",
    border: "rgba(100,116,139,0.18)",
  },
};

function getPlatformMeta(source: string) {
  return (
    PLATFORM_META[source] ?? {
      emoji: "🌐",
      color: "#64748b",
      bg: "rgba(100,116,139,0.08)",
      border: "rgba(100,116,139,0.18)",
    }
  );
}

interface AnalyticsDrawerProps {
  linkId: number;
  shortCode: string;
  originalUrl: string;
  onClose: () => void;
}

export default function AnalyticsDrawer({
  linkId,
  shortCode,
  originalUrl,
  onClose,
}: AnalyticsDrawerProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/links/${linkId}/clicks`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [linkId]);

  useEffect(() => {
    load();
  }, [load]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const maxCount = data?.sources?.[0]?.count ?? 1;
  const uniquePct =
    data && data.totalClicks > 0
      ? Math.round((data.uniqueClicks / data.totalClicks) * 100)
      : 0;
  const returnRate =
    data && data.totalClicks > 0
      ? Math.round(
          ((data.totalClicks - data.uniqueClicks) / data.totalClicks) * 100
        )
      : 0;

  return (
    <>
      {/* Backdrop */}
      <div className="drawer-backdrop" onClick={onClose} />

      {/* Drawer panel */}
      <aside className="analytics-drawer">
        {/* ── Header ── */}
        <div className="drawer-header">
          <div className="drawer-header-left">
            <div className="drawer-icon-wrap">
              <BarChart3 size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="drawer-title">Link Analytics</div>
              <div className="drawer-subtitle">
                <code className="drawer-code">{shortCode}</code>
              </div>
            </div>
          </div>
          <div className="drawer-header-actions">
            <button
              className="drawer-refresh-btn"
              onClick={load}
              disabled={loading}
              title="Refresh data"
            >
              <RefreshCw size={14} strokeWidth={2} className={loading ? "spin" : ""} />
            </button>
            <button className="drawer-close-btn" onClick={onClose} title="Close">
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* ── Link info strip ── */}
        <div className="drawer-link-strip">
          <ExternalLink size={12} strokeWidth={2} style={{ flexShrink: 0, opacity: 0.5 }} />
          <span className="drawer-link-url">{originalUrl}</span>
        </div>

        {/* ── Body ── */}
        <div className="drawer-body">
          {loading && !data ? (
            <div className="drawer-loading">
              <Loader2 size={20} strokeWidth={2} className="spin" />
              <span>Loading analytics…</span>
            </div>
          ) : error ? (
            <div className="drawer-error">
              Failed to load analytics — {error}
            </div>
          ) : !data ? null : (
            <>
              {/* ── Counters ── */}
              <div className="drawer-counters">
                <div className="drawer-counter amber">
                  <div className="dc-icon">
                    <MousePointerClick size={20} strokeWidth={2} />
                  </div>
                  <div className="dc-body">
                    <div className="dc-val">
                      {data.totalClicks.toLocaleString()}
                    </div>
                    <div className="dc-label">Total Clicks</div>
                  </div>
                  <TrendingUp
                    size={28}
                    strokeWidth={1}
                    className="dc-bg-icon"
                  />
                </div>

                <div className="drawer-counter teal">
                  <div className="dc-icon">
                    <Users size={20} strokeWidth={2} />
                  </div>
                  <div className="dc-body">
                    <div className="dc-val">
                      {data.uniqueClicks.toLocaleString()}
                    </div>
                    <div className="dc-label">
                      Unique Visitors
                      {data.totalClicks > 0 && (
                        <span className="dc-pct"> · {uniquePct}%</span>
                      )}
                    </div>
                  </div>
                  <Users size={28} strokeWidth={1} className="dc-bg-icon" />
                </div>

                <div className="drawer-counter purple">
                  <div className="dc-icon">
                    <Zap size={20} strokeWidth={2} />
                  </div>
                  <div className="dc-body">
                    <div className="dc-val">
                      {(data.totalClicks - data.uniqueClicks).toLocaleString()}
                    </div>
                    <div className="dc-label">
                      Return Visits
                      {data.totalClicks > 0 && (
                        <span className="dc-pct"> · {returnRate}%</span>
                      )}
                    </div>
                  </div>
                  <Zap size={28} strokeWidth={1} className="dc-bg-icon" />
                </div>
              </div>

              {/* ── Referrer Sources ── */}
              <div className="drawer-section">
                <div className="drawer-section-title">
                  <Globe size={13} strokeWidth={2} />
                  Traffic Sources
                  <span className="drawer-section-badge">
                    {data.sources.length} platform
                    {data.sources.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {data.sources.length === 0 ? (
                  <div className="drawer-empty">
                    <MousePointerClick
                      size={28}
                      strokeWidth={1.5}
                      style={{ opacity: 0.3 }}
                    />
                    <p>No clicks recorded yet.</p>
                    <p className="drawer-empty-sub">
                      Share your link to start seeing traffic data.
                    </p>
                  </div>
                ) : (
                  <div className="source-list">
                    {data.sources.map(({ source, count }, idx) => {
                      const meta = getPlatformMeta(source);
                      const pct = Math.round((count / maxCount) * 100);
                      const totalPct =
                        data.totalClicks > 0
                          ? Math.round((count / data.totalClicks) * 100)
                          : 0;
                      return (
                        <div key={source} className="source-item">
                          <div className="source-item-top">
                            {/* Rank */}
                            <span className="source-rank">#{idx + 1}</span>

                            {/* Platform badge */}
                            <span
                              className="source-platform"
                              style={{
                                background: meta.bg,
                                border: `1px solid ${meta.border}`,
                                color: meta.color,
                              }}
                            >
                              <span className="source-emoji">
                                {meta.emoji}
                              </span>
                              {source}
                            </span>

                            {/* Count */}
                            <span className="source-count">
                              {count.toLocaleString()} click
                              {count !== 1 ? "s" : ""}
                            </span>

                            {/* Percentage */}
                            <span
                              className="source-pct"
                              style={{ color: meta.color }}
                            >
                              {totalPct}%
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="source-bar-wrap">
                            <div
                              className="source-bar-fill"
                              style={{
                                width: `${pct}%`,
                                background: meta.color,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
