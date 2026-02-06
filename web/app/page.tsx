"use client";

import React, { useEffect, useMemo, useState } from "react";

type Engine = "finance" | "care_delivery" | "technology" | "risk_compliance";
type Audience = "executive" | "operational" | "technical" | "cross_functional";
type Priority = "high" | "medium" | "low";

type KB = {
  initiatives: Record<string, { id: string; name: string }>;
};

type RecommendRequest = {
  initiative_id: string;
  buying_job_id: string;
  primary_engine: Engine;
  secondary_engines: Engine[];
  audience_type: Audience;
  strategic_priority: Priority;
  trigger_context: string;
};

export default function Page() {
  const [kb, setKb] = useState<KB | null>(null);

  // Form state
  const [initiativeId, setInitiativeId] = useState<string>("");
  const [buyingJobId, setBuyingJobId] = useState<string>("problem_identification");
  const [primaryEngine, setPrimaryEngine] = useState<Engine>("finance");
  const [secondaryEngines, setSecondaryEngines] = useState<Engine[]>([]);
  const [audienceType, setAudienceType] = useState<Audience>("executive");
  const [priority, setPriority] = useState<Priority>("high");
  const [triggerContext, setTriggerContext] = useState<string>("");

  // Result state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<any>(null);

  // Load KB client-side so we can populate dropdowns
  useEffect(() => {
    async function loadKb() {
      try {
        const res = await fetch("/data/kb_dummy_v1.json");
        if (!res.ok) throw new Error(`Failed to load KB: ${res.status}`);
        const data = await res.json();
        setKb(data);

        const keys = Object.keys(data.initiatives || {});
        if (keys.length > 0) setInitiativeId(keys[0]);
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    }
    loadKb();
  }, []);

  const buyingJobOptions = useMemo(
    () => [
      { id: "problem_identification", label: "Problem Identification" },
      { id: "solution_exploration", label: "Solution Exploration" },
      { id: "requirements_building", label: "Requirements Building" },
      { id: "vendor_selection", label: "Vendor Selection" },
      { id: "purchase", label: "Purchase" },
    ],
    []
  );

  const initiativeOptions = useMemo(() => {
    if (!kb) return [];
    return Object.entries(kb.initiatives).map(([id, obj]) => ({
      id,
      label: obj.name,
    }));
  }, [kb]);

  const engineOptions: { id: Engine; label: string }[] = [
    { id: "finance", label: "Finance" },
    { id: "care_delivery", label: "Care Delivery" },
    { id: "technology", label: "Technology" },
    { id: "risk_compliance", label: "Risk & Compliance" },
  ];

  const audienceOptions: { id: Audience; label: string }[] = [
    { id: "executive", label: "Executive" },
    { id: "operational", label: "Operational" },
    { id: "technical", label: "Technical" },
    { id: "cross_functional", label: "Cross-functional" },
  ];

  const priorityOptions: { id: Priority; label: string }[] = [
    { id: "high", label: "High" },
    { id: "medium", label: "Medium" },
    { id: "low", label: "Low" },
  ];

  function toggleSecondary(engine: Engine) {
    setSecondaryEngines((prev) => {
      if (prev.includes(engine)) return prev.filter((e) => e !== engine);
      return [...prev, engine];
    });
  }

  async function onGenerate() {
    setError("");
    setResult(null);

    if (!initiativeId) {
      setError("Select an initiative.");
      return;
    }
    if (!triggerContext.trim()) {
      setError("Add a short trigger context (1–2 sentences).");
      return;
    }

    const payload: RecommendRequest = {
      initiative_id: initiativeId,
      buying_job_id: buyingJobId,
      primary_engine: primaryEngine,
      secondary_engines: secondaryEngines.filter((e) => e !== primaryEngine),
      audience_type: audienceType,
      strategic_priority: priority,
      trigger_context: triggerContext.trim(),
    };

    setLoading(true);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const rawText = await res.text();

let data: any = null;
try {
  data = rawText ? JSON.parse(rawText) : null;
} catch {
  // non-JSON response (e.g., HTML error page)
}

if (!res.ok) {
  const msg = data?.error || rawText || `Request failed (${res.status})`;
  throw new Error(msg);
}

if (!data) throw new Error("API returned empty/non-JSON response.");
setResult(data);

    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>CRAM Demand</h1>
      <p style={{ marginTop: 0, color: "#444", marginBottom: 18 }}>
        MVP content recommendation engine (dummy KB v1). Structured, traceable outputs.
      </p>

      <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0 }}>Inputs</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Initiative</div>
            <select
              value={initiativeId}
              onChange={(e) => setInitiativeId(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            >
              {initiativeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Buying Job</div>
            <select
              value={buyingJobId}
              onChange={(e) => setBuyingJobId(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            >
              {buyingJobOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Primary Engine</div>
            <select
              value={primaryEngine}
              onChange={(e) => setPrimaryEngine(e.target.value as Engine)}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            >
              {engineOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Audience Type</div>
            <select
              value={audienceType}
              onChange={(e) => setAudienceType(e.target.value as Audience)}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            >
              {audienceOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Strategic Priority</div>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            >
              {priorityOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Secondary Engines</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {engineOptions.map((opt) => (
                <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={secondaryEngines.includes(opt.id)}
                    onChange={() => toggleSecondary(opt.id)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <label style={{ display: "block", marginTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Trigger Context (1–2 sentences)</div>
          <textarea
            value={triggerContext}
            onChange={(e) => setTriggerContext(e.target.value)}
            rows={3}
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            placeholder="Example: Q3 denial rates exceeded 15%; oncology starts delayed; CFO requested cost reduction plan."
          />
        </label>

        <button
          onClick={onGenerate}
          disabled={loading}
          style={{
            marginTop: 12,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #222",
            background: loading ? "#eee" : "#111",
            color: loading ? "#333" : "#fff",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 700,
          }}
        >
          {loading ? "Generating..." : "Generate Recommendation"}
        </button>

        {error && <div style={{ marginTop: 12, color: "#b00020", fontWeight: 600 }}>{error}</div>}
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0 }}>Output</h2>

        {!result && <p style={{ color: "#555" }}>Run a recommendation to see results.</p>}

        {result && (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ background: "#fafafa", border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Trigger Context Summary</div>
              <div>{result.trigger_context_summary}</div>
            </div>

            <div style={{ background: "#fafafa", border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Recommended Assets (Ranked)</div>
              <div style={{ display: "grid", gap: 10 }}>
                {result.recommended_assets?.map((a: any) => (
                  <div
                    key={a.rank}
                    style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 10, background: "white" }}
                  >
                    <div style={{ fontWeight: 800 }}>
                      #{a.rank} — {a.asset_type}
                    </div>
                    <div style={{ color: "#444", marginTop: 4 }}>
                      <span style={{ fontWeight: 700 }}>Channel:</span> {a.primary_channel} •{" "}
                      <span style={{ fontWeight: 700 }}>Format:</span> {a.format} •{" "}
                      <span style={{ fontWeight: 700 }}>Confidence:</span> {a.confidence}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontWeight: 700 }}>Use case</div>
                      <div>{a.use_case}</div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontWeight: 700 }}>Why recommended</div>
                      <ul style={{ margin: "6px 0 0 18px" }}>
                        {a.why_recommended?.map((w: string, i: number) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontWeight: 700 }}>Artifacts supported</div>
                      <div style={{ color: "#444" }}>{(a.supported_internal_artifacts || []).join(", ")}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#fafafa", border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Top Asset Build Spec</div>
              <div style={{ fontWeight: 800 }}>{result.top_asset_build_spec?.asset_type}</div>
              <div style={{ color: "#444", marginTop: 4 }}>
                <span style={{ fontWeight: 700 }}>Channel:</span> {result.top_asset_build_spec?.primary_channel} •{" "}
                <span style={{ fontWeight: 700 }}>Format:</span> {result.top_asset_build_spec?.format}
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 700 }}>Messaging angle</div>
                <div>{result.top_asset_build_spec?.messaging_angle}</div>
              </div>
            </div>

            <details style={{ background: "#fafafa", border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>Raw JSON (expand)</summary>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  fontSize: 12,
                  background: "white",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #eee",
                  marginTop: 10,
                }}
              >
{JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </section>
    </main>
  );
}
