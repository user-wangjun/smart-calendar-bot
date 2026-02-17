import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    vue(),
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz'
    })
  ],
  base: '/',

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@views': resolve(__dirname, 'src/views'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@router': resolve(__dirname, 'src/router'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@api': resolve(__dirname, 'src/api'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@config': resolve(__dirname, 'src/config'),
      '@services': resolve(__dirname, 'src/services')
    }
  },

  server: {
    port: 5173,
    host: '127.0.0.1',
    strictPort: true,
    open: false,
    hmr: {
      overlay: true,
      clientPort: 5173,
      protocol: 'ws'
    },
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/.git/**']
    },
    fs: {
      strict: false
    },
    headers: {
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks (id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue')) {
              return 'vue-vendor';
            }
            if (id.includes('element-plus')) {
              return 'element-plus';
            }
            if (id.includes('chart.js')) {
              return 'chartjs';
            }
            if (id.includes('lodash')) {
              return 'lodash';
            }
            return 'vendor';
          }
          return undefined;
        }
      }
    }
  }
});
