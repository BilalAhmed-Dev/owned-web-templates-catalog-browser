import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

const templates = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/templates' }),
	schema: z.object({
		title: z.string(),
		framework: z.enum(['nextjs', 'html', 'wordpress', 'other']),
		tech: z.array(z.string()),
		tags: z.array(z.string()),
		cover: z.string(),
		zipFile: z.string().default('./source.zip'),
		addedAt: z.date().optional(),
	}),
});

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	templates,
};
