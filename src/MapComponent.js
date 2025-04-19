import React, { useEffect, useRef } from 'react';

function MapComponent({ listeners }) {
  const mapContainer = useRef(null);

  useEffect(() => {
    const map = new window.google.maps.Map(mapContainer.current, {
      center: {lat: -34.397, lng: 150.644},
      zoom: 8,
    });
  }, []);

  return (
    <div ref={mapContainer} style={{ width: '100%', height: '400px' }} />
  );
}

export default MapComponent;
