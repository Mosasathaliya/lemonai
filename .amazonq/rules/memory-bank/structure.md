# Project Structure

## Directory Organization

### Root Level
```
lemonai/
├── src/                    # Backend Node.js application
├── frontend/               # Vue 3 frontend application
├── browser_server/         # Python browser automation service
├── containers/             # Docker configurations
├── public/                 # Static assets and schemas
├── resources/              # Additional resources
├── test/                   # Test files
├── types/                  # TypeScript definitions
├── bin/                    # Executable scripts
└── main.js                 # Electron main process
```

### Backend (src/)
Core Node.js/Koa application with modular architecture:

**Agent System** (`src/agent/`)
- `AgenticAgent.js` - Main agent orchestrator
- `AgenticAgent.run.js` - Agent execution logic
- `TaskManager.js` - Task queue and management
- `auto-reply/` - Automated response generation
- `chat-completion/` - Chat interaction handling
- `code-act/` - Code execution actions
- `generate-agent/` - Dynamic agent creation
- `intent-detection/` - User intent classification
- `memory/` - Conversation and context memory
- `planning/` - Task planning and decomposition
- `reflection/` - Self-evaluation and improvement
- `summary/` - Content summarization
- `tools/` - Agent tool implementations
- `prompt/` - Prompt templates and management

**LLM Integration** (`src/completion/`)
- `llm.base.js` - Base LLM client abstraction
- `llm.azure.openai.js` - Azure OpenAI integration
- `llm.gemini.js` - Google Gemini integration
- `llm.one.js` - Unified LLM interface
- `calc.token.js` - Token counting utilities
- `handle.error.js` - Error handling for LLM calls
- `log.record.js` - LLM usage logging

**Code Execution** (`src/editor/` & `src/runtime/`)
- `editor/coding.js` - Code generation
- `editor/execute.js` - Code execution orchestration
- `runtime/DockerRuntime.js` - Docker-based sandbox
- `runtime/LocalRuntime.js` - Local execution environment
- `runtime/browser.js` - Browser automation integration
- `runtime/terminal_run.js` - Terminal command execution

**Data Models** (`src/models/`)
- `Conversation.js` - Chat conversations
- `Message.js` - Individual messages
- `Agent.js` - Agent configurations
- `File.js` / `FileVersion.js` - File management
- `Knowledge.js` - Knowledge base entries
- `Model.js` / `Platform.js` - LLM provider configs
- `User.js` - User management
- `Task.js` - Task tracking
- `McpServer.js` - MCP server configurations

**API Routes** (`src/routers/`)
- `agent/` - Agent management endpoints
- `conversation/` - Conversation CRUD
- `message/` - Message operations
- `file/` - File upload/download
- `knowledge/` - Knowledge base API
- `model/` - Model configuration
- `platform/` - Provider settings
- `runtime/` - Runtime control
- `mcp_server/` - MCP server management
- `user/` - User authentication

**Tools** (`src/tools/`)
- `browser.js` - Web browsing capabilities
- `WebSearch.js` - Search engine integration
- `terminal_run.js` - Shell command execution
- `read_file.js` - File reading
- `write_code.js` - Code writing and editing
- `impl/` - Tool implementations

**Utilities** (`src/utils/`)
- `llm.js` - LLM helper functions
- `json.js` - JSON parsing utilities
- `markdown.js` - Markdown processing
- `template.js` - Template rendering
- `text_to_image.js` - Image generation
- `function.call.js` - Function calling utilities
- `jwt.js` - Authentication tokens
- `validate.js` - Input validation

**MCP Integration** (`src/mcp/`)
- `client.js` - MCP client implementation
- `server.js` - MCP server management
- `tool.js` - MCP tool integration
- `prompt.js` - MCP prompt handling
- `transport.js` - Communication layer

### Frontend (frontend/)
Vue 3 single-page application:

**Core** (`frontend/src/`)
- `App.vue` - Root component
- `main.js` - Application entry point
- `router/` - Vue Router configuration
- `store/` - Pinia state management
- `services/` - API client services

**UI Components** (`frontend/src/`)
- `components/` - Reusable Vue components
- `view/` - Page-level components
- `assets/` - Images, fonts, styles
- `locals/` - i18n translations

**Build Configuration**
- `vite.config.js` - Vite build settings
- `package.json` - Frontend dependencies

### Browser Service (browser_server/)
Python-based browser automation:

- `server.py` - FastAPI/Flask server
- `browser_use/agent/` - Browser agent logic
- `browser_use/browser/` - Playwright integration
- `browser_use/service/` - Service layer
- `browser_use/utils/` - Helper utilities
- `requirements.txt` - Python dependencies

### Containers (containers/)
Docker configurations:

- `app/Dockerfile` - Main application container
- `runtime/Dockerfile` - Sandbox runtime container
- `app/VERSION` - Application version
- `runtime/VERSION` - Runtime version

### Public Assets (public/)
- `default_data/` - Default configurations (platforms, search providers)
- `schemas/` - JSON schemas for data validation
- `img/` - Static images and logos

## Core Components and Relationships

### Agent Execution Flow
1. **User Input** → Frontend sends message to backend
2. **Intent Detection** → Classifies user request type
3. **Planning** → Breaks down task into steps
4. **Tool Selection** → Chooses appropriate tools (browser, code, search)
5. **Execution** → Runs tools in sandbox environment
6. **Reflection** → Evaluates results and adjusts
7. **Response** → Streams results back to frontend

### LLM Integration Layer
- Abstracts multiple providers (OpenAI, Gemini, Ollama, Azure)
- Handles streaming responses
- Manages token counting and rate limiting
- Logs all LLM interactions

### Runtime Sandbox
- Docker-based isolated environment
- Supports Python, JavaScript, and shell execution
- File system access control
- Network isolation options

### Memory System
- Short-term: Conversation history in database
- Long-term: Knowledge base with vector search
- Experience repository: Learned patterns and solutions

## Architectural Patterns

### Backend Patterns
- **MVC-like Structure**: Models, Routers (Controllers), Services
- **Middleware Pipeline**: Koa middleware for auth, logging, error handling
- **Dependency Injection**: Context-based service access
- **Event-Driven**: Streaming responses via Server-Sent Events
- **Plugin Architecture**: Extensible tool and agent system

### Frontend Patterns
- **Component-Based**: Vue 3 Composition API
- **State Management**: Pinia stores for global state
- **Service Layer**: Axios-based API clients
- **Reactive UI**: Real-time updates via SSE and WebSocket

### Integration Patterns
- **API Gateway**: Backend serves as central API hub
- **Microservices**: Browser service as separate Python service
- **Container Orchestration**: Docker Compose for multi-service deployment
- **Protocol Abstraction**: MCP for tool integration
