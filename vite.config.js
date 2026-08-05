import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import path from 'path'
import fs from 'fs'

// Identificador unico do build: gravado no bundle e em dist/version.json.
// O app compara os dois em runtime para se auto-atualizar quando sai deploy.
const buildId = Date.now().toString()

export default defineConfig({
  plugins: [
    react(),
    mkcert(),
    {
      name: 'emit-version-json',
      closeBundle() {
        const distDir = path.resolve(__dirname, 'dist')
        if (fs.existsSync(distDir)) {
          fs.writeFileSync(path.join(distDir, 'version.json'), JSON.stringify({ version: buildId }))
        }
      },
    },
  ],
  define: {
    __APP_VERSION__: JSON.stringify(buildId),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    https: true,
    host: '0.0.0.0',
  },
})
