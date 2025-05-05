# Icemap WordPress Plugin

A WordPress plugin that displays a map of Icecast listeners on your website.

## Requirements

- WordPress 5.0 or higher
- PHP 7.4 or higher
- Composer (for development/installation)

## Installation

1. Clone or download this repository to your WordPress plugins directory
2. Navigate to the plugin directory and run:
   ```
   composer install
   ```
3. Activate the plugin through the WordPress admin interface

## Dependencies

This plugin uses the following PHP libraries (automatically installed via Composer):

- **symfony/dom-crawler**: For XML parsing
- **symfony/css-selector**: Required by the DOM Crawler
- **masterminds/html5**: HTML5 parser used by the DOM Crawler

## Configuration

1. Go to Settings > Icemap in your WordPress admin
2. Enter your Icecast server details:
   - Server URL
   - Mount point
   - Username
   - Password
3. Configure map settings:
   - Google Maps API Key (if using Google Maps)
   - Default latitude/longitude
   - Map ID (for Google Maps styling)

## Usage

Use the Icemap block in the WordPress block editor, or add the following shortcode to your posts or pages:

```
[icemap height="400px"]
```

## Troubleshooting

If you encounter any issues with the plugin, check the following:

1. Make sure you've run `composer install` in the plugin directory
2. Verify your Icecast server credentials are correct
3. Check your server's error logs for any PHP errors

## License

This plugin is licensed under the GPL v2 or later.
