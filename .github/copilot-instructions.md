# Mighty Agent Development Guide

## Project Overview
Mighty Agent is a full-stack, open-source agentic AI framework providing a fully local alternative to platforms like Manus & Genspark AI. It features an integrated Code Interpreter VM sandbox for safe execution, supporting planning, action, reflection, and memory functionalities.

**Stack**: Node.js/Koa backend, Vue 3 frontend, Python browser service, Docker-based runtime sandbox, SQLite/MySQL database

## Architecture Fundamentals

### Three-Tier Agent Execution Flow
1. **Intent Detection** → Classifies request type (chat, agent, twins modes)
2. **Planning** → Breaks task into steps using `src/agent/planning/`, generates markdown task lists
3. **Execution Loop** → For each task:
   - **Tool Selection** → Chooses from browser, code execution, terminal, file operations, web search
   - **Action** → Executes in Docker sandbox via `DockerRuntime.js` or `LocalRuntime.js`
   - **Reflection** → Evaluates success/failure using `src/agent/reflection/` (environment-based or LLM-based evaluation)
   - **Memory Update** → Stores conversation history and learned patterns

### Runtime System Architecture
- **RUNTIME_TYPE** env var controls execution environment: `local`, `docker`, or `local-docker` (default)
- `src/runtime/DockerRuntime.js` - Container-based sandbox with network isolation
- `src/runtime/LocalRuntime.js` - Direct local execution for development
- All runtime instances implement: `connect_container()`, `execute_action()`, and tool execution methods
- Workspace organization: `workspace/Conversation_<first-6-chars-of-id>/` per conversation

### MCP (Model Context Protocol) Integration
- Located in `src/mcp/`, provides standardized tool/prompt/resource interface
- `McpClient` manages server connections with connection pooling and health checks
- Tool IDs format: `${server_name}__${tool_name}` for uniqueness across servers
- Cache service at `src/mcp/cache.js` reduces redundant MCP list operations
- Transport layer supports stdio, SSE, and WebSocket protocols

## Critical Development Patterns

### Message Format & Streaming Pattern
All agent responses follow this structure (see `src/utils/message.js`):
```javascript
const msg = Message.format({
  role: 'assistant',              // user|assistant|system
  status: 'success',              // success|failure
  action_type: 'code_execution',  // question|answer|code_execution|error|planning|reflection
  content: 'Result text',
  json: { files: [...] },         // Optional structured data
  task_id: conversation_id
});
onTokenStream(msg);  // Stream to frontend
await Message.saveToDB(msg, conversation_id);  // Persist
```

### Agent Mode Routing (src/routers/agent/run.js)
Mode notification sent to frontend before execution:
```javascript
const modeNotification = `__lemon_mode__${JSON.stringify({ mode: intent })}\n\n`;
onTokenStream(modeNotification);
```
Modes: `chat` (direct LLM), `agent` (full planning+action loop), `twins` (multi-agent collaboration)

### LLM Provider Abstraction
- Base class: `src/completion/llm.base.js` defines standard interface
- Implementations: `llm.azure.openai.js`, `llm.gemini.js`, `llm.one.js` (unified wrapper)
- Model format: `provider#${platform_name}#${model_name}` (e.g., `provider#openai#gpt-4`)
- Token counting via `@dqbd/tiktoken`, usage logged to `src/completion/log.record.js`
- Streaming handled with SSE, non-streaming returns complete text

### Database Patterns (Sequelize ORM)
- Soft delete: Set `deleted_at` timestamp instead of destroying records
- User ownership check: Always verify `user_id` matches `ctx.state.user.id` before operations
- Batch queries to avoid N+1: Load related data with `Op.in` operator, use Map for O(1) lookup
```javascript
const latestMessages = await Message.findAll({
  where: { conversation_id: { [Op.in]: conversationIds }, user_id: state.user.id },
  order: [['conversation_id', 'ASC'], ['create_at', 'DESC']]
});
const messageMap = new Map();
for (const msg of latestMessages) {
  if (!messageMap.has(msg.conversation_id)) messageMap.set(msg.conversation_id, msg);
}
```

### Error Handling & Logging Convention
Use emoji indicators for log visibility (adopted across 80%+ of codebase):
```javascript
console.log('✅ Operation successful');
console.error('❌ Operation failed:', error.message);
console.warn('⚠️ Potential issue detected');
console.log('🚀 Starting process');
console.log('🤖 Using model: deepseek-v3');
```
Wrap all async operations in try-catch, log with context (operation name, key parameters), provide user-friendly error messages.

## Key Development Workflows

### Running the Application
```bash
# Backend development
npm run dev              # Nodemon auto-restart on changes
npm start                # Production mode
make run                 # Both frontend and backend (via Makefile)
npm test                 # Run Mocha tests (requires mocha installed)

# Frontend development
cd frontend && npm run dev

# Docker deployment
docker-compose up        # Start all services
make init                # Install deps and init DB tables
node src/models/sync.js  # Sync database schema
```

