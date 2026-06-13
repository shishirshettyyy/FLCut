"use client";

import { Link2, CheckCircle2, XCircle, Copy, Check } from "lucide-react";
import { useState } from "react";

interface ShortenFormProps {
  onSuccess: (link: { id: number; originalUrl: string; shortCode: string; createdAt: string }) => void;
}

export default function ShortenForm({ onSuccess }: ShortenFormProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
    shortUrl?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalUrl: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ type: "error", message: data.error || "Something went wrong." });
      } else {
        const shortUrl = `${baseUrl}/${data.shortCode}`;
        setResult({ type: "success", message: shortUrl, shortUrl });
        onSuccess(data);
        setUrl("");
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
        <div className="shorten-form">
          {/* URL Input */}
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

          {/* Submit Button */}
          <button
            id="shorten-btn"
            className="shorten-btn"
            type="submit"
            disabled={loading || !url.trim()}
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
