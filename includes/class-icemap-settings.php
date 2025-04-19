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
      array( $this, 'render_text_field' ),
      'icemap-settings',
      'icemap_settings_section',
      array(
        'label_for' => 'icemap_google_maps_api_key'
      )
    );
  }

  public function render_settings_section() {
    echo '<p>Enter your Icecast server, mount point, and Google Maps API key.</p>';
  }

  public function render_text_field( $args ) {
    $name = $args['label_for'];
    $value = get_option( $name );
    echo '<input type="text" name="' . $name . '" id="' . $name . '" value="' . $value . '" />';
  }
}
