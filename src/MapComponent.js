import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

// Define libraries outside the component to avoid re-creation on renders
const googleMapsLibraries = ['marker'];

function MapComponent({ markers }) {
	// Load the Google Maps JavaScript API with marker library
	// This must be called before any other hooks that depend on it
	const { isLoaded, loadError } = useJsApiLoader({
		googleMapsApiKey: window.googleMapsApiKey || '',
		// Include the marker library for Advanced Markers
		libraries: googleMapsLibraries
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
	const [addedMarkerIds, setAddedMarkerIds] = useState(new Set());
	const [selectedMarker, setSelectedMarker] = useState(null);
	const mapRef = useRef(null);
	const advancedMarkersRef = useRef([]);
	const infoWindowRef = useRef(null);

	// Create an info window for markers
	const createInfoWindow = useCallback(() => {
		if (!window.google || !window.google.maps) return null;

		if (!infoWindowRef.current) {
			infoWindowRef.current = new window.google.maps.InfoWindow();
		}

		return infoWindowRef.current;
	}, []);

	// Fit map bounds to show all markers
	const fitBoundsToMarkers = useCallback((markersToFit) => {
		if (!mapRef.current || !markersToFit.length || !window.google) return;

		const bounds = new window.google.maps.LatLngBounds();
		markersToFit.forEach(marker => {
			bounds.extend(marker.position);
		});

		mapRef.current.fitBounds(bounds);
		// console.log('Map fitted to bounds');
	}, []);

	// Handle new markers being added
	useEffect(() => {
		// Only proceed if the map is loaded and we have markers to add
		if (!isLoaded || loadError || !mapRef.current || !markers || !markers.length) {
			return;
		}

		// Get the new markers that haven't been added yet
		const newMarkers = markers.filter(marker => !addedMarkerIds.has(marker.id));

		if (newMarkers.length === 0) {
			return; // No new markers to add
		}

		// console.log(`Adding ${newMarkers.length} new markers to the map`);

		// Create the info window if it doesn't exist
		const infoWindow = createInfoWindow();

		// Create and add advanced markers for the new markers
		if (window.google && window.google.maps && window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
			// Add a small delay to ensure Google Maps API is fully initialized
			setTimeout(() => {
				newMarkers.forEach((markerData) => {
					try {
						// Ensure position is valid
						if (!markerData.position || typeof markerData.position.lat !== 'number' || typeof markerData.position.lng !== 'number') {
							console.error(`Invalid position for marker ${markerData.id}:`, markerData.position);
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

						// Mark this marker as added
						setAddedMarkerIds(prevIds => new Set([...prevIds, markerData.id]));
					} catch (err) {
						console.error(`Error creating advanced marker ${markerData.id}:`, err);
					}
				});

				// Resize map occasionally.
				if ( markers.length % 5 === 0 ) {
					fitBoundsToMarkers(markers);
				}
			}, 100); // Small delay to ensure API is fully loaded
		} else {
			console.error('Advanced Marker API not available');
			setError('Advanced Marker API not available. Please check your Google Maps API version and ensure the marker library is loaded.');
		}
	}, [markers, isLoaded, loadError, createInfoWindow, fitBoundsToMarkers, addedMarkerIds]);

	// Handle map load
	const onMapLoad = useCallback((map) => {
		console.log('Map loaded successfully');
		mapRef.current = map;
	}, []);

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
