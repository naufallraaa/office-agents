import { resolve } from 'path';

// Load .env from project root
const envPath = resolve(import.meta.dir, '../../../.env');
const envText = await Bun.file(envPath).text();

envText.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  
  const [key, ...values] = trimmed.split('=');
  if (key && values.length) {
    process.env[key.trim()] = values.join('=').trim();
  }
});

console.log('✓ Environment loaded from .env');
