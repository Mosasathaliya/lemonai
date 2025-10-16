// @ts-ignore
const router = require("koa-router")();
const axios = require("axios");

const CF_AI_USE = parseBoolean(process.env.CF_AI_USE);
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_API_BASE_URL = process.env.CF_API_BASE_URL || "https://api.cloudflare.com/client/v4";

const EMBEDDING_ROUTES = [
  {
    path: "/v1/embeddings/bge-base-en-v1.5",
    envKey: "CF_BGE_MODEL",
    defaultModel: "@cf/baai/bge-base-en-v1.5",
    buildPayload: buildBaseEmbeddingPayload,
  },
  {
    path: "/v1/embeddings/bge-small-en-v1.5",
    envKey: "CF_BGE_SMALL_MODEL",
    defaultModel: "@cf/baai/bge-small-en-v1.5",
    buildPayload: buildBaseEmbeddingPayload,
  },
  {
    path: "/v1/embeddings/embeddinggemma-300m",
    envKey: "CF_EMBEDDING_GEMMA_MODEL",
    defaultModel: "@cf/google/embeddinggemma-300m",
    buildPayload: buildBaseEmbeddingPayload,
  },
  {
    path: "/v1/embeddings/bge-large-en-v1.5",
    envKey: "CF_BGE_LARGE_MODEL",
    defaultModel: "@cf/baai/bge-large-en-v1.5",
    buildPayload: buildBaseEmbeddingPayload,
  },
  {
    path: "/v1/embeddings/bge-m3",
    envKey: "CF_BGE_M3_MODEL",
    defaultModel: "@cf/baai/bge-m3",
    buildPayload: buildBgeM3Payload,
  },
];

