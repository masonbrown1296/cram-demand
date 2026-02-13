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

function titleCase(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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
    setSecondaryEngines((prev) =>
      prev.includes(engine) ? prev.filter((e) => e !== engine) : [...prev, engine]
    );
  }

  function onReset() {
    setBuyingJobId("problem_identification");
    setPrimaryEngine("finance");
    setSecondaryEngines([]);
    setAudienceType("executive");
    setPriority("high");
    setTriggerContext("");
    setResult(null);
    setError("");
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

  const primaryEngineLabel =
    engineOptions.find((e) => e.id === primaryEngine)?.label || "—";

  const secondaryEngineLabels = secondaryEngines
    .filter((e) => e !== primaryEngine)
    .map((e) => engineOptions.find((x) => x.id === e)?.label)
    .filter(Boolean) as string[];

  return (
    <div className="container">
      <div className="topbar">
        <div className="brand">
          <div className="badge" />
          <div className="title">
            <h1>CRAM Demand</h1>
            <p>Buyer-journey content recommender • internal MVP</p>
          </div>
        </div>
      </div>

      <div className="grid">
        {/* LEFT: INPUTS */}
        <div className="card">
          <div className="cardHead">
            <div className="sectionTitle">
              <div className="iconBox" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7 7h10M7 12h10M7 17h6"
                    stroke="var(--cmm-navy)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h2>Input Parameters</h2>
            </div>
          </div>
          <div className="cardBody">
            <div className="formStack">
              <div className="formGroup">
                <label className="label">Initiative</label>
                <select className="select" value={initiativeId} onChange={(e) => setInitiativeId(e.target.value)}>
                  {initiativeOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="formGroup">
                <label className="label">Buying Job</label>
                <select className="select" value={buyingJobId} onChange={(e) => setBuyingJobId(e.target.value)}>
                  {buyingJobOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="formGroup">
                <label className="label">Primary Engine</label>
                <select
                  className="select"
                  value={primaryEngine}
                  onChange={(e) => setPrimaryEngine(e.target.value as Engine)}
                >
                  {engineOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label} Engine
                    </option>
                  ))}
                </select>
              </div>

              <div className="formGroup">
                <label className="label">Secondary Engines</label>
                <div className="pills">
                  {engineOptions.map((opt) => (
                    <label key={opt.id} className="pill">
                      <input
                        type="checkbox"
                        checked={secondaryEngines.includes(opt.id)}
                        onChange={() => toggleSecondary(opt.id)}
                      />
                      {opt.label} Engine
                    </label>
                  ))}
                </div>
              </div>

              <div className="row2">
                <div className="formGroup">
                  <label className="label">Strategic Priority</label>
                  <select className="select" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                    {priorityOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="formGroup">
                  <label className="label">Audience Type</label>
                  <select
                    className="select"
                    value={audienceType}
                    onChange={(e) => setAudienceType(e.target.value as Audience)}
                  >
                    {audienceOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="formGroup">
                <label className="label">Trigger Context</label>
                <textarea
                  className="textarea"
                  value={triggerContext}
                  onChange={(e) => setTriggerContext(e.target.value)}
                  placeholder="e.g., oncology starts delayed; denial rate spike; CFO pushing cost controls; IT flagged integration risk."
                />
              </div>

              <div className="actionRow">
                <button className="btnSecondary" onClick={onReset} type="button">
                  Reset
                </button>

                <button className="btn btnPrimary" onClick={onGenerate} disabled={loading} type="button">
                  {loading ? "Generating..." : "Generate Recommendation"}
                  <svg className="btnIcon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <path
                      d="M13 6l6 6-6 6"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              {error && <div className="alert">{error}</div>}

              <div className="note" style={{ marginTop: 4 }}>
                Tip: Strong trigger context improves ranking and messaging angle.
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: OUTPUT */}
        <div className="card">
          <div className="cardHead">
            <div className="sectionTitle">
              <div className="iconBox" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 19c4-8 12-8 16 0"
                    stroke="var(--cmm-navy)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 5v6l4 2"
                    stroke="var(--cmm-navy)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2>Recommendation</h2>
            </div>
            <span className="note">{result ? "Result ready" : "Run inputs to generate"}</span>
          </div>

          <div className="cardBody">
            {!result && (
              <div>
                <p style={{ marginTop: 0, color: "var(--muted)" }}>
                  You’ll get ranked asset recommendations, a build spec for the top asset, proof requirements, and likely
                  objections.
                </p>
              </div>
            )}

            {result && (
              <>
                {/* HERO SUMMARY (Base44-like) */}
                <div className="hero" style={{ marginBottom: 14 }}>
                  <div className="heroGrid">
                    <div>
                      <div className="heroLabel">Initiative</div>
                      <div className="heroValue">{selectedInitiativeLabel}</div>
                      <div className="heroChips">
                        <span className="heroChip">{primaryEngineLabel} Engine</span>
                        {secondaryEngineLabels.map((l) => (
                          <span key={l} className="heroChip">
                            {l} Engine
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="heroLabel">Buying Job</div>
                      <div className="heroValue">{selectedBuyingJobLabel}</div>

                      <div style={{ marginTop: 10 }}>
                        <div className="heroLabel">Priority / Audience</div>
                        <div className="heroValue">
                          {titleCase(priority)} • {audienceOptions.find((a) => a.id === audienceType)?.label}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="subtleDivider" style={{ background: "rgba(255,255,255,0.12)" }} />

                  <div>
                    <div className="heroLabel">Trigger Context</div>
                    <div className="heroValue" style={{ fontWeight: 700 }}>
                      {triggerContext || "—"}
                    </div>
                  </div>
                </div>

                {/* TRIGGER SUMMARY */}
                <div className="asset" style={{ background: "linear-gradient(180deg, var(--tint-cyan), #fff)" }}>
                  <div className="assetTitle">
                    <strong>Trigger Context Summary</strong>
                  </div>
                  <div style={{ marginTop: 6 }}>{result.trigger_context_summary}</div>
                </div>

                <div style={{ height: 12 }} />

                {/* RECOMMENDED ASSETS */}
                <div className="moduleTitle">
                  <h3>Recommended Assets (Ranked)</h3>
                  <span className="meta">Top 3</span>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {(result.recommended_assets || []).map((a: any) => (
                    <div key={a.rank} className={`rankCard ${a.rank === 1 ? "rankCardTop" : ""}`}>
                      <div className="rankHead">
                        <div className="rankBadge">{a.rank}</div>
                        <div className="rankTitle">
                          <strong>{a.asset_type}</strong>
                          <div className="desc">{a.use_case}</div>
                        </div>
                        <div className="note" style={{ marginLeft: "auto", fontWeight: 800 }}>
                          {a.confidence} confidence
                        </div>
                      </div>

                      <div className="kvRow">
                        <span className="kv">Channel: {a.primary_channel}</span>
                        <span className="kv">Format: {a.format}</span>
                        <span className="kv">Audience: {a.audience_alignment}</span>
                      </div>

                      <div className="subtleDivider" />

                      <div style={{ display: "grid", gap: 10 }}>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: 12, color: "var(--cmm-navy)" }}>Why recommended</div>
                          <ul>
                            {(a.why_recommended || []).map((w: string, i: number) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <div style={{ fontWeight: 900, fontSize: 12, color: "var(--cmm-navy)" }}>
                            Artifacts supported
                          </div>
                          <div className="note" style={{ fontSize: 13 }}>
                            {(a.supported_internal_artifacts || []).join(", ")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* BUILD SPEC */}
                <div style={{ height: 14 }} />

                <div className="moduleTitle">
                  <h3>Detailed Outline: {result.top_asset_build_spec?.asset_type}</h3>
                  <span className="meta">
                    {result.top_asset_build_spec?.primary_channel} • {result.top_asset_build_spec?.format}
                  </span>
                </div>

                <div className="asset" style={{ background: "linear-gradient(180deg, var(--tint-magenta), #fff)" }}>
                  <div style={{ marginTop: 2 }}>
                    <div style={{ fontWeight: 900, fontSize: 12, color: "var(--cmm-navy)" }}>Messaging angle</div>
                    <div style={{ marginTop: 6 }}>{result.top_asset_build_spec?.messaging_angle}</div>
                  </div>

                  <div className="subtleDivider" />

                  <div style={{ fontWeight: 900, fontSize: 12, color: "var(--cmm-navy)" }}>Outline</div>

                  <div style={{ marginTop: 8, display: "grid", gap: 10 }}>
                    {(result.top_asset_build_spec?.outline || []).map((s: any, idx: number) => (
                      <div key={idx} className="asset" style={{ boxShadow: "none" }}>
                        <div className="assetTitle">
                          <strong style={{ fontSize: 13 }}>
                            {idx + 1}. {s.section_title}
                          </strong>
                        </div>
                        <div className="note" style={{ fontSize: 13, marginTop: 6 }}>
                          {s.section_goal}
                        </div>

                        <div style={{ marginTop: 8 }}>
                          <div style={{ fontWeight: 900, fontSize: 12, color: "var(--cmm-navy)" }}>
                            Required elements
                          </div>
                          <ul style={{ marginTop: 6 }}>
                            {(s.required_elements || []).map((x: string, i: number) => (
                              <li key={i}>{x}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* REQUIRED PROOF ELEMENTS */}
                <div style={{ marginTop: 14 }}>
                  <div className="moduleTitle">
                    <h3>Required Proof Elements</h3>
                    <span className="meta">What this asset must prove</span>
                  </div>

                  <div className="columns3">
                    <div className="miniCard">
                      <h4>Financial</h4>
                      <ul>
                        {(result.proof_requirements?.financial || []).slice(0, 5).map((x: string, i: number) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="miniCard">
                      <h4>Operational</h4>
                      <ul>
                        {(result.proof_requirements?.operational || []).slice(0, 5).map((x: string, i: number) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="miniCard">
                      <h4>Risk / Compliance</h4>
                      <ul>
                        {(result.proof_requirements?.risk_compliance || []).slice(0, 5).map((x: string, i: number) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* LIKELY OBJECTIONS */}
                <div style={{ marginTop: 14 }}>
                  <div className="moduleTitle">
                    <h3>Likely Objections to Address</h3>
                    <span className="meta">By stakeholder engine</span>
                  </div>

                  <div className="engineGrid">
                    {[
                      { key: "finance", label: "Finance Engine", dot: "var(--cmm-magenta)" },
                      { key: "care_delivery", label: "Care Delivery Engine", dot: "var(--cmm-cyan)" },
                      { key: "technology", label: "Technology Engine", dot: "var(--cmm-orange)" },
                      { key: "risk_compliance", label: "Risk & Compliance Engine", dot: "var(--cmm-navy)" },
                    ].map((eng) => (
                      <div key={eng.key} className="engineCard">
                        <div className="engineCardHead">
                          <span className="engineDot" style={{ background: eng.dot }} />
                          <strong>{eng.label}</strong>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {(result.objection_handling?.[eng.key] || []).slice(0, 4).map((o: any, i: number) => (
                            <li key={i}>{o.objection}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RAW JSON */}
                <div style={{ height: 12 }} />
                <details className="asset">
                  <summary style={{ cursor: "pointer", fontWeight: 900 }}>Raw JSON</summary>
                  <pre style={{ marginTop: 10 }}>{JSON.stringify(result, null, 2)}</pre>
                </details>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, textAlign: "center" }} className="note">
        Internal MVP • logic clarity & framework alignment testing
      </div>
    </div>
  );
}
