const router = require("koa-router")();
const axios = require("axios");

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_API_BASE = process.env.CF_AI_BASE_URL || "https://api.cloudflare.com/client/v4";

const WORKER_MODELS = {
  backend: "@hf/thebloke/deepseek-coder-6.7b-instruct-awq",
  frontend: "@cf/qwen/qwen2.5-coder-32b-instruct",
  architect: "@cf/meta/llama-3.1-70b-instruct",
  reviewer: "@cf/qwen/qwq-32b"
};

const sharedMemory = new Map();

router.post("/v1/coding/orchestrate", async (ctx) => {
  const body = ctx.request.body || {};
  const { task, session_id = generateSessionId() } = body;

  if (!task) {
    ctx.status = 400;
    ctx.body = { error: { message: "task required", type: "bad_request" } };
    return;
  }

  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    ctx.status = 500;
    ctx.body = { error: { message: "CF credentials missing", type: "config_error" } };
    return;
  }

  try {
    const memory = getMemory(session_id);
    memory.task = task;
    memory.history = memory.history || [];

    const plan = await architect(task, memory);
    memory.plan = plan;
    memory.history.push({ role: "architect", content: plan });

    const results = await executeWorkers(plan, memory);
    
    const review = await reviewer(results, memory);
    memory.review = review;
    memory.history.push({ role: "reviewer", content: review });

    ctx.body = {
      session_id,
      plan,
      results,
      review,
      memory: {
        context_size: memory.history.length,
        shared_state: Object.keys(memory).filter(k => k !== 'history')
      }
    };
  } catch (error) {
    ctx.status = 502;
    ctx.body = { error: { message: error.message, type: "orchestration_error" } };
  }
});

router.get("/v1/coding/memory/:session_id", async (ctx) => {
  const { session_id } = ctx.params;
  const memory = sharedMemory.get(session_id);
  
  if (!memory) {
    ctx.status = 404;
    ctx.body = { error: { message: "Session not found", type: "not_found" } };
    return;
  }

  ctx.body = { session_id, memory };
});

router.delete("/v1/coding/memory/:session_id", async (ctx) => {
  const { session_id } = ctx.params;
  sharedMemory.delete(session_id);
  ctx.body = { success: true, message: "Memory cleared" };
});

async function architect(task, memory) {
  const prompt = buildArchitectPrompt(task, memory);
  const response = await callWorker(WORKER_MODELS.architect, prompt, memory);
  return parseArchitectPlan(response);
}

async function executeWorkers(plan, memory) {
  const results = {};

  if (plan.needs_backend) {
    memory.history.push({ role: "system", content: "Starting backend worker" });
    results.backend = await callWorker(
      WORKER_MODELS.backend,
      buildBackendPrompt(plan, memory),
      memory
    );
    memory.backend_code = results.backend;
    memory.history.push({ role: "backend", content: results.backend });
  }

  if (plan.needs_frontend) {
    memory.history.push({ role: "system", content: "Starting frontend worker" });
    results.frontend = await callWorker(
      WORKER_MODELS.frontend,
      buildFrontendPrompt(plan, memory),
      memory
    );
    memory.frontend_code = results.frontend;
    memory.history.push({ role: "frontend", content: results.frontend });
  }

  return results;
}

async function reviewer(results, memory) {
  const prompt = buildReviewPrompt(results, memory);
  return await callWorker(WORKER_MODELS.reviewer, prompt, memory);
}

async function callWorker(model, prompt, memory) {
  const messages = [
    { role: "system", content: "You are an expert coding assistant. Use shared context from memory." },
    ...memory.history.slice(-10).map(h => ({ role: h.role === "system" ? "system" : "user", content: h.content })),
    { role: "user", content: prompt }
  ];

  const url = `${CF_API_BASE}/accounts/${CF_ACCOUNT_ID}/ai/run/${model}`;
  const response = await axios.post(url, { messages, temperature: 0.2 }, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CF_API_TOKEN}`
    }
  });

  const result = response.data?.result ?? response.data;
  return extractText(result);
}

function buildArchitectPrompt(task, memory) {
  return `Analyze this coding task and create a plan:

Task: ${task}

Previous context: ${memory.history.length > 0 ? "Building on previous work" : "New project"}

Respond in JSON format:
{
  "needs_backend": true/false,
  "needs_frontend": true/false,
  "backend_tasks": ["task1", "task2"],
  "frontend_tasks": ["task1", "task2"],
  "integration_points": ["api endpoint", "data flow"]
}`;
}

function buildBackendPrompt(plan, memory) {
  const context = memory.frontend_code ? `\nFrontend code exists:\n${memory.frontend_code.substring(0, 500)}...` : "";
  return `Create backend code for:
${plan.backend_tasks.join("\n")}

Integration points: ${plan.integration_points.join(", ")}
${context}

Provide complete, production-ready code.`;
}

function buildFrontendPrompt(plan, memory) {
  const context = memory.backend_code ? `\nBackend API:\n${memory.backend_code.substring(0, 500)}...` : "";
  return `Create frontend code for:
${plan.frontend_tasks.join("\n")}

Integration points: ${plan.integration_points.join(", ")}
${context}

Provide complete, production-ready code.`;
}

function buildReviewPrompt(results, memory) {
  return `Review this code for integration issues:

Backend:
${results.backend || "N/A"}

Frontend:
${results.frontend || "N/A"}

Original task: ${memory.task}

Check: API compatibility, data flow, error handling, security.`;
}

function parseArchitectPlan(response) {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {}
  
  return {
    needs_backend: response.toLowerCase().includes("backend"),
    needs_frontend: response.toLowerCase().includes("frontend"),
    backend_tasks: ["Implement API"],
    frontend_tasks: ["Create UI"],
    integration_points: ["REST API"]
  };
}

function extractText(result) {
  if (typeof result === "string") return result;
  if (!result) return "";
  return result.response || result.text || result.output_text || "";
}

function getMemory(sessionId) {
  if (!sharedMemory.has(sessionId)) {
    sharedMemory.set(sessionId, { history: [] });
  }
  return sharedMemory.get(sessionId);
}

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = exports = router.routes();
