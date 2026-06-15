import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
// import vueDevTools from "vite-plugin-vue-devtools";
// 禁用 vue-auto-router，使用手动路由配置
// import vueAutoRouter from "@wemt/vue3-auto-router";

export default defineConfig({
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
          'vendor-vueuse': ['@vueuse/core'],
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
    proxy: {
      // datav.kivii.org API 代理配置
      '/auth': {
        target: 'https://datav.kivii.org',
        changeOrigin: true,
      },
      '/kivii': {
        target: 'https://datav.kivii.org',
        changeOrigin: true,
      },
      '/Restful': {
        target: 'https://datav.kivii.org',
        changeOrigin: true,
      },
      '/codes': {
        target: 'https://datav.kivii.org',
        changeOrigin: true,
      },
      '/codet': {
        target: 'https://datav.kivii.org',
        changeOrigin: true,
      },
      '/Storages': {
        target: 'https://datav.kivii.org',
        changeOrigin: true,
      },
      '/storages': {
        target: 'https://datav.kivii.org',
        changeOrigin: true,
      },
      '/Serve': {
        target: 'https://datav.kivii.org',
        changeOrigin: true,
      },
      '/Content': {
        target: 'http://debug.k5.jst-gov.com',
        changeOrigin: true,
      }
    },
  },
});
