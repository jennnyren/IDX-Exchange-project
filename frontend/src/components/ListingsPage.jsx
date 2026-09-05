import { useEffect, useState, useCallback } from "react";
import { fetchProperties } from "../api/properties";
import PropertyCard from "./PropertyCard";
import PropertyFilters from "./PropertyFilters";
import SortControls from "./SortControls";
import Pagination from "./Pagination";

const ITEMS_PER_PAGE = 20;

export default function ListingsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const runSearch = useCallback((activeFilters, activeSort, page) => {
    setLoading(true);
    setError(null);
    const offset = (page - 1) * ITEMS_PER_PAGE;
    fetchProperties({
      limit: ITEMS_PER_PAGE,
      offset,
      ...activeFilters,
      ...activeSort,
    })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    runSearch(filters, sort, currentPage);
  }, [runSearch, filters, sort, currentPage]);

  function handleSearch(newFilters) {
    setFilters(newFilters);
    setSort({});
    setCurrentPage(1);
  }

  function handleClear() {
    setFilters({});
    setSort({});
    setCurrentPage(1);
  }

  function handleSortChange(newSort) {
    setSort(newSort);
    setCurrentPage(1);
  }

  function handlePageChange(page) {
    setCurrentPage(page);
    window.scrollTo({ top: 0 });
  }

  const totalPages = data ? Math.ceil(data.total / ITEMS_PER_PAGE) : 0;
  const startItem = data ? data.offset + 1 : 0;
  const endItem = data ? data.offset + data.results.length : 0;

  return (
    <div>
      <PropertyFilters onSearch={handleSearch} onClear={handleClear} />
      <SortControls value={sort} onChange={handleSortChange} />

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
              Showing {startItem}-{endItem} of {data.total} properties
            </p>
            <div className="grid">
              {data.results.map((property) => (
                <PropertyCard key={property.L_ListingID} property={property} />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        ))}
    </div>
  );
}
