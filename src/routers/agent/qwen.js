const router = require("koa-router")();
const axios = require("axios");

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_API_BASE = process.env.CF_AI_BASE_URL || "https://api.cloudflare.com/client/v4";

const QWEN_MODELS = {
  "qwen1.5-0.5b-chat": process.env.CF_QWEN_0_5B_MODEL || "@cf/qwen/qwen1.5-0.5b-chat",
  "qwen1.5-1.8b-chat": process.env.CF_QWEN_1_8B_MODEL || "@cf/qwen/qwen1.5-1.8b-chat",
  "qwen1.5-7b-chat-awq": process.env.CF_QWEN_7B_MODEL || "@cf/qwen/qwen1.5-7b-chat-awq",
  "qwen1.5-14b-chat-awq": process.env.CF_QWEN_14B_MODEL || "@cf/qwen/qwen1.5-14b-chat-awq",
  "qwen2.5-coder-32b-instruct": process.env.CF_QWEN_CODER_MODEL || "@cf/qwen/qwen2.5-coder-32b-instruct",
  "qwq-32b": process.env.CF_QWQ_MODEL || "@cf/qwen/qwq-32b"
};

for (const [key, modelId] of Object.entries(QWEN_MODELS)) {
  router.post(`/v1/chat/${key}`, async (ctx) => {
    if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
      ctx.status = 500;
      ctx.body = { error: { message: "CF credentials missing", type: "config_error" } };
      return;
    }

    const body = ctx.request.body || {};
    const isStream = body.stream === true;

    const payload = {
      messages: body.messages || [{ role: "user", content: body.prompt || body.input_text || "" }],
      temperature: body.temperature,
      top_p: body.top_p
    };

    try {
      const url = `${CF_API_BASE}/accounts/${CF_ACCOUNT_ID}/ai/run/${modelId}`;
      const cfResponse = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CF_API_TOKEN}`
        }
      });

      const result = cfResponse.data?.result ?? cfResponse.data;
      const text = extractText(result);

      if (isStream) {
        ctx.type = "text/event-stream";
        ctx.set("Cache-Control", "no-cache");
        ctx.body = `data: ${JSON.stringify({ choices: [{ delta: { content: text }, finish_reason: null }] })}\n\ndata: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] })}\n\ndata: [DONE]\n\n`;
      } else {
        ctx.body = { model: modelId, choices: [{ message: { role: "assistant", content: text }, finish_reason: "stop" }] };
      }
    } catch (error) {
      ctx.status = 502;
      ctx.body = { error: { message: error.message || "Qwen request failed", type: "workers_ai_error" } };
    }
  });
}

function extractText(result) {
  if (typeof result === "string") return result;
  if (!result) return "";
  return result.response || result.text || result.output_text || "";
}

module.exports = exports = router.routes();
