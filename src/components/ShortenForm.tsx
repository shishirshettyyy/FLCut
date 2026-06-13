"use client";

import {
  Link2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Tag,
  CalendarX,
  CalendarClock,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";

interface LinkData {
  id: number;
  originalUrl: string;
  shortCode: string;
  createdAt: string;
  expiresAt?: string | null;
  activatesAt?: string | null;
}

interface ShortenFormProps {
  onSuccess: (link: LinkData) => void;
}

const RESERVED_WORDS = [
  "api",
  "admin",
  "dashboard",
  "analytics",
  "settings",
  "login",
  "register",
  "help",
  "about",
];

const ALIAS_RE = /^[a-z0-9-]{2,30}$/i;

function getAliasValidationState(alias: string): {
  status: "idle" | "ok" | "reserved" | "invalid";
  message: string;
} {
  if (!alias) return { status: "idle", message: "" };
  const lower = alias.toLowerCase();
  if (RESERVED_WORDS.includes(lower))
    return {
      status: "reserved",
      message: `"${lower}" is a reserved word — pick another alias.`,
    };
  if (!ALIAS_RE.test(alias))
    return {
      status: "invalid",
      message: "Only letters, numbers & hyphens (2–30 chars).",
    };
  return { status: "ok", message: "Looks good!" };
}

export default function ShortenForm({ onSuccess }: ShortenFormProps) {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [activatesAt, setActivatesAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
    shortUrl?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const aliasState = getAliasValidationState(alias);
  const aliasBlocked = aliasState.status === "reserved" || aliasState.status === "invalid";

  // Current datetime string (YYYY-MM-DDTHH:MM) for min datetime constraint
  const nowStr = new Date().toISOString().slice(0, 16);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    if (alias && aliasBlocked) return;

    setLoading(true);
    setResult(null);

    try {
      const body: Record<string, string | null> = {
        originalUrl: url.trim(),
        customAlias: alias.trim() || null,
        expiresAt: expiresAt || null,
        activatesAt: activatesAt || null,
      };

      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ type: "error", message: data.error || "Something went wrong." });
      } else {
        const shortUrl = `${baseUrl}/${data.shortCode}`;
        setResult({ type: "success", message: shortUrl, shortUrl });
        onSuccess(data);
        setUrl("");
        setAlias("");
        setExpiresAt("");
        setActivatesAt("");
      }
    } catch (err) {
      setResult({ type: "error", message: "Network error — " + String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result?.shortUrl) return;
    await navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        {/* URL Input */}
        <div className="shorten-form">
          <label className="url-field" htmlFor="url-input">
            <span className="url-field-icon">
              <Link2 size={17} strokeWidth={2} />
            </span>
            <input
              id="url-input"
              className="url-input"
              type="url"
              placeholder="Paste your long URL here…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={loading}
              autoComplete="off"
            />
          </label>

          <button
            id="shorten-btn"
            className="shorten-btn"
            type="submit"
            disabled={loading || !url.trim() || aliasBlocked}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Working…
              </>
            ) : (
              <>
                <Link2 size={16} strokeWidth={2.5} />
                Shorten
              </>
            )}
          </button>
        </div>

        {/* Advanced Options Row */}
        <div className="advanced-row">
          {/* Custom Alias */}
          <div className="adv-field-wrap">
            <label className="adv-label" htmlFor="alias-input">
              <Tag size={12} strokeWidth={2.5} />
              Custom Alias
            </label>
            <div
              className={`adv-input-wrap ${
                aliasState.status === "reserved"
                  ? "reserved"
                  : aliasState.status === "invalid"
                  ? "invalid"
                  : aliasState.status === "ok"
                  ? "ok"
                  : ""
              }`}
            >
              <span className="adv-prefix">flcut.io/</span>
              <input
                id="alias-input"
                className="adv-input"
                type="text"
                placeholder="my-link"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                disabled={loading}
                autoComplete="off"
                maxLength={30}
              />
              {aliasState.status === "ok" && (
                <span className="alias-status-icon ok">
                  <Check size={13} strokeWidth={3} />
                </span>
              )}
              {(aliasState.status === "reserved" ||
                aliasState.status === "invalid") && (
                <span className="alias-status-icon bad">
                  {aliasState.status === "reserved" ? (
                    <ShieldAlert size={13} strokeWidth={2.5} />
                  ) : (
                    <AlertTriangle size={13} strokeWidth={2.5} />
                  )}
                </span>
              )}
            </div>
            {alias && aliasState.message && (
              <p
                className={`alias-hint ${
                  aliasState.status === "ok" ? "hint-ok" : "hint-bad"
                }`}
              >
                {aliasState.status === "reserved" && (
                  <ShieldAlert size={11} strokeWidth={2.5} />
                )}
                {aliasState.status === "invalid" && (
                  <AlertTriangle size={11} strokeWidth={2.5} />
                )}
                {aliasState.status === "ok" && <Check size={11} strokeWidth={3} />}
                {aliasState.message}
              </p>
            )}
            {!alias && (
              <p className="alias-hint hint-neutral">
                Leave blank for an auto-generated code
              </p>
            )}
          </div>

          {/* Expiry Date */}
          <div className="adv-field-wrap">
            <label className="adv-label" htmlFor="expires-input">
              <CalendarX size={12} strokeWidth={2.5} />
              Expires On
            </label>
            <input
              id="expires-input"
              className="adv-date-input"
              type="datetime-local"
              value={expiresAt}
              min={nowStr}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={loading}
            />
            <p className="alias-hint hint-neutral">
              Link returns &ldquo;expired&rdquo; after this time
            </p>
          </div>

          {/* Activation Date */}
          <div className="adv-field-wrap">
            <label className="adv-label" htmlFor="activates-input">
              <CalendarClock size={12} strokeWidth={2.5} />
              Activates On
            </label>
            <input
              id="activates-input"
              className="adv-date-input"
              type="datetime-local"
              value={activatesAt}
              min={nowStr}
              onChange={(e) => setActivatesAt(e.target.value)}
              disabled={loading}
            />
            <p className="alias-hint hint-neutral">
              Link won&apos;t work before this time
            </p>
          </div>
        </div>

        {/* Reserved words reference */}
        <div className="reserved-words-ref">
          <ShieldAlert size={11} strokeWidth={2.5} />
          Reserved aliases:{" "}
          {RESERVED_WORDS.map((w) => (
            <code key={w} className="reserved-tag">
              {w}
            </code>
          ))}
        </div>
      </form>

      {/* Result Banner */}
      {result && (
        <div className={`result-banner ${result.type}`}>
          <div className={`result-icon ${result.type}`}>
            {result.type === "success" ? (
              <CheckCircle2 size={18} strokeWidth={2} />
            ) : (
              <XCircle size={18} strokeWidth={2} />
            )}
          </div>

          <div className="result-content">
            <div className="result-label">
              {result.type === "success" ? "Saved to database ✓" : "Error"}
            </div>
            <div className="result-url">{result.message}</div>
          </div>

          {result.type === "success" && (
            <button
              id="copy-btn"
              className={`copy-btn ${copied ? "done" : ""}`}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check size={13} strokeWidth={2.5} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={13} strokeWidth={2} />
                  Copy
                </>
              )}
            </button>
          )}
        </div>
      )}
    </>
  );
}
