// @ts-ignore
const router = require("koa-router")();
const axios = require("axios");

const CF_AI_USE = parseBoolean(process.env.CF_AI_USE);
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_BGE_RERANKER_MODEL =
  process.env.CF_BGE_RERANKER_MODEL || "@cf/baai/bge-reranker-base";
const CF_API_BASE_URL =
  process.env.CF_API_BASE_URL || "https://api.cloudflare.com/client/v4";

router.post("/v1/rerank/bge-reranker-base", async (ctx) => {
  const body = ctx.request.body || {};
  const parsed = buildRerankerPayload(body);

  if (!parsed.valid) {
    ctx.status = 400;
    ctx.body = {
      error: {
        message:
          parsed.message ||
          "`query` is required and `contexts` must be an array with non-empty `text`.",
        type: "bad_request",
      },
    };
    return;
  }

  if (!shouldUseCloudflareAi()) {
    ctx.status = 503;
    ctx.body = {
      error: {
        message:
          "Cloudflare Workers AI is not configured for the application container.",
        type: "workers_ai_unavailable",
      },
    };
    return;
  }

  try {
    const url = `${CF_API_BASE_URL}/accounts/${CF_ACCOUNT_ID}/ai/run/${encodeURIComponent(
      CF_BGE_RERANKER_MODEL,
    )}`;
    const response = await axios({
      method: "post",
      url,
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: parsed.payload,
      responseType: "json",
      validateStatus: () => true,
    });

    if (response.status >= 400 || response.data?.success === false) {
      const message = extractErrorMessage(response);
      ctx.status = response.status || 502;
      ctx.body = {
        error: {
          message,
          type: "workers_ai_error",
        },
      };
      return;
    }

    const results = extractRerankerResults(response.data);
    ctx.status = 200;
    ctx.body = {
      model: CF_BGE_RERANKER_MODEL,
      results,
    };
  } catch (error) {
    console.error("Error during Cloudflare reranker proxy:", error);
    ctx.status = 502;
    ctx.body = {
      error: {
        message:
          error.message || "Failed to contact Cloudflare Workers AI reranker.",
        type: "workers_ai_error",
      },
    };
  }
});

function buildRerankerPayload(body) {
  const query =
    typeof body?.query === "string" ? body.query.trim() : "";
  if (!query) {
    return { valid: false, message: "`query` must be a non-empty string." };
  }

  const contextsInput = Array.isArray(body?.contexts) ? body.contexts : [];
  const contexts = [];
  for (const item of contextsInput) {
    if (!item || typeof item !== "object") continue;
    const text =
      typeof item.text === "string" ? item.text.trim() : "";
    if (text) {
      contexts.push({ text });
    }
  }

  if (contexts.length === 0) {
    return {
      valid: false,
      message:
        "`contexts` must include at least one object with a non-empty `text`.",
    };
  }

  const payload = { query, contexts };

  if (body?.top_k !== undefined) {
    const topK = Number(body.top_k);
    if (!Number.isNaN(topK) && topK >= 1) {
      payload.top_k = Math.floor(topK);
    }
  }

  return { valid: true, payload };
}

function extractErrorMessage(response) {
  try {
    if (response.data?.errors?.length) {
      return response.data.errors
        .map((err) => err?.message || JSON.stringify(err))
        .join("; ");
    }
    if (response.data?.error?.message) {
      return response.data.error.message;
    }
    if (typeof response.data === "string") {
      return response.data;
    }
  } catch (error) {
    return error.message || "Cloudflare Workers AI request failed.";
  }
  return "Cloudflare Workers AI request failed.";
}

function extractRerankerResults(data) {
  if (!data || typeof data !== "object") {
    return [];
  }

  const items = Array.isArray(data.response)
    ? data.response
    : Array.isArray(data.results)
      ? data.results
      : [];

  const results = [];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const id = Number(item.id);
    const score = Number(item.score);
    if (!Number.isNaN(id) && !Number.isNaN(score)) {
      results.push({ id, score });
    }
  }
  return results;
}

function parseBoolean(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
}

function shouldUseCloudflareAi() {
  return CF_AI_USE && CF_ACCOUNT_ID && CF_API_TOKEN;
}

module.exports = router.routes();
