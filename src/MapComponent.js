import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

function MapComponent({ listeners }) {
  const mapContainerStyle = {
    width: '100%',
    height: '400px'
  };

  // Default center (will be adjusted based on markers)
  const [center, setCenter] = useState({
    lat: 38.8683,
    lng: -107.5920
  });

  const [zoom, setZoom] = useState(3);
  const [error, setError] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const mapRef = useRef(null);
  const listenersRef = useRef(null);

  // Store listeners in a ref to access in callbacks
  useEffect(() => {
    listenersRef.current = listeners;
    // Process listeners when they change
    processListeners();
  }, [listeners]);

  // Load the Google Maps JavaScript API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: window.googleMapsApiKey || '',
    // You can add additional libraries if needed
    // libraries: ['places']
  });

  // Process listeners data and create marker objects
  const processListeners = useCallback(() => {
    if (!listenersRef.current) {
      console.log('No listeners data available');
      setMarkers([]);
      return;
    }

    // Check if listeners is an array
    const listenersArray = Array.isArray(listenersRef.current) ? listenersRef.current : [];
    console.log('Processing listeners array:', listenersArray);

    if (!listenersArray.length) {
      console.log('No listeners in the array');
      setMarkers([]);
      return;
    }

    // Create marker objects
    const newMarkers = listenersArray
      .filter(listener => listener && listener.latitude !== undefined && listener.longitude !== undefined)
      .map((listener, index) => {
        const ip = listener.ip || listener.IP || 'Unknown';
        const city = listener.city || 'Unknown';
        const country = listener.country || 'Unknown';

        return {
          id: index,
          position: {
            lat: parseFloat(listener.latitude),
            lng: parseFloat(listener.longitude)
          },
          info: {
            ip,
            city,
            country
          }
        };
      });

    console.log(`Created ${newMarkers.length} marker objects`);
    setMarkers(newMarkers);

    // If we have markers, fit the map to show all of them
    if (newMarkers.length > 0 && mapRef.current) {
      fitBoundsToMarkers(newMarkers);
    }
  }, []);

  // Fit map bounds to show all markers
  const fitBoundsToMarkers = useCallback((markersToFit) => {
    if (!mapRef.current || !markersToFit.length) return;

    const bounds = new window.google.maps.LatLngBounds();
    markersToFit.forEach(marker => {
      bounds.extend(marker.position);
    });

    mapRef.current.fitBounds(bounds);
    console.log('Map fitted to bounds');
  }, []);

  // Handle map load
  const onMapLoad = useCallback((map) => {
    console.log('Map loaded successfully');
    mapRef.current = map;

    // If we already have markers, fit bounds
    if (markers.length > 0) {
      fitBoundsToMarkers(markers);
    }
  }, [markers, fitBoundsToMarkers]);

  // Handle marker click
  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
  };

  // Handle info window close
  const handleInfoWindowClose = () => {
    setSelectedMarker(null);
  };

  // If there's a load error, display it
  if (loadError) {
    return (
      <div style={{
        width: '100%',
        height: '400px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        border: '1px solid #f5c6cb',
        borderRadius: '5px'
      }}>
        <div>
          <h3>Map Error</h3>
          <p>Error loading Google Maps: {loadError.message}</p>
          <p>Please check your Google Maps API key and internet connection.</p>
        </div>
      </div>
    );
  }

  // If there's an error, display it
  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '400px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        border: '1px solid #f5c6cb',
        borderRadius: '5px'
      }}>
        <div>
          <h3>Map Error</h3>
          <p>{error}</p>
          <p>Please check the console for more details.</p>
        </div>
      </div>
    );
  }

  // If the API is not yet loaded, show a loading message
  if (!isLoaded) {
    return (
      <div style={{
        width: '100%',
        height: '400px',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p>Loading map...</p>
      </div>
    );
  }

  return (
    <div id="map-container">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        onLoad={onMapLoad}
        options={{
          fullscreenControl: true,
          streetViewControl: true,
          mapTypeControl: true,
          zoomControl: true
        }}
      >
        {markers.map(marker => (
          <Marker
            key={marker.id}
            position={marker.position}
            onClick={() => handleMarkerClick(marker)}
          />
        ))}

        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={handleInfoWindowClose}
          >
            <div>
              <h3>Listener</h3>
              <p>IP: {selectedMarker.info.ip}</p>
              <p>Location: {selectedMarker.info.city}, {selectedMarker.info.country}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

export default MapComponent;
