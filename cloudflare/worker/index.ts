import { Container, getContainer } from "@cloudflare/containers";
import type { DurableObjectNamespace } from "cloudflare:workers";

export interface Env {
  MIGHTY_AGENT_CONTAINER: DurableObjectNamespace<MightyAgentContainer>;
  CF_ACCOUNT_ID?: string;
  CF_API_TOKEN?: string;
  DB: D1Database;
  STORAGE: R2Bucket;
  USER_DATA: R2Bucket;
  CACHE: KVNamespace;
  AI: any;
}

export class MightyAgentContainer extends Container {
  defaultPort = 3000;
  sleepAfter = "15m";
  enableInternet = true;
  envVars = {
    NODE_ENV: "production",
    PORT: "3000",
    LEMON_AI_PATH: "/app",
    CF_AI_USE: "true",
    CF_AI_MODEL: "@cf/openai/gpt-oss-20b",
    CF_AURA_MODEL: "@cf/deepgram/aura-1",
    CF_BART_MODEL: "@cf/facebook/bart-large-cnn",
    CF_BGE_MODEL: "@cf/baai/bge-base-en-v1.5",
    CF_BGE_SMALL_MODEL: "@cf/baai/bge-small-en-v1.5",
    CF_BGE_LARGE_MODEL: "@cf/baai/bge-large-en-v1.5",
    CF_EMBEDDING_GEMMA_MODEL: "@cf/google/embeddinggemma-300m",
    CF_BGE_M3_MODEL: "@cf/baai/bge-m3",
    CF_BGE_RERANKER_MODEL: "@cf/baai/bge-reranker-base",
    CF_DEEPSEEK_CODER_MODEL: "@hf/thebloke/deepseek-coder-6.7b-base-awq",
    CF_DEEPSEEK_CODER_INSTRUCT_MODEL: "@hf/thebloke/deepseek-coder-6.7b-instruct-awq",
    CF_DEEPSEEK_MATH_MODEL: "@cf/deepseek-ai/deepseek-math-7b-instruct",
    CF_DETR_RESNET_MODEL: "@cf/facebook/detr-resnet-50",
    CF_FALCON_MODEL: "@cf/tiiuae/falcon-7b-instruct",
    CF_DREAMSHAPER_MODEL: "@cf/lykon/dreamshaper-8-lcm",
    CF_GEMMA_MODEL: "@cf/google/gemma-3-12b-it",
    CF_GEMMA_7B_MODEL: "@hf/google/gemma-7b-it",
    CF_DISTILBERT_MODEL: "@cf/huggingface/distilbert-sst-2-int8",
    CF_GEMMA_7B_LORA_MODEL: "@cf/google/gemma-7b-it-lora",
    CF_GEMMA_SEA_LION_MODEL: "@cf/aisingapore/gemma-sea-lion-v4-27b-it",
    CF_FLUX_MODEL: "@cf/deepgram/flux",
    CF_GPT_OSS_20B_MODEL: "@cf/openai/gpt-oss-20b",
    CF_QWEN_0_5B_MODEL: "@cf/qwen/qwen1.5-0.5b-chat",
    CF_QWEN_1_8B_MODEL: "@cf/qwen/qwen1.5-1.8b-chat",
    CF_QWEN_7B_MODEL: "@cf/qwen/qwen1.5-7b-chat-awq",
    CF_QWEN_14B_MODEL: "@cf/qwen/qwen1.5-14b-chat-awq",
    CF_QWEN_CODER_MODEL: "@cf/qwen/qwen2.5-coder-32b-instruct",
    CF_QWQ_MODEL: "@cf/qwen/qwq-32b",
    CF_FLUX_SCHNELL_MODEL: "@cf/black-forest-labs/flux-1-schnell",
    CF_SDXL_BASE_MODEL: "@cf/stabilityai/stable-diffusion-xl-base-1.0",
    CF_SDXL_LIGHTNING_MODEL: "@cf/bytedance/stable-diffusion-xl-lightning",
    CF_SD15_IMG2IMG_MODEL: "@cf/runwayml/stable-diffusion-v1-5-img2img",
    CF_SD15_INPAINT_MODEL: "@cf/runwayml/stable-diffusion-v1-5-inpainting",
    CF_LUCID_ORIGIN_MODEL: "@cf/leonardo/lucid-origin",
    CF_PHOENIX_MODEL: "@cf/leonardo/phoenix-1.0",
  };

