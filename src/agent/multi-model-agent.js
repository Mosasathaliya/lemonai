const axios = require("axios");

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_API_BASE = process.env.CF_AI_BASE_URL || "https://api.cloudflare.com/client/v4";

const AGENT_MODELS = {
  planner: "@cf/meta/llama-3.1-70b-instruct",
  backend_coder: "@hf/thebloke/deepseek-coder-6.7b-instruct-awq",
  frontend_coder: "@cf/qwen/qwen2.5-coder-32b-instruct",
  reviewer: "@cf/qwen/qwq-32b",
  executor: "@cf/meta/llama-3.1-8b-instruct",
  math_solver: "@cf/deepseek-ai/deepseek-math-7b-instruct",
  sql_expert: "@cf/defog/sqlcoder-7b-2",
  vision_analyzer: "@cf/facebook/detr-resnet-50",
  summarizer: "@cf/facebook/bart-large-cnn",
  embedder: "@cf/baai/bge-large-en-v1.5",
  reranker: "@cf/baai/bge-reranker-base",
  classifier: "@cf/huggingface/distilbert-sst-2-int8",
  translator: "@cf/meta/m2m100-1.2b",
  image_gen: "@cf/black-forest-labs/flux-1-schnell",
  tts: "@cf/deepgram/aura-1",
  asr: "@cf/deepgram/flux"
}

class MultiModelAgent {
  constructor(context = {}) {
    this.context = context;
    this.kvMemory = context.kvMemory;
    this.sharedMemory = {
      conversation_id: context.conversation_id,
      history: [],
      artifacts: {},
      plan: null,
      code: {}
    };
  }

  async callModel(modelId, prompt, role = "assistant") {
    const messages = [
      { role: "system", content: `You are ${role}. Access shared memory context.` },
      ...this.sharedMemory.history.slice(-8),
      { role: "user", content: prompt }
    ];

    const url = `${CF_API_BASE}/accounts/${CF_ACCOUNT_ID}/ai/run/${modelId}`;
    const response = await axios.post(url, { messages, temperature: 0.3 }, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CF_API_TOKEN}`
      }
    });

    const result = response.data?.result ?? response.data;
    const text = this.extractText(result);
    
    this.sharedMemory.history.push({ role: "assistant", content: text, model: modelId });
    return text;
  }

  async plan(goal) {
    const prompt = `Create execution plan for: ${goal}

Context: ${JSON.stringify(this.sharedMemory.artifacts)}

Return JSON:
{
  "tasks": [{"id": 1, "type": "backend|frontend|integration", "description": "..."}],
  "dependencies": {"2": [1]},
  "models_needed": ["backend_coder", "frontend_coder"]
}`;

    const planText = await this.callModel(AGENT_MODELS.planner, prompt, "strategic planner");
    const plan = this.parsePlan(planText);
    this.sharedMemory.plan = plan;
    this.sharedMemory.artifacts.plan = plan;
    
    if (this.kvMemory) {
      await this.kvMemory.setSharedContext(this.context.conversation_id, this.sharedMemory);
    }
    
    return plan;
  }

  async executeTask(task) {
    const modelMap = {
      backend: AGENT_MODELS.backend_coder,
      frontend: AGENT_MODELS.frontend_coder,
      integration: AGENT_MODELS.executor,
      math: AGENT_MODELS.math_solver,
      sql: AGENT_MODELS.sql_expert,
      vision: AGENT_MODELS.vision_analyzer,
      summary: AGENT_MODELS.summarizer,
      embedding: AGENT_MODELS.embedder,
      rerank: AGENT_MODELS.reranker,
      classify: AGENT_MODELS.classifier,
      translate: AGENT_MODELS.translator,
      image: AGENT_MODELS.image_gen,
      speech: AGENT_MODELS.tts,
      transcribe: AGENT_MODELS.asr
    };

    const model = modelMap[task.type] || AGENT_MODELS.executor;
    
    if (["vision", "image", "speech", "transcribe", "embedding", "rerank", "classify", "summary"].includes(task.type)) {
      return await this.executeSpecializedTask(task, model);
    }
    
    const contextPrompt = this.buildTaskContext(task);
    const prompt = `${contextPrompt}\n\nTask: ${task.description}\n\nProvide complete implementation.`;
    
    const result = await this.callModel(model, prompt, `${task.type} specialist`);
    
    this.sharedMemory.code[task.id] = result;
    this.sharedMemory.artifacts[`task_${task.id}`] = result;
    
    if (this.kvMemory) {
      await this.kvMemory.publishAgentOutput(this.context.conversation_id, task.type, result);
      await this.kvMemory.setSharedContext(this.context.conversation_id, this.sharedMemory);
    }
    
    return result;
  }

  async executeSpecializedTask(task, model) {
    const url = `${CF_API_BASE}/accounts/${CF_ACCOUNT_ID}/ai/run/${model}`;
    let payload = {};

    switch(task.type) {
      case "vision":
        payload = { image: task.image || [] };
        break;
      case "image":
        payload = { prompt: task.description };
        break;
      case "speech":
        payload = { text: task.description };
        break;
      case "transcribe":
        payload = { audio: task.audio || [], encoding: "linear16" };
        break;
      case "embedding":
        payload = { text: task.description };
        break;
      case "rerank":
        payload = { query: task.query, contexts: task.contexts || [] };
        break;
      case "classify":
        payload = { text: task.description };
        break;
      case "summary":
        payload = { input_text: task.description };
        break;
    }

    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CF_API_TOKEN}`
      },
      responseType: task.type === "image" || task.type === "speech" ? "arraybuffer" : "json"
    });

    const result = response.data?.result ?? response.data;
    this.sharedMemory.artifacts[`task_${task.id}`] = result;
    return result;
  }

  async review(taskResults) {
    const prompt = `Review code integration:

Plan: ${JSON.stringify(this.sharedMemory.plan)}

Code artifacts:
${Object.entries(taskResults).map(([id, code]) => `Task ${id}:\n${code.substring(0, 500)}`).join("\n\n")}

Check: compatibility, errors, improvements needed.`;

    return await this.callModel(AGENT_MODELS.reviewer, prompt, "code reviewer");
  }

  buildTaskContext(task) {
    const deps = this.sharedMemory.plan?.dependencies?.[task.id] || [];
    const depCode = deps.map(id => `Dependency ${id}:\n${this.sharedMemory.code[id]?.substring(0, 300)}`).join("\n");
    
    return `Shared context:
- Goal: ${this.context.goal}
- Completed tasks: ${Object.keys(this.sharedMemory.code).join(", ")}
${depCode ? `\nDependencies:\n${depCode}` : ""}`;
  }

  parsePlan(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { tasks: [], dependencies: {}, models_needed: [] };
    } catch (e) {
      return { tasks: [{ id: 1, type: "integration", description: "Execute task" }], dependencies: {}, models_needed: ["executor"] };
    }
  }

  extractText(result) {
    if (typeof result === "string") return result;
    return result?.response || result?.text || result?.output_text || "";
  }

  getMemory() {
    return {
      ...this.sharedMemory,
      history_length: this.sharedMemory.history.length,
      artifacts_count: Object.keys(this.sharedMemory.artifacts).length
    };
  }
}

module.exports = MultiModelAgent;
