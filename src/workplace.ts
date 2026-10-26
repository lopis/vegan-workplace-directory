// Shared by the Astro site (src/content.config.ts) and the PR validation script (scripts/validate.ts),
// so the rules contributors are checked against are the same ones the site is built with.
import { z } from 'astro/zod';

export const LABELS = {
  vegan: {
    rank: 1,
    name: 'Vegan company',
    food: 'All food the company provides is vegan, by policy.',
    culture: "Veganism is part of the company's values.",
  },
  'vegan-friendly': {
    rank: 2,
    name: 'Vegan friendly',
    food: 'A proper vegan option is always available, without having to ask.',
    culture: 'Vegan needs are considered by default; no awkwardness at events.',
  },
  vegetarian: {
    rank: 3,
    name: 'Vegetarian only',
    food: 'Vegetarian options exist, but vegan options are rare, ad hoc or on request.',
    culture: 'Vegans are tolerated but have to speak up or bring their own food.',
  },
  'not-vegan': {
    rank: 4,
    name: 'Not vegan friendly',
    food: 'Little or no plant-based food is provided.',
    culture: 'Vegan needs are ignored, met poorly or with pushback.',
  },
} as const;

export type Label = keyof typeof LABELS;
const LABEL_VALUES = Object.keys(LABELS) as [Label, ...Label[]];

export const SIZES = ['1-99', '100-199', '200-499', '500-749', '750-999', '1000+'] as const;

const regionNames = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' });
// Region codes that Intl knows but that aren't countries.
const NOT_COUNTRIES = new Set(['EU', 'EZ', 'UN', 'QO', 'ZZ']);

export function countryName(code: string): string | undefined {
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper) || NOT_COUNTRIES.has(upper)) return undefined;
  const name = regionNames.of(upper);
  return name === 'Unknown Region' ? undefined : name;
}

export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const SLUG = '[a-z0-9]+(?:-[a-z0-9]+)*';
/** `<company>.<country>[-<city>[-<location>]].md` */
export const FILE_NAME = new RegExp(`^(${SLUG})\\.([a-z]{2})(?:-(${SLUG}))?\\.md$`);

/** Page URL slug: file name without `.md`, dots replaced by hyphens. */
export function entryId(fileName: string): string {
  return fileName.replace(/\.md$/, '').replaceAll('.', '-');
}

/** A domain with an optional path, without protocol, e.g. `ecosia.org` or `example.com/jobs`. */
function isWebAddress(address: string): boolean {
  if (/\s/.test(address)) return false;
  try {
    const { hostname } = new URL(`https://${address}`);
    return /^([a-z0-9-]+\.)+[a-z0-9-]{2,}$/.test(hostname);
  } catch {
    return false;
  }
}

const isMissing = (input: unknown) => input === undefined || input === null;

/** Message for a field that is missing or not text; other issues keep their own message. */
const typeError = (field: string) => (iss: { code?: string; input?: unknown }) =>
  iss.code !== 'invalid_type' ? undefined : isMissing(iss.input) ? `"${field}" is required` : `"${field}" must be text`;

const text = (field: string) =>
  z
    .string({ error: typeError(field) })
    .trim()
    .min(1, `"${field}" must not be empty`);

const oneLine = (field: string) =>
  text(field).refine((s) => !s.includes('\n'), `"${field}" must be a single line`);

const DATE_MESSAGE = '"lastUpdated" must be a date written as YYYY-MM-DD, e.g. 2026-10-20';

export const workplaceSchema = z.strictObject(
  {
    name: oneLine('name'),
    industry: oneLine('industry'),
    city: oneLine('city'),
    country: z
      .string({ error: typeError('country') })
      .refine((code) => /^[A-Z]{2}$/.test(code) && countryName(code) !== undefined, {
        error: (iss) => `"country" must be a two-letter uppercase country code like DE or US, got "${iss.input}"`,
      }),
    size: z.enum(SIZES, {
      error: (iss) =>
        isMissing(iss.input)
          ? '"size" is required'
          : `"size" must be one of ${SIZES.join(', ')}, got "${iss.input}"`,
    }),
    label: z.enum(LABEL_VALUES, {
      error: (iss) =>
        isMissing(iss.input)
          ? '"label" is required'
          : `"label" must be one of ${LABEL_VALUES.join(', ')}, got "${iss.input}"`,
    }),
    description: oneLine('description'),
    veganStatus: oneLine('veganStatus'),
    website: z
      .string({ error: typeError('website') })
      .trim()
      .refine((s) => !/^[a-z]+:\/\//i.test(s), {
        error: (iss) =>
          `"website" must not start with http:// or https:// (the site adds https:// itself), ` +
          `write e.g. ${String(iss.input).replace(/^[a-z]+:\/\//i, '')}`,
        abort: true,
      })
      .refine(isWebAddress, {
        error: (iss) => `"website" must be a web address like ecosia.org or example.com/jobs, got "${iss.input}"`,
      }),
    lastUpdated: z.preprocess(
      // YAML parsers differ: some turn 2026-10-20 into a Date, others keep it a string.
      (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
      z
        .string({ error: (iss) => (isMissing(iss.input) ? '"lastUpdated" is required' : DATE_MESSAGE) })
        .regex(/^\d{4}-\d{2}-\d{2}$/, DATE_MESSAGE)
        .transform((s) => new Date(`${s}T00:00:00Z`))
        .refine((d) => !Number.isNaN(d.getTime()), DATE_MESSAGE),
    ),
  },
  {
    error: (iss) =>
      iss.code === 'unrecognized_keys'
        ? `unknown field ${iss.keys.map((k) => `"${k}"`).join(', ')} (check the spelling against _template.md)`
        : undefined,
  },
);

export type Workplace = z.infer<typeof workplaceSchema>;
