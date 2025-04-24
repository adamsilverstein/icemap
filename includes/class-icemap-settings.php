<?php
/**
 * Settings Class
 */
class Icemap_Settings {

	public function __construct() {
		add_action( 'admin_menu', array( $this, 'add_settings_page' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
	}

	public function add_settings_page() {
		add_options_page(
			'Icemap Settings',
			'Icemap',
			'manage_options',
			'icemap-settings',
			array( $this, 'render_settings_page' )
		);
	}

	public function register_settings() {
		register_setting(
			'icemap_settings',
			'icemap_server'
		);

		register_setting(
			'icemap_settings',
			'icemap_mount'
		);

		register_setting(
			'icemap_settings',
			'icemap_google_maps_api_key'
		);

		register_setting(
			'icemap_settings',
			'icemap_google_maps_map_id'
		);

		register_setting(
			'icemap_settings',
			'icemap_username'
		);

		register_setting(
			'icemap_settings',
			'icemap_password'
		);

		register_setting(
			'icemap_settings',
			'icemap_default_latitude',
			array(
				'sanitize_callback' => array( $this, 'sanitize_coordinate' )
			)
		);

		register_setting(
			'icemap_settings',
			'icemap_default_longitude',
			array(
				'sanitize_callback' => array( $this, 'sanitize_coordinate' )
			)
		);

		register_setting(
			'icemap_settings',
			'icemap_path',
			array(
				'sanitize_callback' => 'sanitize_text_field'
			)
		);

		add_settings_section(
			'icemap_settings_section',
			'Icemap Settings',
			array( $this, 'render_settings_section' ),
			'icemap-settings'
		);

		add_settings_field(
			'icemap_server',
			'Icecast Server',
			array( $this, 'render_text_field' ),
			'icemap-settings',
			'icemap_settings_section',
			array(
				'label_for' => 'icemap_server'
			)
		);

		add_settings_field(
			'icemap_mount',
			'Icecast Mount Point',
			array( $this, 'render_text_field' ),
			'icemap-settings',
			'icemap_settings_section',
			array(
				'label_for' => 'icemap_mount'
			)
		);

		add_settings_field(
			'icemap_google_maps_api_key',
			'Google Maps API Key',
			array( $this, 'render_password_field' ),
			'icemap-settings',
			'icemap_settings_section',
			array(
				'label_for' => 'icemap_google_maps_api_key'
			)
		);

		add_settings_field(
			'icemap_google_maps_map_id',
			'Google Maps Map ID',
			array( $this, 'render_text_field_with_description' ),
			'icemap-settings',
			'icemap_settings_section',
			array(
				'label_for' => 'icemap_google_maps_map_id',
				'description' => 'Required for Advanced Markers. Create a Map ID in the <a href="https://console.cloud.google.com/google/maps-apis/map-ids" target="_blank">Google Cloud Console</a> under Google Maps Platform > Maps Management.'
			)
		);

		add_settings_field(
			'icemap_username',
			'Icecast Username',
			array( $this, 'render_text_field' ),
			'icemap-settings',
			'icemap_settings_section',
			array(
				'label_for' => 'icemap_username'
			)
		);

		add_settings_field(
			'icemap_password',
			'Icecast Password',
			array( $this, 'render_password_field' ),
			'icemap-settings',
			'icemap_settings_section',
			array(
				'label_for' => 'icemap_password'
			)
		);

		add_settings_field(
			'icemap_default_latitude',
			'Default Latitude',
			array( $this, 'render_text_field_with_description' ),
			'icemap-settings',
			'icemap_settings_section',
			array(
				'label_for' => 'icemap_default_latitude',
				'description' => 'Default latitude to use when geolocation fails (e.g., 38.8683)'
			)
		);

		add_settings_field(
			'icemap_default_longitude',
			'Default Longitude',
			array( $this, 'render_text_field_with_description' ),
			'icemap-settings',
			'icemap_settings_section',
			array(
				'label_for' => 'icemap_default_longitude',
				'description' => 'Default longitude to use when geolocation fails (e.g., -107.5920)'
			)
		);

		add_settings_field(
			'icemap_path',
			'Icemap Path',
			array( $this, 'render_text_field_with_description' ),
			'icemap-settings',
			'icemap_settings_section',
			array(
				'label_for' => 'icemap_path',
				'description' => 'Enter a path like \'maps/icemap\' for the full-screen map. Leave blank to disable.'
			)
		);
	}

	public function render_settings_section() {
		echo '<p>Enter your Icecast server details, Google Maps API key/Map ID, default location coordinates, and optional full-screen map path.</p>';
	}

	public function render_text_field( $args ) {
		$name = $args['label_for'];
		$value = get_option( $name );
		echo '<input type="text" name="' . $name . '" id="' . $name . '" value="' . $value . '" class="regular-text code"/>';
	}

	/**
	 * Render a text field with description.
	 */
	public function render_text_field_with_description( $args ) {
		$name = $args['label_for'];
		$value = get_option( $name );
		$description = isset( $args['description'] ) ? $args['description'] : '';

		echo '<input type="text" name="' . $name . '" id="' . $name . '" value="' . $value . '" class="regular-text code"/>';

		if ( ! empty( $description ) ) {
			echo '<p class="description">' . $description . '</p>';
		}
	}

	/**
	 * Render a password field.
	 */
	public function render_password_field( $args ) {
		$name = $args['label_for'];
		$value = get_option( $name );
		echo '<input type="password" name="' . $name . '" id="' . $name . '" value="' . $value . '" class="regular-text code"/>';
	}

	/**
	 * Sanitize coordinate values to ensure they are valid numbers.
	 *
	 * @param string $value The coordinate value to sanitize.
	 * @return float|string The sanitized coordinate value.
	 */
	public function sanitize_coordinate( $value ) {
		// Remove any non-numeric characters except decimal point and minus sign
		$value = preg_replace( '/[^0-9.-]/', '', $value );

		// Convert to float
		$float_value = floatval( $value );

		// Check if it's a valid coordinate
		if ( is_numeric( $value ) ) {
			return $float_value;
		}

		// Return default value if invalid
		return '';
	}

	/**
	 * Render the settings page.
	 */
	public function render_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
			<form action="options.php" method="post">
				<?php
				settings_fields( 'icemap_settings' );
				do_settings_sections( 'icemap-settings' );
				submit_button( 'Save Settings' );
				?>
			</form>
		</div>
		<?php
	}
}
