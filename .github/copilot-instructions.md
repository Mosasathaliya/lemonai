# GitHub Copilot Instructions for Mighty Agent

## What is Mighty Agent?
**Full-stack, open-source agentic AI framework** - local alternative to Manus/Genspark with Docker-sandboxed code execution. Supports deep research, web browsing, coding, and data analysis on local hardware.

**Stack**: Node.js (Koa) + Vue 3 + SQLite/MySQL + Docker + Electron. Runs locally (Ollama) or cloud (Claude/GPT/Gemini/Grok).

## Critical Architecture Patterns

### 1. Three-Tier Runtime System (THE KEY PATTERN)
Runtime selection via `RUNTIME_TYPE` env var determines code execution environment:

```javascript
// src/agent/AgenticAgent.js
const RUNTIME_TYPE = process.env.RUNTIME_TYPE || 'local-docker';
const runtimeMap = {
  'local': LocalRuntime,           // NO sandbox - dev only, UNSAFE
  'docker': DockerRuntime,          // Remote Docker - production
  'local-docker': LocalDockerRuntime // Local Docker - DEFAULT, recommended
}
```

**Why this matters**: 
- `local-docker` is the sweet spot: sandboxed but accessible for debugging
- ALWAYS use sandboxed runtime in production (docker/local-docker)
- Docker container management is in `src/runtime/DockerRuntime.local.js` - container reuse, port allocation logic

### 2. Message Streaming Architecture
All agent actions stream via SSE (Server-Sent Events):

```javascript
// Pattern seen in src/agent/AgenticAgent.js
async _publishMessage({ uuid, action_type, status, content, json, task_id }) {
  const msg = Message.format({ uuid, action_type, status, content, json, task_id });
  this.onTokenStream(msg);  // Stream to frontend
  await Message.saveToDB(msg, this.context.conversation_id);  // Persist
}

// Action types: 'thinking', 'code_execution', 'auto_reply', 'finish_summery'
// Status: 'in_progress', 'success', 'error'
```

**Critical**: Frontend expects real-time message streams via `src/routers/agent/coding.sse.js`. Always maintain this pattern for new agent actions.

### 3. Module Alias Pattern
**ALWAYS** use `@src/` prefix for imports (configured in `jsconfig.json` + `package.json`):

```javascript
// CORRECT ✓
const Message = require('@src/utils/message.js');
const Conversation = require('@src/models/Conversation');

// WRONG ✗ - relative paths break in some contexts
const Message = require('../../../utils/message.js');
```

### 4. Agent Execution Flow (Code-Act Loop)
The agent uses a **Code-Act** pattern - think, code, execute, reflect:

```javascript
// src/agent/AgenticAgent.js - Simplified flow
class AgenticAgent {
  async run() {
    await this._initialSetupAndAutoReply();    // 1. Connect runtime, auto-reply
    await this._performPlanning();             // 2. Plan tasks
    await this._executeTasks();                // 3. Run code-act loop
    return await this._generateFinalOutput();  // 4. Summarize & version files
  }
  
  // The critical run_loop in AgenticAgent.run.js
  async run_loop() {
    while (!this.is_stop && this.taskManager.hasIncompleteTasks()) {
      const thinkingResult = await thinking(/* context */);  // LLM thinks
      const codeResult = await execute_code(/* ... */);       // Execute in sandbox
      await this._publishMessage(/* stream results */);       // Stream to frontend
      // Reflection happens here in production
    }
  }
}
```

**Key insight**: Each iteration generates messages streamed to frontend. The runtime (Docker container) persists across iterations for performance.

### 5. MCP (Model Context Protocol) Integration
Extensible tool system - add capabilities without code changes:

```javascript
// MCP servers defined in database (McpServer model)
// Tools auto-discovered from: src/mcp/client.js
const mcpClient = new MCPClient(serverConfig);
await mcpClient.connect();
const tools = await mcpClient.listTools();  // Tools exposed to agent

// Used in: src/agent/code-act/code-act.js
const mcpTools = await getMCPTools(context.mcp_server_ids);
// Agent can now call these tools during execution
```

**Pattern**: Add new capabilities via MCP servers (database config) instead of modifying core agent code.

## Essential Development Workflows

