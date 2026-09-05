import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { parsePhotos } from "../utils/photos";
import { useFavorites } from "../hooks/useFavorites";
import PropertyImageCarousel from "./PropertyImageCarousel";

export default function PropertyCard({ property }) {
  const photos = parsePhotos(property.L_Photos);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(property.L_ListingID);

  function handleFavoriteClick(e) {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(property);
  }

  return (
    <Link to={`/property/${property.L_ListingID}`} className="property-card">
      <button
        type="button"
        className="favorite-button"
        aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={favorited}
        onClick={handleFavoriteClick}
      >
        {favorited ? "♥" : "♡"}
      </button>
      <PropertyImageCarousel photos={photos} alt={property.L_Address} />
      <div className="property-card-body">
        <p className="price">
          ${Number(property.L_SystemPrice).toLocaleString()}
        </p>
        <p className="address">{property.L_Address}</p>
        <p className="citystate">
          {property.L_City}, {property.L_State}
        </p>
        <p className="stats">
          {property.L_Keyword2} bd | {property.LM_Dec_3} ba |{" "}
          {Number(property.LM_Int2_3).toLocaleString()} sqft
        </p>
      </div>
    </Link>
  );
}

// Numeric RETS fields are typed as number-or-string because mysql2 returns
// DECIMAL columns (price, baths) as strings, while INT columns come back as
// numbers. Only the listing id is required — it keys the detail route and the
// favorites store; every other column is nullable in rets_property.
const numericField = PropTypes.oneOfType([PropTypes.number, PropTypes.string]);

PropertyCard.propTypes = {
  property: PropTypes.shape({
    L_ListingID: numericField.isRequired,
    L_Photos: PropTypes.string,
    L_SystemPrice: numericField,
    L_Address: PropTypes.string,
    L_City: PropTypes.string,
    L_State: PropTypes.string,
    L_Keyword2: numericField,
    LM_Dec_3: numericField,
    LM_Int2_3: numericField,
  }).isRequired,
};
