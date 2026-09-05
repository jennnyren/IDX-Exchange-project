/**
 * Parses the `L_Photos` column into an array of photo URLs.
 *
 * The column is a TEXT field holding a JSON array, but the feed is not
 * guaranteed to populate it: rows come through with NULL, an empty string, or
 * occasionally a JSON scalar instead of an array. Any of those would throw or
 * return a non-iterable from a bare JSON.parse, so both failure modes are
 * funnelled into an empty array — callers can always map over the result.
 */
export function parsePhotos(photosJson) {
  try {
    const photos = JSON.parse(photosJson);
    // Guards against valid JSON that isn't a list (e.g. `null`, `"url"`, `{}`).
    return Array.isArray(photos) ? photos : [];
  } catch {
    // Invalid JSON, empty string, or undefined — treat as "no photos".
    return [];
  }
}