### Quick Start Commands
```bash
# ONE command to setup everything
make init              # Installs deps + initializes DB

# Development (starts both frontend & backend)
make run               # Backend on :5005, Frontend on :5173

# OR run separately
npm run start          # Backend only
cd frontend && npm run dev  # Frontend only

# Production
npm run prd            # PM2 process manager

# Electron Desktop App
npm run start-electron # Dev mode
npm run package        # Package for current platform
npm run make          # Build distributables (DMG/exe/deb/rpm)
```

### Database Initialization Pattern
**CRITICAL**: Run BEFORE first start:
```bash
node src/models/sync.js  # Creates/migrates all tables
# OR
make init-tables
```

Tables created: User, Conversation, Message, File, FileVersion, Task, Agent, Model, McpServer, Knowledge, Platform, etc.
See `src/models/sync.js` for default data seeding (platforms, models).

### Docker Development Setup
```bash
# 1. Pull runtime sandbox image (REQUIRED for code execution)
docker pull hexdocom/mighty-agent-runtime-sandbox:latest

# 2. Run app in Docker (for testing production setup)
docker run -it --rm \
  --name mighty-agent-app \
  --env DOCKER_HOST_ADDR=host.docker.internal \
  --publish 5005:5005 \
  --add-host host.docker.internal:host-gateway \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume ~/.cache:/.cache \
  hexdocom/mighty-agent:latest make run
```

**Why mount Docker socket?** App needs to spawn sandbox containers for code execution. Security implication: container has Docker access.

### Testing Pattern
```bash
npm test  # Runs Mocha tests in test/api/

# Test structure example (test/api/platform/platform.test.js):
const request = require("supertest");
const sinon = require("sinon");
const { expect } = require("chai");
const app = require("@src/app");

describe("Feature", () => {
  let server;
  before(() => { server = app.listen(); });
  after(() => { server.close(); });
  afterEach(() => { sinon.restore(); });
  
  it("should do something", async () => {
    sinon.stub(Model, "method").resolves(mockData);
    const res = await request(server).post("/api/endpoint").send(data);
    expect(res.status).to.equal(200);
  });
});
```

**Convention**: Use `sinon` stubs for DB, `supertest` for HTTP, `chai` assertions. Place tests in `test/api/` or colocate with `.test.js` suffix.

## Code Conventions You MUST Follow

### 1. Error Handling & Response Format
```javascript
// API responses use custom ctx.response wrapper (src/middlewares/wrap.context.js)
ctx.response.success(data);           // { success: true, data, error: null }
ctx.response.fail(data, message);     // { success: false, data, error: message }

// NEVER return raw ctx.body = {} in routers - breaks frontend expectations
```

### 2. Async/Await Pattern
```javascript
// ALWAYS use async/await (no callbacks or .then chains)
async function executeTask() {
  const result = await someAsyncOperation();
  return result;
}

// Error handling in routers
router.post('/endpoint', async (ctx) => {
  try {
    const result = await operation();
    return ctx.response.success(result);
  } catch (error) {
    console.error('Error:', error);
    return ctx.response.fail({}, error.message);
  }
});
```

### 3. Environment Variables (with defaults!)
```javascript
// ALWAYS provide defaults for non-sensitive configs
const RUNTIME_TYPE = process.env.RUNTIME_TYPE || 'local-docker';
const WORKSPACE_DIR = process.env.WORKSPACE_DIR || 'workspace';
const ENABLE_KNOWLEDGE = process.env.ENABLE_KNOWLEDGE === 'ON';

// See .env.example for full list (33+ Cloudflare AI model configs)
```

### 4. Logging Pattern
```javascript
// Setup in src/app.js
const { logging } = require("@src/logger/index");
global.logging = logging;

// Use structured logging (winston/pino)
logging.info('Operation started', { conversationId, userId });
logging.error('Operation failed', { error: err.message, stack: err.stack });

// Console.log is OK for development, but prefer structured logging
```

### 5. Frontend (Vue 3 Composition API)
```vue
<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const data = ref([]);

onMounted(async () => {
  data.value = await fetchData();
});
</script>

<style scoped lang="scss">
// Use scoped styles, SCSS syntax
</style>
```

## Critical Integration Points

### 1. LLM Provider System
Multi-provider support via `src/models/Model.js` and `DefaultModelSetting.js`:

