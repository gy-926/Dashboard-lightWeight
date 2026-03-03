import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
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
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        inlineDynamicImports: true, // 内联动态导入，将所有动态导入的模块都打包到主文件中
        entryFileNames: "Content/UmdDashboard/assets/index.[hash].js",
        chunkFileNames: "Content/UmdDashboard/assets/[name].[hash].js",
        assetFileNames: "Content/UmdDashboard/assets/[name].[hash].[ext]",
      },
    },
  },
  server: {
    proxy: {
      // datav.kivii.org API 代理配置
      "/auth": {
        target: "https://datav.kivii.org",
        changeOrigin: true,
      },
      "/kivii": {
        target: "https://datav.kivii.org",
        changeOrigin: true,
      },
      "/Restful": {
        target: "https://datav.kivii.org",
        changeOrigin: true,
      },
      "/codet": {
        target: "https://datav.kivii.org",
        changeOrigin: true,
      },
      "/storages": {
        target: "https://datav.kivii.org",
        changeOrigin: true,
      },
    },
  },
});
