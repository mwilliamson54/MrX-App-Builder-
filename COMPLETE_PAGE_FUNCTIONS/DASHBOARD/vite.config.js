import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Build configuration optimized for Cloudflare Pages
  build: {
    outDir: 'dist',
    sourcemap: false,

    // Using esbuild instead of terser (fast + no dependency)
    minify: 'esbuild',

    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react']
        }
      }
    },

    chunkSizeWarningLimit: 1000
  },

  // Local development server with API proxy
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false
      }
    }
  },

  // Preview server configuration
  preview: {
    port: 4173,
    host: true
  },

  // Environment variables
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version)
  }
})
