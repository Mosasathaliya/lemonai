# GitHub Copilot Instructions for Mighty Agent (LemonAI)

## Project Overview

Mighty Agent is a **full-stack, open-source, agentic AI framework** that provides a fully local alternative to platforms like Manus & Genspark AI. It features an integrated Code Interpreter VM sandbox for safe code execution, supporting deep research, web browsing, viable coding, and data analysis entirely on local hardware.

### Core Capabilities
- **Planning & Execution**: Multi-step task planning with reflection and memory
- **Code Interpreter**: Safe code execution in Docker/VM sandboxes
- **Multi-Model Support**: Works with local LLMs (DeepSeek, Qwen, Llama, Gemma via Ollama) and cloud APIs (Claude, GPT, Gemini, Grok)
- **Web Integration**: Browser automation, web search, and data scraping
- **MCP Integration**: Model Context Protocol for extensible tool integration

## Tech Stack

### Backend (Node.js)
- **Framework**: Koa v2 - Lightweight web framework
- **ORM**: Sequelize - Database abstraction layer
- **Database**: SQLite (default) with support for MySQL
- **Key Libraries**:
  - `dockerode` - Docker API integration
  - `playwright` - Browser automation
  - `@modelcontextprotocol/sdk` - MCP integration
  - `koa-router` - API routing
  - `dotenv` - Environment configuration
  - `winston` / `pino` - Logging

### Frontend (Vue.js)
- **Framework**: Vue 3 with Composition API
- **Build Tool**: Vite 6.x
- **State Management**: Vuex store pattern
- **Router**: Vue Router with history mode
- **Styling**: SCSS with embedded Sass

### Desktop Application
- **Framework**: Electron 29.x
- **Build**: Electron Forge with Vite plugin
- **Packaging**: DMG (macOS), Squirrel (Windows), DEB/RPM (Linux)

### Deployment & Cloud
- **Containerization**: Docker with multi-platform support (amd64, arm64)
- **Cloud**: Cloudflare Workers for serverless AI endpoints
- **CI/CD**: GitHub Actions for Docker image builds

## Architecture

### Core Components

#### 1. Agent System (`src/agent/`)
The agentic AI system with multiple specialized modules:

