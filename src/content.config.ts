import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { entryId, workplaceSchema } from './workplace.ts';

const workplaces = defineCollection({
  loader: glob({
    pattern: ['*.md', '!_*.md'],
    base: './src/content/workplaces',
    generateId: ({ entry }) => entryId(entry),
  }),
  schema: workplaceSchema,
});

export const collections = { workplaces };
