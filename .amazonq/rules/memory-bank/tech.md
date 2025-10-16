# Technology Stack

## Programming Languages
- **JavaScript/Node.js**: Backend application (Node.js runtime)
- **Vue 3**: Frontend framework with Composition API
- **Python**: Browser automation service
- **TypeScript**: Type definitions for runtime and tools
- **Shell/Bash**: Deployment and build scripts

## Backend Technologies

### Core Framework
- **Koa 2.7+**: Lightweight Node.js web framework
- **koa-router**: Routing middleware
- **koa-body**: Request body parsing
- **koa-static**: Static file serving
- **koa-logger**: HTTP request logging

### Database & ORM
- **Sequelize 6.37+**: SQL ORM
- **SQLite3**: Default local database
- **MySQL2**: Production database option

### LLM Integration
- **@dqbd/tiktoken**: Token counting for OpenAI models
- **axios**: HTTP client for API calls
- **Custom LLM clients**: Azure OpenAI, Gemini, Ollama support

### Runtime & Execution
- **dockerode**: Docker API client for Node.js
- **playwright**: Browser automation
- **@playwright/test**: Testing framework
- **e2b**: Code execution sandbox

### MCP (Model Context Protocol)
- **@modelcontextprotocol/sdk**: MCP integration

### Authentication & Security
- **jsonwebtoken**: JWT token generation/validation
- **dotenv**: Environment variable management

### Utilities
- **cheerio**: HTML parsing
- **marked**: Markdown parsing
- **fast-xml-parser**: XML processing
- **node-xlsx**: Excel file handling
- **uuid**: Unique identifier generation
- **which**: Cross-platform command lookup

### Logging
- **winston**: Structured logging
- **pino**: High-performance logging
- **debug**: Debug logging utility

### Testing
- **mocha**: Test framework
- **chai**: Assertion library
- **sinon**: Test spies/stubs/mocks
- **supertest**: HTTP assertion library

### Documentation
- **swagger-jsdoc**: OpenAPI/Swagger documentation
- **koa2-swagger-ui**: Swagger UI integration

## Frontend Technologies

### Core Framework
- **Vue 3.5+**: Progressive JavaScript framework
- **Vite 5.4+**: Build tool and dev server
- **Vue Router 4.4+**: Official routing library
- **Pinia 2.2+**: State management
- **pinia-plugin-persistedstate**: State persistence

### UI Framework
- **Ant Design Vue 4.2+**: Component library
- **@ant-design/icons-vue**: Icon components

### Code Editor
- **@codemirror/state**: Editor state management
- **@codemirror/view**: Editor view layer
- **@codemirror/lang-html**: HTML language support
- **@codemirror/theme-one-dark**: Dark theme
- **vue-codemirror**: Vue wrapper for CodeMirror

### Terminal
- **@xterm/xterm**: Terminal emulator
- **xterm-addon-fit**: Terminal fitting addon

### Document Handling
- **@vue-office/docx**: Word document viewer
- **@vue-office/excel**: Excel viewer
- **@vue-office/pdf**: PDF viewer
- **@vue-office/pptx**: PowerPoint viewer
- **mammoth**: DOCX to HTML conversion
- **xlsx**: Excel file processing
- **jszip**: ZIP file handling

### Markdown & Syntax Highlighting
- **markdown-it**: Markdown parser
- **markdown-it-attrs**: Attribute plugin
- **marked**: Alternative markdown parser
- **prismjs**: Syntax highlighting
- **highlight.js**: Code highlighting
- **mermaid**: Diagram generation

### Utilities
- **axios**: HTTP client
- **@microsoft/fetch-event-source**: SSE client
- **@vueuse/core**: Vue composition utilities
- **mitt**: Event emitter
- **uuid**: ID generation
- **md5**: Hashing utility
- **file-saver**: File download utility
- **html2pdf.js**: PDF generation
- **driver.js**: User onboarding tours
- **socket.io-client**: WebSocket client

### Internationalization
- **vue-i18n**: i18n support

### Styling
- **sass**: CSS preprocessor
- **less**: Alternative CSS preprocessor
- **less-loader**: Webpack less loader

### Build Tools
- **@vitejs/plugin-vue**: Vue plugin for Vite
- **unplugin-vue-components**: Auto-import components
- **vite-svg-loader**: SVG component loader
- **vite-plugin-svg-icons**: SVG sprite plugin
- **vite-plugin-svgr**: SVG to React component

## Browser Service (Python)

### Framework
- **FastAPI/Flask**: Web framework (inferred from structure)
- **Playwright**: Browser automation library

### Dependencies
- Listed in `browser_server/requirements.txt`
- Python 3.8+ recommended

## Desktop Application (Electron)

### Core
- **Electron 29.2**: Desktop app framework
- **electron-store**: Persistent storage

### Build Tools
- **@electron-forge/cli**: Build and packaging
- **@electron-forge/maker-dmg**: macOS DMG maker
- **@electron-forge/maker-squirrel**: Windows installer
- **@electron-forge/maker-deb**: Debian package
- **@electron-forge/maker-rpm**: RPM package
- **@electron-forge/maker-zip**: ZIP archive
- **@electron-forge/plugin-vite**: Vite integration
- **@electron-forge/plugin-fuses**: Security features
- **electron-rebuild**: Native module rebuilding

## Container Technologies

### Docker
- **Docker Engine**: Container runtime
- **Docker Compose**: Multi-container orchestration
- **Docker Desktop**: Development environment

### Images
- Custom runtime sandbox image: `hexdolemonai/lemon-runtime-sandbox`
- Main application image: `hexdolemonai/lemon`

## Development Tools

### Package Management
- **pnpm 9.15.5**: Fast, disk-efficient package manager
- **npm**: Alternative package manager
- **node-abi**: Native module compatibility

### Code Quality
- **nodemon**: Auto-restart development server
- **module-alias**: Path aliasing (@src)

### Version Control
- **Git**: Source control
- **GitHub Actions**: CI/CD workflows

## Build & Development Commands

### Backend
```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm run prd            # Start with PM2 process manager
npm test               # Run Mocha tests
npm run electron-start # Start Electron app
npm run package        # Package Electron app
npm run make           # Build Electron distributables
```

### Frontend
```bash
cd frontend
npm run dev            # Start Vite dev server
npm run build          # Build for production
npm run preview        # Preview production build
```

### Docker
```bash
docker-compose up      # Start all services
make run               # Run application (via Makefile)
```

### Browser Service
```bash
cd browser_server
pip install -r requirements.txt
python server.py       # Start browser service
```

## Environment Requirements

### System Requirements
- **RAM**: Minimum 4GB (8GB+ recommended)
- **Disk**: 10GB+ free space
- **OS**: macOS, Linux (Ubuntu 22.04+), Windows 10/11 with WSL2

### Runtime Requirements
- **Node.js**: v16+ (v18+ recommended)
- **Python**: 3.8+
- **Docker**: Latest version with Docker Compose
- **pnpm**: 9.15.5 (specified in package.json)

### Optional
- **Ollama**: For local LLM inference
- **CUDA/GPU**: For accelerated local model inference
