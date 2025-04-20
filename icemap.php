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

	// Make sure Mapbox GL JS is enqueued if available
	$access_token = get_option( 'icemap_mapbox_access_token' );
	if ( ! empty( $access_token ) ) {
		wp_enqueue_script( 'mapbox-gl' );
		wp_enqueue_style( 'mapbox-gl' );
	}

	// Build the HTML output
	$output = '<div id="root" class="icemap-container" style="height: ' . esc_attr( $height ) . '"></div>';

	// Add inline script to ensure mapboxgl is available and access token is set
	if ( ! empty( $access_token ) ) {
		$output .= '<script>
			// Ensure mapboxgl is defined and access token is set
			if (typeof window.mapboxgl !== "undefined") {
				// Make sure mapboxgl is available globally
				window.mapboxgl.accessToken = "' . esc_js( $access_token ) . '";
			} else {
				console.error("Mapbox GL JS is not loaded. Please check if the script is being blocked.");
			}
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
		$access_token = get_option( 'icemap_mapbox_access_token' );
		if ( ! empty( $access_token ) ) {
			// Load in header (false) to ensure it's available before our component tries to use it
			wp_enqueue_script( 'mapbox-gl', 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js', array(), '2.15.0', false );
			wp_enqueue_style( 'mapbox-gl', 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css', array(), '2.15.0' );

			// Add the access token to the page - use 'after' to ensure it runs after the script is loaded
			wp_add_inline_script( 'mapbox-gl', 'window.mapboxgl.accessToken = "' . esc_js( $access_token ) . '";', 'after' );
		}
	}

	public function enqueue_scripts() {
		// Get the access token
		$access_token = get_option( 'icemap_mapbox_access_token' );

		// Define dependencies - include mapbox-gl if access token is available
		$dependencies = array( 'wp-element' );
		if ( ! empty( $access_token ) ) {
			$dependencies[] = 'mapbox-gl';
		}

		// Enqueue the script with the appropriate dependencies
		wp_enqueue_script( 'icemap-index', plugin_dir_url( __FILE__ ) . 'dist/index.js', $dependencies, '1.0.0', true );
		wp_enqueue_style( 'icemap-index', plugin_dir_url( __FILE__ ) . 'dist/index.css', array(), '1.0.0' );
	}

	public function plugin_init() {
		require_once plugin_dir_path( __FILE__ ) . 'includes/class-icemap-settings.php';
		new Icemap_Settings();
	}
}

new Icemap();

?>
