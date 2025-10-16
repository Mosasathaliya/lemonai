# Development Guidelines

## Code Quality Standards

### Code Formatting and Structure
- **Indentation**: Use 2 spaces for JavaScript/Vue files (consistent across frontend and backend)
- **Line Length**: Keep lines under 120 characters where practical
- **Semicolons**: Use semicolons consistently in backend code; optional in frontend Vue components
- **Quotes**: Use single quotes for strings in JavaScript; double quotes in JSON
- **Trailing Commas**: Avoid trailing commas in object/array literals for compatibility

### Naming Conventions
- **Files**: Use kebab-case for router files (`agent-run.js`), camelCase for utility files (`textToImage.js`)
- **Classes**: PascalCase (e.g., `IframeManager`, `TextToImageService`, `AgenticAgent`)
- **Functions**: camelCase (e.g., `generateImage`, `checkDockerAvailability`, `handleContentChange`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `REQUIRED_DOCKER_IMAGE`, `ENABLE_KNOWLEDGE`, `INJECTED_STYLE_ID`)
- **Private Methods**: Prefix with underscore or use clear naming (e.g., `_parseResponse`, `handleError`)
- **Database Models**: PascalCase singular (e.g., `Conversation`, `Message`, `Agent`)
- **Router Paths**: kebab-case with leading slash (e.g., `/api/agent/run`, `/api/conversation`)

### Documentation Standards
- **JSDoc Comments**: Use for public methods and complex functions
- **Inline Comments**: Explain complex logic, business rules, and non-obvious decisions
- **Chinese Comments**: Acceptable for internal documentation (seen in frontend code)
- **Swagger Documentation**: Required for all API endpoints with complete parameter descriptions
- **Function Headers**: Include purpose, parameters, and return values for utility functions

### File Organization
- **Module Exports**: Use `module.exports = exports = router.routes()` pattern for routers
- **Imports**: Group by type (Node.js built-ins, third-party, local modules with @src alias)
- **Constants**: Define at top of file after imports
- **Helper Functions**: Place after main logic or in separate utility files

## Semantic Patterns Overview

### 1. Async/Await Error Handling Pattern (100% of async code)
```javascript
// Standard try-catch with detailed error logging
try {
  const result = await someAsyncOperation();
  console.log('✅ Operation successful');
  return result;
} catch (error) {
  console.error('❌ Operation failed:', error.message);
  throw new Error(`Operation failed: ${error.message}`);
}

// Promise-based error handling for streams
agent.run(question).then(async (content) => {
  console.log('content', content);
  onCompleted();
}).catch(async (error) => {
  const msg = Message.format({ status: 'success', action_type: 'error', content: error.message });
  onTokenStream(msg);
  await Message.saveToDB(msg, conversation_id);
  console.error('Agent run error:', error);
  onCompleted();
});
```

### 2. Logging Pattern with Emoji Indicators (80% of files)
```javascript
// Success indicators
console.log('✅ Docker installed successfully');
console.log(`✅ Image generated successfully`);

// Error indicators
console.error('❌ API request failed:', error.message);
console.warn('⚠️ No files found for conversation');

// Process indicators
console.log('🚀 Starting batch screenshot processing');
console.log('🎨 Generating image with prompt');
console.log('🤖 Using model: deepseek-v3');
```

### 3. Configuration Object Pattern (90% of service classes)
```javascript
// Destructuring with defaults
const {
  style = '',
  aspectRatio = '1:1',
  quality = 'standard',
  size = 'medium',
  enhancePrompt = true
} = options;

// Options merging
const portraitOptions = {
  ...options,
  aspectRatio,
  quality: 'high',
  size: 'medium',
  enhancePrompt: false
};
```

### 4. Singleton Service Pattern (100% of service classes)
```javascript
let textToImageService = null;

function getTextToImageService() {
  if (!textToImageService) {
    textToImageService = new TextToImageService();
  }
  return textToImageService;
}

module.exports = {
  TextToImageService,
  getTextToImageService
};
```

### 5. Stream Response Pattern (100% of agent/chat endpoints)
```javascript
// SSE stream setup
const { stream, onTokenStream } = handleStream(body.responseType, response);

// Stream event handling
stream.on('close', async () => {
  console.log('Stream closed');
  await cleanup();
});

// Token streaming
onTokenStream(msg);

// Stream completion
const onCompleted = () => {
  stream.end();
};
```

