/**
 * Fetches listener data from the Icecast server via the WordPress REST API
 * @returns {Promise<Object>} The listener data
 */
async function getListeners() {
	try {
		// console.log('Fetching listeners from API...');
		const response = await fetch('/wp-json/icemap/v1/listeners');
		// console.log('Received response status:', response.status);

		// Check if the response is ok
		if (!response.ok) {
			const errorText = await response.text();
			console.error('Error fetching listeners:', response.status, errorText);
			throw new Error(`Server returned ${response.status}: ${errorText}`);
		}

		// Get the raw text first for logging
		const responseText = await response.clone().text();
		// console.log('Raw response text:', responseText);

		// Try to parse the JSON response
		let data;
		try {
			data = await response.json();
			// console.log('Parsed listener data (structure):', JSON.stringify(data, null, 2));
			// console.log('Parsed listener data (type):', typeof data);
			// console.log('Parsed listener data (keys):', data ? Object.keys(data) : 'null');
		} catch (parseError) {
			console.error('Error parsing JSON response:', parseError);
			// console.log('Response was not valid JSON, returning raw text');
			return responseText; // Return the raw text if parsing fails
		}

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
		// console.log(`Fetching geolocation for IP: ${ip}`);
		const response = await fetch(`/wp-json/icemap/v1/geolocation/${ip}`);
		// console.log('Received geolocation response status:', response.status);

		// Check if the response is ok
		if (!response.ok) {
			const errorText = await response.text();
			console.error('Error fetching geolocation:', response.status, errorText);
			throw new Error(`Server returned ${response.status}: ${errorText}`);
		}

		// Get the raw text first for logging
		const responseText = await response.clone().text();
		// console.log('Raw geolocation response text:', responseText);

		// Try to parse the JSON response
		let data;
		try {
			data = await response.json();
			// console.log('Parsed geolocation data:', data);
		} catch (parseError) {
			console.error('Error parsing geolocation JSON response:', parseError);
			return null; // Return null if parsing fails
		}
		return data;
	} catch (error) {
		console.error('Failed to fetch geolocation:', error);
		return null;
	}
}

export default { getListeners, getGeolocation };
