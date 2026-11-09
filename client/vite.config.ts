import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                // Keep the React runtime in its own long-lived vendor chunk.
                manualChunks: {
                    react: ["react", "react-dom", "react-dom/client"]
                }
            }
        }
    },
    server: {
        host: "0.0.0.0",
        port: 5173,
        proxy: {
            "/api": {
                target: "http://127.0.0.1:4000",
                changeOrigin: true
            }
        }
    }
});
