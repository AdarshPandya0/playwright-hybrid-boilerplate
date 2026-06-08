import fs from 'fs';
import path from 'path';

// Flatten shard-specific blob output directories into the root blob-report directory
// so Playwright can merge a single set of zip artifacts.
const blobDir = path.resolve('blob-report');

let counter = 1;
if (fs.existsSync(blobDir)) {
    fs.readdirSync(blobDir).forEach(item => {
        const itemPath = path.join(blobDir, item);
        // If it's one of the shard sub-folders created by the sharded runner.
        if (fs.statSync(itemPath).isDirectory()) {
            fs.readdirSync(itemPath).forEach(file => {
                if (file.endsWith('.zip')) {
                    // Move each shard archive up and rename it to avoid collisions.
                    fs.renameSync(path.join(itemPath, file), path.join(blobDir, `shard-${counter++}.zip`));
                }
            });
        }
    });
    console.log('All blobs successfully hoisted for merging');
}