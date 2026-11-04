import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

export default defineConfig({
  server: { host: "::", port: 8081 },
  plugins: [react(), mcpPlugin()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
