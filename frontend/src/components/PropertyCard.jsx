import { Link } from "react-router-dom";
import { parsePhotos } from "../utils/photos";
import PropertyImageCarousel from "./PropertyImageCarousel";

export default function PropertyCard({ property }) {
  const photos = parsePhotos(property.L_Photos);

  return (
    <Link to={`/property/${property.L_ListingID}`} className="property-card">
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
