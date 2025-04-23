import React, { useState, useEffect } from 'react';
import MapComponent from './MapComponent';
import icecastService from './icecastService';

function App() {
	const [listeners, setListeners] = useState(null);
	const [processedListeners, setProcessedListeners] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

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

		// Set up a refresh interval (every 60 seconds)
		const intervalId = setInterval(fetchListeners, 60000);

		// Clean up the interval on component unmount
		return () => clearInterval(intervalId);
	}, []);

	// Process listeners and fetch geolocation data
	useEffect(() => {
		if ( processedListeners && processedListeners.length > 0 ) {
			return;
		}
		async function processListeners() {
			if (!listeners) return;
			// console.log('Processing listeners (raw):', listeners);
			// console.log('Processing listeners (type):', typeof listeners);
			// console.log('Processing listeners (keys):', listeners ? Object.keys(listeners) : 'null');
			try {
				// Extract the actual listeners array
				let listenersArray = [];
				// More robust checking of the data structure
				if (listeners.source && listeners.source.listener) {
					// console.log('Found listeners.source.listener:', listeners.source.listener);
					listenersArray = Array.isArray(listeners.source.listener)
						? listeners.source.listener
						: [listeners.source.listener]; // Handle case where it's a single object
				} else if (listeners.source && listeners.source.listeners && listeners.source.listeners.listener) {
					// console.log('Found listeners.source.listeners.listener:', listeners.source.listeners.listener);
					listenersArray = Array.isArray(listeners.source.listeners.listener)
						? listeners.source.listeners.listener
						: [listeners.source.listeners.listener]; // Handle case where it's a single object
				} else {
					// console.log('Unexpected listeners data format:', listeners);
					setProcessedListeners([]);
					return;
				}

				// console.log('Extracted listeners array:', listenersArray);

				// Check if we have any listeners
				if (!listenersArray || !listenersArray.length) {
					// console.log('No listeners in the array');
					setProcessedListeners([]);
					return;
				}

				// Process each listener to add geolocation data
				const processed = [];

				// Remove any duplicates IPs from the listenersArray.
				const uniqueIPs = new Set();
				const filteredListeners = listenersArray.filter(listener => {
					const ip =  listener.IP;
					if (listener.IP && !uniqueIPs.has(ip)) {
						uniqueIPs.add(ip);
						return true; // Keep this listener
					}
					return false; // Skip this listener
				});

				console.log('Filtered listeners (unique IPs):', filteredListeners);

				for (const listener of filteredListeners) {
					// console.log('Processing listener:', listener);

					// Check if listener exists and has an IP property
					if (!listener) {
						// console.log('Listener is null or undefined');
						continue;
					}

					// Check for IP property with different possible casings
					const ip = listener.IP;
					if (!ip) {
						// console.log('Listener missing IP address:', listener);
						continue;
					}

					try {
						// Fetch geolocation data for the IP
						// console.log('Fetching geolocation for IP:', ip);
						const geoData = await icecastService.getGeolocation(ip);
						// console.log('Received geolocation data:', geoData);

						if (geoData && geoData.latitude && geoData.longitude) {
							const processedListener = {
								...listener,
								latitude: geoData.latitude,
								longitude: geoData.longitude,
								city: geoData.city || 'Unknown',
								country: geoData.country_name || 'Unknown',
								ip: ip
							};
							// console.log('Processed listener with geolocation:', processedListener);
							processed.push(processedListener);
						} else {
							// console.log('No geolocation data for IP:', ip);

							// Use default coordinates if geolocation fails
							const defaultListener = {
								...listener,
								latitude: window.defaultLatitude || 38.8683,
								longitude: window.defaultLongitude || -107.5920,
								city: 'Unknown',
								country: 'Unknown',
								ip: ip
							};
							// console.log('Processed listener with default coordinates:', defaultListener);
							processed.push(defaultListener);
						}
						// Pause for a short time to avoid overwhelming the geolocation API
						await new Promise(resolve => setTimeout(resolve, 500));
					} catch (err) {
						console.error('Error fetching geolocation for IP:', ip, err);

						// Use default coordinates if geolocation fails
						const errorListener = {
							...listener,
							latitude: window.defaultLatitude || 38.8683,
							longitude: window.defaultLongitude || -107.5920,
							city: 'Unknown',
							country: 'Unknown',
							ip: ip
						};
						// console.log('Processed listener with default coordinates (after error):', errorListener);
						processed.push(errorListener);
					}
				}

				// Update the processed listeners
				// console.log('Final processed listeners:', processed);
				setProcessedListeners(processed);
			} catch (err) {
				console.error('Error processing listeners:', err);
			}
		}

		processListeners();
	}, [listeners]);

	if (loading && !listeners) {
		return (
			<div style={{
				width: '100%',
				height: '400px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: '#f0f0f0'
			}}>
				<p>Loading listener data...</p>
			</div>
		);
	}

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
		<div>
			<MapComponent listeners={processedListeners} />
		</div>
	);
}

export default App;
