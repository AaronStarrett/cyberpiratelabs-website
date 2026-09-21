import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

const site = process.env.SITE_URL || "https://cyberpiratelabs.com";

export default defineConfig({
  site,
  output: "static",
  trailingSlash: "always",
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes("/404"),
    }),
  ],
  vite: {
    server: {
      host: "127.0.0.1",
      port: 43123,
      strictPort: true,
    },
  },
});
