# Mighty Agent is the first Full-stack, Open-source, Agentic AI framework, offering a G��fully local alternativeG�� to platforms like Manus & Genspark AI. It features an integrated Code Interpreter VM sandbox for safe execution.G��G��

<div align=center>
  <img src="./public/img/logo.jpeg" width="400">
</div>
<p align="center">
  <a href="https://mighty-agent-11.gitbook.io/mighty-agent">Get to know Mighty Agent quickly</a> -+
  <a href="https://mighty-agent-11.gitbook.io/mighty-agent/development-deployment-guidelines/docker-quick-deployment">Docker Quick Deployment</a> -+
  <a href="https://mighty-agent-11.gitbook.io/mighty-agent/">Documentation</a> -+
  <a href="https://Mighty Agent.cc/">Download the desktop app for macOS & Windows</a> -+
  <a href="https://deepwiki.com/hexdocom/Mighty Agent">DeepWiki</a> 
</p>

<p align="center">
  <a href="./README.md"><img alt="README in English" src="https://img.shields.io/badge/English-d9d9d9"></a>
  <a href="./README_CN.md"><img alt="t��S+�S+����t��F�F+����S+�" src="https://img.shields.io/badge/t��S+�S+����-d9d9d9"></a>
</p>


**Mighty AgentG��** is the first **G��full-stack, open-source, agentic AI framework**, offering a **G��fully local alternativeG��** to platforms like **Manus & Genspark AI. It features an integrated Code Interpreter VM sandbox for safe execution**.G��G��

**G��Mighty Agent empowers deep research, web browsing, viable coding, and data analysis G�� running entirely on your local hardware.G��G��** It supports G��**planning, action, reflection, and memoryG��** functionalities using **G��local LLMs**G�� (like DeepSeek, Qwen, Llama, Gemma) via **Ollama**, ensuring **G��complete privacy and zero cloud dependency.**

For enhanced security, Mighty Agent operates within a G��**local Virtual Machine (VM) sandbox.** This sandbox **G��protects your machine's files and operating systemG��** by safely handling all code writing, execution, and editing tasks.

Additionally, Mighty Agent provides the **G��flexibility to configure enhanced results**G�� using APIs from leading cloud models like **G��Claude, GPT, Gemini, and Grok.**

<a href="https://youtu.be/OmU_4rrZUHE?si=iseqOl5TV2n2kovy">
  <figure>
    <img src="./public/img/githubvideo.png" alt="">
  </figure>
</a>

### function and characteristic
The world's first full-stack open-source AI Agentic framework with comprehensive capabilities
#### Multi: Infinite possibilities
Universal AI Agent capabilities supporting unlimited task scenarios, including:
- Deep search & research reports
- Code generation & data analysis
- Content creation & document processing
Supports experience repository for self-learning and extending enterprise-specific customizations.

**Deployment options:** Open source code, Container, Client application, Online subscription - compatible with cloud/local/all-in-one systems

#### Fast: Rapid Deploy
One-click deployment for immediate usage with minimal technical requirements:
- Simplified installation process for all deployment options
- Quick setup without complex configurations
- Ready-to-use system within minutes

Supporting various deployment environments from personal computers to enterprise servers, with comprehensive documentation for smooth implementation.

#### Good: Powerful & Flexibility
Feature-rich framework with extensive capabilities:
- Virtual machine integration
- Code generation & execution
- Browser operations & web search
- Multi-tool integration

Highly adaptable architecture allows for custom modifications and extensions to fit specific business requirements and integration with existing systems.

#### Economic: Same qualityn+�10x cheaper
Dramatically reduced operational costs:
- Task execution costs 1/10 - 1/100 of other agent products
- Open source subscription model
- Based on open source DeepSeekV3 model

Significant cost savings without compromising on quality or performance, making advanced AI capabilities accessible to organizations of all sizes.

### Using Mighty Agent

