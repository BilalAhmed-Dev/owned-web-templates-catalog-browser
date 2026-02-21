# Template Vault (Astro + Starlight)

A public, file-based template catalog built with Astro Starlight.

This project lets you:
- Store templates as content entries (`.md`/`.mdx`) with screenshots and metadata
- Browse them in a filterable catalog (`/templates`)
- Open detail pages (`/templates/[slug]`)
- Download the original zip from each detail page (`/download/[slug]`)
- Ingest new zip files quickly with `npm run ingest`

No database is required. Everything is managed in the repo using content collections.

## Purpose

This repo is a local-first "template vault" for organizing downloaded template packs in a consistent structure:
- Notes and metadata in `entry.mdx`
- Visual previews in `images/`
- Original archive as `source.zip`

It is optimized for quickly finding templates by framework and tech stack, then downloading the original zip when needed.

## Quick Start

```bash
npm install
npm run dev
```

Open: `http://localhost:4321/templates`

## Ingest Workflow

Drop new zip files into:

```text
vault/inbox/
```

Then run:

```bash
npm run ingest
```

What `npm run ingest` does:
1. Scans `vault/inbox/` for `.zip` files
2. Creates `src/content/templates/<slug>/`
3. Moves zip to `src/content/templates/<slug>/source.zip`
4. Creates `src/content/templates/<slug>/entry.mdx` with starter frontmatter:
   - `title` (humanized from zip file name)
   - `framework: "other"`
   - `tech: []`
   - `tags: []`
   - `cover: "./images/cover.png"`
   - `zipFile: "./source.zip"`
5. Creates `src/content/templates/<slug>/images/`
6. Prints a created/failed summary

Optional watch mode:

```bash
node scripts/ingest.mjs --watch
```

## Template Entry Structure

Each template should look like:

```text
src/content/templates/<slug>/
  entry.mdx
  source.zip
  images/
    cover.png
    ...other screenshots
```

`entry.mdx` frontmatter schema:
- `title`: string
- `framework`: `nextjs | html | wordpress | other`
- `tech`: string[]
- `tags`: string[]
- `cover`: string (usually `./images/cover.png`)
- `zipFile`: string (default `./source.zip`)
- `addedAt`: date (optional)

## Main Commands

| Command | Purpose |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start local dev server |
| `npm run ingest` | Import zip files from `vault/inbox` into the templates collection |
| `npm run build` | Build production output |
| `npm run preview` | Preview production build locally |

## Routes

- `/templates` - Catalog page with filters, active chips, sorting, and result count
- `/templates/[slug]` - Template detail page with metadata, screenshots, and body content
- `/download/[slug]` - Zip download endpoint (`Content-Disposition: attachment`)

## Tech Stack

- [Astro](https://docs.astro.build/)
- [Starlight](https://starlight.astro.build/)
- Astro Content Collections (`src/content.config.ts`)

## Notes for a Public Repo

- Do not commit private/commercial template sources unless redistribution is allowed by license.
- Keep large binary files in check (consider Git LFS if needed).
