import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import vueAutoRouter from "@wemt/vue3-auto-router";

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    vueAutoRouter(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
