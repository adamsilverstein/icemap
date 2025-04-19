<?php
/**
 * REST API Controller
 */
class Icemap_REST_Controller {
  public function __construct() {
    // Initialize the REST API endpoint
  }

  public function register_routes() {
    // Register the REST API routes
  }

  public function get_listeners( $request ) {
    $server = get_option( 'icemap_server' );
    $mount = get_option( 'icemap_mount' );

    $url = $server . '/admin/listclients.xml?mount=/' . $mount;

    $response = wp_remote_get( $url );

    if ( is_wp_error( $response ) ) {
      return new WP_Error( 'icemap_error', 'Unable to retrieve listener data.', array( 'status' => 500 ) );
    }

    $body = wp_remote_retrieve_body( $response );
    $xml = simplexml_load_string( $body );
    $json = json_encode( $xml );

    return rest_ensure_response( $json );
  }

  public function get_geolocation_data( $ip ) {
    $url = 'https://ipapi.co/' . $ip . '/json/';

    $response = wp_remote_get( $url );

    if ( is_wp_error( $response ) ) {
      return new WP_Error( 'icemap_error', 'Unable to retrieve geolocation data.', array( 'status' => 500 ) );
    }

    $body = wp_remote_retrieve_body( $response );

    $data = json_decode( $body );

    return rest_ensure_response( $data );
  }
}
