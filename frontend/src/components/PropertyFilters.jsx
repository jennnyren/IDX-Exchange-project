import { useState } from "react";

const EMPTY_FILTERS = {
  city: "",
  zipcode: "",
  minPrice: "",
  maxPrice: "",
  beds: "",
  baths: "",
};

export default function PropertyFilters({ onSearch, onClear }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  function handleChange(e) {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSearch(filters);
  }

  function handleClear() {
    setFilters(EMPTY_FILTERS);
    onClear();
  }

  return (
    <form onSubmit={handleSubmit} className="property-filters">
      <input
        name="city"
        placeholder="City"
        value={filters.city}
        onChange={handleChange}
      />
      <input
        name="zipcode"
        placeholder="ZIP code"
        value={filters.zipcode}
        onChange={handleChange}
      />
      <input
        name="minPrice"
        type="number"
        placeholder="Min price"
        value={filters.minPrice}
        onChange={handleChange}
      />
      <input
        name="maxPrice"
        type="number"
        placeholder="Max price"
        value={filters.maxPrice}
        onChange={handleChange}
      />
      <select name="beds" value={filters.beds} onChange={handleChange}>
        <option value="">Beds (any)</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}+
          </option>
        ))}
      </select>
      <select name="baths" value={filters.baths} onChange={handleChange}>
        <option value="">Baths (any)</option>
        {[1, 2, 3, 4].map((n) => (
          <option key={n} value={n}>
            {n}+
          </option>
        ))}
      </select>
      <button type="submit">Search</button>
      <button type="button" onClick={handleClear}>
        Clear Filters
      </button>
    </form>
  );
}
