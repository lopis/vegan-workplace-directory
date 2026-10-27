# Vegan Workplace Directory

This is a user-contributed list of how easy it is to be vegan in workplaces around the world.

To add or update a workplace, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Development

Requires Node 24 or later.

```sh
pnpm install
pnpm dev           # local dev server
pnpm validate      # check all workplace files
pnpm build         # build the static site into dist/
```

The workplaces in `src/content/workplaces/` are fictional sample data.

## Prototype spec

### Stack

- Astro static site (fully pre-rendered, no backend).
- Workplaces are an Astro [content collection](https://docs.astro.build/en/guides/content-collections/) with a schema. Invalid frontmatter fails the build, so a bad PR is caught by CI.
- Hosted on GitHub Pages and deployed by a GitHub Action on every push to `main`.
- Minimal CSS: only what is needed for a readable table and page. No design work.
- JavaScript only where needed: a small inline script to sort and filter the start-page table.

### What is a workplace

A workplace is one company in one location (city). Each workplace is one markdown file in `src/content/workplaces/`.

### File naming

`<company>.<country>[-<city>[-<location>]].md`, all lowercase, words separated by hyphens.

- `company` (required): short slug of the company name, e.g. `ecosia`
- `country` (required): ISO 3166-1 alpha-2 code, e.g. `de`
- `city` (optional): slug of the city name, e.g. `berlin`. Only needed when the company has more than one workplace in that country.
- `location` (optional): short name for the office, e.g. `downtown`. Only needed when the company has more than one workplace in that city.

The city is always in the frontmatter, even when the file name leaves it out. When a company gets a second workplace in a country that so far had only one, the existing file is renamed to include its city (e.g. `ecosia.de.md` becomes `ecosia.de-berlin.md` when a Munich office is added).

```text
src/content/workplaces/
  ecosia.de.md
  acme.us-new-york-downtown.md
  acme.us-new-york-east.md
  acme.us-austin.md
```

The URL is the file name without `.md`, with dots replaced by hyphens: `ecosia.de.md` → `/workplaces/ecosia-de/`.

### Workplace file format

```markdown
---
name: Ecosia GmbH              # required, full legal/common name
industry: Search engine        # required, free text. probably should become list of options
city: Berlin                   # required
country: DE                    # required, ISO 3166-1 alpha-2
size: 200-499                  # required, one of: 1-99, 100-199, 200-499, 500-749, 750-999, 1000+
label: vegan-friendly          # required, one of: vegan, vegan-friendly, vegetarian, not-vegan
description: Search engine that uses its profits to plant trees.  # required, one line
veganStatus: Vegan lunch option every day; team events default to vegetarian.  # required, one line
website: ecosia.org               # required, without https://
lastUpdated: 2026-10-20           # required, date the info was last checked
---

Optional free-form markdown with more detail: what the canteen serves,
how events are catered, how colleagues react, etc.
```

#### Size

Headcount **at this location**, written as the range it falls into: `1-99`, `100-199`, `200-499`, `500-749`, `750-999` or `1000+`.

The site maps each range to a number internally so sizes can be sorted; contributors only ever write the range.

#### Vegan label rubric

The label covers both **food** (canteen, catering, office snacks, events) and **workplace culture** (how veganism is treated socially and in company policy). Pick the label whose description fits best overall.

| `label` value    | Displayed as       | Food                                                                        | Culture                                                            |
| ---------------- | ------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `vegan`          | Vegan company      | All food the company provides is vegan, by policy.                          | Veganism is part of the company's values.                          |
| `vegan-friendly` | Vegan friendly     | A proper vegan option is always available, without having to ask.           | Vegan needs are considered by default; no awkwardness at events.   |
| `vegetarian`     | Vegetarian only    | Vegetarian options exist, but vegan options are rare, ad hoc or on request. | Vegans are tolerated but have to speak up or bring their own food. |
| `not-vegan`      | Not vegan friendly | Little or no plant-based food is provided.                                  | Vegan needs are ignored or met with pushback.                      |

If food and culture point to different labels, use the less vegan-friendly one and explain why in `veganStatus`.

Contributors only ever write the English value. The site maps each value to a rank internally (`vegan` = 1 … `not-vegan` = 4) for sorting; the rank never appears in markdown files.

### Pages

**Start page (`/`)**

- A table of all workplaces with columns: company name (linked to the detail page), industry, location (`City, Country`), and vegan label (its display name, e.g. "Vegan friendly").
- The table is sortable by clicking the label column header (most to least vegan-friendly, or the reverse). Ties are sorted by company name. The default order is most vegan-friendly first.
- A country dropdown above the table filters rows. Its options are generated from the countries in the data.
- The table is pre-rendered as plain HTML, so it still lists every workplace with JS disabled; only sorting and filtering need JS.

**Workplace page (`/workplaces/<slug>/`, see [File naming](#file-naming))**

- Shows every field: name, industry, location, size range, label with its rubric description, both one-liners, website link, last updated date, and the free-form markdown body.
- Has a link back to the start page.

### Contributing

Contributions come in as GitHub pull requests:

- `CONTRIBUTING.md` explains the naming rule and the label rubric, and links to an example file.
- A link on each company page to "edit this page" links to the company's markdown file on github.
- `src/content/workplaces/_template.md` (ignored by the build) is a copy-paste starting point.
- Contributors who don't want to edit files can instead open an issue using the "Add a workplace" [issue form](.github/ISSUE_TEMPLATE/add-workplace.yml), which asks for every field. A maintainer converts it into a workplace file and opens the PR. The form can't run the schema, so validation happens on that PR. `lastUpdated` isn't asked for; the maintainer uses the issue's date.
- A GitHub Action validates every PR and fails if any workplace file is malformed (see [PR validation](#pr-validation)).
- Each workplace has one rating. Anyone can open a PR to add or change any workplace; disagreements about a rating are discussed in the PR or in an issue.
- Contributors are not credited on the site or in the markdown files. GitHub's commit history and contributor list already record who contributed.

### PR validation

A GitHub Action (`.github/workflows/validate.yml`) runs on every pull request and fails if anything is wrong. It runs two steps:

1. **`pnpm validate`** ([scripts/validate.ts](scripts/validate.ts)): checks every file against the same schema the site uses ([src/workplace.ts](src/workplace.ts)) and reports all problems at once. It also checks things the schema can't see:
   - Every file in `src/content/workplaces/` (except `_template.md`) matches `<company>.<country>[-<city>[-<location>]].md`: lowercase letters, digits and hyphens only.
   - The country code in the file name matches `country` in the frontmatter.
   - If the file name includes a city, it starts with the slug of the frontmatter `city` (so `acme.us-new-york-east.md` must have `city: New York`).
   - If a company has more than one file in the same country, every one of them includes the city.
   - If a company has more than one file in the same city, every one of them includes a location.
2. **`astro build`**: as a safety net, the content collection schema rejects missing required fields, unknown `label` or `size` values, invalid country codes, a `website` that includes `http://`/`https://` or isn't a valid address, a malformed `lastUpdated` date, and one-liners that contain line breaks.

Errors are printed per file with a plain-English message (e.g. `acme.us-new-york.md: "size" must be one of 1-99, 100-199, …, got "300"`), so contributors can fix the file without reading the code.

To actually block merging, `main` needs branch protection with the validation check marked as required. That's a repository setting, not something the workflow can enforce by itself.

### Out of scope for the prototype

- Search, pagination, maps.
- Contributor accounts, voting, or multiple ratings per workplace.
- Handling stale entries (e.g. flagging workplaces whose `lastUpdated` is old).
- Visual design.
