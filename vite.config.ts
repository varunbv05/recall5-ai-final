// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  vite: {
    define: {
      // Explicitly define Supabase environment variables for Cloudflare Pages
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || 'https://hcathcfqumfrupawwvix.supabase.co'),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(process.env.SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjYXRoY2ZxdW1mcnVwYXd3dml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MTQzODUsImV4cCI6MjA5Mzk5MDM4NX0.cxt9HvIBPmetw8zxxusPL-T9IXdAigL4kqjnLmKJwj4'),
    },
  },
});
