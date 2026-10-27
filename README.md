# Vaiorett · Portfolio

A bilingual portfolio for architectural visualization, 3D modeling and digital asset production. Eight project URLs and existing project artwork are preserved. The public website uses the Vaiorett brand and a dedicated contact email; the complete résumé is shared separately during applications.

## Editing without code

Open `manage.html`. Add a project, upload images or video links, edit Chinese and English text, choose a layout, preview, then publish. New images and custom video covers are converted to WebP in the browser. The editor keeps drafts locally; the GitHub token is held only in memory and never written to the repository or export. Use a fine-grained token limited to this repository with Contents read/write.

Image layouts: automatic, full-width, or two-column gallery. Image uploads need no captions, descriptions or paragraphs; accessible labels fall back to the project title. Existing image text remains compatible. Each image has a width preference. Drag images or use the move buttons to change reading order. Mobile uses one column; long boards remain complete. Automatic layout does not generate or translate text.

Video links support Bilibili, YouTube and HTTPS MP4/WebM files. Posters show only a play button. Playback options contain the source link and troubleshooting help. Third-party sign-in verification, recommendations and playback quality remain controlled by their platforms. An optional direct MP4/WebM version uses the native player without platform recommendations. No media stream extraction or login bypass is performed.

## Build

Node 24.22.1 or a version supported by Astro 7.4.2:

```sh
npm ci
npm run build
npm test
```

Astro components in `src/` generate shared page templates. SCSS generates `portfolio.css`; `scripts/collect-templates.mjs` packages the templates, and `scripts/build.py` renders current content into the bilingual static HTML files. Commit source and generated files together. GitHub Pages serves the repository root.

Daily content edits do not require Node or an AI chat. The editor and Python renderer use the same committed templates, so automatic poster updates preserve the design. `content-data.js` stores approved public text, `gallery-data.js` stores media and layout choices, and `src/data/schema.json` defines the editable fields.

## Privacy and maintenance

Every public HTML page, including future generated project pages, contains `noindex`. Crawling remains allowed so search engines can read that directive. The sitemap is empty. This is an indexing preference, not access control: anyone with a URL can view, copy, screenshot or redistribute public content.

Do not upload a complete résumé, personal phone number, real-name identity details, employer-internal documents, raw design files or material you are not entitled to show. Review screenshots for visible usernames, file paths, addresses and confidential annotations. Strip metadata from externally prepared files; the normal browser WebP conversion does not carry source EXIF into its output.

The privacy revision uses a new local draft store to avoid silently restoring old identity-bearing drafts. Old browser drafts are not deleted, but they are not automatically imported. Review all text and image captions before publishing. This public repository contains no private backup; keep complete documents and historical backups outside it.

Use a GitHub noreply email for commits. Deleting a file from the current website does not remove it from old commits, forks, clones, search caches or third-party archives. History remediation must be verified separately.

## Design and licenses

Astro/SCSS components use the rounded surfaces and compact navigation of Koibumi as a design reference, adapted to a soft violet project portfolio. No reference-blog artwork, avatar or articles are copied. Fonts and icons are hosted locally. See `THIRD_PARTY_NOTICES.md` and the licenses in `assets/`. Brand icons identify tools; text remains visible, and tools without available brand icons use letter marks.
