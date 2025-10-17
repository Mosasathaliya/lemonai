# Deploying Container-enabled Workers on Cloudflare

## What you will deploy

In this tutorial, you will deploy a **Container-enabled Worker**. All Containers on Cloudflare are deployed with and accessed via Workers. You define your container image code alongside your Worker, then deploy it with `wrangler deploy`.

Container instances are launched **on-demand** in response to requests from a Worker, and can be put to sleep after a configurable timeout.

Containers can run a wide variety of languages and tools, use more memory and CPU than a Worker, and run for longer periods of time.

## Quick Start: "Just let me deploy it!"

If you want to skip ahead and deploy your Container-enabled Worker, you can use one of these methods:

### Using npm scripts (recommended):

```bash
npm run deploy:cloudflare
```

### Using the Cloudflare template:

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/containers-template
```

### Using wrangler directly:

```bash
npx wrangler deploy
```

## Prerequisites

You must have the following **permissions** to deploy a Container-enabled Worker:

- **"Containers: Edit"** - Required to manage container instances
- **"Workers Scripts: Edit"** - Required to deploy and update Worker scripts

### Additional Requirements

- **Docker** or Docker-compatible CLI tool running locally
- **Cloudflare Account** with appropriate permissions
- **Wrangler CLI** installed globally or via npx

## Deployment Process

When you run `wrangler deploy`, several things happen:

1. **Wrangler builds your image locally** using Docker
2. **Wrangler pushes your image** to the Cloudflare Registry (automatically integrated with your account)
3. **Your image is automatically distributed** across Cloudflare's Network and prepped for fast boots
4. **Wrangler deploys your Worker** that routes traffic to containers

### Important Notes

- The build and push process uses **Docker** by default. You must have Docker or a Docker-compatible CLI tool running locally.
- After your **first deployment**, wait a few minutes until the Worker is ready to receive requests. During this time, requests are sent to the Worker, but calls to the Container will error.
- The build and push usually take the longest on the first deploy. **Future deploys will go faster** by reusing cached image layers.

## Mighty Agent Container Configuration

The Mighty Agent project is already configured for Container deployment:

### Container Class Definition

The container is defined in `cloudflare/worker/index.ts`:

```typescript
export class MightyAgentContainer extends Container {
  defaultPort = 3000;
  sleepAfter = "15m";
  enableInternet = true;
  // Environment variables configured for AI models and services
}
```

### Wrangler Configuration

Container settings are defined in `wrangler.toml`:

```toml
[containers]
image = "mighty-agent:latest"
build = { context = ".", dockerfile = "Dockerfile.cloudflare" }

[containers.resources]
cpu = 2
memory = "10Gi"

[[durable_objects.bindings]]
name = "MIGHTY_AGENT_CONTAINER"
class_name = "MightyAgentContainer"
```

## Routing to Containers

### Getting Container Instances

Container instances are accessed via Workers. To spin up a Container instance:

```typescript
const containerInstance = env.MIGHTY_AGENT_CONTAINER.get(id);
```

Each unique ID passed to `get()` will result in a new Container instance launching. Multiple Worker requests calling to the same ID will route requests to the same Container instance.

### Making Container Requests

Once you have a container instance, you can make requests to it using `fetch`:

```typescript
return containerInstance.fetch(request);
```

This automatically makes requests to the `defaultPort`. You can pass the request value from your Worker's fetch handler to proxy requests to the container.

### Routing Examples

#### Singleton Pattern (Single Instance)

Route all requests to a single instance:

```typescript
const id = env.MIGHTY_AGENT_CONTAINER.idFromName('singleton');
const containerInstance = env.MIGHTY_AGENT_CONTAINER.get(id);
return await containerInstance.fetch(request);
```

#### Session-based Routing (Unique Instances)

Route to different instances based on session:

```typescript
const sessionId = request.headers.get("session-id");
const id = env.MIGHTY_AGENT_CONTAINER.idFromName(sessionId);
const containerInstance = env.MIGHTY_AGENT_CONTAINER.get(id);
return await containerInstance.fetch(request);
```

#### Load Balancing

Balance requests across multiple containers:

```typescript
import { getRandom } from "@cloudflare/containers";

const containerInstance = await getRandom(env.MIGHTY_AGENT_CONTAINER, 3);
return containerInstance.fetch(request);
```

## Testing Your Container

### Making Test Requests

After deployment, open the URL for your Worker. It should look like:
```
https://mighty-agent.YOUR_ACCOUNT_NAME.workers.dev
```

### Health Check Endpoints

The Mighty Agent container provides health check endpoints:

- `/__health` - Worker health check
- `/__container_health` - Container health check

You can verify deployment by requesting these endpoints.

## Deploying Mighty Agent

### Step 1: Install Dependencies

```bash
pnpm install --frozen-lockfile
```

### Step 2: Build the Application

```bash
pnpm run build
```

This builds the frontend and prepares the distribution files.

### Step 3: Configure Environment

Set your Cloudflare credentials:

```bash
export CF_API_TOKEN="your-api-token"
export CF_ACCOUNT_ID="your-account-id"
```

Or use wrangler login:

```bash
npx wrangler login
```

### Step 4: Deploy

Deploy using npm scripts:

```bash
# Deploy to default environment
npm run deploy:cloudflare

# Deploy to production
npm run deploy:cloudflare:prod

# Deploy to staging
npm run deploy:cloudflare:staging
```

Or use wrangler directly:

```bash
npx wrangler deploy
```

For production environment:

```bash
npx wrangler deploy --env production
```

### Step 5: Verify Deployment

```bash
curl https://mighty-agent.YOUR_ACCOUNT_NAME.workers.dev/__health
```

## Environment Variables

The container is pre-configured with environment variables for AI models:

- `CF_AI_USE=true` - Enable Cloudflare AI
- `CF_ACCOUNT_ID` - Your Cloudflare account ID
- `CF_API_TOKEN` - Your Cloudflare API token
- Various model configurations (see `cloudflare/worker/index.ts`)

## Troubleshooting

### Container Not Starting

- Ensure Docker is running locally during build
- Check that your account has "Containers: Edit" permission
- Verify the Dockerfile.cloudflare builds successfully

### Build Taking Too Long

- First builds are slower due to layer caching
- Subsequent builds reuse cached layers
- Use `.dockerignore` to exclude unnecessary files

### Container Health Check Failing

- Wait a few minutes after first deployment
- Check container logs in Cloudflare dashboard
- Verify environment variables are set correctly

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Containers on Workers](https://developers.cloudflare.com/workers/runtime-apis/containers/)
- [Mighty Agent Documentation](https://mighty-agent-11.gitbook.io/mighty-agent)
- [GitHub Repository](https://github.com/Mosasathaliya/lemonai)

## CI/CD Integration

The project includes GitHub Actions workflow for automated deployment. See `.github/workflows/deploy-cloudflare.yml` for the automated deployment pipeline.

To use it:

1. Set repository secrets:
   - `CF_API_TOKEN`
   - `CF_ACCOUNT_ID`
   - `CF_ZONE_ID` (optional)

2. Push to main/master branch or manually trigger the workflow

The workflow will automatically build, test, and deploy your Container-enabled Worker.
