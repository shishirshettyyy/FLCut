"use client";

import { useCallback, useEffect, useState } from "react";
import { Scissors, Link2, Sparkles } from "lucide-react";
import StatsBar from "@/components/StatsBar";
import ShortenForm from "@/components/ShortenForm";
import LinksTable from "@/components/LinksTable";

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

export default function DashboardPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [fetching, setFetching] = useState(false);
  const [newestId, setNewestId] = useState<number | null>(null);

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const fetchLinks = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/links");
      const data = await res.json();
      if (Array.isArray(data)) setLinks(data);
    } catch {
      // silent
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  function handleNewLink(link: Link) {
    setNewestId(link.id);
    fetchLinks();
    setTimeout(() => setNewestId(null), 2500);
  }

  const latestCode = links[0]?.shortCode ?? "—";
  const lastCreated = links[0] ? formatDate(links[0].createdAt) : "—";

  return (
    <div className="page-wrapper">
      {/* ── Topbar ── */}
      <nav className="topbar">
        <div className="container">
          <div className="topbar-inner">
            <a href="/" className="logo">
              <div className="logo-icon">
                <Scissors size={17} color="#fff" strokeWidth={2.5} />
              </div>
              <span className="logo-text">
                FL<span>Cut</span>
              </span>
            </a>

            <span className="topbar-badge">
              <span className="status-dot" />
              Neon PostgreSQL
            </span>
          </div>
        </div>
      </nav>

      <main style={{ flex: 1 }}>
        <div className="container">
          {/* ── Hero ── */}
          <header className="hero">
            <div className="hero-eyebrow">
              <Sparkles size={13} strokeWidth={2} />
              Finite Loop Club · URL Shortener
            </div>
            <h1 className="hero-title">
              Make long links{" "}
              <span className="highlight">short & sharp</span>
            </h1>
            <p className="hero-sub">
              Paste any URL, get a clean short link
            </p>
          </header>

          {/* ── Stats ── */}
          <StatsBar
            totalLinks={links.length}
            latestCode={latestCode}
            lastCreated={lastCreated}
          />

          {/* ── Shorten Card ── */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-icon amber">
                <Link2 size={18} strokeWidth={2} />
              </div>
              <div>
                <div className="card-title">Shorten a URL</div>
                <div className="card-subtitle">
                  Paste your long URL and get a 6-char short code instantly
                </div>
              </div>
            </div>

            <ShortenForm onSuccess={handleNewLink} />
          </div>

          {/* ── Links Table ── */}
          <LinksTable
            links={links}
            loading={fetching}
            newestId={newestId}
            onRefresh={fetchLinks}
            baseUrl={baseUrl}
          />
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="container">
          Built for{" "}
          <strong style={{ color: "var(--slate-800)" }}>Finite Loop Club</strong>
          {" · "}
          Next.js 16 · Prisma 7 · Neon PostgreSQL
        </div>
      </footer>
    </div>
  );
}
