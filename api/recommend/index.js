// api/recommend/index.js
// CRAM Demand (MVP) — Azure Static Web Apps Function
// Reads KB from api/data/kb_dummy_v1.json
// Calls Azure OpenAI and returns structured JSON

const fs = require("fs");
const path = require("path");

// ---------- KB ----------
function readKbJson() {
  const kbPath = path.join(__dirname, "..", "data", "kb_dummy_v1.json");
  const raw = fs.readFileSync(kbPath, "utf8");
  return JSON.parse(raw);
}

// ---------- Prompts ----------
const SYSTEM_PROMPT = `
You are CRAM Demand — a decision-support assistant that recommends demand generation content strategies.

Goal:
Given a buying context (initiative, buying job, stakeholder engine(s), audience type, strategic priority, and a trigger context), produce 3 ranked content recommendations plus a build-ready spec for the top recommendation.

Operating rules:
- Do NOT invent initiatives, buying jobs, internal artifacts, engines, asset types, channels, formats, or proof points that are not present in the provided Knowledge Base.
- You MAY adapt emphasis, ranking, messaging angle, and outline structure based on Trigger Context (treat each situation as 1-of-1), but only using the allowed building blocks from the Knowledge Base.
- If the Trigger Context implies something outside the Knowledge Base, capture it only as an Assumption and keep recommendations generic rather than inventing specifics.

Output MUST be valid JSON matching the provided JSON schema.
Keep output concise and operational.
`.trim();

// ---------- JSON Schema (Structured Outputs) ----------
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

// ---------- Azure OpenAI ----------
async function callAzureOpenAI({ endpoint, apiKey, deployment, system, user, schema }) {
  const base = endpoint.replace(/\/+$/, "");
  // Use a broadly compatible preview for structured outputs
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

  if (typeof fetch !== "function") {
    throw new Error("Runtime fetch() is unavailable in this Functions environment.");
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`Azure OpenAI error ${resp.status}: ${text}`);
  }

  const data = JSON.parse(text);
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content returned from Azure OpenAI.");
  return content;
}

// ---------- Handler ----------
module.exports = async function (context, req) {
  try {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

    if (!endpoint || !apiKey || !deployment) {
      context.res = {
        status: 500,
        headers: { "Content-Type": "application/json" },
        body: {
          error:
            "Missing env vars. Set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT in Azure Static Web Apps configuration.",
        },
      };
      return;
    }

    // KB
    const kb = readKbJson();

    // Inputs
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

    const parsed = JSON.parse(raw);

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: parsed,
    };
  } catch (err) {
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: {
        error: err?.message || String(err),
        stack: err?.stack || null,
      },
    };
  }
};
