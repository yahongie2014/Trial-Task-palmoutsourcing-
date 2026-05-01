import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../wp-plugin/hidden-deals/build",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "hidden-deals.js",
        assetFileNames: "hidden-deals.[ext]",
      },
    },
  },
});