  async fetch(request: Request, env?: any): Promise<Response> {
    await this.startAndWaitForPorts();

    const url = new URL(request.url);
    if (url.pathname === "/__container_health") {
      return new Response(
        JSON.stringify({ status: "ok", models: 65, r2: !!env?.STORAGE }),
        { headers: { "content-type": "application/json" } },
      );
    }

    // Pass R2 bucket via custom header for container access
    const headers = new Headers(request.headers);
    if (env?.STORAGE) {
      headers.set('X-R2-Available', 'true');
    }

    const modifiedRequest = new Request(request, { headers });
    return this.containerFetch(modifiedRequest);
  }

  override async onInit(env: any): Promise<void> {
    if (env.CF_ACCOUNT_ID) this.envVars.CF_ACCOUNT_ID = env.CF_ACCOUNT_ID;
    if (env.CF_API_TOKEN) this.envVars.CF_API_TOKEN = env.CF_API_TOKEN;
    if (env.D1_DATABASE_ID) this.envVars.D1_DATABASE_ID = env.D1_DATABASE_ID;
    if (env.R2_BUCKET_NAME) this.envVars.R2_BUCKET_NAME = env.R2_BUCKET_NAME;
    if (env.KV_NAMESPACE_ID) this.envVars.KV_NAMESPACE_ID = env.KV_NAMESPACE_ID;
  }

  override onStart(): void {
    this.renewActivityTimeout();
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/__health") {
      return new Response("ok", { headers: { "content-type": "text/plain" } });
    }

    // R2 proxy (main storage)
    if (url.pathname.startsWith("/__r2/")) {
      const key = url.pathname.slice(6);
      if (request.method === "GET") {
        const obj = await env.STORAGE.get(key);
        return obj ? new Response(obj.body) : new Response("Not found", { status: 404 });
      }
      if (request.method === "PUT") {
        await env.STORAGE.put(key, request.body);
        return new Response(JSON.stringify({ success: true }));
      }
      if (request.method === "DELETE") {
        await env.STORAGE.delete(key);
        return new Response(JSON.stringify({ success: true }));
      }
    }

    // R2 User Data (separate bucket for login/user data)
    if (url.pathname.startsWith("/__userdata/")) {
      const key = url.pathname.slice(12);
      if (request.method === "GET") {
        const obj = await env.USER_DATA.get(key);
        return obj ? new Response(obj.body) : new Response("Not found", { status: 404 });
      }
      if (request.method === "PUT") {
        await env.USER_DATA.put(key, request.body);
        return new Response(JSON.stringify({ success: true }));
      }
      if (request.method === "DELETE") {
        await env.USER_DATA.delete(key);
        return new Response(JSON.stringify({ success: true }));
      }
    }

    // D1 proxy
    if (url.pathname === "/__d1/query" && request.method === "POST") {
      const { sql, params } = await request.json() as any;
      const result = await env.DB.prepare(sql).bind(...(params || [])).all();
      return new Response(JSON.stringify(result));
    }

    // KV proxy
    if (url.pathname.startsWith("/__kv/")) {
      const key = url.pathname.slice(6);
      if (request.method === "GET") {
        const value = await env.CACHE.get(key);
        return new Response(value);
      }
      if (request.method === "PUT") {
        await env.CACHE.put(key, await request.text());
        return new Response(JSON.stringify({ success: true }));
      }
      if (request.method === "DELETE") {
        await env.CACHE.delete(key);
        return new Response(JSON.stringify({ success: true }));
      }
    }

    if (url.pathname === "/") {
      url.pathname = "/index.html";
      return Response.redirect(url.toString(), 302);
    }

    const container = getContainer(env.MIGHTY_AGENT_CONTAINER, "primary");
    return container.fetch(request, env);
  },
};

