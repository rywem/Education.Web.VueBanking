import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// Vite config. Mental model: this is your frontend's MSBuild + dotnet watch
// rolled into one. `vite` (dev) gives you an unbundled, hot-reloading dev
// server; `vite build` produces the optimized static output in dist/.
//
// Vite 8 note: the bundler under the hood is now Rolldown (Rust). You won't
// notice except that builds are faster — the config API is unchanged.
export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      // Runtime half of the "@/..." alias. The tsconfig "paths" entry is the
      // editor half. Both must agree or you get "works in editor, fails at
      // build" (or vice versa) — a common first-day papercut.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    port: 5173,
    proxy: {
      // THE key piece for a .NET pairing. The browser only ever talks to the
      // Vite origin (http://localhost:5173). Any request starting with /api is
      // transparently forwarded to the ASP.NET Core process. Result: in dev,
      // the SPA and API look same-origin, so CORS never fires and there's no
      // cross-origin cookie weirdness. It also mirrors a common prod layout
      // (reverse proxy / ASP.NET serving the SPA), so dev ≈ prod.
      '/api': {
        target: 'https://localhost:7123', // must match launchSettings.json
        changeOrigin: true,
        // GOTCHA: the ASP.NET dev HTTPS cert is self-signed. Node's proxy will
        // reject it unless you either trust it (`dotnet dev-certs https --trust`)
        // or tell the proxy not to verify. secure:false is the pragmatic
        // dev-only choice. Never ship this to prod.
        secure: false,
      },
    },
  },

  build: {
    // Where `vite build` drops the static site. Point your ASP.NET Core static
    // file middleware (or Azure Static Web Apps) at this folder for deployment.
    outDir: 'dist',
  },
})
