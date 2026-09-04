/**
 * Generates a URL-safe slug from an English string.
 * Rules:
 *   1. Lowercase the string
 *   2. Replace spaces and non-alphanumeric characters with hyphens
 *   3. Collapse consecutive hyphens into one
 *   4. Strip leading / trailing hyphens
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Resolves a unique slug by appending an incrementing numeric suffix
 * if the base slug already exists in the database.
 *
 * @param baseSlug   - The generated slug from the entity name
 * @param existsFn   - An async function that returns true if a slug is already taken
 */
export async function resolveUniqueSlug(
  baseSlug: string,
  existsFn: (slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = baseSlug;
  let counter = 2;

  while (await existsFn(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
