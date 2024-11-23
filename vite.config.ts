import { fileURLToPath, URL } from 'node:url'

import { defineConfig, PluginOption, ViteDevServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import path from 'path';
import fs from 'fs';
import { IncomingMessage, ServerResponse } from 'http';
import OpenAI from 'openai';

import dotenv from 'dotenv';
dotenv.config();

const writeJsonPlugin = (): PluginOption => ({
  name: 'write-json',
  configureServer(server: ViteDevServer) {
    server.middlewares.use('/write-json', (req: IncomingMessage, res: ServerResponse) => {
      if (req.method === 'POST') {
        let body = '';

        req.on('data', (chunk) => {
          body += chunk.toString();
        });

        req.on('end', () => {
          try {
            const { data, fileName } = JSON.parse(body);

            if (!fileName || typeof fileName !== 'string') {
              throw new Error('Invalid or missing file name');
            }

            // Define the path for the output file
            const filePath = path.resolve(__dirname, 'public', fileName);

            // Write JSON data to the file
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, filePath }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: (err as Error).message }));
          }
        });
      } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Method not allowed' }));
      }
    });
  },
});

// Define the OpenAI plugin
const useOpenAIPlugin = (): PluginOption => ({
  name: 'openai-proxy',
  configureServer(server: ViteDevServer) {
    server.middlewares.use('/openai', (req: IncomingMessage, res: ServerResponse) => {
      if (req.method === 'POST') {
        let body = '';

        req.on('data', (chunk) => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const prompt = JSON.parse(body);

            // Initialize OpenAI API
            const openai = new OpenAI({
              apiKey: process.env.OPENAI_API_KEY,
            });

            // Call OpenAI API
            const completion = await openai.chat.completions.create(prompt);

            // Send back the response
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(completion));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: (err as Error).message }));
          }
        });
      } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Method not allowed' }));
      }
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  base: '/mobile-text-adventures/',
  build: {
    outDir: 'docs',
  },
  plugins: [
    vue(),
    vueDevTools(),
    writeJsonPlugin(),
    useOpenAIPlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
