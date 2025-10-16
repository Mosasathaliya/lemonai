FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++ git curl bash

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml Makefile ./
COPY frontend/package.json frontend/pnpm-lock.yaml ./frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile
RUN cd frontend && pnpm install --frozen-lockfile

# Copy frontend and build
COPY ./frontend ./frontend
RUN cd frontend && VITE_IS_CLIENT=true pnpm run build && rm -rf node_modules

# Install Playwright
RUN npx playwright install
RUN npx playwright install-deps

# Create workspace directory
RUN mkdir -p workspace

# Copy application code
COPY ./public ./public
COPY ./bin ./bin
COPY ./src ./src
COPY ./types ./types

# Initialize database tables
RUN make init-tables

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV LEMON_AI_PATH=/app
ENV CF_AI_MODEL=@cf/openai/gpt-oss-20b
ENV CF_AURA_MODEL=@cf/deepgram/aura-1
ENV CF_BART_MODEL=@cf/facebook/bart-large-cnn
ENV CF_BGE_MODEL=@cf/baai/bge-base-en-v1.5
ENV CF_BGE_SMALL_MODEL=@cf/baai/bge-small-en-v1.5
ENV CF_BGE_LARGE_MODEL=@cf/baai/bge-large-en-v1.5
ENV CF_EMBEDDING_GEMMA_MODEL=@cf/google/embeddinggemma-300m
ENV CF_BGE_M3_MODEL=@cf/baai/bge-m3
ENV CF_BGE_RERANKER_MODEL=@cf/baai/bge-reranker-base
ENV CF_DEEPSEEK_CODER_MODEL=@hf/thebloke/deepseek-coder-6.7b-base-awq
ENV CF_DEEPSEEK_CODER_INSTRUCT_MODEL=@hf/thebloke/deepseek-coder-6.7b-instruct-awq
ENV CF_DEEPSEEK_MATH_MODEL=@cf/deepseek-ai/deepseek-math-7b-instruct
ENV CF_DETR_RESNET_MODEL=@cf/facebook/detr-resnet-50
ENV CF_FALCON_MODEL=@cf/tiiuae/falcon-7b-instruct
ENV CF_DREAMSHAPER_MODEL=@cf/lykon/dreamshaper-8-lcm
ENV CF_GEMMA_MODEL=@cf/google/gemma-3-12b-it
ENV CF_GEMMA_7B_MODEL=@hf/google/gemma-7b-it
ENV CF_DISTILBERT_MODEL=@cf/huggingface/distilbert-sst-2-int8
ENV CF_GEMMA_7B_LORA_MODEL=@cf/google/gemma-7b-it-lora
ENV CF_GEMMA_SEA_LION_MODEL=@cf/aisingapore/gemma-sea-lion-v4-27b-it
ENV CF_FLUX_MODEL=@cf/deepgram/flux
ENV CF_GPT_OSS_20B_MODEL=@cf/openai/gpt-oss-20b
ENV CF_QWEN_0_5B_MODEL=@cf/qwen/qwen1.5-0.5b-chat
ENV CF_QWEN_1_8B_MODEL=@cf/qwen/qwen1.5-1.8b-chat
ENV CF_QWEN_7B_MODEL=@cf/qwen/qwen1.5-7b-chat-awq
ENV CF_QWEN_14B_MODEL=@cf/qwen/qwen1.5-14b-chat-awq
ENV CF_QWEN_CODER_MODEL=@cf/qwen/qwen2.5-coder-32b-instruct
ENV CF_QWQ_MODEL=@cf/qwen/qwq-32b
ENV CF_FLUX_SCHNELL_MODEL=@cf/black-forest-labs/flux-1-schnell
ENV CF_SDXL_BASE_MODEL=@cf/stabilityai/stable-diffusion-xl-base-1.0
ENV CF_SDXL_LIGHTNING_MODEL=@cf/bytedance/stable-diffusion-xl-lightning
ENV CF_SD15_IMG2IMG_MODEL=@cf/runwayml/stable-diffusion-v1-5-img2img
ENV CF_SD15_INPAINT_MODEL=@cf/runwayml/stable-diffusion-v1-5-inpainting
ENV CF_LUCID_ORIGIN_MODEL=@cf/leonardo/lucid-origin
ENV CF_PHOENIX_MODEL=@cf/leonardo/phoenix-1.0

EXPOSE 3000

CMD ["pnpm", "start"]
