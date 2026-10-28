import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Report() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [deleted, setDeleted] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api("/reports/me")
      .then(setReport)
      .catch((err) => setError(err.message));
  }, []);

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api("/reports/me", { method: "DELETE" });
      setDeleted(true);
      setShowDeleteModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  function getBadgeClass(level) {
    switch (level?.toLowerCase()) {
      case "leader":
        return "badge-leader";
      case "practitioner":
        return "badge-practitioner";
      case "exploring":
        return "badge-exploring";
      default:
        return "badge-beginner";
    }
  }

  if (error) {
    return (
      <div className="card">
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  if (deleted) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "48px 32px" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>🗑️</div>
        <h2 className="card-title">Your Diagnostic Data Was Permanently Deleted</h2>
        <p className="card-subtitle" style={{ maxWidth: "480px", margin: "0 auto 24px" }}>
          In accordance with your organization's privacy policy, all your submitted answers, scores, and risk flags have been completely wiped from the database.
        </p>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Your responses no longer contribute to team or leadership dashboards.
        </p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "48px" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading diagnostic report…</p>
      </div>
    );
  }

  const practices = report.pulse_practice || [];

  return (
    <>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
          <div>
            <h2 className="card-title" style={{ margin: "0 0 4px" }}>
              {report.name}'s AI Maturity Report
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
              Organization: <strong style={{ color: "var(--text-secondary)" }}>{report.organization}</strong>
              {report.completed_at && ` • Completed: ${new Date(report.completed_at).toLocaleDateString()}`}
            </p>
          </div>
          <span className={`metric-badge ${getBadgeClass(report.level)}`}>
            {report.level || "Unassessed"}
          </span>
        </div>

        {/* High-level metrics */}
        <div className="metrics-grid">
          <div className="metric-card">
            <p className="metric-label">Maturity Level</p>
            <p className="metric-value" style={{ color: "var(--primary)" }}>
              {report.level}
            </p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Average Score</p>
            <p className="metric-value">
              {report.average_score ?? "N/A"}{" "}
              <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "normal" }}>/ 5.0</span>
            </p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Identified Risks</p>
            <p className="metric-value" style={{ color: report.risks?.length ? "var(--rose)" : "var(--emerald)" }}>
              {report.risks?.length || 0}
            </p>
          </div>
        </div>

        {/* Active Risk Flags */}
        {report.risks?.length > 0 && (
          <div>
            <h3 style={{ fontSize: "1rem", margin: "0 0 8px", color: "var(--text-secondary)" }}>
              Identified Risk Areas:
            </h3>
            <div className="risk-chips">
              {report.risks.map((r) => (
                <span key={r} className="risk-chip">
                  <span>⚠️</span> {r.replaceAll("_", " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pulse Practice Section */}
        {practices.length > 0 && (
          <div>
            <div className="section-title">
              <div>
                <span style={{ color: "var(--primary)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>
                  ELEVATING CAPABILITY
                </span>
                <span>Pulse Practice • 10-Minute Workplace Sprints</span>
              </div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "normal" }}>
                Vetted & Evidence-Based
              </span>
            </div>

            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "4px" }}>
              Actionable micro-exercises tailored directly to your diagnostic answers. Designed to bridge the gap between AI awareness and safe, high-leverage execution.
            </p>

            <div className="practice-grid">
              {practices.map((item) => (
                <div key={item.id} className="practice-card">
                  <div className="practice-header">
                    <div className="practice-title-group">
                      <h4>{item.title}</h4>
                      <span className="practice-provider">
                        Provider: {item.provider} • <span style={{ textTransform: "capitalize" }}>{item.topic?.replace("_", " ")}</span>
                      </span>
                    </div>
                    <span className="practice-duration">⏱️ {item.duration_minutes} min practice</span>
                  </div>

                  <div className="practice-why">
                    <strong>Why you received this:</strong> {item.why}
                  </div>

                  <div className="practice-box">
                    <div className="practice-box-title">
                      <span>🎯</span> 10-Minute Workplace Exercise
                    </div>
                    <p className="practice-box-text">{item.practice}</p>
                  </div>

                  <div className="success-measure-box">
                    <span style={{ fontSize: "1.1rem" }}>✅</span>
                    <div>
                      <strong>Success Measure:</strong> {item.success_measure}
                    </div>
                  </div>

                  <div className="practice-footer">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="external-link"
                    >
                      Open Verified Resource <span>↗</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safe-Use Coaching */}
        {report.coaching?.length > 0 && (
          <div style={{ marginTop: "32px" }}>
            <h3 style={{ fontSize: "1.1rem", margin: "0 0 14px" }}>Specific Safety Directives</h3>
            {report.coaching.map((item) => (
              <div className="coaching-card" key={item.risk}>
                <b>{item.title}</b>
                <p>{item.action}</p>
              </div>
            ))}
          </div>
        )}

        {/* Next Steps */}
        {report.next_steps?.length > 0 && (
          <div style={{ marginTop: "28px" }}>
            <h3 style={{ fontSize: "1.1rem", margin: "0 0 12px" }}>Recommended Role Next Steps</h3>
            <ul style={{ paddingLeft: "20px", color: "var(--text-secondary)", lineHeight: "1.7" }}>
              {report.next_steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        <hr style={{ border: "0", borderTop: "1px solid var(--border-subtle)", margin: "32px 0 24px" }} />

        {/* Right to Delete / Privacy Compliance */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h3 style={{ fontSize: "1rem", margin: "0 0 4px", color: "var(--text-primary)" }}>
              Data Privacy & Right to Erasure
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0, maxWidth: "520px" }}>
              You may exercise your right to delete your assessment. This immediately purges all your responses, scores, and risks from this organization's database and leadership dashboards.
            </p>
          </div>
          <button className="outline-danger" onClick={() => setShowDeleteModal(true)}>
            Delete My Data
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ margin: "0 0 12px", color: "var(--rose)", fontSize: "1.2rem" }}>
              Permanently Delete Diagnostic Data?
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: "1.6" }}>
              Are you sure you want to delete all diagnostic answers, maturity scores, and risk flags for <strong>{report.organization}</strong>?
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "12px 0" }}>
              ⚠️ This action cannot be undone. All dashboard aggregates will instantly recalculate without your data.
            </p>
            <div className="modal-actions">
              <button className="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                Cancel
              </button>
              <button className="danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Purging data…" : "Confirm Permanent Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
