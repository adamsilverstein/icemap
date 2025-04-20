/**
 * Fetches listener data from the Icecast server via the WordPress REST API
 * @returns {Promise<Object>} The listener data
 */
async function getListeners() {
	try {
		const response = await fetch('/wp-json/icemap/v1/listeners');

		// Check if the response is ok
		if (!response.ok) {
			const errorText = await response.text();
			console.error('Error fetching listeners:', response.status, errorText);
			throw new Error(`Server returned ${response.status}: ${errorText}`);
		}

		// Parse the JSON response
		const data = await response.json();

		// Log the data structure for debugging
		console.log('Received listener data:', data);

		return data;
	} catch (error) {
		console.error('Failed to fetch listeners:', error);
		// Return an empty object with the expected structure
		return { source: { listeners: { listener: [] } } };
	}
}

/**
 * Fetches geolocation data for an IP address
 * @param {string} ip - The IP address to geolocate
 * @returns {Promise<Object>} The geolocation data
 */
async function getGeolocation(ip) {
	try {
		const response = await fetch(`/wp-json/icemap/v1/geolocation/${ip}`);

		// Check if the response is ok
		if (!response.ok) {
			const errorText = await response.text();
			console.error('Error fetching geolocation:', response.status, errorText);
			throw new Error(`Server returned ${response.status}: ${errorText}`);
		}

		// Parse the JSON response
		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Failed to fetch geolocation:', error);
		return null;
	}
}

export default { getListeners, getGeolocation };
