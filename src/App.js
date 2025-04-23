import React, { useState, useEffect } from 'react';
import MapComponent from './MapComponent';
import icecastService from './icecastService';

function App() {
	const [listeners, setListeners] = useState(null);
	const [mapMarkers, setMapMarkers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isProcessingListeners, setIsProcessingListeners] = useState(false);

	// Fetch listener data from the Icecast server
	useEffect(() => {
		async function fetchListeners() {
			try {
				setLoading(true);
				setError(null);
				const data = await icecastService.getListeners();
				// console.log('Received listener data (raw):', data);

				// The data is already parsed in icecastService.js, no need to parse it again
				// Check if data is a string (needs parsing) or already an object
				const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
				// console.log('Parsed listener data:', parsedData);

				setListeners(parsedData);
			} catch (err) {
				console.error('Error in App component:', err);
				setError('Failed to load listener data. Please check the console for details.');
			} finally {
				setLoading(false);
			}
		}

		fetchListeners();

		// Set up a refresh interval.
		const interval = 60 * 1000 * 5; // 5 minutes
		const intervalId = setInterval( fetchListeners, interval );

		// Clean up the interval on component unmount
		return () => clearInterval( intervalId );
	}, []);

	// Process listeners and fetch geolocation data
	useEffect(() => {
		// If we don't have listeners data or we're already processing, don't start again
		if (!listeners || isProcessingListeners) return;

		async function processListeners() {
			try {
				setIsProcessingListeners(true);
				// Extract the actual listeners array
				let listenersArray = [];
				// More robust checking of the data structure
				if (listeners.source && listeners.source.listener) {
					listenersArray = Array.isArray(listeners.source.listener)
						? listeners.source.listener
						: [listeners.source.listener]; // Handle case where it's a single object
				} else if (listeners.source && listeners.source.listeners && listeners.source.listeners.listener) {
					listenersArray = Array.isArray(listeners.source.listeners.listener)
						? listeners.source.listeners.listener
						: [listeners.source.listeners.listener]; // Handle case where it's a single object
				} else {
					console.log('Unexpected listeners data format:', listeners);
					return;
				}

				// Check if we have any listeners
				if (!listenersArray || !listenersArray.length) {
					console.log('No listeners in the array');
					return;
				}

				// Remove any duplicates IPs from the listenersArray.
				const uniqueIPs = new Set();
				const filteredListeners = listenersArray.filter(listener => {
					const ip = listener.IP;
					if (listener.IP && !uniqueIPs.has(ip)) {
						uniqueIPs.add(ip);
						return true; // Keep this listener
					}
					return false; // Skip this listener
				});

				// console.log('Filtered listeners (unique IPs):', filteredListeners);

				// Process each listener one by one, adding markers as we go
				for (const listener of filteredListeners) {
					// Skip invalid listeners
					if (!listener) continue;

					// Skip listeners whos IPs have already been displayed.
					if (mapMarkers.some(marker => marker.id === listener.IP)) {
						// console.log('Skipping already processed IP:', listener.IP);
						continue;
					}

					// Check for IP property
					const ip = listener.IP;
					if (!ip) continue;

					try {
						// Fetch geolocation data for the IP
						const geoData = await icecastService.getGeolocation(ip);

						let markerData;
						if (geoData && geoData.latitude && geoData.longitude) {
							markerData = {
								id: ip, // Use IP as unique identifier
								position: {
									lat: parseFloat(geoData.latitude),
									lng: parseFloat(geoData.longitude)
								},
								info: {
									ip: ip,
									city: geoData.city || 'Unknown',
									country: geoData.country_name || 'Unknown'
								}
							};
						} else {
							// Use default coordinates if geolocation fails
							markerData = {
								id: ip, // Use IP as unique identifier
								position: {
									lat: parseFloat(window.defaultLatitude || 38.8683),
									lng: parseFloat(window.defaultLongitude || -107.5920)
								},
								info: {
									ip: ip,
									city: 'Unknown',
									country: 'Unknown'
								}
							};
						}

						// Add this marker to the map
						setMapMarkers(prevMarkers => [...prevMarkers, markerData]);

						// Pause for a short time to avoid overwhelming the geolocation API
						await new Promise(resolve => setTimeout(resolve, 5));
					} catch (err) {
						console.error('Error fetching geolocation for IP:', ip, err);

						// Use default coordinates if geolocation fails
						const markerData = {
							id: ip, // Use IP as unique identifier
							position: {
								lat: parseFloat(window.defaultLatitude || 38.8683),
								lng: parseFloat(window.defaultLongitude || -107.5920)
							},
							info: {
								ip: ip,
								city: 'Unknown',
								country: 'Unknown'
							}
						};

						// Add this marker to the map
						setMapMarkers(prevMarkers => [...prevMarkers, markerData]);
					}
				}
			} catch (err) {
				console.error('Error processing listeners:', err);
			} finally {
				setIsProcessingListeners(false);
			}
		}

		processListeners();
	}, [listeners, isProcessingListeners]);

	if (error) {
		return (
			<div style={{
				width: '100%',
				height: '400px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: '#f8d7da',
				color: '#721c24',
				padding: '20px',
				border: '1px solid #f5c6cb',
				borderRadius: '5px'
			}}>
				<div>
					<h3>Error</h3>
					<p>{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div style={{ position: 'relative' }}>
			{/* Always render the map component, even while loading */}
			<MapComponent markers={mapMarkers} />

			{/* Show loading indicator if we're still fetching initial data */}
			{loading && !listeners && (
				<div style={{
					position: 'absolute',
					top: '200px', // Center vertically in the 400px map
					left: '50%',
					transform: 'translate(-50%, -50%)',
					backgroundColor: 'rgba(255, 255, 255, 0.8)',
					padding: '10px 20px',
					borderRadius: '5px',
					boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
					zIndex: 1000 // Ensure it appears above the map
				}}>
					<p>Loading listener data...</p>
				</div>
			)}

			{/* Show processing indicator when we're adding markers */}
			{isProcessingListeners && (
				<div style={{
					position: 'absolute',
					top: '20px',
					right: '20px',
					backgroundColor: 'rgba(255, 255, 255, 0.8)',
					padding: '8px 15px',
					borderRadius: '5px',
					boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
					zIndex: 1000, // Ensure it appears above the map
					fontSize: '14px'
				}}>
					<p style={{ margin: 0 }}>Loading markers: {mapMarkers.length} added</p>
				</div>
			)}
		</div>
	);
}

export default App;
