// @ts-ignore
const router = require("koa-router")();
const axios = require("axios");

const CF_AI_USE = parseBoolean(process.env.CF_AI_USE);
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_API_BASE_URL =
  process.env.CF_AI_BASE_URL || "https://api.cloudflare.com/client/v4";
const CF_DISTILBERT_MODEL =
  process.env.CF_DISTILBERT_MODEL || "@cf/huggingface/distilbert-sst-2-int8";

router.post("/v1/classify/distilbert-sst-2-int8", async (ctx) => {
  const body = ctx.request.body || {};
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!text) {
    ctx.status = 400;
    ctx.body = {
      error: {
        message: "`text` is required for classification.",
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
      CF_DISTILBERT_MODEL,
    )}`;

    const response = await axios({
      method: "post",
      url,
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: { text },
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

    ctx.status = 200;
    ctx.body = {
      model: CF_DISTILBERT_MODEL,
      results: response.data,
    };
  } catch (error) {
    console.error("Error during Cloudflare distilbert proxy:", error);
    ctx.status = 502;
    ctx.body = {
      error: {
        message: error.message || "Failed to contact Cloudflare Workers AI.",
        type: "workers_ai_error",
      },
    };
  }
});

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

function parseBoolean(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
}

function shouldUseCloudflareAi() {
  return CF_AI_USE && CF_ACCOUNT_ID && CF_API_TOKEN;
}

module.exports = router.routes();