```javascript
// Models configured in DB with platform association
// Supported: Ollama (local), OpenAI, Claude, Gemini, Grok, Azure, Cloudflare Workers AI

// In agent code:
const { getDefaultModel } = require('@src/utils/default_model');
const model = await getDefaultModel(userId, 'chat'); // or 'embedding', 'code', etc.

// Cloudflare Workers AI: 30+ models via env vars (CF_AI_MODEL, CF_GEMMA_MODEL, etc.)
```

### 2. File Storage & Versioning
```javascript
// Local storage pattern (workspace per conversation)
const dir_name = 'Conversation_' + conversation_id.slice(0, 6);
const WORKSPACE_DIR = process.env.WORKSPACE_DIR || 'workspace';
const conversationDir = path.join(WORKSPACE_DIR, dir_name);

// Git-like versioning (src/utils/versionManager.js)
await createFilesVersion(conversation_id, newFiles, '.html', state);

// Cloud storage: R2 (Cloudflare Object Storage) - see src/middlewares/r2.js
```

### 3. Browser Automation (Playwright)
```javascript
// Python service: browser_server/ (FastAPI/Flask + Playwright)
// Node.js wrapper: src/runtime/browser.js, src/tools/browser.js

// Pattern: Agent calls browser tools during code-act loop
// See browser_server/readme.md for setup
```

### 4. Knowledge Base (RAG)
```javascript
// Enable via ENABLE_KNOWLEDGE=ON
// Storage: Vector embeddings in database (Knowledge model)
// Management: src/routers/knowledge/
// Integration: Used in agent planning/execution for context retrieval
```

## Common Tasks & Patterns

### Adding a New API Endpoint
```javascript
// 1. Create router file: src/routers/<domain>/<feature>.js
const router = require("koa-router")();

/**
 * @swagger
 * /api/feature:
 *   post:
 *     summary: Feature description
 *     tags: [Feature]
 */
router.post("/", async (ctx) => {
  try {
    const result = await operation();
    return ctx.response.success(result);
  } catch (error) {
    return ctx.response.fail({}, error.message);
  }
});

module.exports = router;

// 2. Register in src/routers/index.js
const feature = require('./feature');
router.use('/api/feature', feature.routes());

// 3. Frontend service (frontend/src/services/<feature>.js)
export const createFeature = (data) => {
  return request.post('/api/feature', data);
};
```

### Adding a New Tool (MCP Pattern)
```javascript
// 1. Implement in src/tools/impl/new_tool.js
async function newTool(params) {
  // Tool logic
  return result;
}

// 2. Register in src/tools/index.js
module.exports = {
  new_tool: newTool,
  // ... other tools
};

// 3. OR add as MCP server (better for extensibility)
// Add McpServer record in DB, agent auto-discovers tools
```

### Modifying Agent Behavior
```javascript
// 1. Update prompts: src/agent/prompt/*.js
const systemPrompt = `You are a helpful assistant...`;

// 2. Adjust code-act loop: src/agent/code-act/code-act.js
// 3. Modify thinking: src/agent/code-act/thinking.js
// 4. Update reflection: src/agent/reflection/index.js

// WARNING: Changes affect all agent interactions - test thoroughly
```

### Database Model Changes
```javascript
// 1. Update model: src/models/Feature.js
const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const Feature = sequelize.define('Feature', {
  new_field: DataTypes.STRING
});

// 2. Add to sync: src/models/sync.js
await Feature.sync({ alter: true }); // Auto-migrates in dev

// 3. Production: Manual migration or backup before alter
```

## Debugging & Troubleshooting

### Common Issues

**Docker container won't start:**
```bash
# Check Docker socket permissions
ls -la /var/run/docker.sock
sudo chmod 666 /var/run/docker.sock  # Or add user to docker group

# Check if port is available
lsof -i :5005
```

**"Cannot find module @src/...":**
```bash
# Ensure module-alias is registered (should be in src/app.js line 1)
require("module-alias/register");

# Check jsconfig.json has correct paths
```

**Database locked errors (SQLite):**
```javascript
// SQLite doesn't handle concurrent writes well
// Solution: Use transactions or switch to MySQL for production
await sequelize.transaction(async (t) => {
  await Model.create(data, { transaction: t });
});
```

**Frontend can't connect to backend:**
```javascript
// Check CORS (enabled by default in Koa)
// Verify API_BASE_URL in frontend/src/config/
// Check if backend is actually running on :5005
```

