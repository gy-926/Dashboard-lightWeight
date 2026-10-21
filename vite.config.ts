import { fileURLToPath, URL } from 'node:url';

import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { getDevApiUrl } from './scripts/dev-api-config.mjs';
// import vueDevTools from "vite-plugin-vue-devtools";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const legacyTarget = env.DEV_LEGACY_PROXY_TARGET?.trim();
  const legacyProxy = legacyTarget
    ? Object.fromEntries(
        ['/auth', '/kivii', '/Restful', '/codet'].map(path => [
          path,
          { target: legacyTarget, changeOrigin: true },
        ])
      )
    : {};

  return {
    plugins: [
      vue(),
      // vueDevTools(),
      // vueAutoRouter(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // inlineDynamicImports: true, // 移除此行以启用代码分割，优化加载性能和内存占用
          entryFileNames: 'Content/UmdDashboard/assets/index.[hash].js',
          chunkFileNames: 'Content/UmdDashboard/assets/[name].[hash].js',
          assetFileNames: 'Content/UmdDashboard/assets/[name].[hash].[ext]',
          manualChunks: {
            'vendor-vue': ['vue', 'vue-router', 'pinia'],
            'vendor-echarts': ['echarts'],
            'vendor-sfc-loader': ['vue3-sfc-loader'],
            'vendor-kivii': ['@kivii.com/bridge'],
            'kivii-public-components': ['kivii-public-components'],
          },
        },
      },
    },
    esbuild: {
      // 生产环境移除 console.log 和 debugger
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
    server: {
      host: '127.0.0.1',
      proxy: {
        '/api': {
          target: getDevApiUrl(),
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, ''),
          cookiePathRewrite: { '/auth': '/api/auth' },
        },
        ...legacyProxy,
      },
    },
  };
});
