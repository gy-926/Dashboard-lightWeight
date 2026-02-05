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
    },
  },
});
