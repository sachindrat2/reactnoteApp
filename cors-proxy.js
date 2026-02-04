import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Proxy middleware
app.use('/api', createProxyMiddleware({
  target: 'https://notesapp.agreeableocean-d7058ab3.japanwest.azurecontainerapps.io',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '',
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error');
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxying request:', req.method, req.url);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('Received response:', proxyRes.statusCode, req.url);
  }
}));

app.listen(PORT, () => {
  console.log(`CORS Proxy server running on http://localhost:${PORT}`);
});