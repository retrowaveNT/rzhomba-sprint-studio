import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

process.env.NITRO_PRESET ??= "node-server";

export default defineConfig(({ command }) => ({
  server: { port: 3000, host: true },
  resolve: { dedupe: ["react", "react-dom"] },
  plugins: [
    tsconfigPaths(),
    tanstackStart({ server: { entry: "server" } }),
    ...(command === "build" ? [nitro()] : []),
    viteReact(),
    tailwindcss(),
  ],
}));