for (const route of EMBEDDING_ROUTES) {
  router.post(route.path, async (ctx) => {
    const body = ctx.request.body || {};
    const parsed = route.buildPayload(body);

    if (!parsed) {
      ctx.status = 400;
      ctx.body = {
        error: {
          message: "`text` must be a non-empty string or array of strings.",
          type: "bad_request",
        },
      };
      return;
    }

    if (!shouldUseCloudflareAi()) {
      ctx.status = 503;
      ctx.body = {
        error: {
          message: "Cloudflare Workers AI is not configured for the application container.",
          type: "workers_ai_unavailable",
        },
      };
      return;
    }

    const modelId = process.env[route.envKey] || route.defaultModel;

    try {
      const url = `${CF_API_BASE_URL}/accounts/${CF_ACCOUNT_ID}/ai/run/${encodeURIComponent(
        modelId,
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

      if (response.status >= 400 || (response.data && response.data.success === false)) {
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

      const data = extractEmbeddings(response.data, parsed.originalTexts);
      ctx.status = 200;
      ctx.body = {
        model: modelId,
        data,
      };
    } catch (error) {
      console.error(`Error during Cloudflare ${modelId} proxy:`, error);
      ctx.status = 502;
      ctx.body = {
        error: {
          message: error.message || "Failed to contact Cloudflare Workers AI.",
          type: "workers_ai_error",
        },
      };
    }
  });
}

function buildBaseEmbeddingPayload(body) {
  let text;
  if (typeof body?.text === "string") {
    text = body.text;
  } else if (Array.isArray(body?.text)) {
    text = body.text.filter((item) => typeof item === "string" && item.trim().length > 0);
  } else if (typeof body?.input === "string") {
    text = body.input;
  } else if (Array.isArray(body?.input)) {
    text = body.input.filter((item) => typeof item === "string" && item.trim().length > 0);
  }

  if (text === undefined) {
    return null;
  }

  if (Array.isArray(text)) {
    if (text.length === 0) {
      return null;
    }
  } else if (text.trim().length === 0) {
    return null;
  }

  const payload = { text };
  if (typeof body?.pooling === "string") {
    payload.pooling = body.pooling;
  }
  const originalTexts = Array.isArray(text) ? text : [text];
  return { payload, originalTexts };
}

function buildBgeM3Payload(body) {
  const payload = {};
  const originalTexts = [];
  let hasContent = false;

  const appendTexts = (items) => {
    for (const item of items) {
      const trimmed = item.trim();
      if (trimmed.length > 0) {
        originalTexts.push(trimmed);
      }
    }
  };

  const sanitizeTexts = (value) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? [trimmed] : [];
    }
    if (Array.isArray(value)) {
      return value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
    return [];
  };

  const sanitizeContexts = (value) => {
    if (!Array.isArray(value)) {
      return [];
    }
    const contexts = [];
    for (const item of value) {
      if (item && typeof item === "object" && typeof item.text === "string") {
        const trimmed = item.text.trim();
        if (trimmed.length > 0) {
          contexts.push({ text: trimmed });
        }
      }
    }
    return contexts;
  };

  const texts = sanitizeTexts(body?.text);
  if (texts.length > 0) {
    payload.text = Array.isArray(body?.text) ? texts : texts[0];
    appendTexts(texts);
    hasContent = true;
  }

  const query = typeof body?.query === "string" ? body.query.trim() : "";
  if (query.length > 0) {
    payload.query = query;
    originalTexts.push(query);
    hasContent = true;
  }

  const contexts = sanitizeContexts(body?.contexts);
  if (contexts.length > 0) {
    payload.contexts = contexts;
    appendTexts(contexts.map((ctx) => ctx.text));
    hasContent = true;
  }

  if (typeof body?.truncate_inputs === "boolean") {
    payload.truncate_inputs = body.truncate_inputs;
  }

  if (Array.isArray(body?.requests)) {
    const sanitizedRequests = [];
    for (const request of body.requests) {
      if (!request || typeof request !== "object") continue;
      const reqPayload = {};
      const reqTexts = sanitizeTexts(request.text);
      if (reqTexts.length > 0) {
        reqPayload.text = Array.isArray(request.text) ? reqTexts : reqTexts[0];
        appendTexts(reqTexts);
      }
      const reqContexts = sanitizeContexts(request.contexts);
      if (reqContexts.length > 0) {
        reqPayload.contexts = reqContexts;
        appendTexts(reqContexts.map((ctx) => ctx.text));
      }
      const reqQuery = typeof request.query === "string" ? request.query.trim() : "";
      if (reqQuery.length > 0) {
        reqPayload.query = reqQuery;
        originalTexts.push(reqQuery);
      }
      if (typeof request.truncate_inputs === "boolean") {
        reqPayload.truncate_inputs = request.truncate_inputs;
      }
      if (Object.keys(reqPayload).length > 0) {
        sanitizedRequests.push(reqPayload);
      }
    }
    if (sanitizedRequests.length > 0) {
      payload.requests = sanitizedRequests;
      hasContent = true;
    }
  }

  if (!hasContent) {
    return null;
  }

  return { payload, originalTexts };
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

function extractEmbeddings(data, originalText) {
  const texts = Array.isArray(originalText) ? originalText : [originalText];

  if (!data || typeof data !== "object") {
    return texts.map((text, index) => ({ index, embedding: [], text }));
  }

  if (Array.isArray(data.data)) {
    return data.data.map((item, index) => {
      if (item && typeof item === "object" && Array.isArray(item.embedding)) {
        return {
          index,
          embedding: item.embedding.map(Number),
          text: texts[index],
        };
      }
      return {
        index,
        embedding: [],
        text: texts[index],
      };
    });
  }

  if (Array.isArray(data.embeddings)) {
    return data.embeddings.map((embedding, index) => ({
      index,
      embedding: Array.isArray(embedding) ? embedding.map(Number) : [],
      text: texts[index],
    }));
  }

  if (Array.isArray(data.result)) {
    return data.result.map((embedding, index) => ({
      index,
      embedding: Array.isArray(embedding) ? embedding.map(Number) : [],
      text: texts[index],
    }));
  }

  return texts.map((text, index) => ({ index, embedding: [], text }));
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
