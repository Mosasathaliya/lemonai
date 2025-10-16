# Product Overview

## Project Purpose
Lemon AI is the first full-stack, open-source, agentic AI framework that provides a fully local alternative to platforms like Manus and Genspark AI. It empowers users to perform deep research, web browsing, coding, and data analysis entirely on local hardware with complete privacy and zero cloud dependency.

## Value Proposition
- **Complete Privacy**: Runs entirely on local hardware using local LLMs (DeepSeek, Qwen, Llama, Gemma) via Ollama
- **Cost Efficiency**: Task execution costs 1/10 to 1/100 of other agent products
- **Security**: Operates within a local Virtual Machine (VM) sandbox with integrated Code Interpreter for safe code execution
- **Flexibility**: Supports both local models and optional cloud APIs (Claude, GPT, Gemini, Grok) for enhanced results
- **Open Source**: Apache 2.0 based license with full transparency

## Key Features and Capabilities

### Multi: Infinite Possibilities
- **Deep Search & Research Reports**: Comprehensive web research with automated report generation
- **Code Generation & Data Analysis**: Full coding capabilities with safe execution environment
- **Content Creation & Document Processing**: Multi-format document handling and generation
- **Experience Repository**: Self-learning system with enterprise-specific customizations
- **Universal AI Agent**: Supports unlimited task scenarios

### Fast: Rapid Deployment
- **One-Click Deployment**: Docker-based deployment for immediate usage
- **Multiple Deployment Options**: Open source code, container, desktop client, online subscription
- **Minimal Technical Requirements**: Quick setup without complex configurations
- **Cross-Platform**: Compatible with macOS, Linux, and Windows (WSL)

### Good: Powerful & Flexible
- **Virtual Machine Integration**: Safe isolated execution environment
- **Browser Operations**: Automated web browsing and interaction via Playwright
- **Multi-Tool Integration**: Extensible tool system with MCP (Model Context Protocol) support
- **Highly Adaptable Architecture**: Custom modifications and enterprise integrations

### Economic: Cost-Effective
- **Open Source Model**: Based on DeepSeek V3 and other open-source LLMs
- **Dramatic Cost Reduction**: 10x cheaper than commercial alternatives
- **No Vendor Lock-in**: Full control over deployment and scaling

## Target Users and Use Cases

### Target Users
- **Developers**: Building AI-powered applications with local privacy
- **Researchers**: Conducting deep research with automated analysis
- **Data Analysts**: Processing and analyzing data with AI assistance
- **Enterprises**: Organizations requiring private, cost-effective AI solutions
- **Privacy-Conscious Users**: Individuals prioritizing data security and local processing

### Primary Use Cases
1. **Research & Analysis**: Automated web research, data collection, and report generation
2. **Software Development**: Code generation, debugging, and documentation
3. **Data Processing**: Excel/CSV analysis, data transformation, and visualization
4. **Content Creation**: Document generation, summarization, and translation
5. **Task Automation**: Browser automation, workflow orchestration, and repetitive task handling
6. **Knowledge Management**: Building and querying private knowledge bases
7. **Enterprise Integration**: Custom AI agents for specific business workflows

## System Architecture
- **Frontend**: Vue 3 + Vite + Ant Design Vue
- **Backend**: Node.js + Koa framework
- **Database**: SQLite (local) / MySQL (production)
- **Runtime**: Docker-based sandbox with code execution capabilities
- **Browser Automation**: Python-based browser service using Playwright
- **AI Integration**: Multi-provider LLM support with streaming responses
