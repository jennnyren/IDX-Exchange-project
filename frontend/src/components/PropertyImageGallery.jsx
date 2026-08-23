import { useState } from "react";

export default function PropertyImageGallery({ photos, alt }) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (photos.length === 0) {
    return <div className="gallery-noimage">No photos available</div>;
  }

  return (
    <div className="gallery">
      <img
        className="gallery-main-image"
        src={photos[index]}
        alt={alt}
        onClick={() => setLightboxOpen(true)}
      />
      {photos.length > 1 && (
        <div className="gallery-thumbnails">
          {photos.map((photo, i) => (
            <img
              key={photo}
              src={photo}
              alt={`${alt} thumbnail ${i + 1}`}
              className={
                i === index
                  ? "gallery-thumbnail gallery-thumbnail-active"
                  : "gallery-thumbnail"
              }
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
      {lightboxOpen && (
        <div
          className="lightbox-backdrop"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="lightbox-close"
            aria-label="Close"
            onClick={() => setLightboxOpen(false)}
          >
            &times;
          </button>
          <img
            className="lightbox-image"
            src={photos[index]}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
