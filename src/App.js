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
				console.log('Received listener data:', data);
				setListeners(JSON.parse(data));
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
		async function processListeners() {
			if (!listeners) return;
			console.log( 'Processing listeners:', listeners);
			try {
				// Extract the actual listeners array
				let listenersArray = [];
				if (listeners.source && listeners.source.listener ) {
					listenersArray = listeners.source.listener;
				} else {
					console.log('Unexpected listeners data format:', listeners);
					return;
				}

				// Check if we have any listeners
				if (!listenersArray.length) {
					console.log('No listeners in the array');
					setProcessedListeners({ source: { listeners: { listener: [] } } });
					return;
				}

				// Process each listener to add geolocation data
				const processed = [];

		// Limit to 5 ips.
		listenersArray = listenersArray.slice( 0,4 );

				for (const listener of listenersArray) {
					if (!listener || !listener.IP) {
						console.log('Listener missing IP address:', listener);
						continue;
					}

					try {
						// Fetch geolocation data for the IP
						const geoData = await icecastService.getGeolocation(listener.IP);

						if (geoData && geoData.latitude && geoData.longitude) {
							processed.push({
								...listener,
								latitude: geoData.latitude,
								longitude: geoData.longitude,
								city: geoData.city,
								country: geoData.country_name,
								ip: listener.IP
							});
						} else {
							console.log('No geolocation data for IP:', listener.IP);

							// Use random coordinates for testing if geolocation fails
							processed.push({
								...listener,
								latitude: Math.random() * 180 - 90,
								longitude: Math.random() * 360 - 180,
								city: 'Unknown',
								country: 'Unknown',
								ip: listener.IP
							});
						}
						// Pause for a short time to avoid overwhelming the geolocation API
						await new Promise(resolve => setTimeout(resolve, 500));
					} catch (err) {
						console.error('Error fetching geolocation for IP:', listener.IP, err);

						// Use random coordinates for testing if geolocation fails
						processed.push({
							...listener,
							latitude: Math.random() * 180 - 90,
							longitude: Math.random() * 360 - 180,
							city: 'Unknown',
							country: 'Unknown',
							ip: listener.IP
						});
					}
				}

				// Update the processed listeners
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
