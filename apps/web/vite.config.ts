import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { imagesOptimizer } from "@vinext/cloudflare/images/images-optimizer";
import { obsid } from "obsid/vite";
import vinext from "vinext";
import { defineConfig } from "vite";
import obsidConfig from "./obsid.config.ts";

export default defineConfig({
  plugins: [
    obsid(obsidConfig),
    tailwindcss(),
    vinext({
      images: {
        optimizer: {
          adapter: imagesOptimizer().adapter,
        },
      },
      nextConfig: {
        output: "export",
      },
    }),
    cloudflare({
      viteEnvironment: {
        childEnvironments: [
          "ssr",
        ],
        name: "rsc",
      },
    }),
  ],
});
