async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

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

  return handleResponse(res); // { total, limit, offset, results }
}

export async function fetchPropertyById(id) {
  const res = await fetch(`/api/properties/${id}`);
  return handleResponse(res); // single property object
}

export async function fetchOpenHouses(id) {
  const res = await fetch(`/api/properties/${id}/openhouses`);
  return handleResponse(res); // array of open house rows
}
