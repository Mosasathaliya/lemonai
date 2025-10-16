// @ts-ignore
const router = require("koa-router")();
const axios = require("axios");
const { PassThrough } = require("stream");
const { randomUUID } = require("crypto");

const calcToken = require("@src/completion/calc.token.js");

const OPENAI_API_KEY = process.env.API_KEY;
const OPENAI_BASE_URL = process.env.BASE_URL;
const MODEL_NAME = process.env.MODEL_NAME;

const CF_AI_USE = parseBoolean(process.env.CF_AI_USE);
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_AI_MODEL = process.env.CF_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct";
const CF_API_BASE = process.env.CF_AI_BASE_URL || "https://api.cloudflare.com/client/v4";

const OPENAI_COMPLETION_PREFIX = "chatcmpl";

router.post("/v1/chat/completions", async (ctx) => {
  const { request } = ctx;
  const body = request.body || {};
  const isStream = body.stream === true;

  if (shouldUseCloudflareAi()) {
    await handleCloudflareWorkersAi(ctx, body, isStream);
    return;
  }

  await handleOpenAi(ctx, body, isStream);
});

async function handleOpenAi(ctx, body, isStream) {
  if (!OPENAI_API_KEY) {
    ctx.status = 500;
    ctx.body = {
      error: {
        message: "OpenAI API Key not configured. Please set OPENAI_API_KEY environment variable.",
        type: "server_error",
        code: "api_key_missing",
      },
    };
    return;
  }

  const { response } = ctx;
  let clientResponseStream = null;

  if (isStream) {
    response.type = "text/event-stream";
    response.set("Cache-Control", "no-cache");
    response.set("Connection", "keep-alive");
    response.set("X-Accel-Buffering", "no");

    clientResponseStream = new PassThrough();
    ctx.body = clientResponseStream;
    ctx.status = 200;
  } else {
    response.type = "application/json";
  }

  try {
    const openaiRequestBody = { ...body };
    openaiRequestBody.model = MODEL_NAME;
    openaiRequestBody.stream = isStream;

    const openaiHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    };

    const openaiResponse = await axios({
      method: "post",
      url: `${OPENAI_BASE_URL}/chat/completions`,
      headers: openaiHeaders,
      data: openaiRequestBody,
      responseType: isStream ? "stream" : "json",
    });

    if (isStream) {
      let fullContent = "";
      const inputTokens = calcTokenInput("", openaiRequestBody.messages);

      openaiResponse.data.on("data", (chunk) => {
        const lines = chunk.toString().split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") return;
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                fullContent += parsed.choices[0].delta.content;
              }
              if (parsed.choices?.[0]?.delta?.tool_calls) {
                const toolCalls = parsed.choices[0].delta.tool_calls;
                for (const toolCall of toolCalls) {
                  if (toolCall.function) {
                    if (toolCall.function.name) {
                      fullContent += `Function: ${toolCall.function.name}\n`;
                    }
                    if (toolCall.function.arguments) {
                      fullContent += `Arguments: ${toolCall.function.arguments}\n`;
                    }
                  }
                }
              }
            } catch (error) {
              console.error("Error parsing SSE data:", error);
            }
          }
        }
      });

      openaiResponse.data.pipe(clientResponseStream);

      openaiResponse.data.on("end", async () => {
        const outputTokens = calcToken(fullContent);
        console.log("===input_tokens, output_tokens======", inputTokens, outputTokens);

        clientResponseStream.end();
        console.log("OpenAI stream ended, client stream closed.");
      });

      openaiResponse.data.on("error", (err) => {
        console.error("Error piping OpenAI stream:", err);
        const errorData = JSON.stringify({
          error: {
            message: err.message || "An error occurred during streaming from OpenAI.",
            type: "openai_stream_error",
            code: null,
          },
        });
        clientResponseStream.write(`data: ${errorData}\n\n`);
        clientResponseStream.end();
        ctx.status = 500;
      });
    } else {
      ctx.body = openaiResponse.data;
      ctx.status = openaiResponse.status;
    }
  } catch (error) {
    console.error("Error during OpenAI API proxy:", error);

    if (axios.isAxiosError(error) && error.response) {
      console.error("OpenAI API error response:", error.response.data);
      ctx.status = error.response.status;
      ctx.body = error.response.data;
    } else {
      ctx.status = 500;
      ctx.body = {
        error: {
          message: error.message || "An unknown error occurred during proxying to OpenAI.",
          type: "proxy_server_error",
          code: null,
        },
      };
    }

    if (clientResponseStream && !clientResponseStream.writableEnded) {
      clientResponseStream.end();
    }
  }
}

