"use client";

import { useState } from "react";
import {
  Link2,
  ExternalLink,
  Clock,
  RefreshCw,
  DatabaseZap,
  CalendarX,
  CalendarClock,
  Tag,
  BarChart3,
  MousePointerClick,
} from "lucide-react";
import AnalyticsDrawer from "./AnalyticsPanel";

interface Link {
  id: number;
  originalUrl: string;
  shortCode: string;
  customAlias?: string | null;
  expiresAt?: string | null;
  activatesAt?: string | null;
  createdAt: string;
  _count?: { clicks: number };
}

interface LinksTableProps {
  links: Link[];
  loading: boolean;
  newestId: number | null;
  onRefresh: () => void;
  baseUrl: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function LinkStatus({
  expiresAt,
  activatesAt,
}: {
  expiresAt?: string | null;
  activatesAt?: string | null;
}) {
  const now = new Date();

  if (expiresAt && now > new Date(expiresAt)) {
    return (
      <span
        className="status-badge expired"
        title={`Expired on ${formatDateShort(expiresAt)}`}
      >
        <CalendarX size={10} strokeWidth={2.5} />
        Expired
      </span>
    );
  }

  if (activatesAt && now < new Date(activatesAt)) {
    return (
      <span
        className="status-badge scheduled"
        title={`Activates on ${formatDateShort(activatesAt)}`}
      >
        <CalendarClock size={10} strokeWidth={2.5} />
        Scheduled
      </span>
    );
  }

  return (
    <span className="status-badge active">
      <span className="status-dot-sm" />
      Active
    </span>
  );
}

export default function LinksTable({
  links,
  loading,
  newestId,
  onRefresh,
  baseUrl,
}: LinksTableProps) {
  const [activeLink, setActiveLink] = useState<Link | null>(null);

  function openAnalytics(link: Link) {
    setActiveLink(link);
  }

  function closeAnalytics() {
    setActiveLink(null);
  }

  return (
    <>
      <section>
        {/* Toolbar */}
        <div className="table-toolbar">
          <span className="table-count">
            <DatabaseZap size={14} strokeWidth={2} />
            Stored Links
            <span className="count-pill">{links.length}</span>
          </span>

          <button
            id="refresh-btn"
            className={`refresh-btn ${loading ? "loading" : ""}`}
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw size={13} strokeWidth={2} />
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* Table Card */}
        <div className="table-card">
          {links.length === 0 && !loading ? (
            /* Empty State */
            <div className="empty-state">
              <div className="empty-illustration">
                <Link2 size={28} strokeWidth={1.5} />
              </div>
              <div className="empty-title">No links yet</div>
              <p className="empty-sub">
                Shorten your first URL above — it will appear
                <br />
                here in real-time and sync to Prisma Studio.
              </p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Original URL</th>
                  <th>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Tag size={11} />
                      Short / Alias
                    </span>
                  </th>
                  <th>Short URL</th>
                  <th>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <MousePointerClick size={11} />
                      Clicks
                    </span>
                  </th>
                  <th>Status</th>
                  <th>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={11} />
                      Created
                    </span>
                  </th>
                  <th>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <BarChart3 size={11} />
                      Analytics
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr
                    key={link.id}
                    className={`${link.id === newestId ? "row-new" : ""} ${activeLink?.id === link.id ? "row-active" : ""}`}
                  >
                    <td className="td-id">#{link.id}</td>

                    <td className="td-original" title={link.originalUrl}>
                      <a
                        href={link.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          color: "inherit",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        {link.originalUrl}
                        <ExternalLink
                          size={11}
                          style={{ flexShrink: 0, opacity: 0.5 }}
                        />
                      </a>
                    </td>

                    <td>
                      <span className="short-badge">
                        <Link2 size={10} strokeWidth={2.5} />
                        {link.customAlias ?? link.shortCode}
                      </span>
                      {link.customAlias && (
                        <span className="alias-chip">alias</span>
                      )}
                    </td>

                    <td className="td-short-url">
                      {baseUrl}/{link.customAlias ?? link.shortCode}
                    </td>

                    {/* Click count badge */}
                    <td>
                      <span className="click-count-badge">
                        <MousePointerClick size={10} strokeWidth={2.5} />
                        {link._count?.clicks ?? 0}
                      </span>
                    </td>

                    <td>
                      <LinkStatus
                        expiresAt={link.expiresAt}
                        activatesAt={link.activatesAt}
                      />
                    </td>

                    <td className="td-date">{formatDate(link.createdAt)}</td>

                    {/* Analytics button */}
                    <td>
                      <button
                        className={`analytics-toggle-btn ${activeLink?.id === link.id ? "active" : ""}`}
                        onClick={() =>
                          activeLink?.id === link.id
                            ? closeAnalytics()
                            : openAnalytics(link)
                        }
                        title="View analytics"
                      >
                        <BarChart3 size={12} strokeWidth={2} />
                        Stats
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Analytics Drawer */}
      {activeLink && (
        <AnalyticsDrawer
          linkId={activeLink.id}
          shortCode={activeLink.customAlias ?? activeLink.shortCode}
          originalUrl={activeLink.originalUrl}
          onClose={closeAnalytics}
        />
      )}
    </>
  );
}
