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

	// Make sure Google Maps API is enqueued if available
	$api_key = get_option( 'icemap_google_maps_api_key' );
	$map_id = get_option( 'icemap_google_maps_map_id' );
	$default_latitude = get_option( 'icemap_default_latitude', '38.8683' );
	$default_longitude = get_option( 'icemap_default_longitude', '-107.5920' );

	if ( ! empty( $api_key ) ) {
		wp_enqueue_script( 'google-maps' );
	}

	// Build the HTML output
	$output = '<div id="root" class="icemap-container" style="height: ' . esc_attr( $height ) . '"></div>';

	// Add inline script to ensure Google Maps API key, Map ID, and default coordinates are set
	if ( ! empty( $api_key ) ) {
		$output .= '<script>
			// Make Google Maps API key available globally
			window.googleMapsApiKey = "' . esc_js( $api_key ) . '";
			// Make Google Maps Map ID available globally
			window.googleMapsMapId = "' . esc_js( $map_id ) . '";
			// Make default coordinates available globally
			window.defaultLatitude = ' . floatval( $default_latitude ) . ';
			window.defaultLongitude = ' . floatval( $default_longitude ) . ';
		</script>';
	}

	return $output;
}

class Icemap {
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
		add_action( 'plugins_loaded', array( $this, 'plugin_init' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_mapbox_gl' ) );
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

	public function enqueue_mapbox_gl() {
		// This method is kept for backward compatibility but now loads Google Maps instead
		$api_key = get_option( 'icemap_google_maps_api_key' );
		$map_id = get_option( 'icemap_google_maps_map_id' );
		$default_latitude = get_option( 'icemap_default_latitude', '38.8683' );
		$default_longitude = get_option( 'icemap_default_longitude', '-107.5920' );

		if ( ! empty( $api_key ) ) {
			// Load Google Maps API with marker library for Advanced Markers
			wp_enqueue_script( 'google-maps', 'https://maps.googleapis.com/maps/api/js?key=' . esc_attr( $api_key ) . '&libraries=marker&loading=async', array(), null, array( 'loading' => 'async' ) );

			// Add the API key, Map ID, and default coordinates to the page
			$inline_script = 'window.googleMapsApiKey = "' . esc_js( $api_key ) . '";';
			$inline_script .= 'window.googleMapsMapId = "' . esc_js( $map_id ) . '";';
			$inline_script .= 'window.defaultLatitude = ' . floatval( $default_latitude ) . ';';
			$inline_script .= 'window.defaultLongitude = ' . floatval( $default_longitude ) . ';';
			wp_add_inline_script( 'google-maps', $inline_script, 'after' );
		}
	}

	public function enqueue_scripts() {
		// Get the API key and default coordinates
		$api_key = get_option( 'icemap_google_maps_api_key' );
		$default_latitude = get_option( 'icemap_default_latitude', '38.8683' );
		$default_longitude = get_option( 'icemap_default_longitude', '-107.5920' );

		// Define dependencies - include google-maps if API key is available
		$dependencies = array( 'wp-element' );
		if ( ! empty( $api_key ) ) {
			$dependencies[] = 'google-maps';
		}

		// Enqueue the script with the appropriate dependencies
		wp_enqueue_script( 'icemap-index', plugin_dir_url( __FILE__ ) . 'dist/index.js', $dependencies, '1.0.0', true );
		wp_enqueue_style( 'icemap-index', plugin_dir_url( __FILE__ ) . 'dist/index.css', array(), '1.0.0' );

		// Add default coordinates as global variables
		$inline_script = 'window.defaultLatitude = ' . floatval( $default_latitude ) . ';';
		$inline_script .= 'window.defaultLongitude = ' . floatval( $default_longitude ) . ';';
		wp_add_inline_script( 'icemap-index', $inline_script, 'before' );
	}

	public function plugin_init() {
		require_once plugin_dir_path( __FILE__ ) . 'includes/class-icemap-settings.php';
		new Icemap_Settings();
	}
}

new Icemap();

?>
