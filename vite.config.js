import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Using a relative base so the built site works whether it's hosted at
// https://<user>.github.io/  or  https://<user>.github.io/<repo-name>/
// (GitHub Project Pages serve from a sub-path, so an absolute "/" base breaks assets.)
export default defineConfig({
  plugins: [react()],
  base: './',
})
