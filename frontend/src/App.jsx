import React, { useState } from "react";
import Login from "./pages/Login.jsx";
import OrgPicker from "./pages/OrgPicker.jsx";
import Diagnostic from "./pages/Diagnostic.jsx";
import Report from "./pages/Report.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { setToken } from "./api.js";

export default function App() {
  const [step, setStep] = useState("login");
  const [session, setSession] = useState(null);
  const [org, setOrg] = useState(null);

  function logout() {
    setToken(null);
    setOrg(null);
    setSession(null);
    setStep("login");
  }

  function handleLoginDone(userSession) {
    setSession(userSession);
    // If user belongs to only 1 organization, auto-select it or show org picker
    setStep("org");
  }

  return (
    <div className="wrap">
      <header className="app-header">
        <div className="brand-group">
          <div className="brand-icon">⚡</div>
          <div className="brand-meta">
            <p className="brand-eyebrow">ELEVANTE AI</p>
            <h1>AI Pulse</h1>
          </div>
        </div>

        {org && (
          <div className="org-pill">
            <span>🏢</span>
            <span>{org.org_name}</span>
            <strong>• {org.role}</strong>
          </div>
        )}

        {step !== "login" && (
          <nav className="app-actions">
            {step !== "org" && session?.organizations?.length > 1 && (
              <button className="secondary" onClick={() => setStep("org")}>
                Switch Org
              </button>
            )}
            {step !== "org" && session?.organizations?.length === 1 && step === "report" && (
              <button className="secondary" onClick={() => setStep("diagnostic")}>
                Retake
              </button>
            )}
            <button className="secondary" onClick={logout}>
              Log out
            </button>
          </nav>
        )}
      </header>

      {step === "login" && <Login onDone={handleLoginDone} />}

      {step === "org" && (
        <OrgPicker
          orgs={session.organizations}
          onPick={(o) => {
            setOrg(o);
            setStep(o.role === "admin" ? "dashboard" : "diagnostic");
          }}
        />
      )}

      {step === "diagnostic" && (
        <Diagnostic onDone={() => setStep("report")} />
      )}

      {step === "report" && <Report />}

      {step === "dashboard" && <Dashboard org={org} />}
    </div>
  );
}
