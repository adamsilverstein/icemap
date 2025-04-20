<?php
/**
 * REST API Controller
 */
class Icemap_REST_Controller {
	private $cache_version = '1.0.0';


	public function __construct() {
		// Initialize the REST API endpoint
	}

		public function register_routes() {
		register_rest_route( 'icemap/v1', '/listeners', array(
			'methods'						 => 'GET',
			'callback'						=> array( $this, 'get_listeners' ),
			'permission_callback' => function() {
				return true; // Public endpoint
			}
		) );

		register_rest_route( 'icemap/v1', '/geolocation/(?P<ip>[a-zA-Z0-9.]+)', array(
			'methods'	=> 'GET',
			'callback' => array( $this, 'get_geolocation_data' ),
			'args' => array(
				'ip' => array(
					'validate_callback' => function( $param ) {
						return filter_var( $param, FILTER_VALIDATE_IP );
					}
				)
			),
			'permission_callback' => function() {
				return true; // Public endpoint
			}
		) );
	}

	public function get_listeners( $request ) {
		$server	 = get_option( 'icemap_server' );
		$mount		= get_option( 'icemap_mount' );
		$username = get_option( 'icemap_username' );
		$password = get_option( 'icemap_password' );

		// Ensure server has protocol
		if ( strpos( $server, 'http://' ) !== 0 && strpos( $server, 'https://' ) !== 0 ) {
			$server = 'https://' . $server;
		}

		// Ensure mount point is properly formatted
		$mount = ltrim( $mount, '/' );

		// Construct the URL
		$url = $server . '/admin/listclients.xml?mount=/' . $mount;

		// Log the URL being requested (for debugging)
		error_log( 'Icemap: Requesting URL: ' . $url );

		$args = array(
			'headers' => array(
				'Authorization' => 'Basic ' . base64_encode( $username . ':' . $password )
			),
			'timeout' => 15, // Increase timeout for slow servers
		);

		// Log the authentication (mask password)
		error_log( 'Icemap: Using authentication: ' . $username . ':****' );

		$response = wp_remote_get( $url, $args );

		if ( is_wp_error( $response ) ) {
			$error_message = $response->get_error_message();
			error_log( 'Icemap: WP Error: ' . $error_message );
			return new WP_Error( 'icemap_error', 'Unable to retrieve listener data: ' . $error_message, array( 'status' => 500 ) );
		}

		$response_code = wp_remote_retrieve_response_code( $response );
		$response_message = wp_remote_retrieve_response_message( $response );

		// Log the response code and message
		error_log( 'Icemap: Response code: ' . $response_code . ' ' . $response_message );

		if ( $response_code !== 200 ) {
			$body = wp_remote_retrieve_body( $response );
			error_log( 'Icemap: Error response body: ' . $body );
			return new WP_Error( 'icemap_error', 'Server returned error: ' . $response_code . ' ' . $response_message, array( 'status' => $response_code ) );
		}

		$body = wp_remote_retrieve_body( $response );

		// Check if body is empty
		if ( empty( $body ) ) {
			error_log( 'Icemap: Empty response body' );
			return new WP_Error( 'icemap_error', 'Empty response from server', array( 'status' => 500 ) );
		}

		// Try to parse XML
		libxml_use_internal_errors( true );
		$xml = simplexml_load_string( $body );

		if ( $xml === false ) {
			$xml_errors = libxml_get_errors();
			libxml_clear_errors();
			$error_msg = 'XML parsing failed: ';
			foreach ( $xml_errors as $error ) {
				$error_msg .= $error->message . ' ';
			}
			error_log( 'Icemap: ' . $error_msg );
			error_log( 'Icemap: Raw response: ' . substr( $body, 0, 1000 ) ); // Log first 1000 chars
			return new WP_Error( 'icemap_error', 'Invalid XML response from server', array( 'status' => 500 ) );
		}

		// Convert XML to JSON and ensure it's properly formatted
		$json = json_encode( $xml );

		return rest_ensure_response( $json );
	}



	/**
	 * Helper function to get the cache key.
	 */
	private function get_cache_key( $ip ) {

		// Remove the last octet from the ip address (after the last period).
		$last_period = strrpos( $ip, '.' );
		if ( $last_period !== false ) {
			$ip = substr( $ip, 0, $last_period );
		}

		return 'icemap_geo_' . $this->cache_version . '_' . md5( $ip );
	}