### Debugging Runtime Issues
```bash
# 1. Set RUNTIME_TYPE=local for direct debugging (NO SANDBOX)
RUNTIME_TYPE=local npm run start

# 2. Check Docker logs
docker logs -f <container_id>

# 3. Inspect running container
docker exec -it <container_id> /bin/bash

# 4. View execution logs in DB
# SELECT * FROM Messages WHERE action_type = 'code_execution';
```

### API Testing
```bash
# Swagger UI at http://localhost:5005/swagger
# Or use curl:
curl -X POST http://localhost:5005/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

## Project-Specific Notes

### Naming History
- **Former**: "LemonAI" (hexdolemonai namespace)
- **Current**: "Mighty Agent" (hexdocom namespace)
- Some image names still use "lemon" prefix (backward compat)

### Multi-Platform Support
- **Desktop**: macOS (DMG), Windows (Squirrel), Linux (DEB/RPM)
- **Docker**: amd64 + arm64 builds
- **WSL**: Windows requires WSL2 + Docker Desktop

### Cloudflare Workers Deployment
```bash
# Build workflow (cloudflare/ directory)
cd frontend && pnpm run build    # Frontend assets
pnpm run build                    # Worker bundle
wrangler deploy                   # Deploy to Cloudflare

# wrangler.toml configures:
# - AI binding (Workers AI)
# - D1 database (SQLite on edge)
# - R2 storage (file uploads)
# - KV cache (response caching)
# - Containers binding (main app)
```

## Key Files Reference

### Critical Entry Points
- `src/app.js` - Koa application setup, middleware chain
- `main.js` - Electron main process
- `src/agent/AgenticAgent.js` - Main agent orchestrator
- `src/runtime/DockerRuntime.local.js` - Default runtime implementation
- `frontend/src/main.js` - Vue app bootstrap
- `src/models/sync.js` - Database initialization & seeding

### Important Directories
- `src/agent/` - AI agent implementation (planning, code-act, reflection)
- `src/runtime/` - Code execution environments (local, docker, e2b)
- `src/routers/` - API endpoints (RESTful + SSE)
- `src/models/` - Sequelize ORM models
- `src/mcp/` - Model Context Protocol integration
- `frontend/src/components/` - Vue components (18+ subdirectories)
- `containers/` - Dockerfile definitions
- `test/api/` - Mocha test suites

### Configuration Files
- `.env.example` - Environment template (33+ Cloudflare AI configs)
- `jsconfig.json` - Module aliases (@src/*, @types/*)
- `package.json` - Backend dependencies & scripts
- `frontend/package.json` - Frontend dependencies
- `wrangler.toml` - Cloudflare Workers config
- `forge.config.js` - Electron packaging config
- `Makefile` - Build & deployment shortcuts

## Essential Environment Variables
```bash
# Runtime
RUNTIME_TYPE=local-docker  # local | docker | local-docker

# Storage
STORAGE_PATH=data/database.sqlite
WORKSPACE_DIR=workspace
ENABLE_KNOWLEDGE=ON        # Enable RAG features

# Cloudflare (30+ model configs - see .env.example)
CF_AI_USE=false
CF_ACCOUNT_ID=your_account_id
CF_API_TOKEN=your_api_token
CF_AI_MODEL=@cf/meta/llama-3.1-8b-instruct
# ... 27 more CF_*_MODEL variables for different models
```

## Resources

- **Documentation**: https://mighty-agent-11.gitbook.io/mighty-agent
- **API Docs**: `/swagger` endpoint + API_README.md
- **Contributing**: CONTRIBUTING.md
- **Docker Guide**: README.md (Docker Quick Deployment)
- **Frontend Guide**: frontend/WEB_README.md
- **Issues**: https://github.com/hexdocom/Mighty-Agent/issues
- **Discord**: Community support

---

**TL;DR for AI Agents**: 
1. Use `@src/` imports, never relative paths
2. Runtime system is Docker-based - `local-docker` is the default
3. Message streaming via SSE is the communication pattern
4. All agent actions flow through Code-Act loop in AgenticAgent
5. Use `ctx.response.success/fail` for API responses
6. Run `make init` first, then `make run` for dev
7. MCP for adding tools without code changes
8. Test with `npm test` (Mocha + Chai + Sinon)

*Last updated: Based on codebase analysis of Mighty Agent v0.4.0*
