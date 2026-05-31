// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Used to build absolute URLs for SEO / social share tags.
  // Change this to your real domain when you deploy.
  site: 'https://tomegag.com',

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: vercel()
});