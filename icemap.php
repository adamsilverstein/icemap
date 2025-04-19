<?php
/**
 * Plugin Name: Icemap
 * Plugin URI: https://example.com/icemap
 * Description: Displays a map of Icecast listeners on a WordPress website.
 * Version: 1.0.0
 * Author: Your Name
 * Author URI: https://example.com
 */

class Icemap {
  public function __construct() {
    add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
  }

  public function register_rest_routes() {
    require_once plugin_dir_path( __FILE__ ) . 'includes/class-icemap-rest-controller.php';
    $controller = new Icemap_REST_Controller();
    $controller->register_routes();

    require_once plugin_dir_path( __FILE__ ) . 'includes/class-icemap-settings.php';
    new Icemap_Settings();

    add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_google_maps_api' ) );
    add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
  }

  public function enqueue_google_maps_api() {
    $api_key = get_option( 'icemap_google_maps_api_key' );
    wp_enqueue_script( 'google-maps-api', 'https://maps.googleapis.com/maps/api/js?key=' . $api_key, array(), '1.0.0', true );
  }

  public function enqueue_scripts() {
    wp_enqueue_script( 'icemap-index', plugin_dir_url( __FILE__ ) . 'dist/index.js', array( 'wp-element' ), '1.0.0', true );
    wp_enqueue_style( 'icemap-index', plugin_dir_url( __FILE__ ) . 'dist/index.css', array(), '1.0.0' );
  }
}

new Icemap();

?>
