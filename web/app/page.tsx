"use client";

import React, { useEffect, useMemo, useState } from "react";

type Engine = "finance" | "care_delivery" | "technology" | "risk_compliance";
type Audience = "executive" | "operational" | "technical" | "cross_functional";
type Priority = "high" | "medium" | "low";

type KB = { initiatives: Record<string, { id: string; name: string }> };

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

  // Inputs
  const [initiativeId, setInitiativeId] = useState<string>("");
  const [buyingJobId, setBuyingJobId] = useState<string>("problem_identification");
  const [primaryEngine, setPrimaryEngine] = useState<Engine>("finance");
  const [secondaryEngines, setSecondaryEngines] = useState<Engine[]>([]);
  const [audienceType, setAudienceType] = useState<Audience>("executive");
  const [priority, setPriority] = useState<Priority>("high");
  const [triggerContext, setTriggerContext] = useState<string>("");

  // Result
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<any>(null);

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
    return Object.entries(kb.initiatives).map(([id, obj]) => ({ id, label: obj.name }));
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
    setSecondaryEngines((prev) => (prev.includes(engine) ? prev.filter((e) => e !== engine) : [...prev, engine]));
  }

  async function onGenerate() {
    setError("");
    setResult(null);

    if (!initiativeId) return setError("Select an initiative.");
    if (!triggerContext.trim()) return setError("Add a short trigger context (1–2 sentences).");

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
      } catch {}

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

  const selectedInitiativeLabel =
    initiativeOptions.find((x) => x.id === initiativeId)?.label || "—";
  const selectedBuyingJobLabel =
    buyingJobOptions.find((x) => x.id === buyingJobId)?.label || "—";

  return (
    <div className="container">
      <div className="topbar">
        <div className="brand">
          <div className="badge" aria-hidden="true" />
          <div className="title">
            <h1>CRAM Demand</h1>
            <p>Content recommendation engine • structured outputs • dummy KB v1</p>
          </div>
        </div>
        <div className="kpi" aria-label="context chips">
          <div className="chip">Initiative: {selectedInitiativeLabel}</div>
          <div className="chip">Buying Job: {selectedBuyingJobLabel}</div>
        </div>
      </div>

      <div className="grid">
        {/* Inputs */}
        <div className="card">
          <div className="cardHead">
            <h2>Inputs</h2>
            <span className="note">Required: initiative + trigger context</span>
          </div>
          <div className="cardBody">
            <label className="label">Initiative</label>
            <select className="select" value={initiativeId} onChange={(e) => setInitiativeId(e.target.value)}>
              {initiativeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div style={{ height: 12 }} />

            <label className="label">Buying Job</label>
            <select className="select" value={buyingJobId} onChange={(e) => setBuyingJobId(e.target.value)}>
              {buyingJobOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div style={{ height: 12 }} />

            <div className="row2">
              <div>
                <label className="label">Primary Engine</label>
                <select className="select" value={primaryEngine} onChange={(e) => setPrimaryEngine(e.target.value as Engine)}>
                  {engineOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Audience Type</label>
                <select className="select" value={audienceType} onChange={(e) => setAudienceType(e.target.value as Audience)}>
                  {audienceOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ height: 12 }} />

            <div className="row2">
              <div>
                <label className="label">Strategic Priority</label>
                <select className="select" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                  {priorityOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Secondary Engines</label>
                <div className="pills" style={{ marginTop: 2 }}>
                  {engineOptions.map((opt) => (
                    <label key={opt.id} className="pill">
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

            <div style={{ height: 12 }} />

            <label className="label">Trigger Context</label>
            <textarea
              className="textarea"
              value={triggerContext}
              onChange={(e) => setTriggerContext(e.target.value)}
              placeholder="Example: Q3 denial rates exceeded 15%; oncology starts delayed; CFO requested a cost-reduction plan while IT flagged integration risk."
            />

            <div style={{ height: 12 }} />

            <button className="btn" onClick={onGenerate} disabled={loading}>
              {loading ? "Generating..." : "Generate recommendation"}
            </button>

            {error && <div className="alert">{error}</div>}
          </div>
        </div>

        {/* Output */}
        <div className="card">
          <div className="cardHead">
            <h2>Recommendation</h2>
            <span className="note">{result ? "Result ready" : "Run inputs to generate"}</span>
          </div>

          <div className="cardBody">
            {!result && (
              <div>
                <p style={{ marginTop: 0, color: "var(--muted)" }}>
                  You’ll get ranked asset recommendations, build spec, proof requirements, and traceability.
                </p>
                <div className="hr" />
                <p className="note" style={{ margin: 0 }}>
                  Tip: Use trigger context to surface urgency, objections, or constraints (budget, integration, compliance).
                </p>
              </div>
            )}

            {result && (
              <>
                <div className="asset" style={{ background: "linear-gradient(180deg, var(--tint-cyan), #fff)" }}>
                  <div className="assetTitle">
                    <strong>Trigger summary</strong>
                  </div>
                  <div style={{ marginTop: 6 }}>{result.trigger_context_summary}</div>
                </div>

                <div style={{ height: 12 }} />

                <div className="asset">
                  <div className="assetTitle">
                    <strong>Top 3 recommended assets</strong>
                    <span className="note">Ranked</span>
                  </div>

                  <div className="assetGrid">
                    {(result.recommended_assets || []).map((a: any) => (
                      <div key={a.rank} className="asset" style={{ boxShadow: "none" }}>
                        <div className="assetTitle">
                          <strong>
                            #{a.rank} — {a.asset_type}
                          </strong>
                          <span className="note">{a.confidence} confidence</span>
                        </div>
                        <div className="assetMeta">
                          <b>Channel:</b> {a.primary_channel} • <b>Format:</b> {a.format} •{" "}
                          <b>Audience:</b> {a.audience_alignment}
                        </div>
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontWeight: 800, fontSize: 12, color: "var(--cmm-navy)" }}>Use case</div>
                          <div>{a.use_case}</div>
                        </div>
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontWeight: 800, fontSize: 12, color: "var(--cmm-navy)" }}>Why recommended</div>
                          <ul>
                            {(a.why_recommended || []).map((w: string, i: number) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontWeight: 800, fontSize: 12, color: "var(--cmm-navy)" }}>Artifacts supported</div>
                          <div className="note" style={{ fontSize: 13 }}>
                            {(a.supported_internal_artifacts || []).join(", ")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ height: 12 }} />

                <div className="asset" style={{ background: "linear-gradient(180deg, var(--tint-magenta), #fff)" }}>
                  <div className="assetTitle">
                    <strong>Build spec for #1</strong>
                    <span className="note">
                      {result.top_asset_build_spec?.primary_channel} • {result.top_asset_build_spec?.format}
                    </span>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: 12, color: "var(--cmm-navy)" }}>Messaging angle</div>
                    <div>{result.top_asset_build_spec?.messaging_angle}</div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 12, color: "var(--cmm-navy)" }}>Outline</div>
                    <div style={{ marginTop: 6 }}>
                      {(result.top_asset_build_spec?.outline || []).map((s: any, idx: number) => (
                        <div key={idx} className="asset" style={{ boxShadow: "none", marginTop: 8 }}>
                          <div className="assetTitle">
                            <strong style={{ fontSize: 13 }}>{s.section_title}</strong>
                            <span className="note">Section {idx + 1}</span>
                          </div>
                          <div className="note" style={{ fontSize: 13, marginTop: 6 }}>
                            {s.section_goal}
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <div style={{ fontWeight: 800, fontSize: 12, color: "var(--cmm-navy)" }}>
                              Required elements
                            </div>
                            <ul>
                              {(s.required_elements || []).map((x: string, i: number) => (
                                <li key={i}>{x}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ height: 12 }} />

                <details className="asset">
                  <summary style={{ cursor: "pointer", fontWeight: 800 }}>Raw JSON</summary>
                  <pre style={{ marginTop: 10 }}>{JSON.stringify(result, null, 2)}</pre>
                </details>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, textAlign: "center" }} className="note">
        Internal MVP • guardrailed to KB • replace KB later without UI rewrite
      </div>
    </div>
  );
}
