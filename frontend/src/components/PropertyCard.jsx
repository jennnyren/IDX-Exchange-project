function parsePhotos(photosJson) {
  try {
    const photos = JSON.parse(photosJson);
    return Array.isArray(photos) ? photos : [];
  } catch {
    return [];
  }
}

export default function PropertyCard({ property }) {
  const photos = parsePhotos(property.L_Photos);
  const firstPhoto = photos[0];

  return (
    <div className="property-card">
      {firstPhoto ? (
        <img src={firstPhoto} alt={property.L_Address} />
      ) : (
        <div className="property-card-noimage">No photo</div>
      )}
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
    </div>
  );
}
