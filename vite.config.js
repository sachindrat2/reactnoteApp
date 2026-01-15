import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin to add build timestamp to HTML and asset URLs
const timestampPlugin = () => {
  return {
    name: 'timestamp-plugin',
    transformIndexHtml(html) {
      const timestamp = Date.now();
      return html
        .replace('BUILD_TIME', timestamp)
        .replace('BUILD_TIMESTAMP', new Date().toISOString())
        // Add timestamp query params to asset URLs for cache busting
        .replace(/href="([^"]*\/assets\/[^"]*\.(css|js))"/g, `href="$1?v=${timestamp}"`)
        .replace(/src="([^"]*\/assets\/[^"]*\.(js|css))"/g, `src="$1?v=${timestamp}"`);
    }
  };
};

export default defineConfig({
  plugins: [react(), timestampPlugin()],
  base: '/notes/', // Use /notes/ for correct subpath deployment
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable source maps for production
    minify: 'terser', // Better minification
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          utils: ['src/utils/performance.js', 'src/services/api.js']
        }
      }
    },
    chunkSizeWarningLimit: 600,
    // Optimize for production
    target: 'es2015',
    reportCompressedSize: true
  },
  server: {
    port: 8080,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'https://ownnoteapp-hedxcahwcrhwb8hb.canadacentral-01.azurewebsites.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  }
})