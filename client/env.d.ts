/// <reference types="vite/client" />

// Type the environment variables you read via import.meta.env. Without this,
// import.meta.env.VITE_API_BASE_URL is `any` (or an error under strict).
// Only VITE_-prefixed vars are exposed to client code — Vite strips everything
// else so you can't accidentally leak a server secret into the bundle.
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
