# Mighty Agent is the first Full-stack, Open-source, Agentic AI framework, offering a G��fully local alternativeG�� to platforms like Manus & Genspark AI. It features an integrated Code Interpreter VM sandbox for safe execution.G��G��

<div align=center>
  <img src="./public/img/logo.jpeg" width="400">
</div>
<p align="center">
  <a href="https://mighty-agent-11.gitbook.io/mighty-agent">Get to know Mighty Agent quickly</a> -+
  <a href="https://mighty-agent-11.gitbook.io/mighty-agent/development-deployment-guidelines/docker-quick-deployment">Docker Quick Deployment</a> -+
  <a href="./CLOUDFLARE_CONTAINERS.md">Cloudflare Container Deployment</a> -+
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

Mighty Agent supports deployment as a **Container-enabled Worker** on Cloudflare, providing scalable, on-demand container instances with Workers AI integration.

#### Quick Deploy

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Build the application
pnpm run build

# Deploy to Cloudflare
npx wrangler deploy
```

For detailed instructions, prerequisites, and configuration options, see **[CLOUDFLARE_CONTAINERS.md](./CLOUDFLARE_CONTAINERS.md)**.

#### Prerequisites

- **Cloudflare Account** with the following permissions:
  - "Containers: Edit"
  - "Workers Scripts: Edit"
- **Docker** or Docker-compatible CLI running locally
- **Wrangler CLI** (installed via npx or globally)

#### Available AI Models

The Cloudflare Worker integrates Workers AI via the `AI` binding. The following AI models and endpoints are available:

**Chat Models:**
- DeepSeek Coder: `POST /api/agent/v1/chat/deepseek-coder-6.7b-base-awq` and `/api/agent/v1/chat/deepseek-coder-6.7b-instruct-awq`
- Falcon 7B: `POST /api/agent/v1/chat/falcon-7b-instruct`
- Gemma 3 12B: `POST /api/agent/v1/chat/gemma-3-12b-it`
- Gemma 7B: `POST /api/agent/v1/chat/gemma-7b-it`
- Gemma SEA-LION 27B: `POST /api/agent/v1/chat/gemma-sea-lion-v4-27b-it`
- GPT-OSS 20B: `POST /api/agent/v1/chat/gpt-oss-20b`
- DeepSeek Math: `POST /api/agent/v1/chat/deepseek-math-7b-instruct`

**Vision & Image Generation:**
- Object Detection (DETR ResNet-50): `POST /api/agent/v1/vision/detr-resnet-50`
- Text-to-Image (Dreamshaper): `POST /api/agent/v1/image/dreamshaper-8-lcm`

**Audio Processing:**
- Text-to-Speech (Deepgram Aura): `POST /api/agent/v1/text-to-speech/aura-1`
- Speech-to-Text (Deepgram Flux): `POST /api/agent/v1/asr/flux`

**Text Processing:**
- Summarization (BART): `POST /api/agent/v1/summarize/bart-large-cnn`
- Sentiment Analysis (DistilBERT): `POST /api/agent/v1/classify/distilbert-sst-2-int8`

**Embeddings & Search:**
- Multilingual Embeddings (EmbeddingGemma 300M): `POST /api/agent/v1/embeddings/embeddinggemma-300m`
- BGE Base Embeddings: `POST /api/agent/v1/embeddings/bge-base-en-v1.5`
- BGE Small Embeddings: `POST /api/agent/v1/embeddings/bge-small-en-v1.5`
- BGE Large Embeddings: `POST /api/agent/v1/embeddings/bge-large-en-v1.5`
- BGE M3 Multilingual: `POST /api/agent/v1/embeddings/bge-m3`
- Reranking (BGE Reranker): `POST /api/agent/v1/rerank/bge-reranker-base`

All endpoints support OpenAI-compatible message format. Many support streaming responses with `stream=true`.

#### Configuration

Set environment variables to configure AI model access:
- `CF_AI_USE=true` - Enable Cloudflare AI
- `CF_ACCOUNT_ID` - Your Cloudflare account ID
- `CF_API_TOKEN` - Your Cloudflare API token
- Model-specific variables (see `cloudflare/worker/index.ts`)

#### CI/CD Integration

Automated deployment is configured via GitHub Actions (`.github/workflows/deploy-cloudflare.yml`). Set repository secrets for `CF_API_TOKEN` and `CF_ACCOUNT_ID` to enable automatic deployment on push to main/master.


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
