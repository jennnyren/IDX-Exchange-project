import { useState } from "react";

export default function PropertyImageCarousel({ photos, alt }) {
  const [index, setIndex] = useState(0);

  if (photos.length === 0) {
    return <div className="property-card-noimage">No photo</div>;
  }

  function handlePrev(e) {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i - 1 + photos.length) % photos.length);
  }

  function handleNext(e) {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + 1) % photos.length);
  }

  return (
    <div className="carousel">
      <img src={photos[index]} alt={alt} />
      {photos.length > 1 && (
        <>
          <button
            type="button"
            className="carousel-arrow carousel-arrow-prev"
            onClick={handlePrev}
            aria-label="Previous photo"
          >
            &#8249;
          </button>
          <button
            type="button"
            className="carousel-arrow carousel-arrow-next"
            onClick={handleNext}
            aria-label="Next photo"
          >
            &#8250;
          </button>
          <span className="carousel-counter">
            {index + 1} / {photos.length}
          </span>
        </>
      )}
    </div>
  );
}
