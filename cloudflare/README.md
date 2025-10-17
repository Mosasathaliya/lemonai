# Cloudflare Deployment

This directory contains the Cloudflare Worker implementation for Mighty Agent's Container-enabled Worker deployment.

## Structure

```
cloudflare/
├── worker/
│   ├── index.ts          # Main Worker and Container class definition
│   ├── r2/               # R2 storage utilities
│   └── *.pdf             # Cloudflare Workers AI model documentation
└── wrangler.toml         # Worker configuration (legacy)
```

## Main Components

### Worker Implementation (`worker/index.ts`)

The Worker implements:
- **MightyAgentContainer** class extending the Cloudflare Container class
- Container configuration (port, sleep timeout, environment variables)
- Request routing to container instances
- Health check endpoints
- R2 storage integration
- D1 database integration

### Container Configuration

The container is configured with:
- **Default Port**: 3000
- **Sleep After**: 15 minutes of inactivity
- **Internet Access**: Enabled
- **Resources**: 2 CPU cores, 10GB memory (configured in `../wrangler.toml`)

### Environment Variables

Pre-configured environment variables for AI models:
- Cloudflare Workers AI models (70+ models)
- Model-specific configuration variables
- API credentials (CF_ACCOUNT_ID, CF_API_TOKEN)

## Deployment

See the main [CLOUDFLARE_CONTAINERS.md](../CLOUDFLARE_CONTAINERS.md) for complete deployment instructions.

### Quick Deploy

From the project root:

```bash
# Build the application
npm run build

# Deploy to Cloudflare
npm run deploy:cloudflare
```

### Environment-specific Deployment

```bash
npm run deploy:cloudflare:prod      # Production
npm run deploy:cloudflare:staging   # Staging
```

## Configuration Files

### Root wrangler.toml

The main configuration at the project root (`../wrangler.toml`) defines:
- Container image and build settings
- Resource limits (CPU, memory)
- Durable Objects bindings
- AI binding for Workers AI
- D1 database configuration
- R2 bucket configuration

### Legacy wrangler.toml

The `wrangler.toml` in this directory is a legacy configuration. The main configuration at the project root is used for deployment.

## AI Models Integration

The Worker provides access to 65+ Cloudflare Workers AI models through various endpoints:

### Chat Models
- DeepSeek Coder, Falcon, Gemma, GPT-OSS, and more

### Vision & Image
- Object detection (DETR ResNet-50)
- Text-to-image (Dreamshaper, Stable Diffusion variants)

### Audio
- Text-to-speech (Deepgram Aura)
- Speech-to-text (Deepgram Flux)

### Text Processing
- Summarization (BART)
- Sentiment analysis (DistilBERT)

### Embeddings
- Multiple embedding models (BGE variants, EmbeddingGemma)
- Reranking (BGE Reranker)

See the worker code for specific model configurations and endpoints.

## Container Routing

The Worker supports multiple routing patterns:

### Singleton Pattern
Route all requests to a single container instance:
```typescript
const id = env.MIGHTY_AGENT_CONTAINER.idFromName('singleton');
const container = env.MIGHTY_AGENT_CONTAINER.get(id);
return container.fetch(request, env);
```

### Session-based Routing
Route based on session ID:
```typescript
const sessionId = request.headers.get("session-id");
const id = env.MIGHTY_AGENT_CONTAINER.idFromName(sessionId);
const container = env.MIGHTY_AGENT_CONTAINER.get(id);
return container.fetch(request, env);
```

### Load Balancing
Balance across multiple containers:
```typescript
import { getRandom } from "@cloudflare/containers";
const container = await getRandom(env.MIGHTY_AGENT_CONTAINER, 3);
return container.fetch(request, env);
```

## Health Checks

- `/__health` - Worker health check
- `/__container_health` - Container health check (includes model count and R2 status)

## Storage Integration

### R2 Buckets
- `mighty_agent_storage` - Main application storage
- `mighty_agent_userdata` - User-specific data

### D1 Database
- `mighty-agent-db` - SQLite database for structured data

### KV Namespace
- Caching layer for improved performance

## Development

To test the Worker locally:

```bash
npx wrangler dev
```

To build without deploying:

```bash
npx wrangler build
```

## Resources

- [Main Deployment Guide](../CLOUDFLARE_CONTAINERS.md)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Containers Documentation](https://developers.cloudflare.com/workers/runtime-apis/containers/)
- [Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)
