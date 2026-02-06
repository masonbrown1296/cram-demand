// api/recommend/index.js
// CRAM Demand (MVP) — Azure Static Web Apps Function
// - Loads the dummy KB (src/data/kb_dummy_v1.json)
// - Calls Azure OpenAI
// - Returns structured JSON

const fs = require("fs");
const path = require("path");

function readKbJson() {
  // SWA deploys API separately; bundle KB under /api/data so the function can read it.
  const kbPath = path.join(__dirname, "..", "data", "kb_dummy_v1.json");
  const raw = fs.readFileSync(kbPath, "utf8");
  return JSON.parse(raw);
}

const SYSTEM_PROMPT = `
You are CRAM Demand — a decision-support assistant that recommends demand generation content strategies.

Goal:
Given a buying context (initiative, buying job, stakeholder engine(s), audience type, strategic priority, and a trigger context), produce 3 ranked content recommendations plus a build-ready spec for the top recommendation.

Operating rules:
- Do NOT invent initiatives, buying jobs, internal artifacts, engines, asset types, channels, formats, or proof points that are not present in the provided Knowledge Base.
- You MAY adapt emphasis, ranking, messaging angle, and outline structure based on Trigger Context (treat each situation as 1-of-1), but only using the allowed building blocks from the Knowledge Base.
- If the Trigger Context implies something outside the Knowledge Base, capture it only as an Assumption and keep recommendations generic rather than inventing specifics.

Reasoning procedure (must follow):
1) Identify the decision intent of the Buying Job using KB.buying_jobs[buying_job_id].decision_intent.
2) Retrieve the relevant Initiative stage content (KB.initiatives[initiative_id].stages[buying_job_id]) when available.
3) Choose candidate enablement assets using KB.mappings.buying_job_to_asset_candidates[buying_job_id].
4) Rank the top 3 recommendations using:
   - buying job fit (highest weight)
   - primary engine fit
   - audience fit
   - trigger context nuance (urgency, risk, competing priorities)
   - strategic priority
5) For the #1 recommendation, produce a build spec and map objections to proof and/or artifacts.
6) Provide traceability: artifacts used, decision logic chain, and assumptions.

Style constraints:
- Be concise and operational. Avoid generic marketing language.
- Output MUST be valid JSON with the exact top-level keys:
  inputs_echo, trigger_context_summary, recommended_assets, top_asset_build_spec,
  proof_requirements, objection_handling, traceability
`.trim();

