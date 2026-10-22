import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router') || id.includes('\\react\\') || id.includes('\\react-dom\\') || id.includes('\\react-router')) {
              return 'vendor-react'
            }
            if (id.includes('sweetalert2') || id.includes('react-hot-toast')) {
              return 'vendor-ui'
            }
            if (id.includes('axios')) {
              return 'vendor-utils'
            }
            return 'vendor-libs'
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
