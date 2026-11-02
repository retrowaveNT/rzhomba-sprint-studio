import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// По умолчанию собираем обычный Node-сервер (подходит для Render, Railway, Docker).
// Другой таргет можно выбрать переменной окружения, например NITRO_PRESET=vercel.
process.env.NITRO_PRESET ??= "node-server";

export default defineConfig({
  server: { port: 3000 },
  resolve: { dedupe: ["react", "react-dom"] },
  plugins: [
    tsconfigPaths(),
    // Порядок важен: tanstackStart должен идти раньше viteReact.
    tanstackStart({ server: { entry: "server" } }),
    nitro(),
    viteReact(),
    tailwindcss(),
  ],
});