	/**
	 * Helper function to retrieve cached geolocation data for an IP address.
	 *
	 * @param string $ip The IP address to look up.
	 * @return mixed The cached geolocation data or false if not cached.
	 */
	private function get_cached_geolocation( $ip ) {
		$cache_key = $this->get_cache_key( $ip );
		$cached_data = get_transient( $cache_key );

		if ( $cached_data !== false ) {
			return $cached_data;
		}

		return false;
	}

	/**
	 * Helper function to store geolocation data in cache.
	 *
	 * @param string $ip The IP address to cache data for.
	 * @param mixed $data The geolocation data to cache.
	 * @param int $expiration Cache expiration time in seconds (default: 30 days).
	 */
	private function cache_geolocation( $ip, $data, $expiration = 86400 * 30 ) {
		$cache_key = $this->get_cache_key( $ip );
		set_transient($cache_key, $data, $expiration );
		error_log('Icemap: Cached geolocation data for IP: ' . $ip);
	}

	public function get_geolocation_data( $request ) {

		// Extract the IP address from the request parameters
		$ip = $request['ip'];

		// Log the IP address for debugging
		error_log( 'Icemap: Geolocation requested for IP: ' . $ip );


		// Check if we have cached geolocation data for this IP
		$cached_data = $this->get_cached_geolocation( $ip );

		if ( $cached_data !== false ) {
			return rest_ensure_response( $cached_data );
		}
/*
		require "dbip-client.class.php";
		$data = DBIP\Address::lookup( $ip );

		// Log the geolocation data for debugging
		error_log( 'Icemap: Geolocation data for IP ' . $ip . ': ' . print_r( $data, true ) );

		*/
		error_log( 'Icemap: No cached geolocation data found for IP: ' . $ip );

		// Pause for 200 ms.
		usleep( 200000 ); // 200 milliseconds = 200,000 microseconds

		// Construct the URL for the geolocation API
		$url = 'https://ipapi.co/' . $ip . '/json/';

		// Log the URL being requested (for debugging)
		error_log( 'Icemap: Requesting geolocation URL: ' . $url );

		$args = array(
			'timeout' => 10, // Increase timeout for slow servers
		);

		$response = wp_remote_get( $url, $args );

		if ( is_wp_error( $response ) ) {
			$error_message = $response->get_error_message();
			error_log( 'Icemap: Geolocation WP Error: ' . $error_message );
			return new WP_Error( 'icemap_error', 'Unable to retrieve geolocation data: ' . $error_message, array( 'status' => 500 ) );
		}

		$response_code = wp_remote_retrieve_response_code( $response );
		$response_message = wp_remote_retrieve_response_message( $response );

		// Log the response code and message
		error_log( 'Icemap: Geolocation response code: ' . $response_code . ' ' . $response_message );

		if ( $response_code !== 200 ) {
			$body = wp_remote_retrieve_body( $response );
			error_log( 'Icemap: Geolocation error response body: ' . $body );
			return new WP_Error( 'icemap_error', 'Geolocation server returned error: ' . $response_code . ' ' . $response_message, array( 'status' => $response_code ) );
		}

		$body = wp_remote_retrieve_body( $response );

		// Check if body is empty
		if ( empty( $body ) ) {
			error_log( 'Icemap: Empty geolocation response body' );
			return new WP_Error( 'icemap_error', 'Empty response from geolocation server', array( 'status' => 500 ) );
		}

		// Try to parse JSON
		$data = json_decode( $body );

		if ( $data === null && json_last_error() !== JSON_ERROR_NONE ) {
			$error_msg = 'JSON parsing failed: ' . json_last_error_msg();
			error_log( 'Icemap: ' . $error_msg );
			error_log( 'Icemap: Raw geolocation response: ' . substr( $body, 0, 1000 ) ); // Log first 1000 chars
			return new WP_Error( 'icemap_error', 'Invalid JSON response from geolocation server', array( 'status' => 500 ) );
		}

		// Cache the geolocation results
		$this->cache_geolocation( $ip, $data );

		return rest_ensure_response( $data );
	}
}
