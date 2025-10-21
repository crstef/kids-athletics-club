import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";

import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig(async () => {
  const [sparkPlugin, createIconImportProxy] = await Promise.all([
    import("@github/spark/spark-vite-plugin"),
    import("@github/spark/vitePhosphorIconProxyPlugin")
  ]);

  return {
    plugins: [
      react(),
      tailwindcss(),
      // DO NOT REMOVE
      (createIconImportProxy.default ?? createIconImportProxy)() as PluginOption,
      (sparkPlugin.default ?? sparkPlugin)() as PluginOption,
    ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  build: {
    minify: 'terser',
    outDir: 'dist',
    assetsDir: '.',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production'
      }
    },
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
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  };
});
