<?php
/**
 * Plugin Name: Icemap
 * Plugin URI: https://example.com/icemap
 * Description: Displays a map of Icecast listeners on a WordPress website.
 * Version: 1.0.0
 * Author: Your Name
 * Author URI: https://example.com
 */

// Register the block
function icemap_register_block() {
  // Check if Gutenberg is available
  if ( ! function_exists( 'register_block_type' ) ) {
    return;
  }

  // Register the block
  register_block_type( 'icemap/map', array(
    'editor_script' => 'icemap-block-editor',
    'editor_style' => 'icemap-block-editor',
    'render_callback' => 'icemap_render_block',
    'attributes' => array(
      'height' => array(
        'type' => 'string',
        'default' => '400px',
      ),
    ),
  ) );
}

// Enqueue block assets
function icemap_enqueue_block_assets() {
  // Get block.asset.php file for dependencies
  $asset_file = include( plugin_dir_path( __FILE__ ) . 'build/block.asset.php' );

  // Register and enqueue the block editor script
  wp_register_script(
    'icemap-block-editor',
    plugin_dir_url( __FILE__ ) . 'build/block.js',
    $asset_file['dependencies'],
    $asset_file['version']
  );
  wp_enqueue_script( 'icemap-block-editor' );

  // Register and enqueue the block editor style
  wp_register_style(
    'icemap-block-editor',
    plugin_dir_url( __FILE__ ) . 'build/block.css',
    array( 'wp-edit-blocks' ),
    filemtime( plugin_dir_path( __FILE__ ) . 'build/block.css' )
  );
  wp_enqueue_style( 'icemap-block-editor' );

  // Register script translations
  if ( function_exists( 'wp_set_script_translations' ) ) {
    wp_set_script_translations( 'icemap-block-editor', 'icemap' );
  }
}

// Render the block
function icemap_render_block( $attributes ) {
  $height = isset( $attributes['height'] ) ? $attributes['height'] : '400px';

  // Enqueue the necessary scripts and styles
  wp_enqueue_script( 'icemap-index' );
  wp_enqueue_style( 'icemap-index' );

  // Enqueue Google Maps API if available
  $api_key = get_option( 'icemap_google_maps_api_key' );
  if ( ! empty( $api_key ) ) {
    wp_enqueue_script( 'google-maps-api' );
  }

  // Return the container div
  return '<div id="root" class="icemap-container" style="height: ' . esc_attr( $height ) . '"></div>';
}

class Icemap {
  public function __construct() {
    add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
    add_action( 'plugins_loaded', array( $this, 'plugin_init' ) );
    add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_google_maps_api' ) );
    add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

    // Register block
    add_action( 'init', 'icemap_register_block' );
    add_action( 'init', 'icemap_enqueue_block_assets' );
  }

  public function register_rest_routes() {
    require_once plugin_dir_path( __FILE__ ) . 'includes/class-icemap-rest-controller.php';
    $controller = new Icemap_REST_Controller();
    $controller->register_routes();
  }

  public function enqueue_google_maps_api() {
    $api_key = get_option( 'icemap_google_maps_api_key' );
    if ( ! empty( $api_key ) ) {
      wp_enqueue_script( 'google-maps-api', 'https://maps.googleapis.com/maps/api/js?key=' . $api_key, array(), '1.0.0', true );
    }
  }

  public function enqueue_scripts() {
    wp_enqueue_script( 'icemap-index', plugin_dir_url( __FILE__ ) . 'dist/index.js', array( 'wp-element' ), '1.0.0', true );
    wp_enqueue_style( 'icemap-index', plugin_dir_url( __FILE__ ) . 'dist/index.css', array(), '1.0.0' );
  }

  public function plugin_init() {
    require_once plugin_dir_path( __FILE__ ) . 'includes/class-icemap-settings.php';
    new Icemap_Settings();
  }
}

new Icemap();

?>
