<?php
/**
 * Plugin Name: Icemap
 * Plugin URI: https://example.com/icemap
 * Description: Displays a map of Icecast listeners on a WordPress website.
 * Version: 1.0.0
 * Author: Your Name
 * Author URI: https://example.com
 * Requires PHP: 7.4
 * Requires at least: 5.0
 * Text Domain: icemap
 * Domain Path: /languages
 *
 * This plugin uses Composer packages to handle XML parsing instead of relying on the SimpleXML PHP extension.
 */

// Load Composer autoloader if it exists
if (file_exists(plugin_dir_path(__FILE__) . 'vendor/autoload.php')) {
    require_once plugin_dir_path(__FILE__) . 'vendor/autoload.php';
} else {
    // Add an admin notice if the Composer dependencies are not installed
    add_action('admin_notices', 'icemap_missing_composer_dependencies_notice');

    // Disable plugin functionality
    return;
}

/**
 * Display an admin notice if Composer dependencies are missing.
 */
function icemap_missing_composer_dependencies_notice() {
    ?>
    <div class="notice notice-error">
        <p>
            <strong>Icemap Plugin Error:</strong> Composer dependencies are missing.
            Please run <code>composer install</code> in the plugin directory to install required dependencies.
        </p>
        <p>
            See the <a href="<?php echo esc_url(plugin_dir_url(__FILE__) . 'README.md'); ?>">README.md</a> file for installation instructions.
        </p>
    </div>
    <?php
}

// Register the block
function icemap_register_block() {
	// Check if Gutenberg is available
	if ( ! function_exists( 'register_block_type' ) ) {
		return;
	}

	// Register the block
	register_block_type( 'icemap/map', array(
		'editor_script'   => 'icemap-block-editor',
		'editor_style'    => 'icemap-block-editor',
		'render_callback' => 'icemap_render_block',
		'attributes'      => array(
			'height' => array(
				'type'    => 'string',
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
		add_action( 'template_redirect', array( $this, 'handle_fullscreen_map_request' ) );

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
		// This method is now primarily for adding inline data if Google Maps is loaded.
		// The actual enqueuing happens in enqueue_scripts.
		$api_key = get_option( 'icemap_google_maps_api_key' );
		$map_id = get_option( 'icemap_google_maps_map_id' );

		// Only add this data if the google-maps script is expected to be loaded.
		if ( ! empty( $api_key ) && wp_script_is( 'google-maps', 'registered' ) ) {
			// Add the API key and Map ID to the page, attached to the google-maps handle.
			// Note: Default coords are added in enqueue_scripts, attached to icemap-index.
			$inline_script  = 'window.googleMapsApiKey = "' . esc_js( $api_key ) . '";';
			$inline_script .= 'window.googleMapsMapId = "' . esc_js( $map_id ) . '";';
			// Attach to google-maps handle if it exists and is registered.
			wp_add_inline_script( 'google-maps', $inline_script, 'before' );
		}
	}

	public function enqueue_scripts() {
		// Get the API key and default coordinates
		$api_key = get_option( 'icemap_google_maps_api_key' );
		$default_latitude = get_option( 'icemap_default_latitude', '38.8683' );
		$default_longitude = get_option( 'icemap_default_longitude', '-107.5920' );

		// Define base dependencies
		$dependencies = array( 'wp-element' );

		// Conditionally register and add Google Maps as a dependency
		if ( ! empty( $api_key ) ) {
			// Register Google Maps script if not already registered
			if ( ! wp_script_is( 'google-maps', 'registered' ) ) {
				wp_register_script( 'google-maps', 'https://maps.googleapis.com/maps/api/js?key=' . esc_attr( $api_key ) . '&libraries=marker&loading=async', array(), null, array( 'strategy' => 'async' ) );
			}
			// Add google-maps as a dependency for our main script
			$dependencies[] = 'google-maps';
			// Enqueue google-maps explicitly (registration alone doesn't load it)
			wp_enqueue_script( 'google-maps' );
		}

		// Enqueue the main app script with its dependencies
		wp_enqueue_script( 'icemap-index', plugin_dir_url( __FILE__ ) . 'dist/index.js', $dependencies, '1.0.0', true );
		wp_enqueue_style( 'icemap-index', plugin_dir_url( __FILE__ ) . 'dist/index.css', array(), '1.0.0' );

		// Add default coordinates as global variables, attached to our main script
		$inline_script_coords  = 'window.defaultLatitude = ' . floatval( $default_latitude ) . ';';
		$inline_script_coords .= 'window.defaultLongitude = ' . floatval( $default_longitude ) . ';';
		wp_add_inline_script( 'icemap-index', $inline_script_coords, 'before' );
	}

	public function plugin_init() {
		require_once plugin_dir_path( __FILE__ ) . 'includes/class-icemap-settings.php';
		new Icemap_Settings();
	}

	/**
	 * Handles requests for the full-screen map path.
	 */
	public function handle_fullscreen_map_request() {
		$icemap_path = trim( get_option( 'icemap_path', '' ), '/' );

		// If the path setting is empty, do nothing.
		if ( empty( $icemap_path ) ) {
			return;
		}

		// Get the current request path.
		$current_path = trim( parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH ), '/' );

		// Check if the current request matches the configured path.
		if ( $current_path === $icemap_path ) {
			// Get necessary options.
			$api_key           = get_option( 'icemap_google_maps_api_key' );
			$map_id            = get_option( 'icemap_google_maps_map_id' );
			$default_latitude  = get_option( 'icemap_default_latitude', '38.8683' );
			$default_longitude = get_option( 'icemap_default_longitude', '-107.5920' );

			remove_action( 'wp_print_styles', 'print_emoji_styles' );

			// Start outputting the minimal HTML page.
			?>
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Icemap</title>
				<style>
					html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; }
					#root { height: 100%; width: 100%; }
					#wpadminbar { display: none !important; }
					html { margin-top: 0 !important; }
				</style>
				<?php
				$this->enqueue_scripts();
				wp_print_styles();
				wp_print_head_scripts();
				?>
			</head>
			<body>
				<div id="root" class="icemap-container">Loading Map...</div>
				<?php
				// Add inline script data.
				$inline_script  = 'window.googleMapsApiKey = "' . esc_js( $api_key ) . '";';
				$inline_script .= 'window.googleMapsMapId = "' . esc_js( $map_id ) . '";';
				$inline_script .= 'window.defaultLatitude = ' . floatval( $default_latitude ) . ';';
				$inline_script .= 'window.defaultLongitude = ' . floatval( $default_longitude ) . ';';
				// Use wp_add_inline_script attached to the main script handle.
				wp_add_inline_script( 'icemap-index', $inline_script, 'before' );

				// Print footer scripts.
				wp_print_footer_scripts();
				?>
			</body>
			</html>
			<?php
			exit;
		}
	}
}

new Icemap();

?>
