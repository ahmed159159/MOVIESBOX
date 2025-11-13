import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/MOVIESBOX/",   // أهم سطر لمنع الشاشة السوداء من GitHub Pages
  plugins: [react(), tailwindcss()],
});
