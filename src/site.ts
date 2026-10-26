export const REPO_URL = 'https://github.com/lopis/vegan-workplace-directory';

/** Prefixes a site path with the configured base path (needed on GitHub Pages). */
export function href(path: string): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
