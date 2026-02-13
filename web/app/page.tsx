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
    if (!triggerContext.trim())
      return setError("Add a short trigger context (1–2 sentences).");

    const payload: RecommendRequest = {
      initiative_id: initiativeId,
      buying_job_id: buyingJobId,
      primary_engine: primaryEngine,
      secondary_engines: secondaryEngines.filter(
        (e) => e !== primaryEngine
      ),
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
        const msg =
          data?.error || rawText || `Request failed (${res.status})`;
        throw new Error(msg);
      }

      if (!data)
        throw new Error("API returned empty/non-JSON response.");

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
          <div className="badge" />
          <div className="title">
            <h1>CRAM Demand</h1>
            <p>Content recommendation engine • structured outputs • dummy KB v1</p>
          </div>
        </div>
      </div>

      <div className="grid">
        {/* LEFT: INPUTS */}
        <div className="card">
          <div className="cardHead">
            <h2>Input Parameters</h2>
          </div>
          <div className="cardBody">
            <div className="formStack">
              <div className="formGroup">
                <label className="label">Initiative</label>
                <select
                  className="select"
                  value={initiativeId}
                  onChange={(e) => setInitiativeId(e.target.value)}
                >
                  {initiativeOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="formGroup">
                <label className="label">Buying Job</label>
                <select
                  className="select"
                  value={buyingJobId}
                  onChange={(e) =>
                    setBuyingJobId(e.target.value)
                  }
                >
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
                  onChange={(e) =>
                    setPrimaryEngine(e.target.value as Engine)
                  }
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
                  <select
                    className="select"
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as Priority)
                    }
                  >
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
                    onChange={(e) =>
                      setAudienceType(e.target.value as Audience)
                    }
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
                  onChange={(e) =>
                    setTriggerContext(e.target.value)
                  }
                />
              </div>

              <div className="actionRow">
                <button
                  className="btnSecondary"
                  onClick={onReset}
                  type="button"
                >
                  Reset
                </button>

                <button
                  className="btn btnPrimary"
                  onClick={onGenerate}
                  disabled={loading}
                  type="button"
                >
                  {loading
                    ? "Generating..."
                    : "Generate Recommendation"}
                </button>
              </div>

              {error && <div className="alert">{error}</div>}
            </div>
          </div>
        </div>

        {/* RIGHT: OUTPUT */}
        <div className="card">
          <div className="cardHead">
            <h2>Recommendation</h2>
          </div>

          <div className="cardBody">
            {!result && (
              <div className="note">
                Run inputs to generate a recommendation.
              </div>
            )}

            {result && (
              <>
                {/* HERO SUMMARY */}
                <div className="hero">
                  <div className="heroGrid">
                    <div>
                      <div className="heroLabel">
                        Initiative
                      </div>
                      <div className="heroValue">
                        {selectedInitiativeLabel}
                      </div>
                    </div>

                    <div>
                      <div className="heroLabel">
                        Buying Job
                      </div>
                      <div className="heroValue">
                        {selectedBuyingJobLabel}
                      </div>
                    </div>
                  </div>

                  <div className="subtleDivider" />

                  <div>
                    <div className="heroLabel">
                      Trigger Context
                    </div>
                    <div className="heroValue">
                      {triggerContext}
                    </div>
                  </div>
                </div>

                {/* RECOMMENDED ASSETS */}
                <div style={{ marginTop: 16 }}>
                  <div className="moduleTitle">
                    <h3>Recommended Assets (Ranked)</h3>
                  </div>

                  <div style={{ display: "grid", gap: 12 }}>
                    {(result.recommended_assets || []).map(
                      (a: any) => (
                        <div
                          key={a.rank}
                          className={`rankCard ${
                            a.rank === 1
                              ? "rankCardTop"
                              : ""
                          }`}
                        >
                          <div className="rankHead">
                            <div className="rankBadge">
                              {a.rank}
                            </div>
                            <div className="rankTitle">
                              <strong>
                                {a.asset_type}
                              </strong>
                              <div className="desc">
                                {a.use_case}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
