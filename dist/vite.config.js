import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import path from 'path';
import svgLoader from 'vite-svg-loader';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    root: __dirname,
    base: env.VITE_IS_CLIENT === 'true' ? './' : '/',
    build: {
      outDir: env.VITE_IS_CLIENT === 'true' ? 'dist' : '../.vite/renderer/main_window',
      emptyOutDir: true,
      target: 'es2022',
      sourcemap: env.NODE_ENV === 'development',
      minify: 'esbuild',
      chunkSizeWarningLimit: 2000,
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
        defaultIsModuleExports: true,
        requireReturnsDefault: 'auto'
      },
      optimizeDeps: {
        include: [
          'vue',
          'ant-design-vue',
          'lodash',
          'axios',
          'pinia',
          'vue-router'
        ],
        esbuildOptions: {
          target: 'es2022',
          supported: { 
            bigint: true 
          },
          platform: 'node',
          treeShaking: true,
          minify: true
        }
      },
      rollupOptions: {
        external: [
          'electron',
          'events',
          'fs',
          'path',
          'url',
          'util',
          'worker_threads'
        ],
        output: {
          format: 'es',
          chunkFileNames: 'assets/[name]-[hash:8].js',
          entryFileNames: 'assets/[name]-[hash:8].js',
          assetFileNames: 'assets/[name]-[hash:8][extname]',
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('vue') || id.includes('ant-design-vue')) {
                return 'vendor-vue';
              }
              if (id.includes('d3') || id.includes('topojson')) {
                return 'vendor-d3';
              }
              if (id.includes('codemirror') || id.includes('lezer')) {
                return 'vendor-codemirror';
              }
              if (id.includes('mermaid')) {
                return 'vendor-mermaid';
              }
              if (id.includes('lodash') || id.includes('axios') || id.includes('dayjs')) {
                return 'vendor-utils';
              }
              return 'vendor';
            }
          }
        },
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false
        }
      },
      esbuild: {
        drop: ['console', 'debugger'],
        minify: true,
        target: 'es2022',
        platform: 'browser'
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '~@': path.resolve(__dirname, 'src'),
        'vue': path.resolve(__dirname, 'node_modules/vue')
      },
      dedupe: ['vue']
    },
    plugins: [
      vue(),
      svgLoader(),
      Components({
        resolvers: [
          AntDesignVueResolver({
            importStyle: 'less',
            resolve: (name) => {
              if (name === 'AConfigProvider') {
                return { name: 'ConfigProvider', from: 'ant-design-vue' };
              }
            }
          }),
        ],
      }),
    ],
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'ant-design-vue',
        '@ant-design/icons-vue',
        'd3',
        'mermaid',
        '@codemirror/state',
        '@codemirror/view',
        '@codemirror/language',
        '@codemirror/lang-css',
        '@codemirror/lang-javascript',
        '@codemirror/autocomplete',
        '@lezer/common',
        '@lezer/css',
        '@lezer/javascript',
        '@lezer/html',
        '@lezer/highlight',
        '@lezer/lr',
        'style-mod',
        '@marijn/find-cluster-break',
        'mdurl',
        'd3-array',
        'vue-types',
        'scroll-into-view-if-needed',
        'throttle-debounce',
        'uc.micro',
        '@socket.io/component-emitter',
        'socket.io-client',
        '@mermaid-js/parser',
        '@iconify/utils',
        '@braintree/sanitize-url',
        'd3-sankey',
        'ts-dedent',
        'async-validator',
        'vue-demi',
        'w3c-keyname',
        'crelt',
        'internmap',
        'charenc',
        '@emotion/hash',
        '@emotion/unitless',
        'langium',
        'jspdf',
        'html2canvas',
        'socket.io-parser',
        'engine.io-client',
        '@codemirror/commands',
        'punycode.js',
        '@vue/devtools-api',
        '@vueuse/shared',
        'linkify-it'
      ],
      exclude: ['electron', /[\/]\.vite[\/]/],
      esbuildOptions: {
        target: 'es2020',
        platform: 'browser'
      }
    },
    server: {
      port: env.VITE_PORT || 5005,
      host: '0.0.0.0',
      strictPort: true,
      proxy: {
        '/api': {
          target: env.VITE_SERVICE_URL || 'http://127.0.0.1:3000',
          protocol: 'http',
          changeOrigin: true,
          ws: true
        }
      }
    }
  };
});
