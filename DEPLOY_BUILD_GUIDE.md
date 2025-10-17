# Deployment Build Task Guide

## Overview

This guide explains how to use the new `deploy:build` task for building and deploying the Mighty Agent application to Cloudflare Workers with Containers.

## What is `deploy:build`?

The `deploy:build` task is a comprehensive build script that:
- Automatically detects your package manager (pnpm or npm)
- Installs frontend dependencies
- Builds the frontend application with correct environment variables
- Prepares all assets in the `dist/` directory for deployment
- Validates the build output

## Quick Start

### Build Only (No Deployment)

```bash
npm run deploy:build
```

This will:
1. Install frontend dependencies
2. Build the frontend with Vite
3. Copy assets to `dist/` directory
4. Verify the build

### Build + Deploy to Cloudflare

```bash
# Deploy to default environment
npm run deploy:cloudflare

# Deploy to production
npm run deploy:cloudflare:prod

# Deploy to staging
npm run deploy:cloudflare:staging
```

Each deployment command automatically runs `deploy:build` first!

## How It Works

### 1. Package Manager Detection

The build script automatically detects whether you have `pnpm` or `npm` installed:

```javascript
// Checks for pnpm first
const hasPnpm = () => {
    try {
        execSync('pnpm --version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
};

// Falls back to npm if pnpm is not available
const pm = hasPnpm() ? 'pnpm' : 'npm';
```

### 2. Environment Variables

The build script sets `VITE_IS_CLIENT=true` to ensure the frontend builds to the correct directory:

```javascript
const buildCmd = pm === 'pnpm' 
    ? 'VITE_IS_CLIENT=true pnpm run build' 
    : 'VITE_IS_CLIENT=true npm run build';
```

This tells Vite to output to `frontend/dist/` instead of the Electron-specific path.

### 3. Build Process

The complete build process:

```
┌─────────────────────────────┐
│ npm run deploy:build        │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ Detect Package Manager      │
│ (pnpm or npm)               │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ Install Frontend            │
│ Dependencies                │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ Build Frontend              │
│ (with VITE_IS_CLIENT=true)  │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ Copy to dist/               │
│ Directory                   │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ Validate Build Output       │
│ ✓ index.html exists         │
│ ✓ assets/ directory exists  │
└─────────────────────────────┘
```

### 4. Output Structure

After a successful build, your `dist/` directory will contain:

```
dist/
├── assets/
│   ├── index-[hash].css
│   ├── vendor-[hash].css
│   ├── vendor-vue-[hash].css
│   ├── lemon-[hash].jpg
│   └── index-[hash].js
├── img/
│   └── mighty-agent-logo.svg
└── index.html
```

## Testing Your Build

Use the provided test script to verify your build:

```bash
./test-deploy-build.sh
```

This will:
1. Clean the previous build
2. Run `deploy:build`
3. Verify the output structure
4. Report build statistics

Expected output:
```
🧪 Testing Cloudflare Deployment Build Task
============================================

🧹 Cleaning previous build...
✅ Cleaned dist/ directory

🔨 Running deploy:build...
✅ Build completed successfully! (289.57 KB)

🔍 Verifying build output...
✅ dist/ directory exists
✅ dist/index.html exists
✅ dist/assets/ directory exists
📊 Found 11 files in dist/
📦 Total build size: 332K

✅ All checks passed!
🚀 Build is ready for deployment
```

## Deployment to Cloudflare

### Prerequisites

1. **Cloudflare Account**: With appropriate permissions
   - "Containers: Edit"
   - "Workers Scripts: Edit"

2. **Docker**: Running locally for container builds

3. **Wrangler**: Installed (handled automatically via npx)

### Authentication

Choose one method:

**Method 1: Browser Login (Recommended for local dev)**
```bash
npx wrangler login
```

**Method 2: Environment Variables**
```bash
export CF_API_TOKEN="your-api-token"
export CF_ACCOUNT_ID="your-account-id"
```

**Method 3: Secrets (Recommended for CI/CD)**
```bash
npx wrangler secret put CF_API_TOKEN
npx wrangler secret put CF_ACCOUNT_ID
```

### Deploy Commands

```bash
# Default environment
npm run deploy:cloudflare

# Production environment
npm run deploy:cloudflare:prod

# Staging environment
npm run deploy:cloudflare:staging
```

### What Happens During Deployment

1. **Build Step** (`npm run deploy:build`)
   - Installs dependencies
   - Builds frontend
   - Prepares dist/ directory

2. **Wrangler Deploy**
   - Compiles TypeScript worker
   - Builds Docker container
   - Pushes to Cloudflare Registry
   - Deploys Worker
   - Configures Durable Objects

## Troubleshooting

### Build fails with "pnpm: command not found"

The script will automatically fall back to npm. Alternatively, install pnpm:
```bash
npm install -g pnpm
```

### Build outputs to wrong directory

Ensure `VITE_IS_CLIENT=true` is set in the build command. This is handled automatically by the build script.

### Dependencies not installing

Network issues can occur. Try:
```bash
# Use npm registry directly
npm config set registry https://registry.npmjs.org/

# Or clear npm cache
npm cache clean --force
```

### Docker build fails

Ensure Docker Desktop is running:
```bash
docker ps  # Should show running containers or empty list
```

### Wrangler configuration errors

Verify your wrangler.toml has the correct format:
```toml
[[containers]]
class_name = "MightyAgentContainer"
image = "./Dockerfile.cloudflare"
```

## Advanced Usage

### Custom Build Configuration

You can modify `build.js` to customize:
- Output directory
- Build optimizations
- Asset handling
- Environment variables

### CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Build for Cloudflare
  run: npm run deploy:build

- name: Deploy to Cloudflare
  run: npm run deploy:cloudflare:prod
  env:
    CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
    CF_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}
```

### Dry Run (Test Without Deploying)

```bash
npm run deploy:build
npx wrangler deploy --dry-run --env=""
```

## Performance Tips

1. **Use pnpm for faster installs**
   ```bash
   npm install -g pnpm
   ```

2. **Cache frontend dependencies in CI/CD**
   ```yaml
   - uses: actions/cache@v3
     with:
       path: frontend/node_modules
       key: ${{ runner.os }}-pnpm-${{ hashFiles('frontend/pnpm-lock.yaml') }}
   ```

3. **Enable Docker layer caching**
   - First build is slower
   - Subsequent builds reuse layers
   - Much faster on repeated deployments

## Related Documentation

- [CLOUDFLARE_CONTAINERS.md](./CLOUDFLARE_CONTAINERS.md) - Full Cloudflare deployment guide
- [DEPLOYMENT_QUICK_REF.md](./DEPLOYMENT_QUICK_REF.md) - Quick reference
- [README.md](./README.md) - Project overview
- [wrangler.toml](./wrangler.toml) - Cloudflare configuration

## Support

For issues or questions:
1. Check existing [GitHub Issues](https://github.com/Mosasathaliya/lemonai/issues)
2. Review [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
3. Open a new issue with:
   - Build output/error logs
   - System info (OS, Node version, Docker version)
   - Steps to reproduce

## Summary

The `deploy:build` task simplifies the deployment process by:
- ✅ Automating dependency installation
- ✅ Handling environment configuration
- ✅ Building optimized assets
- ✅ Validating output
- ✅ Supporting both pnpm and npm
- ✅ Integrating seamlessly with Cloudflare deployment

Just run `npm run deploy:cloudflare` and you're done! 🚀
