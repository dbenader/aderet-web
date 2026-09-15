import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync } from 'node:fs';

const labEntry = {
  name: 'lab-entry',
  closeBundle() {
    mkdirSync('dist/lab', { recursive: true });
    copyFileSync('dist/index.html', 'dist/lab/index.html');
  },
};

export default defineConfig({ plugins: [react(), labEntry], build: { sourcemap: true } });
