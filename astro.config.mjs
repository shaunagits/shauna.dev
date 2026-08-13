// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://shauna.dev',

  // No integrations, on purpose. The MDX integration came over from
  // portfolio-2026 with the blog content collection; both were deleted when the
  // Writing section was hardcoded (2026-08-13), and this site has no markdown
  // left to compile. One page, one stylesheet, no plugins.

  // Also diverges from portfolio-2026: that repo optimizes real imagery
  // (project cards, headshots) and so pulls in sharp, a native binary. Here the
  // only assets are favicons and an og image served straight from public/ —
  // nothing to optimize. The default sharp service would still be bundled, and
  // it fails to install on this machine (no prebuilt binary for the platform,
  // and building from source needs node-gyp + node-addon-api). Passthrough
  // drops the dependency rather than working around it.
  // If real images are ever added to this site, add `sharp` back and delete this.
  image: { service: passthroughImageService() },
});
