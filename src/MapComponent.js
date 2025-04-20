import React, { useEffect, useRef, useState } from 'react';

function MapComponent({ listeners }) {
	const mapContainer = useRef(null);
	const map = useRef(null);
	const [lng, setLng] = useState(0);
	const [lat, setLat] = useState(0);
	const [zoom, setZoom] = useState(1);
	const markers = useRef([]);
	const [error, setError] = useState(null);

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
			map.current = new mapboxgl.Map({
				container: mapContainer.current,
				style: 'mapbox://styles/mapbox/streets-v12',
				center: [lng, lat],
				zoom: zoom
			});

			// Add navigation controls
			map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

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
	}, []);

	// Update markers when listeners data changes
	useEffect(() => {
		if (!map.current || error) return;

		try {
			// Clear existing markers
			markers.current.forEach(marker => marker.remove());
			markers.current = [];

			// Check if listeners exists and is in the expected format
			if (!listeners) {
				console.log('No listeners data available');
				return;
			}

			// Log the listeners data structure for debugging
			console.log('Listeners data:', listeners);

			// Check if listeners is an array
			const listenersArray = Array.isArray(listeners) ? listeners : [];

			// Check if we have any listeners
			if (!listenersArray.length) {
				console.log('No listeners in the array');
				return;
			}

			// Create markers for each listener
			listenersArray.forEach(listener => {
				// Check if listener has location data
				if (!listener || listener.latitude === undefined || listener.longitude === undefined) {
					console.log('Listener missing location data:', listener);
					return;
				}

				try {
					const popup = new mapboxgl.Popup({ offset: 25 })
						.setHTML(`
							<h3>Listener</h3>
							<p>IP: ${listener.ip || 'Unknown'}</p>
							<p>Location: ${listener.city || 'Unknown'}, ${listener.country || 'Unknown'}</p>
						`);

					const marker = new mapboxgl.Marker()
						.setLngLat([listener.longitude, listener.latitude])
						.setPopup(popup)
						.addTo(map.current);

					markers.current.push(marker);
				} catch (markerErr) {
					console.error('Error creating marker for listener:', listener, markerErr);
				}
			});

			// If we have listeners with coordinates, fit the map to show all markers
			if (markers.current.length > 0) {
				const bounds = new mapboxgl.LngLatBounds();
				markers.current.forEach(marker => {
					bounds.extend(marker.getLngLat());
				});

				map.current.fitBounds(bounds, {
					padding: 50,
					maxZoom: 15
				});
			} else {
				console.log('No markers were created');
			}
		} catch (err) {
			setError(`Error updating markers: ${err.message}`);
			console.error('Error updating markers:', err);
		}
	}, [listeners, error]);

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
