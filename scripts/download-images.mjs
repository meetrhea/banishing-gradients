#!/usr/bin/env node
/**
 * Build-time script to download external images (Unsplash, etc.)
 * and save them locally for better performance and reliability.
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ARTICLES_DIR = join(ROOT, 'src/content/articles');
const IMAGES_DIR = join(ROOT, 'public/images/articles');

// Generate a short hash for the image filename
function hashUrl(url) {
  return createHash('md5').update(url).digest('hex').substring(0, 12);
}

// Extract the base Unsplash URL (before query params)
function getImageId(url) {
  const match = url.match(/photo-([a-f0-9-]+)/);
  return match ? match[1].substring(0, 12) : hashUrl(url);
}

async function downloadImage(url, filepath) {
  // Add WebP format and quality optimization
  let fetchUrl = url;
  if (url.includes('unsplash.com')) {
    fetchUrl = url.includes('?')
      ? `${url}&fm=webp&q=80`
      : `${url}?fm=webp&q=80`;
  }

  console.log(`  Downloading: ${fetchUrl.substring(0, 60)}...`);

  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(filepath, buffer);
  console.log(`  Saved: ${filepath} (${(buffer.length / 1024).toFixed(1)} KB)`);
  return buffer.length;
}

async function processArticles() {
  console.log('📸 Downloading article images...\n');

  // Ensure images directory exists
  if (!existsSync(IMAGES_DIR)) {
    await mkdir(IMAGES_DIR, { recursive: true });
  }

  const files = await readdir(ARTICLES_DIR);
  const mdxFiles = files.filter(f => f.endsWith('.mdx'));

  let totalDownloaded = 0;
  let totalBytes = 0;

  for (const file of mdxFiles) {
    const filepath = join(ARTICLES_DIR, file);
    let content = await readFile(filepath, 'utf-8');

    // Find imageUrl in frontmatter
    const imageMatch = content.match(/imageUrl:\s*["']([^"']+)["']/);
    if (!imageMatch) continue;

    const originalUrl = imageMatch[1];

    // Skip if already local
    if (originalUrl.startsWith('/')) {
      console.log(`✓ ${file} - already local`);
      continue;
    }

    // Generate local filename
    const imageId = getImageId(originalUrl);
    const slug = file.replace('.mdx', '');
    const localFilename = `${slug}.webp`;
    const localPath = `/images/articles/${localFilename}`;
    const absolutePath = join(IMAGES_DIR, localFilename);

    // Download if not exists
    if (!existsSync(absolutePath)) {
      try {
        const bytes = await downloadImage(originalUrl, absolutePath);
        totalDownloaded++;
        totalBytes += bytes;
      } catch (error) {
        console.error(`  ✗ Failed to download for ${file}: ${error.message}`);
        continue;
      }
    } else {
      console.log(`✓ ${file} - image exists`);
    }

    // Update MDX file to use local path
    const newContent = content.replace(
      /imageUrl:\s*["'][^"']+["']/,
      `imageUrl: "${localPath}"`
    );

    if (newContent !== content) {
      await writeFile(filepath, newContent);
      console.log(`  Updated: ${file} → ${localPath}`);
    }
  }

  console.log(`\n✅ Done! Downloaded ${totalDownloaded} images (${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);
}

processArticles().catch(console.error);
