const jsonResponse = (payload) => ({
  content: [{ type: "text", text: JSON.stringify(payload, null, 2) }]
});

const withHeaders = (config) => {
  const headers = { "Content-Type": "application/json" };
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }
  return headers;
};

const postJson = async (config, path, body) => {
  const response = await fetch(`${config.baseUrl.replace(/\/+$/, "")}${path}`, {
    method: "POST",
    headers: withHeaders(config),
    body: JSON.stringify(body)
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`TalentOS API call failed (${response.status}): ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return { ok: true, raw: text };
  }
};

export default function register(api) {
  const config = api.config ?? {};

  api.registerTool(
    {
      name: "talentos_add_candidate",
      description: "Store a structured candidate profile in TalentOS/Mem0 memory.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["name", "roleTitle"],
        properties: {
          name: { type: "string" },
          roleTitle: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          currentCompany: { type: "string" },
          location: { type: "string" },
          seniority: { type: "string" },
          skills: { type: "array", items: { type: "string" } },
          referrerName: { type: "string" },
          notes: { type: "string" },
          sourceChannel: { type: "string" }
        }
      },
      async execute(_id, params) {
        const data = await postJson(config, "/api/v1/talent/candidates", params);
        return jsonResponse(data);
      }
    },
    { optional: true }
  );

  api.registerTool(
    {
      name: "talentos_log_interaction",
      description: "Store an interview or candidate interaction event.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["candidateName", "roleTitle", "stage", "summary"],
        properties: {
          candidateName: { type: "string" },
          roleTitle: { type: "string" },
          stage: { type: "string" },
          summary: { type: "string" },
          strengths: { type: "array", items: { type: "string" } },
          concerns: { type: "array", items: { type: "string" } },
          nextStep: { type: "string" },
          interactionAt: { type: "string" },
          sourceChannel: { type: "string" }
        }
      },
      async execute(_id, params) {
        const data = await postJson(config, "/api/v1/talent/interactions", params);
        return jsonResponse(data);
      }
    },
    { optional: true }
  );

  api.registerTool(
    {
      name: "talentos_followups_due",
      description: "Get follow-up commitments due in a date range.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          fromDate: { type: "string", description: "YYYY-MM-DD" },
          toDate: { type: "string", description: "YYYY-MM-DD" },
          topK: { type: "number" }
        }
      },
      async execute(_id, params) {
        const data = await postJson(config, "/api/v1/talent/query/followups", params ?? {});
        return jsonResponse(data);
      }
    },
    { optional: true }
  );
}
