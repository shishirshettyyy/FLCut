import { Hash, Zap, Clock } from "lucide-react";

interface StatsBarProps {
  totalLinks: number;
  latestCode: string;
  lastCreated: string;
}

export default function StatsBar({ totalLinks, latestCode, lastCreated }: StatsBarProps) {
  return (
    <div className="stats-strip">
      {/* Total */}
      <div className="stat-tile">
        <div className="stat-icon-wrap amber">
          <Hash size={20} strokeWidth={2.5} />
        </div>
        <div className="stat-body">
          <div className="stat-value">{totalLinks}</div>
          <div className="stat-label">Total Links</div>
        </div>
      </div>

      {/* Latest Code */}
      <div className="stat-tile">
        <div className="stat-icon-wrap teal">
          <Zap size={20} strokeWidth={2.5} />
        </div>
        <div className="stat-body">
          <div
            className="stat-value"
            style={{ fontSize: latestCode === "—" ? "1.5rem" : "1.1rem", paddingTop: "2px" }}
          >
            {latestCode}
          </div>
          <div className="stat-label">Latest Code</div>
        </div>
      </div>

      {/* Last Created */}
      <div className="stat-tile">
        <div className="stat-icon-wrap rose">
          <Clock size={20} strokeWidth={2.5} />
        </div>
        <div className="stat-body">
          <div
            className="stat-value"
            style={{ fontSize: lastCreated === "—" ? "1.5rem" : "0.82rem", lineHeight: 1.35, paddingTop: "2px" }}
          >
            {lastCreated}
          </div>
          <div className="stat-label">Last Created</div>
        </div>
      </div>
    </div>
  );
}
