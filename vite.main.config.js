import { defineConfig } from 'vite';
import { builtinModules } from 'node:module';
import pkg from './package.json';

const builtins = [
  'electron',
  ...builtinModules.map((m) => [m, `node:${m}`]).flat(),
];

const external = [...builtins, ...Object.keys(pkg.dependencies || {})];

export default defineConfig({
  root: '.',
  build: {
    outDir: '.vite',
    emptyOutDir: true,
    sourcemap: 'inline',
    minify: false,
    lib: {
      entry: 'main.js',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: [...external, 
        'electron-store',
        '@electron/remote',
        'fsevents',
        ...Object.keys(pkg.devDependencies || {})
      ],
      output: {
        entryFileNames: 'main.js',
        format: 'cjs',
        preserveModules: true
      }
    }
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
});
