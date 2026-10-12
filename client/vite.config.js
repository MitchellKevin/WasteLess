import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Also reachable from other devices on the network (e.g. an iPhone on the same Wi-Fi)
    host: true,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
