import { useFavorites } from "../hooks/useFavorites";
import PropertyCard from "./PropertyCard";

export default function FavoritesPage() {
  const { favorites } = useFavorites();

  if (favorites.length === 0) {
    return (
      <p className="no-results">
        No favorites yet. Heart a property to save it here.
      </p>
    );
  }

  return (
    <div className="grid">
      {favorites.map((property) => (
        <PropertyCard key={property.L_ListingID} property={property} />
      ))}
    </div>
  );
}
