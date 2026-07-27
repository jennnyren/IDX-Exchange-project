export async function fetchProperties({ limit = 20, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit, offset });
  const res = await fetch(`/api/properties?${params}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }

  return res.json(); // { total, limit, offset, results }
}
