import { useEffect, useState, useCallback } from "react";
import { fetchProperties } from "../api/properties";
import PropertyCard from "./PropertyCard";
import PropertyFilters from "./PropertyFilters";

export default function ListingsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const runSearch = useCallback((filters = {}) => {
    setLoading(true);
    setError(null);
    fetchProperties({ limit: 20, offset: 0, ...filters })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  return (
    <div>
      <PropertyFilters onSearch={runSearch} onClear={() => runSearch()} />

      {loading && <p>Loading properties...</p>}
      {error && <p className="error">Couldn't load properties: {error}</p>}

      {!loading &&
        !error &&
        data &&
        (data.results.length === 0 ? (
          <p className="no-results">
            No properties match your filters. Try widening your search.
          </p>
        ) : (
          <>
            <p className="count">
              Showing {data.results.length} of {data.total} properties
            </p>
            <div className="grid">
              {data.results.map((property) => (
                <PropertyCard key={property.L_ListingID} property={property} />
              ))}
            </div>
          </>
        ))}
    </div>
  );
}
