import { mkdir, readdir, rename, copyFile, unlink, writeFile, stat } from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const inboxDir = path.join(rootDir, 'vault', 'inbox');
const templatesDir = path.join(rootDir, 'src', 'content', 'templates');
const watchMode = process.argv.includes('--watch');

const slugify = (value) => {
	const slug = value
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/&/g, ' and ')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
	return slug || 'template';
};

const humanize = (filename) =>
	filename
		.replace(/[_-]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());

const escapeDoubleQuotes = (value) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const buildEntry = (title) => `---
title: "${escapeDoubleQuotes(title)}"
framework: "other"
tech: []
tags: []
cover: "./images/cover.png"
zipFile: "./source.zip"
---

Add template notes here.
`;

const moveFile = async (from, to) => {
	try {
		await rename(from, to);
	} catch (error) {
		if (error && typeof error === 'object' && 'code' in error && error.code === 'EXDEV') {
			await copyFile(from, to);
			await unlink(from);
			return;
		}
		throw error;
	}
};

const pathExists = async (target) => {
	try {
		await stat(target);
		return true;
	} catch (error) {
		if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
			return false;
		}
		throw error;
	}
};

const uniqueSlug = async (baseSlug) => {
	let slug = baseSlug;
	let index = 2;
	while (await pathExists(path.join(templatesDir, slug))) {
		slug = `${baseSlug}-${index}`;
		index += 1;
	}
	return slug;
};

const processZip = async (zipName) => {
	const sourcePath = path.join(inboxDir, zipName);
	const stem = zipName.replace(/\.zip$/i, '');
	const baseSlug = slugify(stem);
	const slug = await uniqueSlug(baseSlug);
	const targetDir = path.join(templatesDir, slug);
	const imagesDir = path.join(targetDir, 'images');
	const zipTarget = path.join(targetDir, 'source.zip');
	const entryPath = path.join(targetDir, 'entry.mdx');
	const title = humanize(stem);

	await mkdir(imagesDir, { recursive: true });
	await moveFile(sourcePath, zipTarget);
	await writeFile(entryPath, buildEntry(title), 'utf8');

	return { slug, title, source: zipName, entryPath, zipTarget };
};

const processInbox = async () => {
	await mkdir(inboxDir, { recursive: true });
	await mkdir(templatesDir, { recursive: true });

	const dirEntries = await readdir(inboxDir, { withFileTypes: true });
	const zipFiles = dirEntries
		.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.zip'))
		.map((entry) => entry.name)
		.sort((a, b) => a.localeCompare(b));

	if (zipFiles.length === 0) {
		console.log('Ingest summary: no .zip files found in vault/inbox.');
		return;
	}

	const created = [];
	const failed = [];

	for (const zipName of zipFiles) {
		try {
			const item = await processZip(zipName);
			created.push(item);
		} catch (error) {
			failed.push({
				file: zipName,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	console.log(`Ingest summary: ${created.length} created, ${failed.length} failed.`);
	for (const item of created) {
		console.log(`- ${item.source} -> src/content/templates/${item.slug}/`);
	}
	for (const item of failed) {
		console.log(`- FAILED ${item.file}: ${item.error}`);
	}

	if (failed.length > 0) {
		process.exitCode = 1;
	}
};

if (watchMode) {
	let running = false;
	let queued = false;

	const run = async () => {
		if (running) {
			queued = true;
			return;
		}
		running = true;
		try {
			await processInbox();
		} finally {
			running = false;
			if (queued) {
				queued = false;
				void run();
			}
		}
	};

	await processInbox();
	console.log('Watching vault/inbox for new .zip files...');
	await mkdir(inboxDir, { recursive: true });
	fs.watch(inboxDir, () => {
		void run();
	});
} else {
	await processInbox();
}
