// @ts-ignore
const router = require("koa-router")();
const axios = require("axios");

const CF_AI_USE = parseBoolean(process.env.CF_AI_USE);
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_AURA_MODEL = process.env.CF_AURA_MODEL || "@cf/deepgram/aura-1";
const CF_API_BASE_URL = process.env.CF_AI_BASE_URL || "https://api.cloudflare.com/client/v4";

router.post("/v1/text-to-speech/aura-1", async (ctx) => {
  const body = ctx.request.body || {};
  const text = body?.text;

  if (typeof text !== "string" || text.trim().length === 0) {
    ctx.status = 400;
    ctx.body = {
      error: {
        message: "`text` is required for aura-1 text-to-speech.",
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

  const payload = buildAuraPayload(body);

  try {
    const url = `${CF_API_BASE_URL}/accounts/${CF_ACCOUNT_ID}/ai/run/${encodeURIComponent(
      CF_AURA_MODEL,
    )}`;

    const response = await axios({
      method: "post",
      url,
      headers: {
        "Authorization": `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: payload,
      responseType: "arraybuffer",
      validateStatus: () => true,
    });

    if (response.status >= 400) {
      let message = "Cloudflare Workers AI request failed.";
      if (response.data) {
        try {
          const parsed = JSON.parse(Buffer.from(response.data).toString("utf-8"));
          if (parsed?.errors?.length) {
            message = parsed.errors.map((err) => err.message || err).join("; ");
          } else if (parsed?.error?.message) {
            message = parsed.error.message;
          }
        } catch {
          message = Buffer.from(response.data).toString("utf-8");
        }
      }

      ctx.status = response.status;
      ctx.body = {
        error: {
          message,
          type: "workers_ai_error",
        },
      };
      return;
    }

    const encoding = payload.encoding || "mp3";
    const contentType =
      response.headers["content-type"] || inferAudioContentType(String(encoding));
    const buffer = Buffer.from(response.data);

    ctx.status = 200;
    ctx.set("Content-Type", contentType);
    ctx.set("Content-Length", String(buffer.length));
    ctx.body = buffer;
  } catch (error) {
    console.error("Error during Cloudflare aura-1 proxy:", error);
    ctx.status = 502;
    ctx.body = {
      error: {
        message: error.message || "Failed to contact Cloudflare Workers AI.",
        type: "workers_ai_error",
      },
    };
  }
});

function buildAuraPayload(body) {
  const allowedKeys = new Set([
    "text",
    "speaker",
    "encoding",
    "container",
    "sample_rate",
    "bit_rate",
  ]);

  const payload = {};
  for (const [key, value] of Object.entries(body)) {
    if (allowedKeys.has(key) && value !== undefined && value !== null) {
      payload[key] = value;
    }
  }

  if (!payload.encoding) {
    payload.encoding = "mp3";
  }
  if (!payload.container) {
    payload.container = "none";
  }

  return payload;
}

function inferAudioContentType(encoding) {
  switch ((encoding || "").toLowerCase()) {
    case "linear16":
      return "audio/wav";
    case "flac":
      return "audio/flac";
    case "mulaw":
    case "alaw":
      return "audio/basic";
    case "mp3":
      return "audio/mpeg";
    case "opus":
      return "audio/ogg";
    case "aac":
      return "audio/aac";
    default:
      return "application/octet-stream";
  }
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
