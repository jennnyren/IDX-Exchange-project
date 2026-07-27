import { useEffect, useState } from "react";
import { fetchProperties } from "../api/properties";
import PropertyCard from "./PropertyCard";

export default function ListingsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchProperties({ limit: 20, offset: 0 })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading properties...</p>;
  if (error) return <p className="error">Couldn't load properties: {error}</p>;

  return (
    <div>
      <p className="count">
        Showing {data.results.length} of {data.total} properties
      </p>
      <div className="grid">
        {data.results.map((property) => (
          <PropertyCard key={property.L_ListingID} property={property} />
        ))}
      </div>
    </div>
  );
}
