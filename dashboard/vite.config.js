import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  plugins: [
    react(),
    sentryVitePlugin({
      org: "mano-20",
      project: "mano-espace",
      telemetry: false,
      disable: !process.env.CI,
    }),
  ],
  build: {
    outDir: "build",
    sourcemap: true,
  },
  define: {
    "process.env": process.env,
  },
});