async function handleCloudflareWorkersAi(ctx, body, isStream) {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    ctx.status = 500;
    ctx.body = {
      error: {
        message: "Cloudflare Workers AI credentials are not configured.",
        type: "server_error",
        code: "cf_ai_missing_credentials",
      },
    };
    return;
  }

  const { response } = ctx;
  const model =
    typeof body?.model === "string" && body.model.trim().length > 0
      ? body.model
      : CF_AI_MODEL;
  const aiPayload = sanitizeAiRequest(body);

  let aiResult;
  try {
    const url = `${CF_API_BASE}/accounts/${CF_ACCOUNT_ID}/ai/run/${model}`;
    const cfResponse = await axios({
      method: "post",
      url,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CF_API_TOKEN}`,
      },
      data: aiPayload,
      responseType: "json",
    });

    if (cfResponse.data && cfResponse.data.success === false) {
      const cfErrors = Array.isArray(cfResponse.data.errors)
        ? cfResponse.data.errors
            .map((item) => item?.message || JSON.stringify(item))
            .join("; ")
        : "Unknown Workers AI error";
      throw new Error(cfErrors);
    }

    aiResult = cfResponse.data?.result ?? cfResponse.data;
  } catch (error) {
    console.error("Error during Cloudflare Workers AI proxy:", error);

    if (axios.isAxiosError(error) && error.response) {
      ctx.status = error.response.status || 502;
      ctx.body =
        error.response.data ??
        {
          error: {
            message: "Cloudflare Workers AI request failed.",
            type: "workers_ai_error",
          },
        };
    } else {
      ctx.status = 502;
      ctx.body = {
        error: {
          message: error.message || "Cloudflare Workers AI request failed.",
          type: "workers_ai_error",
        },
      };
    }
    return;
  }

  const completionPayload = buildCompletionPayload(model, aiResult);

  if (isStream) {
    response.type = "text/event-stream";
    response.set("Cache-Control", "no-cache");
    response.set("Connection", "keep-alive");
    response.set("X-Accel-Buffering", "no");

    const clientResponseStream = new PassThrough();
    ctx.status = 200;
    ctx.body = clientResponseStream;

    writeCompletionStream(clientResponseStream, completionPayload);
    clientResponseStream.end();
  } else {
    response.type = "application/json";
    ctx.status = 200;
    ctx.body = completionPayload;
  }
}

function sanitizeAiRequest(body) {
  const allowedKeys = [
    "messages",
    "prompt",
    "input",
    "input_text",
    "temperature",
    "top_p",
    "presence_penalty",
    "frequency_penalty",
    "stop",
    "response_format",
    "tools",
    "tool_choice",
    "metadata",
    "audio",
    "image",
    "vision",
    "input_audio",
  ];

  const params = {};
  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      params[key] = body[key];
    }
  }

  if (!params.messages && typeof body?.prompt === "string") {
    params.prompt = body.prompt;
  }

  return params;
}

function buildCompletionPayload(model, aiResponse) {
  const created = Math.floor(Date.now() / 1000);
  const id = `${OPENAI_COMPLETION_PREFIX}-${randomUUID()}`;
  const text = extractTextFromAi(aiResponse);
  const usage = extractUsage(aiResponse);

  return {
    id,
    object: "chat.completion",
    created,
    model,
    choices: [
      {
        index: 0,
        finish_reason: "stop",
        message: {
          role: "assistant",
          content: text,
        },
      },
    ],
    usage: {
      prompt_tokens: usage.promptTokens,
      completion_tokens: usage.completionTokens,
      total_tokens: usage.totalTokens,
    },
  };
}

function writeCompletionStream(stream, payload) {
  const { id, created, model, choices } = payload;
  const content = choices?.[0]?.message?.content || "";

  const chunk = {
    id,
    object: "chat.completion.chunk",
    created,
    model,
    choices: [
      {
        index: 0,
        delta: { role: "assistant", content },
        finish_reason: null,
      },
    ],
  };

  const endChunk = {
    id,
    object: "chat.completion.chunk",
    created,
    model,
    choices: [
      {
        index: 0,
        delta: {},
        finish_reason: "stop",
      },
    ],
  };

  stream.write(`data: ${JSON.stringify(chunk)}\n\n`);
  stream.write(`data: ${JSON.stringify(endChunk)}\n\n`);
  stream.write("data: [DONE]\n\n");
}

function extractTextFromAi(aiResponse) {
  if (typeof aiResponse === "string") {
    return aiResponse;
  }
  if (!aiResponse || typeof aiResponse !== "object") {
    return "";
  }

  const response = aiResponse;
  const potentialFields = [
    "response",
    "result",
    "results",
    "output_text",
    "output",
    "text",
  ];

  for (const field of potentialFields) {
    if (typeof response[field] === "string") {
      return response[field];
    }
    if (Array.isArray(response[field]) && response[field].length > 0) {
      const first = response[field][0];
      if (typeof first === "string") {
        return first;
      }
      if (first && typeof first === "object") {
        if (typeof first.text === "string") {
          return first.text;
        }
        if (typeof first.response === "string") {
          return first.response;
        }
      }
    }
  }

  if (response.output && typeof response.output === "object") {
    if (typeof response.output.text === "string") {
      return response.output.text;
    }
    if (Array.isArray(response.output.text) && response.output.text.length > 0) {
      return response.output.text.join("\n");
    }
  }

  return "";
}

function extractUsage(aiResponse) {
  if (!aiResponse || typeof aiResponse !== "object") {
    return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }

  const src = aiResponse;
  const meta = src.meta || src.metadata || {};
  const usage = src.usage || meta.usage || meta.tokens || {};

  const input =
    Number(
      src.input_tokens ??
        usage.input_tokens ??
        usage.prompt_tokens ??
        usage.input ??
        meta.input_tokens ??
        0,
    ) || 0;
  const output =
    Number(
      src.output_tokens ??
        usage.output_tokens ??
        usage.completion_tokens ??
        usage.output ??
        meta.output_tokens ??
        0,
    ) || 0;

  const total =
    Number(usage.total_tokens ?? meta.total_tokens ?? input + output) ||
    input + output;

  return {
    promptTokens: input,
    completionTokens: output,
    totalTokens: total,
  };
}

function calcTokenInput(prompt, messages = []) {
  let content = prompt;
  for (const message of messages) {
    if (!message) continue;
    content += `role: ${message.role}\n`;

    if (message.content) {
      if (typeof message.content === "string") {
        content += message.content;
      } else if (Array.isArray(message.content)) {
        for (const item of message.content) {
          if (item?.type === "text") {
            content += item.text;
          }
        }
      }
    }

    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        if (!toolCall) continue;
        content += `tool_call: ${toolCall.type}\n`;
        if (toolCall.function) {
          content += `function: ${toolCall.function.name}\n`;
          if (toolCall.function.arguments) {
            content += `arguments: ${toolCall.function.arguments}\n`;
          }
        }
      }
    }

    content += "\n---\n";
  }
  return calcToken(content);
}

function parseBoolean(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
}

function shouldUseCloudflareAi() {
  return CF_AI_USE && CF_ACCOUNT_ID && CF_API_TOKEN;
}

module.exports = exports = router.routes();