### 6. Database Query Optimization Pattern (90% of database operations)
```javascript
// Batch queries to avoid N+1
const conversationIds = conversations.map(c => c.conversation_id);
const latestMessages = await Message.findAll({
  attributes: ['conversation_id', 'content', 'user_id'],
  where: {
    conversation_id: { [Op.in]: conversationIds },
    user_id: state.user.id
  },
  order: [['conversation_id', 'ASC'], ['create_at', 'DESC']]
});

// Map-based lookup for O(1) access
const latestMessageMap = new Map();
for (const msg of latestMessages) {
  if (!latestMessageMap.has(msg.conversation_id)) {
    latestMessageMap.set(msg.conversation_id, msg);
  }
}
```

### 7. Cleanup and Resource Management Pattern (100% of manager classes)
```javascript
cleanup() {
  // Stop observers
  if (this.mutationObserver) {
    this.mutationObserver.disconnect();
    this.mutationObserver = null;
  }
  
  // Clear timers
  if (this.contentChangeTimer) {
    clearTimeout(this.contentChangeTimer);
    this.contentChangeTimer = null;
  }
  
  // Reset state
  this.isEditingMode = false;
  this.document = null;
  this.window = null;
}

destroy() {
  this.cleanup();
  this.callbacks = {};
  this.iframe = null;
}
```

### 8. Event Callback Pattern (100% of UI managers)
```javascript
// Callback registration
this.callbacks = {
  onContentChange: null,
  onElementClick: null,
  onElementHover: null
};

on(event, callback) {
  const eventName = `on${event.charAt(0).toUpperCase()}${event.slice(1)}`;
  if (eventName in this.callbacks) {
    this.callbacks[eventName] = callback;
  }
}

// Callback invocation with null checks
if (this.callbacks.onContentChange) {
  this.callbacks.onContentChange(cleanContent);
}
```

### 9. Debouncing Pattern (80% of real-time update handlers)
```javascript
handleContentChange() {
  if (this.contentChangeTimer) {
    clearTimeout(this.contentChangeTimer);
  }
  
  this.contentChangeTimer = setTimeout(() => {
    if (this.callbacks.onContentChange) {
      const cleanContent = this.getCleanContent();
      if (cleanContent.trim() !== this.lastContent?.trim()) {
        this.lastContent = cleanContent;
        this.callbacks.onContentChange(cleanContent);
      }
    }
  }, 800);
}
```

### 10. Mode Selection Pattern (Agent routing)
```javascript
// Intent-based routing
let intent;
if (mode === 'auto') {
  intent = await detect_intent(question, conversation_id, messagesContext);
  intent = intent.toLowerCase().trim();
  if (intent !== 'chat' && intent !== 'agent') {
    intent = 'agent'; // Default fallback
  }
} else {
  intent = mode.toLowerCase();
}

// Mode notification to frontend
const modeNotification = `__lemon_mode__${JSON.stringify({ mode: intent })}\\n\\n`;
onTokenStream(modeNotification);

// Execute based on mode
if (intent === 'chat') {
  await executeChatMode(commonParams);
} else if (intent === 'twins') {
  await executeTwinsMode(commonParams, dir_path);
} else {
  // Agent mode execution
}
```

## Internal API Usage Patterns

### 1. Koa Router API
```javascript
const router = require("koa-router")();

// Route definition with destructured context
router.post("/run", async (ctx, next) => {
  const { request, response } = ctx;
  const body = request.body || {};
  // ... handler logic
  ctx.body = stream;
  ctx.status = 200;
});

// Response helpers (custom middleware)
response.success(data);
response.fail(message);
response.error(message);
```

### 2. Sequelize ORM Patterns
```javascript
// Model queries with where clauses
const conversation = await Conversation.findOne({
  where: { 
    conversation_id: conversation_id, 
    user_id: state.user.id,
    deleted_at: null 
  }
});

// Batch updates
await Conversation.update(
  { status: 'running', model_id },
  { where: { conversation_id } }
);

// Soft delete pattern
conversation.deleted_at = new Date();
await conversation.save();

// Count queries
const knowledge_count = await Knowledge.count({ 
  where: { agent_id: agent_id } 
});
```

### 3. Message Formatting Pattern
```javascript
// Standard message format
const msg = Message.format({
  role: 'user',
  status: 'success',
  content: question,
  action_type: 'question',
  task_id: conversation_id,
  json: newFiles
});

// Save to database
const message = await Message.saveToDB(msg, conversation_id);
```

### 4. LLM Integration Pattern
```javascript
// Get default model
const model_info = await getDefaultModel(conversationId);
const model = `provider#${model_info.platform_name}#${model_info.model_name}`;

// Create LLM instance
const llm = await createLLMInstance(model, () => {}, { model_info });

// Call completion
const content = await llm.completion(prompt, context, {
  temperature: 0.7,
  max_tokens: 1000
});
```

### 5. File System Operations Pattern
```javascript
// Ensure directory exists
await fs.mkdir(dir_path, { recursive: true });

