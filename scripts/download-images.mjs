#!/usr/bin/env node
/**
 * Build-time script to download external images (Unsplash, etc.)
 * and create responsive sizes for better performance.
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ARTICLES_DIR = join(ROOT, 'src/content/articles');
const IMAGES_DIR = join(ROOT, 'public/images/articles');

// Image sizes to generate
const SIZES = {
  featured: { width: 800, height: 533, suffix: '' },        // Featured hero image
  thumbnail: { width: 320, height: 213, suffix: '-thumb' }, // Sidebar/list thumbnails
};

async function downloadAndProcess(url, basePath, slug) {
  // Fetch original image
  let fetchUrl = url;
  if (url.includes('unsplash.com') && !url.includes('&w=')) {
    fetchUrl = url.includes('?') ? `${url}&w=1200` : `${url}?w=1200`;
  }

  console.log(`  Fetching: ${slug}`);
  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const results = {};

  // Generate each size
  for (const [name, config] of Object.entries(SIZES)) {
    const outputPath = join(IMAGES_DIR, `${slug}${config.suffix}.webp`);

    await sharp(buffer)
      .resize(config.width, config.height, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(outputPath);

    const stats = await sharp(outputPath).metadata();
    const fileSize = (await readFile(outputPath)).length;
    console.log(`    ${name}: ${config.width}x${config.height} (${(fileSize / 1024).toFixed(1)} KB)`);

    results[name] = `/images/articles/${slug}${config.suffix}.webp`;
  }

  return results;
}

async function processArticles() {
  console.log('📸 Downloading and resizing article images...\n');

  // Ensure images directory exists
  if (!existsSync(IMAGES_DIR)) {
    await mkdir(IMAGES_DIR, { recursive: true });
  }

  const files = await readdir(ARTICLES_DIR);
  const mdxFiles = files.filter(f => f.endsWith('.mdx'));

  let totalDownloaded = 0;

  for (const file of mdxFiles) {
    const filepath = join(ARTICLES_DIR, file);
    let content = await readFile(filepath, 'utf-8');

    // Find imageUrl in frontmatter
    const imageMatch = content.match(/imageUrl:\s*["']([^"']+)["']/);
    if (!imageMatch) continue;

    const originalUrl = imageMatch[1];
    const slug = file.replace('.mdx', '');

    // Check if already processed (has local path)
    const isLocal = originalUrl.startsWith('/images/articles/');
    const featuredPath = join(IMAGES_DIR, `${slug}.webp`);
    const thumbPath = join(IMAGES_DIR, `${slug}-thumb.webp`);

    // If both sizes exist and it's local, skip
    if (isLocal && existsSync(featuredPath) && existsSync(thumbPath)) {
      console.log(`✓ ${slug} - already processed`);
      continue;
    }

    // Need to download or reprocess
    let sourceUrl = originalUrl;

    // If local, we need to find original URL - check git history or use placeholder
    if (isLocal) {
      console.log(`⚠ ${slug} - need to regenerate thumbnails from existing`);
      // Read existing featured image and resize
      if (existsSync(featuredPath)) {
        const buffer = await readFile(featuredPath);
        await sharp(buffer)
          .resize(SIZES.thumbnail.width, SIZES.thumbnail.height, { fit: 'cover' })
          .webp({ quality: 80 })
          .toFile(thumbPath);
        console.log(`    thumbnail: ${SIZES.thumbnail.width}x${SIZES.thumbnail.height}`);
        continue;
      }
    }

    try {
      const paths = await downloadAndProcess(sourceUrl, IMAGES_DIR, slug);
      totalDownloaded++;

      // Update MDX file to use local path (featured size)
      const newContent = content.replace(
        /imageUrl:\s*["'][^"']+["']/,
        `imageUrl: "${paths.featured}"`
      );

      if (newContent !== content) {
        await writeFile(filepath, newContent);
        console.log(`  Updated: ${file}`);
      }
    } catch (error) {
      console.error(`  ✗ Failed: ${file} - ${error.message}`);
    }
  }

  console.log(`\n✅ Done! Processed ${totalDownloaded} images`);
}

processArticles().catch(console.error);
