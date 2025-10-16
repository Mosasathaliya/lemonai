// @ts-ignore
const router = require("koa-router")();
const axios = require("axios");

const CF_AI_USE = parseBoolean(process.env.CF_AI_USE);
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_API_BASE_URL =
  process.env.CF_AI_BASE_URL || "https://api.cloudflare.com/client/v4";
const CF_DREAMSHAPER_MODEL =
  process.env.CF_DREAMSHAPER_MODEL || "@cf/lykon/dreamshaper-8-lcm";

// Additional image models, exposed 1-by-1 similar to DreamShaper
const IMAGE_MODELS = [
  {
    path: "/v1/image/flux-1-schnell",
    envKey: "CF_FLUX_SCHNELL_MODEL",
    defaultModel: "@cf/black-forest-labs/flux-1-schnell",
  },
  {
    path: "/v1/image/sdxl-base-1.0",
    envKey: "CF_SDXL_BASE_MODEL",
    defaultModel: "@cf/stabilityai/stable-diffusion-xl-base-1.0",
  },
  {
    path: "/v1/image/sdxl-lightning",
    envKey: "CF_SDXL_LIGHTNING_MODEL",
    defaultModel: "@cf/bytedance/stable-diffusion-xl-lightning",
  },
  {
    path: "/v1/image/sd15-img2img",
    envKey: "CF_SD15_IMG2IMG_MODEL",
    defaultModel: "@cf/runwayml/stable-diffusion-v1-5-img2img",
  },
  {
    path: "/v1/image/sd15-inpainting",
    envKey: "CF_SD15_INPAINT_MODEL",
    defaultModel: "@cf/runwayml/stable-diffusion-v1-5-inpainting",
  },
  {
    path: "/v1/image/lucid-origin",
    envKey: "CF_LUCID_ORIGIN_MODEL",
    defaultModel: "@cf/leonardo/lucid-origin",
  },
  {
    path: "/v1/image/phoenix-1.0",
    envKey: "CF_PHOENIX_MODEL",
    defaultModel: "@cf/leonardo/phoenix-1.0",
  },
];

router.post("/v1/image/dreamshaper-8-lcm", async (ctx) => {
  const body = ctx.request.body || {};
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt) {
    ctx.status = 400;
    ctx.body = {
      error: {
        message: "`prompt` is required for image generation.",
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

  let payload;
  try {
    payload = await buildDreamshaperPayload(body, prompt);
  } catch (error) {
    ctx.status = 400;
    ctx.body = {
      error: {
        message: error.message || "Invalid payload.",
        type: "bad_request",
      },
    };
    return;
  }

  try {
    const url = `${CF_API_BASE_URL}/accounts/${CF_ACCOUNT_ID}/ai/run/${encodeURIComponent(
      CF_DREAMSHAPER_MODEL,
    )}`;

    const response = await axios({
      method: "post",
      url,
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: payload,
      responseType: "arraybuffer",
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
    ctx.set("Content-Type", response.headers["content-type"] || "image/png");
    ctx.body = Buffer.from(response.data);
  } catch (error) {
    console.error("Error during Cloudflare dreamshaper proxy:", error);
    ctx.status = 502;
    ctx.body = {
      error: {
        message: error.message || "Failed to contact Cloudflare Workers AI.",
        type: "workers_ai_error",
      },
    };
  }
});

async function buildDreamshaperPayload(body, prompt) {
  const payload = { prompt };

  if (typeof body?.negative_prompt === "string" && body.negative_prompt.trim()) {
    payload.negative_prompt = body.negative_prompt.trim();
  }

  const height = clampInteger(body?.height, 256, 2048);
  if (height !== null) payload.height = height;

  const width = clampInteger(body?.width, 256, 2048);
  if (width !== null) payload.width = width;

  const steps = clampInteger(body?.num_steps, 1, 200);
  if (steps !== null) payload.num_steps = steps;

  const guidance = Number(body?.guidance_scale);
  if (Number.isFinite(guidance)) payload.guidance_scale = guidance;

  const strength = Number(body?.strength);
  if (Number.isFinite(strength)) payload.strength = strength;

  const seed = clampInteger(body?.seed, 0, Number.MAX_SAFE_INTEGER);
  if (seed !== null) payload.seed = seed;

  if (body?.image || body?.image_base64 || body?.image_url) {
    const imageBytes = await resolveImageBytes(body);
    if (!imageBytes || !imageBytes.length) {
      throw new Error("Unable to resolve reference image.");
    }
    payload.image = Array.from(imageBytes);
  }

  return payload;
}

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

// Register additional image routes dynamically
for (const conf of IMAGE_MODELS) {
  router.post(conf.path, async (ctx) => {
    const body = ctx.request.body || {};
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      ctx.status = 400;
      ctx.body = {
        error: {
          message: "`prompt` is required for image generation.",
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

    let payload;
    try {
      payload = await buildDreamshaperPayload(body, prompt);
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        error: {
          message: error.message || "Invalid payload.",
          type: "bad_request",
        },
      };
      return;
    }

    const modelId = process.env[conf.envKey] || conf.defaultModel;
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
        data: payload,
        responseType: "arraybuffer",
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
      ctx.set("Content-Type", response.headers["content-type"] || "image/png");
      ctx.body = Buffer.from(response.data);
    } catch (error) {
      console.error(`Error during Cloudflare image proxy (${modelId}):`, error);
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

module.exports = router.routes();
