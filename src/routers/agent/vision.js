// @ts-ignore
const router = require("koa-router")();
const axios = require("axios");

const CF_AI_USE = parseBoolean(process.env.CF_AI_USE);
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_API_BASE_URL =
  process.env.CF_AI_BASE_URL || "https://api.cloudflare.com/client/v4";
const CF_DETR_RESNET_MODEL =
  process.env.CF_DETR_RESNET_MODEL || "@cf/facebook/detr-resnet-50";

router.post("/v1/vision/detr-resnet-50", async (ctx) => {
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

  let imageBytes;
  try {
    imageBytes = await resolveImageBytes(body);
  } catch (error) {
    console.error("Failed to resolve image bytes", error);
    ctx.status = 400;
    ctx.body = {
      error: {
        message: error.message || "Failed to load image.",
        type: "bad_request",
      },
    };
    return;
  }

  if (!imageBytes || !imageBytes.length) {
    ctx.status = 400;
    ctx.body = {
      error: {
        message:
          "Provide `image` (array of bytes), `image_base64`, or `image_url`.",
        type: "bad_request",
      },
    };
    return;
  }

  try {
    const url = `${CF_API_BASE_URL}/accounts/${CF_ACCOUNT_ID}/ai/run/${encodeURIComponent(
      CF_DETR_RESNET_MODEL,
    )}`;

    const response = await axios({
      method: "post",
      url,
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: { image: Array.from(imageBytes) },
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
      model: CF_DETR_RESNET_MODEL,
      results: extractDetrResults(response.data),
    };
  } catch (error) {
    console.error("Error during Cloudflare detr-resnet-50 proxy:", error);
    ctx.status = 502;
    ctx.body = {
      error: {
        message: error.message || "Failed to contact Cloudflare Workers AI.",
        type: "workers_ai_error",
      },
    };
  }
});

async function resolveImageBytes(body) {
  const image = body?.image;
  if (Array.isArray(image) && image.length > 0) {
    const sanitized = image
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value >= 0 && value <= 255);
    if (sanitized.length > 0) {
      return Uint8Array.from(sanitized);
    }
  }

  if (typeof body?.image_base64 === "string" && body.image_base64.trim()) {
    return decodeBase64(body.image_base64.trim());
  }

  if (typeof body?.image_url === "string" && body.image_url.trim()) {
    const response = await axios.get(body.image_url.trim(), {
      responseType: "arraybuffer",
      validateStatus: () => true,
    });
    if (response.status >= 400) {
      throw new Error(`Failed to fetch image from ${body.image_url}`);
    }
    return new Uint8Array(response.data);
  }

  return null;
}

function decodeBase64(input) {
  const normalized = input.replace(/^data:[^;]+;base64,/, "");
  return new Uint8Array(Buffer.from(normalized, "base64"));
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

function extractDetrResults(data) {
  if (!data || typeof data !== "object") {
    return [];
  }

  if (Array.isArray(data.response)) {
    return data.response;
  }
  if (Array.isArray(data.results)) {
    return data.results;
  }
  if (Array.isArray(data)) {
    return data;
  }
  return [data];
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
