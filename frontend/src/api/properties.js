export async function fetchProperties({
  limit = 20,
  offset = 0,
  city,
  zipcode,
  minPrice,
  maxPrice,
  beds,
  baths,
} = {}) {
  const params = new URLSearchParams({ limit, offset });

  const optional = { city, zipcode, minPrice, maxPrice, beds, baths };
  for (const [key, value] of Object.entries(optional)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  }

  const res = await fetch(`/api/properties?${params}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }

  return res.json(); // { total, limit, offset, results }
}
