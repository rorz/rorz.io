import tailwindcss from "@tailwindcss/vite";
import { obsid } from "obsid/vite";
import vinext from "vinext";
import { defineConfig } from "vite";
import obsidConfig from "./obsid.config.ts";

export default defineConfig({
  plugins: [
    obsid(obsidConfig),
    tailwindcss(),
    vinext(),
  ],
});
