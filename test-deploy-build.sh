#!/bin/bash

# Test script for deploy:build task
# This script verifies that the deployment build process works correctly

set -e

echo "🧪 Testing Cloudflare Deployment Build Task"
echo "============================================"
echo ""

# Clean up previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/
echo "✅ Cleaned dist/ directory"
echo ""

# Run the build
echo "🔨 Running deploy:build..."
npm run deploy:build
echo ""

# Verify build output
echo "🔍 Verifying build output..."

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ ERROR: dist/ directory not found"
    exit 1
fi
echo "✅ dist/ directory exists"

# Check if index.html exists
if [ ! -f "dist/index.html" ]; then
    echo "❌ ERROR: dist/index.html not found"
    exit 1
fi
echo "✅ dist/index.html exists"

# Check if assets directory exists
if [ ! -d "dist/assets" ]; then
    echo "❌ ERROR: dist/assets/ directory not found"
    exit 1
fi
echo "✅ dist/assets/ directory exists"

# Count files in dist
file_count=$(find dist -type f | wc -l)
echo "📊 Found $file_count files in dist/"

# Calculate total size
total_size=$(du -sh dist/ | cut -f1)
echo "📦 Total build size: $total_size"

echo ""
echo "✅ All checks passed!"
echo "🚀 Build is ready for deployment"
echo ""
echo "To deploy, run:"
echo "  npm run deploy:cloudflare           # Default environment"
echo "  npm run deploy:cloudflare:prod      # Production"
echo "  npm run deploy:cloudflare:staging   # Staging"
