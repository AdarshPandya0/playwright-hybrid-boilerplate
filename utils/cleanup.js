// utils/cleanup.js
import fs from 'fs';
import path from 'path';

// Directories removed before each run to prevent stale artifacts from interfering.
// .auth stores cached authentication artifacts used by the hybrid auth fixture.
const dirsToClean = ['.auth', 'blob-report', 'playwright-report'];

for (const dir of dirsToClean) {
  const dirPath = path.resolve(dir);
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`Cleared stale directory: ${dir}`);
  }
}

// Recreate the auth cache directory so parallel workers can save session data.
// The .auth folder should always be present before tests begin.
fs.mkdirSync(path.resolve('.auth'));
console.log('Cleanup complete! Starting parallel shards.');
