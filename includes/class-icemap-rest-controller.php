<?php
/**
 * REST API Controller
 */
class Icemap_REST_Controller {
  public function __construct() {
    // Initialize the REST API endpoint
  }

  public function register_routes() {
    register_rest_route( 'icemap/v1', '/listeners', array(
      'methods'  => 'GET',
      'callback' => array( $this, 'get_listeners' ),
      'permission_callback' => function() {
        return true; // Public endpoint
      }
    ) );

    register_rest_route( 'icemap/v1', '/geolocation/(?P<ip>[a-zA-Z0-9.]+)', array(
      'methods'  => 'GET',
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
    $server = get_option( 'icemap_server' );
    $mount = get_option( 'icemap_mount' );
    $username = get_option( 'icemap_username' );
    $password = get_option( 'icemap_password' );

    $url = $server . '/admin/listclients.xml?mount=/' . $mount;

    $args = array(
      'headers' => array(
        'Authorization' => 'Basic ' . base64_encode( $username . ':' . $password )
      )
    );

    $response = wp_remote_get( $url, $args );

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
