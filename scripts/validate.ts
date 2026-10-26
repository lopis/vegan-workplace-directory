// Checks every workplace file and prints plain-English errors. Run with `pnpm validate`.
// Exits with code 1 if anything is wrong, which fails the PR check.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
import { entryId, FILE_NAME, slugify, workplaceSchema } from '../src/workplace.ts';

const DIR = join(import.meta.dirname, '..', 'src', 'content', 'workplaces');
const errors: { file: string; message: string }[] = [];
const report = (file: string, message: string) => errors.push({ file, message });

interface Parsed {
  file: string;
  company: string;
  country: string;
  /** City and location part of the file name, e.g. `new-york-east`. */
  suffix?: string;
  citySlug?: string;
}

function readFrontmatter(file: string): unknown {
  const source = readFileSync(join(DIR, file), 'utf8');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?(?:\n|$)/);
  if (!match) {
    report(file, 'the file must start with a frontmatter block between two "---" lines (see _template.md)');
    return undefined;
  }
  try {
    return parse(match[1]) ?? {};
  } catch (error) {
    report(file, `the frontmatter is not valid YAML: ${(error as Error).message.split('\n')[0]}`);
    return undefined;
  }
}

const files = readdirSync(DIR, { withFileTypes: true })
  .filter((entry) => entry.isFile() && !entry.name.startsWith('_'))
  .map((entry) => entry.name)
  .sort();

const parsed: Parsed[] = [];

for (const file of files) {
  const nameMatch = file.match(FILE_NAME);
  if (!nameMatch) {
    report(
      file,
      'the file name must look like <company>.<country>.md or <company>.<country>-<city>.md, ' +
        'using only lowercase letters, digits and hyphens (e.g. ecosia.de.md or acme.us-new-york.md)',
    );
  }

  const frontmatter = readFrontmatter(file);
  if (frontmatter === undefined) continue;

  const result = workplaceSchema.safeParse(frontmatter);
  if (!result.success) {
    for (const issue of result.error.issues) report(file, issue.message);
  }
  if (!nameMatch) continue;

  const [, company, country, suffix] = nameMatch;
  const data = frontmatter as Record<string, unknown>;
  const entry: Parsed = { file, company, country, suffix };

  if (typeof data.country === 'string' && data.country.toLowerCase() !== country) {
    report(file, `the file name says country "${country}" but "country" in the file is "${data.country}"`);
  }

  if (typeof data.city === 'string') {
    entry.citySlug = slugify(data.city);
    if (suffix && suffix !== entry.citySlug && !suffix.startsWith(`${entry.citySlug}-`)) {
      report(
        file,
        `the file name says city "${suffix}" but "city" in the file is "${data.city}", ` +
          `so the file name should contain "-${entry.citySlug}" after the country`,
      );
    }
  }

  parsed.push(entry);
}

function groupBy(entries: Parsed[], key: (e: Parsed) => string | undefined): Parsed[][] {
  const groups = new Map<string, Parsed[]>();
  for (const e of entries) {
    const k = key(e);
    if (k === undefined) continue;
    groups.set(k, [...(groups.get(k) ?? []), e]);
  }
  return [...groups.values()].filter((group) => group.length > 1);
}

// A company with several workplaces in one country needs the city in every file name.
for (const group of groupBy(parsed, (e) => `${e.company}.${e.country}`)) {
  for (const e of group.filter((e) => !e.suffix)) {
    const others = group.filter((o) => o !== e).map((o) => o.file).join(', ');
    report(
      e.file,
      `"${e.company}" has more than one workplace in this country (${others}), ` +
        `so the file name must include the city, e.g. ${e.company}.${e.country}-${e.citySlug ?? '<city>'}.md`,
    );
  }
}

// A company with several workplaces in one city needs a location in every file name.
for (const group of groupBy(parsed, (e) => e.citySlug && `${e.company}.${e.country}-${e.citySlug}`)) {
  for (const e of group.filter((e) => !e.suffix || e.suffix === e.citySlug)) {
    const others = group.filter((o) => o !== e).map((o) => o.file).join(', ');
    report(
      e.file,
      `"${e.company}" has more than one workplace in this city (${others}), ` +
        `so the file name must include a location, e.g. ${e.company}.${e.country}-${e.citySlug}-downtown.md`,
    );
  }
}

// Different file names can produce the same page URL, e.g. foo-de.at.md and foo.de-at.md.
for (const group of groupBy(parsed, (e) => entryId(e.file))) {
  for (const e of group) {
    const others = group.filter((o) => o !== e).map((o) => o.file).join(', ');
    report(e.file, `this file would get the same page URL as ${others}; rename one of them`);
  }
}

const inGitHubActions = process.env.GITHUB_ACTIONS === 'true';
const repoRoot = join(import.meta.dirname, '..');

if (errors.length === 0) {
  console.log(`✓ ${files.length} workplace files are valid.`);
} else {
  for (const { file, message } of errors) {
    console.log(`✗ ${file}: ${message}`);
    // Shows the error inline on the file in the PR's "Files changed" tab.
    if (inGitHubActions) console.log(`::error file=${relative(repoRoot, join(DIR, file))}::${message}`);
  }
  console.log(`\n${errors.length} problem(s) found. See CONTRIBUTING.md for the expected format.`);
  process.exitCode = 1;
}
