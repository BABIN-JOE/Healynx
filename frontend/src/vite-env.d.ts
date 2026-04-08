// src/env.d.ts
interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  // add other VITE_ env vars here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