// Move files with cross-partition handling
try {
  await fs.rename(srcPath, destPath);
} catch (err) {
  if (err.code === 'EXDEV' || err.code === 'EEXIST') {
    await fs.copyFile(srcPath, destPath);
    await fs.unlink(srcPath);
  } else {
    throw err;
  }
}

// Read directory with file types
const files = await fs.readdir(dir_path, { withFileTypes: true });
```

### 6. Docker API Pattern (via dockerode)
```javascript
// Check Docker availability
async function checkDockerAvailability(webContents) {
  try {
    await executeDockerInfo();
    return true;
  } catch (error) {
    webContents.send('setup-status', { 
      step: 'installing-docker',
      message: 'Docker is not installed or not running.'
    });
    return false;
  }
}

// Execute Docker commands
function executeDockerInfo() {
  return new Promise((resolve, reject) => {
    exec('docker --version', (error, stdout, stderr) => {
      if (error) {
        return reject({ error, stderr });
      }
      resolve(stdout);
    });
  });
}
```

### 7. Electron IPC Pattern
```javascript
// Main process handlers
ipcMain.handle('check-docker-setup', async () => {
  const setupDone = store.get(DOCKER_SETUP_DONE_KEY, false);
  return setupDone;
});

// Send to renderer
mainWindow.webContents.send('setup-status', { 
  step: 'downloading', 
  message: 'Downloading...', 
  progress: 0.5 
});
```

## Frequently Used Code Idioms

### 1. Null-Safe Property Access
```javascript
const doc = this.iframe.contentDocument || this.iframe.contentWindow?.document;
const imageData = imagePart.inlineData || imagePart.inline_data;
```

### 2. Array Filtering and Mapping
```javascript
const modelIds = [...new Set(conversations.map(c => c.model_id).filter(Boolean))];
const new_conversations = conversations.map(conversation => ({
  ...conversation.toJSON(),
  latest_message: latestMessageMap.get(conversation.conversation_id) || null
}));
```

### 3. Conditional Execution with Early Returns
```javascript
if (!this.document || !this.document.body) {
  console.warn('Document body not ready');
  return;
}
```

### 4. String Manipulation for IDs
```javascript
const conversation_id = uuid.v4();
const title = 'Conversation_' + conversation_id.slice(0, 6);
const dir_name = 'Conversation_' + conversation_id.slice(0, 6);
```

### 5. JSON Parsing with Error Handling
```javascript
let meta = message.meta;
if (typeof meta === 'string') {
  meta = JSON.parse(meta);
}
```

### 6. Batch Processing with Delays
```javascript
for (let i = 0; i < prompts.length; i += concurrent) {
  const batch = prompts.slice(i, i + concurrent);
  
  const batchPromises = batch.map(async (prompt, index) => {
    await new Promise(resolve => setTimeout(resolve, index * (delay / concurrent)));
    return await this.generateImage(prompt, options);
  });
  
  const batchResults = await Promise.all(batchPromises);
  results.push(...batchResults);
  
  if (i + concurrent < prompts.length) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
```

### 7. Environment Variable Access
```javascript
const RUNTIME_TYPE = process.env.RUNTIME_TYPE || 'local-docker';
const ENABLE_KNOWLEDGE = process.env.ENABLE_KNOWLEDGE || "ON";
const WORKSPACE_DIR = getDirpath(process.env.WORKSPACE_DIR || 'workspace', ctx.state.user.id);
```

### 8. Active Instance Tracking
```javascript
const activeAgents = new Map();

// Register
activeAgents.set(conversation_id, agent);

// Retrieve
const agent = activeAgents.get(conversation_id);

// Cleanup
activeAgents.delete(conversation_id);
```

## Best Practices

### Error Handling
- Always wrap async operations in try-catch blocks
- Log errors with context (operation name, parameters)
- Provide user-friendly error messages
- Use emoji indicators for log visibility (✅ ❌ ⚠️)
- Implement fallback behavior for non-critical failures

### Performance Optimization
- Use Map for O(1) lookups instead of array.find()
- Batch database queries to avoid N+1 problems
- Implement debouncing for frequent updates
- Use streaming for large responses
- Clean up resources (timers, observers, streams) properly

### Security Practices
- Validate user input before database operations
- Use parameterized queries (Sequelize handles this)
- Implement soft deletes (deleted_at field)
- Check user ownership before operations
- Sanitize file paths and names

### Code Reusability
- Extract common patterns into utility functions
- Use service classes for complex business logic
- Implement singleton pattern for stateful services
- Create reusable message formatting functions
- Share configuration objects across related operations

### Testing Considerations
- Design functions to be testable (pure functions where possible)
- Separate business logic from framework code
- Use dependency injection for external services
- Implement health check endpoints
- Log important state transitions for debugging
