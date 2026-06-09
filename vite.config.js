import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" keeps asset paths relative so the build works whether it's
// served from a domain root (Netlify/Vercel/custom domain) or a GitHub
// Pages project subpath (https://danieltomaro13.github.io/24-0/).
export default defineConfig({
  plugins: [react()],
  base: "./",
});
