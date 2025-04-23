import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

function MapComponent({ listeners }) {
  // Load the Google Maps JavaScript API with marker library
  // This must be called before any other hooks that depend on it
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: window.googleMapsApiKey || '',
    // Include the marker library for Advanced Markers
    libraries: ['marker']
  });

  // Get the Map ID from the global variable
  const mapId = window.googleMapsMapId || '';

  const mapContainerStyle = {
    width: '100%',
    height: '100%'
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
  const advancedMarkersRef = useRef([]);
  const infoWindowRef = useRef(null);

  // Create an info window for markers - must be defined before processListeners
  const createInfoWindow = useCallback(() => {
    if (!window.google || !window.google.maps) return null;

    if (!infoWindowRef.current) {
      infoWindowRef.current = new window.google.maps.InfoWindow();
    }

    return infoWindowRef.current;
  }, []);

  // Fit map bounds to show all markers - must be defined before processListeners
  const fitBoundsToMarkers = useCallback((markersToFit) => {
    if (!mapRef.current || !markersToFit.length || !window.google) return;

    const bounds = new window.google.maps.LatLngBounds();
    markersToFit.forEach(marker => {
      bounds.extend(marker.position);
    });

    mapRef.current.fitBounds(bounds);
    console.log('Map fitted to bounds');
  }, []);

  // Process listeners data and create marker objects
  const processListeners = useCallback(() => {
    if (!isLoaded || loadError) {
      console.log('Google Maps not loaded yet');
      return;
    }

    if (!listenersRef.current || !mapRef.current || !window.google) {
      console.log('Cannot process listeners: map or data not ready');
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

    // Create marker data objects
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

    console.log(`Created ${newMarkers.length} marker data objects`);
    setMarkers(newMarkers);

    // Clear existing advanced markers
    advancedMarkersRef.current.forEach(marker => {
      if (marker) marker.map = null;
    });
    advancedMarkersRef.current = [];

    // Create the info window if it doesn't exist
    const infoWindow = createInfoWindow();

    // Create and add advanced markers to the map
    if (window.google && window.google.maps && window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
      console.log('Creating advanced markers');

      // Add a small delay to ensure Google Maps API is fully initialized
      setTimeout(() => {
        newMarkers.forEach((markerData, index) => {
          try {
            // Log the exact marker data being used
            console.log(`Creating marker ${index} with data:`, {
              position: markerData.position,
              lat: markerData.position.lat,
              lng: markerData.position.lng
            });

            // Ensure position is valid
            if (!markerData.position || typeof markerData.position.lat !== 'number' || typeof markerData.position.lng !== 'number') {
              console.error(`Invalid position for marker ${index}:`, markerData.position);
              return;
            }

            // Create a simple position object to avoid any potential issues
            const position = {
              lat: parseFloat(markerData.position.lat),
              lng: parseFloat(markerData.position.lng)
            };

            // Create the advanced marker with minimal options first
            const advancedMarker = new window.google.maps.marker.AdvancedMarkerElement({
              map: mapRef.current,
              position: position
            });

            // Store reference to the marker
            advancedMarkersRef.current.push(advancedMarker);
            console.log(`Basic marker ${index} created successfully`);

            // Add click listener to show info window
            advancedMarker.addListener('click', () => {
              if (infoWindow) {
                const content = document.createElement('div');
                content.innerHTML = `
                  <div style="padding: 8px;">
                    <h3 style="margin-top: 0; font-size: 16px;">Listener</h3>
                    <p style="margin: 4px 0;">IP: ${markerData.info.ip || 'Unknown'}</p>
                    <p style="margin: 4px 0;">Location: ${markerData.info.city || 'Unknown'}, ${markerData.info.country || 'Unknown'}</p>
                  </div>
                `;

                infoWindow.setContent(content);
                infoWindow.open({
                  anchor: advancedMarker,
                  map: mapRef.current
                });

                setSelectedMarker(markerData);
              }
            });

            console.log(`Advanced marker ${index} created with all features`);
          } catch (err) {
            console.error(`Error creating advanced marker ${index}:`, err);
            console.error('Marker data:', markerData);
            console.error('Error details:', err.message, err.stack);
          }
        });

        // If we have markers, fit the map to show all of them
        if (markers.current && markers.current.length > 0 && mapRef.current) {
          fitBoundsToMarkers(newMarkers);
        }
      }, 500); // 500ms delay to ensure API is fully loaded
    } else {
      console.error('Advanced Marker API not available');
      console.error('Google object:', window.google);
      console.error('Maps object:', window.google ? window.google.maps : 'undefined');
      console.error('Marker object:', window.google && window.google.maps ? window.google.maps.marker : 'undefined');
      setError('Advanced Marker API not available. Please check your Google Maps API version and ensure the marker library is loaded.');
    }
  }, [isLoaded, loadError, createInfoWindow, fitBoundsToMarkers]);

  // Store listeners in a ref to access in callbacks
  useEffect(() => {
    listenersRef.current = listeners;
    // Process listeners when they change
    if (isLoaded && !loadError && mapRef.current) {
      processListeners();
    }
  }, [listeners, isLoaded, loadError, processListeners]);

  // Handle map load
  const onMapLoad = useCallback((map) => {
    console.log('Map loaded successfully');
    mapRef.current = map;

    // Process listeners to create markers
    if (listenersRef.current) {
      processListeners();
    }
  }, [processListeners]);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      // Clear markers
      if (advancedMarkersRef.current) {
        advancedMarkersRef.current.forEach(marker => {
          if (marker) marker.map = null;
        });
      }

      // Close info window
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, []);

  // Check if Map ID is provided
  if (!mapId) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
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
          <h3>Map Configuration Error</h3>
          <p>Google Maps Map ID is required for Advanced Markers.</p>
          <p>Please add a Map ID in the Icemap Settings page.</p>
        </div>
      </div>
    );
  }

  // If there's a load error, display it
  if (loadError) {
    return (
      <div style={{
        width: '100%',
        height: '4100%00px',
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
        height: '100%',
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
        height: '100%',
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
          zoomControl: true,
          mapId: mapId // Add the Map ID for Advanced Markers
        }}
      >
        {/* Advanced markers are added directly to the map via the Google Maps JavaScript API */}
      </GoogleMap>
    </div>
  );
}

export default MapComponent;
