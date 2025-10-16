const CODER_ROUTES = [
  {
    path: "/v1/chat/deepseek-coder-6.7b-base-awq",
    envKey: "CF_DEEPSEEK_CODER_MODEL",
    defaultModel: "@hf/thebloke/deepseek-coder-6.7b-base-awq",
  },
  {
    path: "/v1/chat/deepseek-coder-6.7b-instruct-awq",
    envKey: "CF_DEEPSEEK_CODER_INSTRUCT_MODEL",
    defaultModel: "@hf/thebloke/deepseek-coder-6.7b-instruct-awq",
  },
  {
    path: "/v1/chat/deepseek-math-7b-instruct",
    envKey: "CF_DEEPSEEK_MATH_MODEL",
    defaultModel: "@cf/deepseek-ai/deepseek-math-7b-instruct",
  },
  {
    path: "/v1/chat/falcon-7b-instruct",
    envKey: "CF_FALCON_MODEL",
    defaultModel: "@cf/tiiuae/falcon-7b-instruct",
  },
  {
    path: "/v1/chat/gemma-3-12b-it",
    envKey: "CF_GEMMA_MODEL",
    defaultModel: "@cf/google/gemma-3-12b-it",
  },
  {
    path: "/v1/chat/gemma-7b-it",
    envKey: "CF_GEMMA_7B_MODEL",
    defaultModel: "@hf/google/gemma-7b-it",
  },
  {
    path: "/v1/chat/gemma-7b-it-lora",
    envKey: "CF_GEMMA_7B_LORA_MODEL",
    defaultModel: "@cf/google/gemma-7b-it-lora",
  },
  {
    path: "/v1/chat/gemma-sea-lion-v4-27b-it",
    envKey: "CF_GEMMA_SEA_LION_MODEL",
    defaultModel: "@cf/aisingapore/gemma-sea-lion-v4-27b-it",
  },
  {
    path: "/v1/chat/gpt-oss-20b",
    envKey: "CF_GPT_OSS_20B_MODEL",
    defaultModel: "@cf/openai/gpt-oss-20b",
  },
];
  {
    path: "/v1/chat/gemma-sea-lion-v4-27b-it",
    envKey: "CF_GEMMA_SEA_LION_MODEL",
    defaultModel: "@cf/aisingapore/gemma-sea-lion-v4-27b-it",
  },

for (const route of CODER_ROUTES) {

