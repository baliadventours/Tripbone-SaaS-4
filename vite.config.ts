import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';

function renameHtmlPlugin() {
  return {
    name: 'rename-html-plugin',
    closeBundle() {
      // Resolve paths using import.meta.url or standard __dirname fallback
      const currentDir = typeof __dirname !== 'undefined' ? __dirname : path.dirname(new URL(import.meta.url).pathname);
      const distDir = path.resolve(currentDir, 'dist');
      const indexPath = path.join(distDir, 'index.html');
      const appHtmlPath = path.join(distDir, 'app.html');
      const templatePath = path.join(distDir, 'app.template.html');
      const fallbackPath = path.resolve(currentDir, 'src/indexHtmlFallback.ts');

      try {
        const sourceHtmlPath = fs.existsSync(indexPath) ? indexPath : (fs.existsSync(appHtmlPath) ? appHtmlPath : null);
        if (sourceHtmlPath) {
          const htmlContent = fs.readFileSync(sourceHtmlPath, 'utf8');
          
          // 1. Write the fallback file for the server side inline fallback
          const fallbackContent = `export const fallbackHtmlTemplate = ${JSON.stringify(htmlContent)};\n`;
          fs.writeFileSync(fallbackPath, fallbackContent);
          console.log('[Vite Plugin] Successfully updated src/indexHtmlFallback.ts');

          // 2. Write to app.template.html and app.html, and ensure index.html exists
          fs.writeFileSync(templatePath, htmlContent);
          fs.writeFileSync(appHtmlPath, htmlContent);
          if (!fs.existsSync(indexPath)) {
            fs.writeFileSync(indexPath, htmlContent);
          }
          console.log('[Vite Plugin] Successfully created index.html, app.html, and app.template.html in dist');
        } else {
          console.log('[Vite Plugin] HTML bundle not found in dist');
        }
      } catch (err) {
        console.error('[Vite Plugin Error]:', err);
      }
    }
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), renameHtmlPlugin()],
    build: {
      rollupOptions: {
        input: path.resolve(__dirname, 'index.html')
      }
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      allowedHosts: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
