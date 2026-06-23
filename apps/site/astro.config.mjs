import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "static",
  adapter: node({ mode: "standalone" }),
  integrations: [react()],
  server: {
    port: 3200,
    host: true,
  },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ["@admin-template/ui"],
    },
    server: {
      proxy: {
        "/api": "http://localhost:4000",
        "/rpc": "http://localhost:4000",
      },
    },
  },
});