const JSON_SCHEMA = {
  name: "cram_demand_recommendation",
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "inputs_echo",
      "trigger_context_summary",
      "recommended_assets",
      "top_asset_build_spec",
      "proof_requirements",
      "objection_handling",
      "traceability",
    ],
    properties: {
      inputs_echo: {
        type: "object",
        additionalProperties: false,
        required: [
          "initiative_id",
          "buying_job_id",
          "primary_engine",
          "secondary_engines",
          "audience_type",
          "strategic_priority",
          "trigger_context",
        ],
        properties: {
          initiative_id: { type: "string" },
          buying_job_id: { type: "string" },
          primary_engine: {
            type: "string",
            enum: ["finance", "care_delivery", "technology", "risk_compliance"],
          },
          secondary_engines: {
            type: "array",
            items: {
              type: "string",
              enum: ["finance", "care_delivery", "technology", "risk_compliance"],
            },
          },
          audience_type: {
            type: "string",
            enum: ["executive", "operational", "technical", "cross_functional"],
          },
          strategic_priority: { type: "string", enum: ["high", "medium", "low"] },
          trigger_context: { type: "string" },
        },
      },
      trigger_context_summary: { type: "string" },
      recommended_assets: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "rank",
            "asset_type",
            "primary_channel",
            "format",
            "use_case",
            "why_recommended",
            "supported_internal_artifacts",
            "engine_alignment",
            "audience_alignment",
            "confidence",
          ],
          properties: {
            rank: { type: "integer", enum: [1, 2, 3] },
            asset_type: { type: "string" },
            primary_channel: { type: "string" },
            format: { type: "string" },
            use_case: { type: "string" },
            why_recommended: {
              type: "array",
              minItems: 2,
              maxItems: 6,
              items: { type: "string" },
            },
            supported_internal_artifacts: {
              type: "array",
              minItems: 1,
              items: { type: "string" },
            },
            engine_alignment: {
              type: "array",
              minItems: 1,
              items: {
                type: "string",
                enum: ["finance", "care_delivery", "technology", "risk_compliance"],
              },
            },
            audience_alignment: {
              type: "string",
              enum: ["executive", "operational", "technical", "cross_functional"],
            },
            confidence: { type: "string", enum: ["low", "medium", "high"] },
          },
        },
      },
      top_asset_build_spec: {
        type: "object",
        additionalProperties: false,
        required: ["asset_type", "primary_channel", "format", "messaging_angle", "outline"],
        properties: {
          asset_type: { type: "string" },
          primary_channel: { type: "string" },
          format: { type: "string" },
          messaging_angle: { type: "string" },
          outline: {
            type: "array",
            minItems: 4,
            maxItems: 12,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["section_title", "section_goal", "required_elements"],
              properties: {
                section_title: { type: "string" },
                section_goal: { type: "string" },
                required_elements: {
                  type: "array",
                  minItems: 2,
                  maxItems: 8,
                  items: { type: "string" },
                },
              },
            },
          },
        },
      },
      proof_requirements: {
        type: "object",
        additionalProperties: false,
        required: ["financial", "operational", "technical", "risk_compliance"],
        properties: {
          financial: { type: "array", items: { type: "string" } },
          operational: { type: "array", items: { type: "string" } },
          technical: { type: "array", items: { type: "string" } },
          risk_compliance: { type: "array", items: { type: "string" } },
        },
      },
     objection_handling: {
  type: "object",
  additionalProperties: false,
  required: ["finance", "care_delivery", "technology", "risk_compliance"],
  properties: {
    finance: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["objection", "response", "proof"],
        properties: {
          objection: { type: "string" },
          response: { type: "string" },
          proof: { type: "array", items: { type: "string" } },
        },
      },
    },
    care_delivery: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["objection", "response", "proof"],
        properties: {
          objection: { type: "string" },
          response: { type: "string" },
          proof: { type: "array", items: { type: "string" } },
        },
      },
    },
    technology: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["objection", "response", "proof"],
        properties: {
          objection: { type: "string" },
          response: { type: "string" },
          proof: { type: "array", items: { type: "string" } },
        },
      },
    },
    risk_compliance: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["objection", "response", "proof"],
        properties: {
          objection: { type: "string" },
          response: { type: "string" },
          proof: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
},

      },
      traceability: {
        type: "object",
        additionalProperties: false,
        required: ["artifacts_used", "decision_logic_trace", "assumptions"],
        properties: {
          artifacts_used: { type: "array", items: { type: "string" } },
          decision_logic_trace: { type: "array", items: { type: "string" } },
          assumptions: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
  strict: true,
};

async function callAzureOpenAI({ endpoint, apiKey, deployment, system, user, schema }) {
  // Uses Azure OpenAI Chat Completions with structured output request shape.
  // (We can migrate to Responses API later if desired.)
const base = endpoint.replace(/\/+$/, "");
const url = `${base}/openai/deployments/${deployment}/chat/completions?api-version=2024-08-01-preview`;


  const body = {
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.4,
    response_format: {
      type: "json_schema",
      json_schema: schema,
    },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Azure OpenAI error ${resp.status}: ${text}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content returned from Azure OpenAI.");
  return content;
}

module.exports = async function (context, req) {
  try {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

    if (!endpoint || !apiKey || !deployment) {
      context.res = {
        status: 500,
        body: {
          error:
            "Missing env vars. Set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT in Azure Static Web Apps configuration.",
        },
      };
      return;
    }

    const kb = readKbJson();
    let inputs = req.body || {};
if (typeof inputs === "string") {
  try { inputs = JSON.parse(inputs); } catch { inputs = {}; }
}

    const userMsg =
      `KNOWLEDGE_BASE_JSON:\n${JSON.stringify(kb)}\n\n` +
      `REQUEST_INPUTS_JSON:\n${JSON.stringify(inputs)}\n\n` +
      `Return only JSON that matches the provided schema.`;

    const raw = await callAzureOpenAI({
      endpoint,
      apiKey,
      deployment,
      system: SYSTEM_PROMPT,
      user: userMsg,
      schema: JSON_SCHEMA,
    });

    // raw is JSON text; parse to validate basic shape
    const parsed = JSON.parse(raw);

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: parsed,
    };
  } catch (err) {
    context.res = {
      status: 500,
      body: { error: err.message || String(err) },
    };
  }
};