* Quickly get Mighty Agent running in your environment with this starter guide. Use our [documentation](https://document.Mighty Agent.cc/) for further references and more in-depth instructions.

### System Requirements[G��](https://docs.all-hands.dev/modules/usage/installation#system-requirements) <a href="#system-requirements" id="system-requirements"></a>

* MacOS with [Docker Desktop support](https://docs.docker.com/desktop/setup/install/mac-install/#system-requirements)
* Linux
* Windows with [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) and [Docker Desktop support](https://docs.docker.com/desktop/setup/install/windows-install/#system-requirements)

A system with a modern processor and a minimum of **4GB RAM** is recommended to run Mighty Agent.

### Prerequisites <a href="#prerequisites" id="prerequisites"></a>

#### MacOS

**Docker Desktop**

1. [Install Docker Desktop on Mac](https://docs.docker.com/desktop/setup/install/mac-install).
2. Open Docker Desktop, go to `Settings > Advanced` and ensure `Allow the default Docker socket to be used` is enabled.

#### Linux

Tested with Ubuntu 22.04.

**Docker Desktop**

1. [Install Docker Desktop on Linux](https://docs.docker.com/desktop/setup/install/linux/).

#### Windows

**WSL**

1. [Install WSL](https://learn.microsoft.com/en-us/windows/wsl/install).
2. Run `wsl --version` in powershell and confirm `Default Version: 2`.

**Docker Desktop**

1. [Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install).
2. Open Docker Desktop, go to `Settings` and confirm the following:

* General: `Use the WSL 2 based engine` is enabled.
* Resources > WSL Integration: `Enable integration with my default WSL distro` is enabled.

**note**

The docker command below to start the app must be run inside the WSL terminal.

### Start the App <a href="#start-the-app" id="start-the-app"></a>

The easiest way to run Mighty Agent is in Docker.

```bash
docker pull hexdocom/mighty-agent-runtime-sandbox:latest

docker run -it --rm --pull=always \
  --name mighty-agent-app \
  --env DOCKER_HOST_ADDR=host.docker.internal \
  --env ACTUAL_HOST_WORKSPACE_PATH=${WORKSPACE_BASE:-$PWD/workspace} \
  --publish 5005:5005 \
  --add-host host.docker.internal:host-gateway \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume ~/.cache:/.cache \
  --volume ${WORKSPACE_BASE:-$PWD/workspace}:/workspace \
  --volume ${WORKSPACE_BASE:-$PWD/data}:/app/data \
  --interactive \
  --tty \
  hexdocom/mighty-agent:latest make run
```

### Cloudflare Workers deployment

- The Cloudflare Worker (`cloudflare/worker/index.ts`) now binds Workers AI via the `AI` binding declared in `wrangler.toml`.
- Requests to `POST /api/agent/v1/chat/completions` are served directly by the Worker and proxied to `env.AI`, keeping the container focused on the rest of the API surface.
- The container receives a default `MODEL_NAME` (`@cf/meta/llama-3.1-8b-instruct`) through its environment; adjust this in `cloudflare/worker/index.ts` or override it at deploy time to target a different Workers AI model.
- To invoke Workers AI from inside the application container, set `CF_AI_USE=true` together with `CF_ACCOUNT_ID`, `CF_API_TOKEN`, and (optionally) `CF_AI_MODEL`; the Koa proxy will mimic the Worker’s OpenAI-compatible responses for both JSON and streaming callers.
- DeepSeek Coder base/instruct models are exposed at `POST /api/agent/v1/chat/deepseek-coder-6.7b-base-awq` and `/api/agent/v1/chat/deepseek-coder-6.7b-instruct-awq`; set `CF_DEEPSEEK_CODER_MODEL` / `CF_DEEPSEEK_CODER_INSTRUCT_MODEL`, send OpenAI-style `messages`, and optionally set `stream=true` for SSE responses.
- Falcon 7B Instruct chat is available at `POST /api/agent/v1/chat/falcon-7b-instruct`; set `CF_FALCON_MODEL` and send OpenAI-style `messages` (supports `stream=true`).
- Gemma 3 12B Instruct chat is available at `POST /api/agent/v1/chat/gemma-3-12b-it`; set `CF_GEMMA_MODEL` and send OpenAI-style `messages` (supports `stream=true`).
- Gemma 7B Instruct chat is available at `POST /api/agent/v1/chat/gemma-7b-it`; set `CF_GEMMA_7B_MODEL` and send OpenAI-style `messages`.
- Gemma SEA-LION 27B Instruct chat is available at `POST /api/agent/v1/chat/gemma-sea-lion-v4-27b-it`; set `CF_GEMMA_SEA_LION_MODEL` and send OpenAI-style `messages`. 
- GPT-OSS 20B chat is available at `POST /api/agent/v1/chat/gpt-oss-20b`; set `CF_GPT_OSS_20B_MODEL` and send instructions/input in OpenAI-compatible format (supports `stream=true`).
- Gemma 7B LoRA chat is available at `POST /api/agent/v1/chat/gemma-7b-it-lora`; set `CF_GEMMA_7B_LORA_MODEL` and send OpenAI-style `messages`. 
- DeepSeek Math instruct model is available at `POST /api/agent/v1/chat/deepseek-math-7b-instruct`; configure `CF_DEEPSEEK_MATH_MODEL` and reuse the same message/stream semantics as other chat routes.
- Object detection via DETR ResNet-50 is available at `POST /api/agent/v1/vision/detr-resnet-50`; set `CF_DETR_RESNET_MODEL`, and send either `image` byte arrays, `image_base64`, or `image_url`.
- Text-to-speech via Deepgram Aura is exposed at `POST /api/agent/v1/text-to-speech/aura-1` in both the Worker and container. Configure `CF_AURA_MODEL` if you need to override the default `@cf/deepgram/aura-1`, and pass `speaker`, `encoding`, `container`, `sample_rate`, or `bit_rate` as documented by Cloudflare.
- Speech-to-text via Deepgram Flux is available at `POST /api/agent/v1/asr/flux`; set `CF_FLUX_MODEL`, and provide audio (array of bytes, base64, or URL) with optional `encoding`, `sample_rate`, and `language`.
- Text-to-image via Dreamshaper is available at `POST /api/agent/v1/image/dreamshaper-8-lcm`; set `CF_DREAMSHAPER_MODEL`, supply `prompt`, and optionally add negative prompts, dimensions, or reference images (`image`, `image_base64`, `image_url`).
- Summarization using Facebook BART is available at `POST /api/agent/v1/summarize/bart-large-cnn`; set `CF_BART_MODEL` to swap models and include optional `max_length` alongside the required `input_text`.
- Multilingual embeddings via EmbeddingGemma 300M are available at `POST /api/agent/v1/embeddings/embeddinggemma-300m`; configure `CF_EMBEDDING_GEMMA_MODEL` and send `text` as a string or array.
- Text embeddings via BAAI BGE Base are served at `POST /api/agent/v1/embeddings/bge-base-en-v1.5`; adjust `CF_BGE_MODEL` if you need a different embedding model and provide `text` as a string or array (with optional `pooling`).
- Lightweight embeddings via BAAI BGE Small are available at `POST /api/agent/v1/embeddings/bge-small-en-v1.5`; override `CF_BGE_SMALL_MODEL` if you swap models and reuse the same payload shape.
- Higher dimension embeddings via BAAI BGE Large are available at `POST /api/agent/v1/embeddings/bge-large-en-v1.5`; override `CF_BGE_LARGE_MODEL` if you swap models and reuse the same request schema.
- Sentiment classification via DistilBERT SST-2 is exposed at `POST /api/agent/v1/classify/distilbert-sst-2-int8`; configure `CF_DISTILBERT_MODEL` and send a `text` string.
- Multi-lingual BGE M3 embeddings are exposed at `POST /api/agent/v1/embeddings/bge-m3`; set `CF_BGE_M3_MODEL` and pass either `text`, or `{query, contexts}` payloads (including `requests`) per the Cloudflare schema.
- Relevance reranking with BGE Reranker Base is exposed at `POST /api/agent/v1/rerank/bge-reranker-base`; configure `CF_BGE_RERANKER_MODEL` and supply `query` plus an array of `{ text }` contexts (optional `top_k`).
- Run `pnpm exec wrangler build` (or `pnpm run build`) before deployment to validate the Worker and container bundle.

### Contributing

For those who'd like to contribute code, see our [Contribution Guide](https://github.com/hexdocom/Mighty-Agent/blob/main/CONTRIBUTING.md). At the same time, please consider supporting Mighty Agent by sharing it on social media and at events and conferences.

#### contributors

<a href="https://github.com/hexdocom/Mighty Agent/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=hexdocom/Mighty Agent" />
</a>

### Community & contact

We welcome your contribution to Mighty Agent to help improve Mighty Agent. Include: submit code, questions, new ideas, or share interesting and useful AI applications you have created based on Mighty Agent. We also welcome you to share Mighty Agent at different events, conferences and social media.

* [GitHub Discussion](https://github.com/hexdocom/Mighty Agent/discussions). Best for: sharing feedback and asking questions.
* [GitHub Issues](https://github.com/hexdocom/Mighty-Agent/issues).Best for: bugs you encounter using Mighty Agent, and feature proposals. See our [Contribution Guide](https://github.com/hexdocom/Mighty-Agent/blob/main/CONTRIBUTING.md).
* [X(Twitter)](https://x.com/Mighty Agent_cc). Best for: sharing your applications and hanging out with the community.
* [Discord](https://discord.gg/EVvCx4BU). Best for: sharing your applications and hanging out with the community.
* commercial licensen+�[service@hexdo.com](mailto:service@hexdo.com)n+�. Business consulting on commercial use licensing Mighty Agent.

### Star History

[![Star History Chart](https://api.star-history.com/svg?repos=hexdocom/Mighty Agent&type=Date)](https://www.star-history.com/#hexdocom/Mighty Agent&Date)

### Security disclosure

To protect your privacy, please avoid posting security issues on GitHub. Instead, send your questions to [service@hexdo.com](mailto:service@hexdo.com) and we will provide you with a more detailed answer.

### License

This repository is available under the [Mighty Agent Open Source License](https://github.com/hexdocom/Mighty-Agent/blob/main/LICENSE), which is essentially Apache 2.0 with a few additional restrictions.