### Adding New Agent Tools
1. Create tool definition in `src/tools/` or `src/agent/tools/`
2. Implement XML action handler in runtime (`src/runtime/utils/tools.js`)
3. Add tool schema to agent prompt (`src/agent/prompt/tool.js`)
4. Update action resolver in `src/utils/resolve.js` for XML parsing
5. Test in LocalRuntime first (`RUNTIME_TYPE=local`), then Docker sandbox

### Debugging Agent Execution
- Set `RUNTIME_TYPE=local` in `.env` to bypass Docker for faster iteration
- Agent logs stream via `onTokenStream` callback - check console and DB messages table
- Planning output logged with `==== planning markdown ====` markers
- Reflection results logged with action status and LLM evaluation
- TaskManager writes `task_log.md` in conversation workspace directory

## Project-Specific Conventions

### File Naming & Module Organization
- Routers: kebab-case (e.g., `agent-run.js`)
- Classes: PascalCase (e.g., `AgenticAgent`, `TaskManager`)
- Utilities: camelCase (e.g., `textToImage.js`)
- Constants: UPPER_SNAKE_CASE (e.g., `RUNTIME_TYPE`, `ENABLE_KNOWLEDGE`)
- Import alias: `@src` maps to project root `src/` directory

### Frontend Component Architecture (Vue 3 + Ant Design Vue)
- Composition API preferred over Options API
- State management via Pinia stores (`frontend/src/store/`)
- API clients in `frontend/src/services/` using axios
- Real-time updates via SSE (Server-Sent Events) for streaming responses
- CodeMirror for code editing, XTerm.js for terminal emulation

### Testing Standards
- Framework: Mocha + Chai + Sinon
- Pattern: Stub Sequelize models with `sinon.stub(Model, 'method').resolves(mockData)`
- Test files colocated: `src/agent/planning/index.test.js` next to `index.js`
- API tests in `test/api/` using supertest for HTTP assertions
- Always `sinon.restore()` in `afterEach` to prevent test pollution

## Essential Configuration

### Environment Variables (.env.example reference)
- `STORAGE_PATH` - SQLite database location (default: `data/database.sqlite`)
- `WORKSPACE_DIR` - Agent workspace root (default: `workspace`)
- `RUNTIME_TYPE` - Execution environment: `local-docker`, `docker`, `local`
- `ENABLE_KNOWLEDGE` - Toggle knowledge base feature (`ON`/`OFF`)
- `CF_AI_USE` - Enable Cloudflare Workers AI integration

### Docker Image Requirements
- Runtime sandbox: `hexdolemonai/lemon-runtime-sandbox:latest`
- Main app: `hexdolemonai/lemon:latest`
- Ensure Docker socket mounted: `--volume /var/run/docker.sock:/var/run/docker.sock`
- Host gateway for container-to-host communication: `--add-host host.docker.internal:host-gateway`

## Cross-Component Integration Points

### Frontend ↔ Backend Communication
- REST API: Standard CRUD via `src/routers/` with Koa Router
- Streaming: SSE for agent responses, format: `data: ${JSON.stringify(msg)}\n\n`
- WebSocket: Real-time updates for collaborative features (via Socket.IO)
- Response helpers: `ctx.response.success(data)`, `ctx.response.fail(message)`, `ctx.response.error(message)`

### Backend ↔ Browser Service (Python)
- Python service at `browser_server/` using Playwright for browser automation
- HTTP API endpoints defined in `browser_server/server.py`
- Node.js calls via `src/runtime/browser.js` wrapper
- Install: `cd browser_server && pip install -r requirements.txt`

### Agent ↔ External LLMs
- Subscription-based models route through sub-server endpoints (`/api/sub_server/*`)
- Local models use direct API calls via provider-specific clients
- Cloudflare Workers AI integration for edge inference (Llama, Gemini, DeepSeek variants)
- All requests logged for token usage tracking and debugging

## Common Pitfalls & Solutions

1. **Agent hangs indefinitely**: Check runtime type matches Docker availability; verify container connectivity with `docker ps`
2. **Planning returns empty tasks**: Ensure LLM response contains valid markdown checklist; check `==== planning markdown ====` logs
3. **File operations fail**: Verify workspace directory exists and has correct permissions; conversation directories auto-created as `Conversation_<id-prefix>`
4. **MCP tools not loading**: Check server health with ping; review `src/mcp/cache.js` for stale entries
5. **Tests fail with "model not found"**: Stub all Sequelize model methods; never rely on actual DB in unit tests
6. **EXDEV errors on file move**: Cross-partition rename limitation; implementation copies then deletes as fallback

---

**Documentation**: https://mighty-agent-11.gitbook.io/mighty-agent  
**Issue Reporting**: Include logs from `docker-compose logs` for backend issues, browser console for frontend
