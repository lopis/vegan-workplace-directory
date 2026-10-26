# Adding or updating a workplace

Every workplace is one small text file in [`src/content/workplaces/`](src/content/workplaces/). You can add or edit one straight from the GitHub website. You don't need to install anything.

## Edit an existing workplace

Open the workplace's page on the site and click **Edit this page on GitHub** at the bottom. Change what you need, then click **Commit changes…** and choose **Propose changes**. GitHub opens a pull request for you.

## Add a new workplace

1. Open [`_template.md`](https://raw.githubusercontent.com/lopis/vegan-workplace-directory/refs/heads/main/src/content/workplaces/_template.md) and copy its contents.
2. In [`src/content/workplaces/`](src/content/workplaces/), click **Add file → Create new file**.
3. Name the file (see [File name](#file-name) below), paste the template and fill it in.
4. Click **Commit changes…** and choose **Propose changes** to open a pull request.

A check runs on every pull request. If something is wrong, the check fails and tells you which file and field to fix. Edit the file in the same pull request and the check runs again.

## File name

`<company>.<country>.md`, all lowercase, with hyphens instead of spaces.

- `company`: short name of the company, e.g. `ecosia` or `byte-bakery`
- `country`: two-letter country code, e.g. `de` for Germany or `us` for the United States

Examples: `ecosia.de.md`, `byte-bakery.pt.md`.

If the company has **more than one workplace in the same country**, add the city after the country: `acme.us-new-york.md`, `acme.us-austin.md`. If there's already a file without a city for that company and country, rename it to include its city too.

If the company has **more than one workplace in the same city**, add a short location name after the city: `acme.us-new-york-downtown.md`, `acme.us-new-york-east.md`.

## Fields

All fields are required.

| Field         | What to write                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| `name`        | The company's full name, e.g. `Ecosia GmbH`                                                           |
| `industry`    | What field the company works in, e.g. `Software`                                                      |
| `city`        | City of this workplace, e.g. `Berlin`                                                                 |
| `country`     | Two-letter country code in capitals, e.g. `DE`                                                        |
| `size`        | Number of people at **this workplace**: `1-99`, `100-199`, `200-499`, `500-749`, `750-999` or `1000+` |
| `label`       | `vegan`, `vegan-friendly`, `vegetarian` or `not-vegan` (see below)                                    |
| `description` | One line about what the company does                                                                  |
| `veganStatus` | One line about what being vegan is like there                                                         |
| `website`     | Company website without `https://`, e.g. `ecosia.org`                                                 |
| `lastUpdated` | Today's date, written as `YYYY-MM-DD`, e.g. `2026-10-26`                                              |

Below the second `---` line you can write as much as you like about the workplace: the canteen, team events, how colleagues react. This part is optional.

## Choosing a label

The label covers both **food** (canteen, catering, office snacks, events) and **workplace culture** (how veganism is treated socially and in company policy). Pick the one that fits best overall.

| `label`          | Food                                                                        | Culture                                                            |
| ---------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `vegan`          | All food the company provides is vegan, by policy.                          | Veganism is part of the company's values.                          |
| `vegan-friendly` | A proper vegan option is always available, without having to ask.           | Vegan needs are considered by default; no awkwardness at events.   |
| `vegetarian`     | Vegetarian options exist, but vegan options are rare, ad hoc or on request. | Vegans are tolerated but have to speak up or bring their own food. |
| `not-vegan`      | Little or no plant-based food is provided.                                  | Vegan needs are ignored or met with pushback.                      |

If food and culture point to different labels, use the less vegan-friendly one and explain why in `veganStatus`.

## Disagreements

Each workplace has one rating. If you disagree with an existing one, open a pull request with your change and explain why, or open an issue to discuss it first.

Your name isn't shown on the site or in the file. Note that GitHub does record who made each change.
