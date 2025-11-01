import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || process.cwd()

// Shared hosts often cap process threads; keep esbuild single-threaded
if (!process.env.ESBUILD_WORKER_THREADS) {
  process.env.ESBUILD_WORKER_THREADS = '1'
}

if (!process.env.GOMAXPROCS) {
  process.env.GOMAXPROCS = '1'
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: '.',
    minify: false,
    rollupOptions: {
      output: {
        entryFileNames: '[name]-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash][extname]',
        manualChunks: {
          'react-vendors': ['react', 'react-dom'],
          'ui-vendors': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'chart-vendors': ['recharts', 'framer-motion'],
          'icons': ['lucide-react', '@phosphor-icons/react'],
          'utils': ['uuid', 'clsx', 'date-fns']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    cssCodeSplit: true
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, '')
      }
    }
  }
})
