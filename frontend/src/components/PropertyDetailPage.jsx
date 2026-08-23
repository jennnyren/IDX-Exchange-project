import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchPropertyById, fetchOpenHouses } from "../api/properties";
import { parsePhotos } from "../utils/photos";
import PropertyImageGallery from "./PropertyImageGallery";
import PropertyMap from "./PropertyMap";

function parseOpenHouseRemarks(allDataJson) {
  try {
    return JSON.parse(allDataJson).OpenHouseRemarks || null;
  } catch {
    return null;
  }
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [openHouses, setOpenHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setProperty(null);
    Promise.all([fetchPropertyById(id), fetchOpenHouses(id)])
      .then(([propertyResult, openHousesResult]) => {
        setProperty(propertyResult);
        setOpenHouses(openHousesResult);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading property...</p>;
  if (error) return <p className="error">Couldn't load property: {error}</p>;
  if (!property) return null;

  const photos = parsePhotos(property.L_Photos);

  return (
    <div className="property-detail">
      <Link to="/" className="back-link">
        &larr; Back to listings
      </Link>

      <PropertyImageGallery photos={photos} alt={property.L_Address} />

      <p className="price">
        ${Number(property.L_SystemPrice).toLocaleString()}
      </p>
      <h2 className="address">{property.L_Address}</h2>
      <p className="citystate">
        {property.L_City}, {property.L_State} {property.L_Zip}
      </p>

      <p className="stats">
        {property.L_Keyword2} bd | {property.LM_Dec_3} ba |{" "}
        {Number(property.LM_Int2_3).toLocaleString()} sqft
        {property.YearBuilt ? ` | Built ${property.YearBuilt}` : ""}
      </p>

      {property.L_Remarks && (
        <section>
          <h3>Description</h3>
          <p>{property.L_Remarks}</p>
        </section>
      )}

      <section>
        <h3>Property Details</h3>
        <dl className="details-grid">
          {property.L_Type_ && (
            <>
              <dt>Type</dt>
              <dd>{property.L_Type_}</dd>
            </>
          )}
          {property.ArchitecturalStyle && (
            <>
              <dt>Style</dt>
              <dd>{property.ArchitecturalStyle}</dd>
            </>
          )}
          {property.LotSizeSquareFeet && (
            <>
              <dt>Lot Size</dt>
              <dd>{Number(property.LotSizeSquareFeet).toLocaleString()} sqft</dd>
            </>
          )}
          {property.Heating && (
            <>
              <dt>Heating</dt>
              <dd>{property.Heating}</dd>
            </>
          )}
          {property.Cooling && (
            <>
              <dt>Cooling</dt>
              <dd>{property.Cooling}</dd>
            </>
          )}
          {property.GarageYN != null && (
            <>
              <dt>Garage</dt>
              <dd>{property.GarageYN ? "Yes" : "No"}</dd>
            </>
          )}
        </dl>
      </section>

      <section>
        <h3>Open Houses</h3>
        {openHouses.length === 0 ? (
          <p>No open houses scheduled.</p>
        ) : (
          <ul className="open-houses">
            {openHouses.map((oh) => {
              const remarks = parseOpenHouseRemarks(oh.all_data);
              return (
                <li key={oh.id}>
                  <strong>{oh.OpenHouseDate}</strong> {oh.OH_StartTime}–
                  {oh.OH_EndTime}
                  {remarks && <p className="open-house-remarks">{remarks}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h3>Map</h3>
        <PropertyMap
          latitude={property.LMD_MP_Latitude}
          longitude={property.LMD_MP_Longitude}
        />
      </section>
    </div>
  );
}