- **AgenticAgent.js**: Main agent orchestrator with task management
- **TaskManager.js**: Tracks and manages multi-step tasks
- **planning/**: Task planning with goal decomposition
- **code-act/**: Code generation and execution loop
  - `code-act.js` - Main code-action execution
  - `thinking.js` - Agent reasoning process
  - `message.js` - Message formatting
- **reflection/**: Self-evaluation and improvement
- **auto-reply/**: Automatic conversation handling
- **intent-detection/**: User intent classification
- **summary/**: Conversation summarization
- **memory/**: Context and history management
- **generate-agent/**: Dynamic agent creation
- **multi-model-agent.js**: Multi-model orchestration

#### 2. Runtime Environment (`src/runtime/`)
Safe code execution with multiple runtime options:

- **DockerRuntime.js**: Production Docker sandbox (remote)
- **DockerRuntime.local.js**: Local Docker sandbox (default)
- **LocalRuntime.js**: Direct local execution (dev only)
- **action_execution_server.js**: Code execution API server
- **plugins/**: Runtime extensions and integrations
- **browser.js**: Browser automation integration
- **terminal_run.js**: Terminal command execution

**Runtime Selection** via `RUNTIME_TYPE` env var:
- `docker` - Remote Docker (production)
- `local-docker` - Local Docker (default, recommended)
- `local` - No sandbox (development only)

#### 3. API Layer (`src/routers/`)
RESTful API with Swagger documentation:

- **agent/**: Core AI agent endpoints
  - `agent.js` - Agent orchestration
  - `chat.js` - Chat completions
  - `coding.js` - Code generation
  - `run.js` - Task execution
  - `proxy.js` - LLM proxy endpoints
  - `embeddings.js`, `classify.js`, etc. - AI utilities
- **conversation/**: Conversation management
- **file/**: File operations and R2 storage
- **message/**: Message history
- **mcp_server/**: MCP server management
- **knowledge/**: Knowledge base operations
- **runtime/**: Runtime control endpoints
- **user/**: User authentication and management

#### 4. Data Layer (`src/models/`)
Sequelize ORM models:

- **User.js**: User accounts and authentication
- **Conversation.js**: Chat conversations
- **Message.js**: Individual messages
- **Agent.js**: Agent configurations
- **Task.js**: Task tracking
- **File.js**, **FileVersion.js**: File management
- **McpServer.js**: MCP server configurations
- **Model.js**, **DefaultModelSetting.js**: LLM configurations
- **Knowledge.js**: Knowledge base entries
- **sync.js**: Database initialization and migrations

#### 5. Tools & Utilities (`src/tools/`)
External integrations and helper functions:

- **WebSearch.js**: Web search integration
- **browser.js**: Browser control
- **read_file.js**: File reading utilities
- **impl/**: Tool implementations

#### 6. MCP Integration (`src/mcp/`)
Model Context Protocol support:

- **client.js**: MCP client connections
- **server.js**: MCP server implementation
- **transport.js**: Communication layer
- **tool.js**: Tool registry and execution
- **prompt.js**: Prompt management
- **cache.js**: Response caching

### Frontend Architecture (`frontend/`)

- **src/components/**: Vue components (18 subdirectories)
- **src/view/**: Page views
- **src/store/**: Vuex state management
- **src/router/**: Vue Router configuration
- **src/services/**: API service layer
- **src/utils/**: Frontend utilities

## Development Workflow

### Environment Setup

1. **Prerequisites**:
   - Node.js (v18+ recommended)
   - Docker Desktop (for runtime sandboxes)
   - pnpm (package manager)

2. **Configuration** (`.env` file):
   ```bash
   STORAGE_PATH=data/database.sqlite
   WORKSPACE_DIR=workspace
   RUNTIME_TYPE=local-docker  # docker | local-docker | local
   ENABLE_KNOWLEDGE=ON
   ```

3. **Installation**:
   ```bash
   make init  # Install all dependencies and initialize DB
   # OR manually:
   npm install --production
   cd frontend && npm install
   node src/models/sync.js  # Initialize database
   ```

### Running the Application

#### Development Mode
```bash
make run  # Starts both backend and frontend
# OR separately:
npm run start      # Backend on port 5005
cd frontend && npm run dev  # Frontend dev server
```

#### Production Mode
```bash
npm run prd  # Uses PM2 process manager
```

#### Docker Mode
```bash
docker run -it --rm \
  --name mighty-agent-app \
  --env DOCKER_HOST_ADDR=host.docker.internal \
  --publish 5005:5005 \
  --add-host host.docker.internal:host-gateway \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume ~/.cache:/.cache \
  hexdocom/mighty-agent:latest make run
```

#### Electron App
```bash
npm run start-electron  # Development
npm run package         # Package for current platform
npm run make           # Create distributable
```

### Build & Deployment

#### Building Images
```bash
make build-runtime-sandbox  # Build sandbox image
make build-app              # Build application image
```

#### Cloudflare Workers
```bash
cd frontend && pnpm run build  # Build frontend
pnpm run build                 # Build Worker
wrangler deploy                # Deploy to Cloudflare
```

### Testing

```bash
npm run test  # Run Mocha tests
# Tests are in test/api/ directory
```

## Code Conventions

### JavaScript/Node.js Backend

1. **Module Aliases**: Use `@src/` prefix for imports
   ```javascript
   const Message = require('@src/utils/message.js');
   const Conversation = require('@src/models/Conversation');
   ```

2. **Async/Await**: Prefer async/await over callbacks
   ```javascript
   async function executeTask() {
     const result = await someAsyncOperation();
     return result;
   }
   ```

3. **Error Handling**: Use try-catch blocks and proper error propagation
   ```javascript
   app.on('error', (err, ctx) => {
     console.error('server error', err, ctx);
   });
   ```

4. **Environment Variables**: Always use `process.env` with defaults
   ```javascript
   const RUNTIME_TYPE = process.env.RUNTIME_TYPE || 'local-docker';
   ```

5. **Logging**: Use structured logging
   ```javascript
   const { logging } = require("@src/logger/index");
   global.logging = logging;
   ```

### Frontend (Vue 3)

1. **Composition API**: Use `<script setup>` syntax
2. **Component Structure**: Keep components focused and reusable
3. **State Management**: Use Vuex for global state, local reactive state for component-specific data
4. **Styling**: Use scoped SCSS, follow BEM-like naming conventions

### File Organization

1. **Feature-based**: Group related files by feature/domain
2. **Index Files**: Use `index.js` for directory exports
3. **Test Colocation**: Place tests near the code they test (`.test.js` suffix)
4. **Configuration**: Keep config files at project root

## Integration Points

### 1. LLM Providers
- **Local**: Ollama integration for local models
- **Cloud**: OpenAI, Anthropic Claude, Google Gemini, xAI Grok
- **Cloudflare**: Workers AI for serverless inference
- **Configuration**: Via `src/models/Model.js` and `DefaultModelSetting.js`

### 2. MCP (Model Context Protocol)
- **Purpose**: Extensible tool and prompt system
- **Server Management**: `src/routers/mcp_server/`
- **Client**: `src/mcp/client.js`
- **Tool Registration**: `src/mcp/tool.js`

### 3. Docker Runtime
- **Image**: `hexdolemonai/lemon-runtime-sandbox`
- **Purpose**: Isolated code execution environment
- **Management**: `src/runtime/DockerRuntime.js`
- **Security**: Sandboxed file system, network isolation

### 4. Browser Automation
- **Library**: Playwright
- **Use Cases**: Web scraping, testing, automation
- **Implementation**: `src/tools/browser.js`, `src/runtime/browser.js`

### 5. File Storage
- **Local**: `WORKSPACE_DIR` for conversation files
- **Cloud**: R2 (Cloudflare Object Storage) integration
- **Versioning**: Git-like file versioning system

### 6. Knowledge Base
- **Feature**: RAG (Retrieval Augmented Generation)
- **Storage**: Vector embeddings in database
- **Management**: `src/routers/knowledge/`

## Common Patterns

### 1. Agent Execution Flow
```javascript
const agent = new AgenticAgent(context);
agent.setGoal(userGoal);
await agent.run();
```

### 2. Runtime Code Execution
```javascript
const runtime = new LocalDockerRuntime(context);
await runtime.connect_container();
const result = await runtime.execute_code(code, language);
```

### 3. Message Publishing
```javascript
await this._publishMessage({
  uuid: uuidv4(),
  action_type: 'thinking',
  status: 'in_progress',
  content: thinkingContent,
  task_id: taskId
});
```

### 4. Database Operations
```javascript
const conversation = await Conversation.findOne({
  where: { id: conversationId }
});
await conversation.update({ title: newTitle });
```

### 5. API Response Format
```javascript
ctx.body = {
  success: true,
  data: result,
  error: null
};
```

## Security Considerations

1. **Sandboxing**: Always use Docker runtime in production (`RUNTIME_TYPE=docker` or `local-docker`)
2. **Input Validation**: Validate all user inputs, especially code to be executed
3. **Authentication**: JWT-based auth via `src/middlewares/auth.js`
4. **File Access**: Restrict file operations to `WORKSPACE_DIR`
5. **API Keys**: Store in environment variables, never commit to repo
6. **Docker Socket**: Mount Docker socket with caution, understand security implications

## Performance Optimization

1. **Database**: Use indexes on frequently queried fields
2. **Caching**: MCP responses cached via `src/mcp/cache.js`
3. **Streaming**: Use SSE for real-time updates (`coding.sse.js`)
4. **Connection Pooling**: Reuse Docker containers when possible
5. **Frontend**: Code splitting with Vite, lazy load routes

## Debugging Tips

1. **Logging Levels**: Adjust via environment variables
2. **Docker Logs**: `docker logs mighty-agent-app`
3. **Database Inspection**: SQLite files in `data/` directory
4. **API Testing**: Swagger UI at `/swagger`
5. **Frontend DevTools**: Vue DevTools extension
6. **Runtime Debugging**: Set `RUNTIME_TYPE=local` for direct debugging

## Contributing Guidelines

1. **Branch Strategy**: Feature branches from `main`
2. **Commit Messages**: Clear, descriptive commit messages
3. **PR Process**: 
   - Create issue first
   - Link PR to issue with "fixes #<issue_number>"
   - Add tests for new features
   - Ensure existing tests pass
4. **Code Review**: Required before merge
5. **Documentation**: Update relevant docs with code changes

## Common Tasks

### Adding a New API Endpoint
1. Create route handler in `src/routers/<domain>/`
2. Add Swagger JSDoc comments
3. Update `src/routers/index.js` to register route
4. Add controller logic
5. Update frontend service in `frontend/src/services/`

### Adding a New Tool
1. Implement tool in `src/tools/impl/`
2. Register in `src/tools/index.js`
3. Add MCP integration if needed
4. Document tool capabilities

### Adding a New Runtime
1. Create runtime class in `src/runtime/`
2. Implement required interface methods
3. Add to `runtimeMap` in `AgenticAgent.js`
4. Update environment configuration

### Modifying Agent Behavior
1. Update prompts in `src/agent/prompt/`
2. Modify agent logic in `src/agent/AgenticAgent.js`
3. Adjust code-act loop in `src/agent/code-act/`
4. Test with various scenarios

## Helpful Resources

- **Documentation**: https://mighty-agent-11.gitbook.io/mighty-agent
- **Docker Deployment**: README.md (Docker Quick Deployment section)
- **Contributing**: CONTRIBUTING.md
- **API Documentation**: API_README.md
- **Frontend Setup**: frontend/WEB_README.md (referenced in CONTRIBUTING.md)
- **GitHub Issues**: https://github.com/hexdocom/Mighty-Agent/issues
- **Discord**: Community support channel

## Project-Specific Notes

1. **Naming**: Project was formerly "LemonAI" (hexdolemonai), now "Mighty Agent" (hexdocom/mighty-agent)
2. **Multi-Platform**: Supports macOS, Windows (WSL), and Linux
3. **License**: Mighty Agent Open Source License (Apache 2.0 with restrictions)
4. **Internationalization**: English and Chinese (CN) documentation
5. **Desktop App**: Available for download at https://MightyAgent.cc/
6. **Minimum Requirements**: 4GB RAM, modern processor, Docker Desktop support

## Quick Reference

### Key Files
- `src/app.js` - Koa application setup
- `main.js` - Electron main process
- `src/agent/AgenticAgent.js` - Main agent class
- `src/runtime/DockerRuntime.local.js` - Default runtime
- `frontend/src/main.js` - Vue app entry
- `Makefile` - Build and run commands
- `package.json` - Dependencies and scripts
- `.env.example` - Environment configuration template

### Important Directories
- `src/agent/` - AI agent implementation
- `src/runtime/` - Code execution environments
- `src/routers/` - API endpoints
- `src/models/` - Database models
- `src/mcp/` - MCP integration
- `frontend/src/` - Vue.js frontend
- `containers/` - Docker configurations
- `test/` - Test files

### Environment Variables
- `RUNTIME_TYPE` - Runtime selection (docker/local-docker/local)
- `STORAGE_PATH` - SQLite database path
- `WORKSPACE_DIR` - Work files directory
- `ENABLE_KNOWLEDGE` - Knowledge base feature toggle
- `CF_*` - Cloudflare Workers AI configuration

---

*This document is maintained as part of the Mighty Agent project. For updates or corrections, please submit a PR.*
