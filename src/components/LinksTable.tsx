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
  Trash2,
  Pencil,
  X,
  Check,
  AlertTriangle,
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

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Convert a stored ISO string to the value format expected by datetime-local */
function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  // Slice to 'YYYY-MM-DDTHH:MM' in local time
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/** Convert a datetime-local string to a proper ISO string (local → UTC) */
function localToIso(local: string): string | null {
  if (!local) return null;
  return new Date(local).toISOString();
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────
interface EditModalProps {
  link: Link;
  onClose: () => void;
  onSaved: () => void;
}

function EditModal({ link, onClose, onSaved }: EditModalProps) {
  const [expiresAt, setExpiresAt] = useState(
    toDatetimeLocal(link.expiresAt)
  );
  const [activatesAt, setActivatesAt] = useState(
    toDatetimeLocal(link.activatesAt)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nowStr = new Date().toISOString().slice(0, 16);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expiresAt: localToIso(expiresAt),
          activatesAt: localToIso(activatesAt),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save.");
      } else {
        onSaved();
        onClose();
      }
    } catch (err) {
      setError("Network error — " + String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="edit-modal-backdrop" onClick={onClose} />

      {/* Panel */}
      <div className="edit-modal" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="edit-modal-header">
          <div className="edit-modal-header-left">
            <div className="edit-modal-icon">
              <Pencil size={15} strokeWidth={2.5} />
            </div>
            <div>
              <div className="edit-modal-title">Edit Schedule</div>
              <div className="edit-modal-sub">
                <span className="short-badge" style={{ fontSize: "0.72rem", padding: "1px 7px" }}>
                  <Link2 size={9} strokeWidth={2.5} />
                  {link.customAlias ?? link.shortCode}
                </span>
              </div>
            </div>
          </div>
          <button className="edit-modal-close" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="edit-modal-body">
          {/* Activates On */}
          <div className="edit-field-group">
            <label className="adv-label" htmlFor="edit-activates">
              <CalendarClock size={12} strokeWidth={2.5} />
              Activates On
            </label>
            <input
              id="edit-activates"
              className="adv-date-input"
              type="datetime-local"
              value={activatesAt}
              onChange={(e) => setActivatesAt(e.target.value)}
              disabled={saving}
            />
            <p className="alias-hint hint-neutral">
              Link won&apos;t work before this time. Clear to activate immediately.
            </p>
          </div>

          {/* Expires On */}
          <div className="edit-field-group">
            <label className="adv-label" htmlFor="edit-expires">
              <CalendarX size={12} strokeWidth={2.5} />
              Expires On
            </label>
            <input
              id="edit-expires"
              className="adv-date-input"
              type="datetime-local"
              value={expiresAt}
              min={activatesAt || nowStr}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={saving}
            />
            <p className="alias-hint hint-neutral">
              Link returns &ldquo;expired&rdquo; after this time. Clear to never expire.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="edit-modal-error">
              <AlertTriangle size={13} strokeWidth={2.5} />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="edit-modal-actions">
            <button className="edit-cancel-btn" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className="edit-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner" style={{ width: 13, height: 13, borderWidth: 1.5 }} />
                  Saving…
                </>
              ) : (
                <>
                  <Check size={13} strokeWidth={2.5} />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function LinksTable({
  links,
  loading,
  newestId,
  onRefresh,
  baseUrl,
}: LinksTableProps) {
  const [activeLink, setActiveLink] = useState<Link | null>(null);
  // Map of linkId → "idle" | "confirm" | "deleting"
  const [deleteState, setDeleteState] = useState<Record<number, string>>({});
  // Edit modal state
  const [editingLink, setEditingLink] = useState<Link | null>(null);

  function openAnalytics(link: Link) {
    setActiveLink(link);
  }

  function closeAnalytics() {
    setActiveLink(null);
  }

  async function handleDelete(linkId: number) {
    const state = deleteState[linkId] ?? "idle";

    // First click → ask for confirmation
    if (state === "idle") {
      setDeleteState((prev) => ({ ...prev, [linkId]: "confirm" }));
      // Auto-reset after 3 s if the user doesn't confirm
      setTimeout(() => {
        setDeleteState((prev) =>
          prev[linkId] === "confirm" ? { ...prev, [linkId]: "idle" } : prev
        );
      }, 3000);
      return;
    }

    // Second click → actually delete
    if (state === "confirm") {
      setDeleteState((prev) => ({ ...prev, [linkId]: "deleting" }));
      if (activeLink?.id === linkId) closeAnalytics();
      try {
        const res = await fetch(`/api/links/${linkId}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        onRefresh();
      } catch (err) {
        console.error("[delete]", err);
        setDeleteState((prev) => ({ ...prev, [linkId]: "idle" }));
      }
    }
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
                here and sync to the database in real-time.
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
                  <th>Edit</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => {
                  const ds = deleteState[link.id] ?? "idle";
                  return (
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

                      {/* Edit button */}
                      <td>
                        <button
                          className="edit-btn"
                          onClick={() => setEditingLink(link)}
                          title="Edit schedule (expires / activates)"
                        >
                          <Pencil size={12} strokeWidth={2} />
                          Edit
                        </button>
                      </td>

                      {/* Delete button */}
                      <td>
                        <button
                          className={`delete-btn ${ds === "confirm" ? "confirm" : ""} ${ds === "deleting" ? "deleting" : ""}`}
                          onClick={() => handleDelete(link.id)}
                          disabled={ds === "deleting"}
                          title={ds === "confirm" ? "Click again to confirm deletion" : "Delete this link"}
                        >
                          <Trash2 size={12} strokeWidth={2} />
                          {ds === "confirm"
                            ? "Sure?"
                            : ds === "deleting"
                            ? "…"
                            : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Edit Modal */}
      {editingLink && (
        <EditModal
          link={editingLink}
          onClose={() => setEditingLink(null)}
          onSaved={onRefresh}
        />
      )}
    </>
  );
}

