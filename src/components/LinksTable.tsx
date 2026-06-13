"use client";

import { Link2, ExternalLink, Clock, RefreshCw, DatabaseZap } from "lucide-react";

interface Link {
  id: number;
  originalUrl: string;
  shortCode: string;
  createdAt: string;
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

export default function LinksTable({
  links,
  loading,
  newestId,
  onRefresh,
  baseUrl,
}: LinksTableProps) {
  return (
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
              Shorten your first URL above — it will appear<br />
              here in real-time and sync to Prisma Studio.
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Original URL</th>
                <th>Short Code</th>
                <th>Short URL</th>
                <th>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={11} />
                    Created
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id} className={link.id === newestId ? "row-new" : ""}>
                  <td className="td-id">#{link.id}</td>

                  <td className="td-original" title={link.originalUrl}>
                    <a
                      href={link.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "inherit",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      {link.originalUrl}
                      <ExternalLink size={11} style={{ flexShrink: 0, opacity: 0.5 }} />
                    </a>
                  </td>

                  <td>
                    <span className="short-badge">
                      <Link2 size={10} strokeWidth={2.5} />
                      {link.shortCode}
                    </span>
                  </td>

                  <td className="td-short-url">
                    {baseUrl}/{link.shortCode}
                  </td>

                  <td className="td-date">{formatDate(link.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
