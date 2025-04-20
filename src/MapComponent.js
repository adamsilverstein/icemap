import React, { useEffect, useRef, useState, useCallback } from 'react';

function MapComponent({ listeners }) {
	const mapContainer = useRef(null);
	const map = useRef(null);
	const [lng, setLng] = useState(107.5920);
	const [lat, setLat] = useState(38.8683);
	const [zoom, setZoom] = useState(9);
	const markers = useRef([]);
	const [error, setError] = useState(null);
	const [mapReady, setMapReady] = useState(false);
	const listenersRef = useRef(null);
	const markerAddAttempts = useRef(0);
	const maxMarkerAttempts = 10; // Maximum number of attempts to add markers

	// Store listeners in a ref to access in callbacks
	useEffect(() => {
		listenersRef.current = listeners;
	}, [listeners]);

	// Function to check if map is truly ready for markers
	const isMapReady = useCallback(() => {
		if (!map.current) return false;

		try {
			// Check multiple conditions to determine if map is truly ready
			const container = map.current.getContainer();
			const hasContainer = !!container && document.body.contains(container);
			const isLoaded = !!map.current._loaded;
			const hasStyle = !!map.current.getStyle();
			const canvasExists = !!container && !!container.querySelector('.mapboxgl-canvas');

			const readyState = {
				hasContainer,
				isLoaded,
				hasStyle,
				canvasExists
			};

			console.log('Map ready state check:', readyState);

			// Map is ready if it meets all these conditions
			return hasContainer && isLoaded && hasStyle && canvasExists;
		} catch (err) {
			console.error('Error checking map ready state:', err);
			return false;
		}
	}, []);

	// Function to add markers to the map
	const addMarkersToMap = useCallback(() => {
		if (!map.current || error) {
			console.log('Cannot add markers: map not available or has error');
			return false;
		}

		try {
			console.log('Map is ready! Adding markers...');

			// Clear existing markers
			markers.current.forEach(marker => marker.remove());
			markers.current = [];

			const listeners = listenersRef.current;

			// Check if listeners exists and is in the expected format
			if (!listeners) {
				console.log('No listeners data available');
				return true; // Successfully processed (no markers to add)
			}

			// Check if listeners is an array
			const listenersArray = Array.isArray(listeners) ? listeners : [];
			console.log('Processing listeners array:', listenersArray);

			if (!listenersArray.length) {
				console.log('No listeners in the array');
				return true; // Successfully processed (no markers to add)
			}

			// Create marker objects first without adding them to the map
			const markerObjects = [];
			const mapboxgl = window.mapboxgl;

			listenersArray.forEach((listener, index) => {
				if (!listener) return;

				const latitude = listener.latitude;
				const longitude = listener.longitude;

				if (latitude === undefined || longitude === undefined) return;

				const ip = listener.ip || listener.IP || 'Unknown';
				const city = listener.city || 'Unknown';
				const country = listener.country || 'Unknown';

				const popup = new mapboxgl.Popup({ offset: 25 })
					.setHTML(`
						<h3>Listener</h3>
						<p>IP: ${ip}</p>
						<p>Location: ${city}, ${country}</p>
					`);

				const marker = new mapboxgl.Marker()
					.setLngLat([longitude, latitude])
					.setPopup(popup);

				markerObjects.push({ marker, lngLat: [longitude, latitude] });
			});

			console.log(`Created ${markerObjects.length} marker objects, now adding to map...`);

			// Now add all markers to the map
			markerObjects.forEach((obj, index) => {
				try {
					obj.marker.addTo(map.current);
					markers.current.push(obj.marker);
					console.log(`Added marker ${index} to map`);
				} catch (err) {
					console.error(`Error adding marker ${index} to map:`, err);
				}
			});

			// If we have markers, fit the map to show all of them
			if (markers.current.length > 0) {
				const bounds = new mapboxgl.LngLatBounds();

				markerObjects.forEach(obj => {
					bounds.extend(obj.lngLat);
				});

				map.current.fitBounds(bounds, {
					padding: 50,
					maxZoom: 15
				});

				console.log(`Successfully added ${markers.current.length} markers to map`);
			} else {
				console.log('No markers were added to the map');
			}

			return true; // Successfully added markers
		} catch (err) {
			console.error('Error adding markers to map:', err);
			return false;
		}
	}, [error, isMapReady]);

	// Initialize map when component mounts
	useEffect(() => {
		if (map.current) return; // Initialize map only once

		// Check if mapboxgl is defined
		const mapboxgl = window.mapboxgl;
		if (typeof mapboxgl === 'undefined') {
			setError('Mapbox GL JS is not loaded. Please check your internet connection.');
			console.error('Mapbox GL JS is not defined on the window object');
			return;
		}

		// Check if access token is set
		if (!mapboxgl.accessToken) {
			setError('Mapbox access token is not set. Please add a valid access token in the Icemap settings.');
			console.error('Mapbox access token is not set');
			return;
		}

		try {
			console.log('Initializing map...');

			// Create the map
			map.current = new mapboxgl.Map({
				container: 'icemap',
				center: [lng, lat],
				zoom: zoom
			});

			// Add navigation controls
			map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

			// Set up event listeners for map readiness
			map.current.on('load', () => {
				console.log('Map "load" event fired');
				// Don't set mapReady here - we'll use our custom isMapReady check
				addMarkersToMap();
			});

			// Clean up on unmount
			return () => {
				if (map.current) {
					map.current.remove();
				}
			};
		} catch (err) {
			setError(`Error initializing map: ${err.message}`);
			console.error('Error initializing Mapbox map:', err);
		}
	}, [lng, lat, zoom]);

	// If there's an error, display it
	if (error) {
		return (
			<div style={{ width: '100%', height: '400px', backgroundColor: '#f8d7da', color: '#721c24',
									 display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
									 border: '1px solid #f5c6cb', borderRadius: '5px' }}>
				<div>
					<h3>Map Error</h3>
					<p>{error}</p>
					<p>Please check the console for more details.</p>
				</div>
			</div>
		);
	}

	return (
		<div ref={mapContainer} style={{ width: '100%', height: '400px' }} />
	);
}

export default MapComponent;
