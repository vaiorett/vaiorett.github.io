import { defineConfig } from 'astro/config';
export default defineConfig({site:'https://vaiorett.github.io',output:'static',outDir:'./.astro-templates',publicDir:'./src/public',compressHTML:false,build:{format:'file'}});
