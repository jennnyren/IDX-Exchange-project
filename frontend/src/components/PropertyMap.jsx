const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function PropertyMap({ latitude, longitude }) {
  if (!latitude || !longitude) {
    return (
      <p className="map-unavailable">Map unavailable for this property.</p>
    );
  }

  if (!API_KEY) {
    return <p className="map-unavailable">Map unavailable (missing API key).</p>;
  }

  const src = `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${latitude},${longitude}`;

  return (
    <iframe
      className="property-map"
      title="Property location"
      src={src}
      loading="lazy"
      allowFullScreen
    />
  );
}
