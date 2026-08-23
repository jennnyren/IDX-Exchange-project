export function parsePhotos(photosJson) {
  try {
    const photos = JSON.parse(photosJson);
    return Array.isArray(photos) ? photos : [];
  } catch {
    return [];
  }
}
