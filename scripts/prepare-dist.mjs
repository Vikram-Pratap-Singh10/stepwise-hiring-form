import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const clientDir = path.join(distDir, 'client');
const serverDir = path.join(distDir, 'server');

if (!fs.existsSync(distDir)) {
  console.error('[prepare-dist] Error: dist directory does not exist.');
  process.exit(1);
}

if (fs.existsSync(clientDir)) {
  console.log('[prepare-dist] Flattening client static files into dist root...');
  
  // Copy all files and folders from dist/client into dist/
  const items = fs.readdirSync(clientDir);
  for (const item of items) {
    const srcPath = path.join(clientDir, item);
    const destPath = path.join(distDir, item);
    
    // If destination exists and is directory, remove before copy
    if (fs.existsSync(destPath)) {
      fs.rmSync(destPath, { recursive: true, force: true });
    }
    fs.cpSync(srcPath, destPath, { recursive: true });
  }

  // Remove dist/client and dist/server
  fs.rmSync(clientDir, { recursive: true, force: true });
  if (fs.existsSync(serverDir)) {
    fs.rmSync(serverDir, { recursive: true, force: true });
  }

  // Remove unwanted build metadata from dist root
  const unwanted = ['nitro.json', 'package.json', 'package-lock.json', 'wrangler.json'];
  for (const file of unwanted) {
    const p = path.join(distDir, file);
    if (fs.existsSync(p)) {
      fs.rmSync(p, { force: true });
    }
  }

  // Remove .wrangler folder from workspace root if present
  const wranglerDir = path.resolve('.wrangler');
  if (fs.existsSync(wranglerDir)) {
    fs.rmSync(wranglerDir, { recursive: true, force: true });
  }
}

// Verify dist/index.html exists
const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  console.log('[prepare-dist] Success! Static build ready in dist/:');
  const distFiles = fs.readdirSync(distDir);
  for (const f of distFiles) {
    console.log(` - dist/${f}`);
  }
} else {
  console.error('[prepare-dist] Warning: dist/index.html was not found!');
  process.exit(1);
}
