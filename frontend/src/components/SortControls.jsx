const SORT_OPTIONS = [
  { value: "", label: "Sort: Default" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "dateListed-desc", label: "Date Listed: Newest First" },
  { value: "dateListed-asc", label: "Date Listed: Oldest First" },
  { value: "sqft-desc", label: "Square Footage: High to Low" },
  { value: "sqft-asc", label: "Square Footage: Low to High" },
  { value: "beds-desc", label: "Beds: High to Low" },
  { value: "beds-asc", label: "Beds: Low to High" },
];

export default function SortControls({ value, onChange }) {
  const currentValue =
    value?.sortBy && value?.sortOrder ? `${value.sortBy}-${value.sortOrder}` : "";

  function handleChange(e) {
    const selected = e.target.value;
    if (!selected) {
      onChange({});
      return;
    }
    const [sortBy, sortOrder] = selected.split("-");
    onChange({ sortBy, sortOrder });
  }

  return (
    <select
      className="sort-controls"
      aria-label="Sort properties"
      value={currentValue}
      onChange={handleChange}
    >
      {SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
