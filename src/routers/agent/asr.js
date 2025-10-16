// @ts-ignore
const router = require("koa-router")();
const axios = require("axios");

const CF_AI_USE = parseBoolean(process.env.CF_AI_USE);
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_API_BASE_URL =
  process.env.CF_AI_BASE_URL || "https://api.cloudflare.com/client/v4";
const CF_FLUX_MODEL =
  process.env.CF_FLUX_MODEL || "@cf/deepgram/flux";

router.post("/v1/asr/flux", async (ctx) => {
  const body = ctx.request.body || {};

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

  let audioBytes;
  try {
    audioBytes = await resolveAudioBytes(body);
  } catch (error) {
    console.error("Failed to resolve audio bytes", error);
    ctx.status = 400;
    ctx.body = {
      error: {
        message: error.message || "Failed to load audio.",
        type: "bad_request",
      },
    };
    return;
  }

  if (!audioBytes || !audioBytes.length) {
    ctx.status = 400;
    ctx.body = {
      error: {
        message: "Provide `audio`, `audio_base64`, or `audio_url`.",
        type: "bad_request",
      },
    };
    return;
  }

  const encoding =
    typeof body?.encoding === "string" && body.encoding.trim().length > 0
      ? body.encoding.trim()
      : "linear16";
  const sampleRate = clampInteger(body?.sample_rate, 8000, 48000) ?? 16000;

  const payload = {
    audio: Array.from(audioBytes),
    encoding,
    sample_rate: sampleRate,
  };

  if (typeof body?.language === "string" && body.language.trim().length > 0) {
    payload.language = body.language.trim();
  }

  try {
    const url = `${CF_API_BASE_URL}/accounts/${CF_ACCOUNT_ID}/ai/run/${encodeURIComponent(
      CF_FLUX_MODEL,
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
      model: CF_FLUX_MODEL,
      results: response.data,
    };
  } catch (error) {
    console.error("Error during Cloudflare flux proxy:", error);
    ctx.status = 502;
    ctx.body = {
      error: {
        message: error.message || "Failed to contact Cloudflare Workers AI.",
        type: "workers_ai_error",
      },
    };
  }
});

async function resolveAudioBytes(body) {
  const audio = body?.audio;
  if (Array.isArray(audio) && audio.length > 0) {
    const sanitized = audio
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value >= 0 && value <= 255);
    if (sanitized.length > 0) {
      return Uint8Array.from(sanitized);
    }
  }

  if (typeof body?.audio_base64 === "string" && body.audio_base64.trim()) {
    return decodeBase64(body.audio_base64.trim());
  }

  if (typeof body?.audio_url === "string" && body.audio_url.trim()) {
    const response = await axios.get(body.audio_url.trim(), {
      responseType: "arraybuffer",
      validateStatus: () => true,
    });
    if (response.status >= 400) {
      throw new Error(`Failed to fetch audio from ${body.audio_url}`);
    }
    return new Uint8Array(response.data);
  }

  return null;
}

function decodeBase64(input) {
  const normalized = input.replace(/^data:[^;]+;base64,/, "");
  return new Uint8Array(Buffer.from(normalized, "base64"));
}

function clampInteger(value, min, max) {
  if (value === undefined || value === null) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const int = Math.floor(num);
  if (int < min || int > max) return null;
  return int;
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

function parseBoolean(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
}

function shouldUseCloudflareAi() {
  return CF_AI_USE && CF_ACCOUNT_ID && CF_API_TOKEN;
}

module.exports = router.routes();
