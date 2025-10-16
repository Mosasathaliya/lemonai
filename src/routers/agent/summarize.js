// @ts-ignore
const router = require("koa-router")();
const axios = require("axios");

const CF_AI_USE = parseBoolean(process.env.CF_AI_USE);
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_BART_MODEL = process.env.CF_BART_MODEL || "@cf/facebook/bart-large-cnn";
const CF_API_BASE_URL = process.env.CF_API_BASE_URL || "https://api.cloudflare.com/client/v4";

router.post("/v1/summarize/bart-large-cnn", async (ctx) => {
  const body = ctx.request.body || {};
  const inputText =
    typeof body?.input_text === "string"
      ? body.input_text
      : typeof body?.text === "string"
        ? body.text
        : "";

  if (typeof inputText !== "string" || inputText.trim().length === 0) {
    ctx.status = 400;
    ctx.body = {
      error: {
        message: "`input_text` is required for bart-large-cnn summarization.",
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

  const payload = buildBartPayload(body);

  try {
    const url = `${CF_API_BASE_URL}/accounts/${CF_ACCOUNT_ID}/ai/run/${encodeURIComponent(
      CF_BART_MODEL,
    )}`;

    const response = await axios({
      method: "post",
      url,
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: payload,
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

    const summary = extractSummary(response.data);
    ctx.status = 200;
    ctx.body = { summary };
  } catch (error) {
    console.error("Error during Cloudflare bart-large-cnn proxy:", error);
    ctx.status = 502;
    ctx.body = {
      error: {
        message: error.message || "Failed to contact Cloudflare Workers AI.",
        type: "workers_ai_error",
      },
    };
  }
});

function buildBartPayload(body) {
  const payload = {
    input_text:
      typeof body?.input_text === "string"
        ? body.input_text
        : typeof body?.text === "string"
          ? body.text
          : "",
  };

  if (body?.max_length !== undefined) {
    const lengthNum = Number(body.max_length);
    if (!Number.isNaN(lengthNum) && lengthNum > 0) {
      payload.max_length = lengthNum;
    }
  }

  return payload;
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

function extractSummary(data) {
  if (!data || typeof data !== "object") {
    return "";
  }

  if (typeof data.summary === "string") {
    return data.summary;
  }

  if (data.result && typeof data.result === "object" && typeof data.result.summary === "string") {
    return data.result.summary;
  }

  if (Array.isArray(data.summaries) && data.summaries.length > 0) {
    const first = data.summaries[0];
    if (typeof first === "string") {
      return first;
    }
    if (first && typeof first === "object" && typeof first.summary === "string") {
      return first.summary;
    }
  }

  return "";
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
