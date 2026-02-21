import { getCollection } from 'astro:content';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const slugFromId = (id: string) => {
	const parts = id.split('/');
	const fileStem = parts.at(-1) ?? '';
	const folder = parts.slice(0, -1).join('/');
	return fileStem === 'entry' && folder ? folder : id;
};

const resolveZipPath = (slug: string, zipFile: string) => {
	const entryDir = path.resolve(process.cwd(), 'src/content/templates', slug);
	const normalizedRef = zipFile.replace(/\\/g, '/').replace(/^\.\//, '');
	const zipPath = path.resolve(entryDir, normalizedRef);

	if (zipPath !== entryDir && !zipPath.startsWith(`${entryDir}${path.sep}`)) {
		return null;
	}

	return zipPath;
};

export async function GET({ params }: { params: { slug?: string } }) {
	const slug = params.slug;
	if (!slug) {
		return new Response('Missing slug.', { status: 400 });
	}

	const entries = await getCollection('templates');
	const entry = entries.find((candidate) => slugFromId(candidate.id) === slug);
	if (!entry) {
		return new Response('Template not found.', { status: 404 });
	}

	const zipPath = resolveZipPath(slug, entry.data.zipFile ?? './source.zip');
	if (!zipPath) {
		return new Response('Invalid zip path.', { status: 400 });
	}

	try {
		const buffer = await readFile(zipPath);
		return new Response(buffer, {
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': `attachment; filename="${slug}.zip"`,
				'Content-Length': String(buffer.byteLength),
			},
		});
	} catch {
		return new Response('Zip file not found.', { status: 404 });
	}
}
