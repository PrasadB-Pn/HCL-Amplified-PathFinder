import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '..');

test('Frontend build artifacts verify production readiness', () => {
  const distDir = path.join(FRONTEND_DIR, 'dist');
  assert.ok(fs.existsSync(distDir), 'dist/ directory must exist after build');

  const indexHtml = path.join(distDir, 'index.html');
  assert.ok(fs.existsSync(indexHtml), 'dist/index.html must exist');

  const htmlContent = fs.readFileSync(indexHtml, 'utf-8');
  assert.ok(htmlContent.includes('<div id="root">'), 'index.html must contain root mount element');

  const assetsDir = path.join(distDir, 'assets');
  assert.ok(fs.existsSync(assetsDir), 'dist/assets/ directory must exist');

  const assetFiles = fs.readdirSync(assetsDir);
  const jsBundle = assetFiles.find((f) => f.endsWith('.js'));
  const cssBundle = assetFiles.find((f) => f.endsWith('.css'));

  assert.ok(jsBundle, 'JavaScript production bundle must be generated');
  assert.ok(cssBundle, 'CSS production bundle must be generated');
});

test('vercel.json is valid and contains SPA rewrites', () => {
  const vercelJsonPath = path.join(FRONTEND_DIR, 'vercel.json');
  assert.ok(fs.existsSync(vercelJsonPath), 'vercel.json must exist');

  const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
  assert.ok(Array.isArray(vercelConfig.rewrites), 'rewrites array must be defined');

  const spaRewrite = vercelConfig.rewrites.find((r) => r.destination === '/index.html');
  assert.ok(spaRewrite, 'Must contain SPA catch-all rewrite to /index.html');
});

test('Production environment variables do not leak sensitive credentials', () => {
  const envExample = path.join(FRONTEND_DIR, '.env.example');
  const envProduction = path.join(FRONTEND_DIR, '.env.production');

  assert.ok(fs.existsSync(envExample), '.env.example must exist');
  assert.ok(fs.existsSync(envProduction), '.env.production must exist');

  const prodContent = fs.readFileSync(envProduction, 'utf-8');
  assert.ok(!prodContent.includes('password'), 'Must not contain plaintext passwords');
  assert.ok(!prodContent.includes('secret'), 'Must not contain secrets');
  assert.ok(prodContent.includes('VITE_API_URL='), 'Must define VITE_API_URL');
  assert.ok(prodContent.includes('VITE_DEMO_MODE=false'), 'Must set VITE_DEMO_MODE=false for production');
});

