<?php
/**
 * Plugin Name:  Hidden Deals Dashboard
 * Description:  View repossessed & undervalued property listings inside the WordPress admin.
 * Version:      1.0.0
 * Author:       coder79
 * Text Domain:  hidden-deals
 */

if (!defined('ABSPATH')) {
    exit; // Prevent direct access
}

class Hidden_Deals_Plugin
{

    /** @var string  Path to the plugin directory */
    private $plugin_dir;

    /** @var string  URL to the plugin directory */
    private $plugin_url;

    /** @var string  API endpoint for listings */
    private $api_url;

    public function __construct()
    {
        $this->plugin_dir = plugin_dir_path(__FILE__);
        $this->plugin_url = plugin_dir_url(__FILE__);
        $this->api_url = defined('HIDDEN_DEALS_API_URL')
            ? HIDDEN_DEALS_API_URL
            : 'https://listing.sericap.online/api/listings';

        add_action('admin_menu', [$this, 'register_admin_menu']);
    }

    // -----------------------------------------------------------------
    // Admin Menu
    // -----------------------------------------------------------------

    /**
     * Register a top-level "Hidden Deals" menu page in wp-admin.
     */
    public function register_admin_menu()
    {
        add_menu_page(
            'Hidden Deals',                      // Page title
            'Hidden Deals',                      // Menu title
            'manage_options',                    // Capability
            'hidden-deals',                      // Menu slug
            [$this, 'render_admin_page'],      // Callback
            'dashicons-building',                // Icon
            25                                   // Position
        );
    }

    // -----------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------

    /**
     * Render the admin page — enqueue React bundle and output the mount div.
     */
    public function render_admin_page()
    {
        $this->enqueue_assets();
        ?>
        <div class="wrap" style="margin: 0; padding: 0; max-width: none;">
            <div id="hidden-deals-root"></div>
        </div>
        <?php
    }

    // -----------------------------------------------------------------
    // Assets
    // -----------------------------------------------------------------

    /**
     * Enqueue the compiled React app (JS + CSS) and pass config via
     * wp_localize_script so the front-end knows the API URL.
     */
    private function enqueue_assets()
    {
        $build_dir = $this->plugin_dir . 'build/';
        $build_url = $this->plugin_url . 'build/';

        // JS bundle
        if (file_exists($build_dir . 'hidden-deals.js')) {
            wp_enqueue_script(
                'hidden-deals-app',
                $build_url . 'hidden-deals.js',
                [],                              // No WP deps needed
                filemtime($build_dir . 'hidden-deals.js'),
                true                             // Load in footer
            );

            // Pass configuration to the React app
            wp_add_inline_script(
                'hidden-deals-app',
                'window.hiddenDealsConfig = ' . wp_json_encode([
                    'apiUrl' => esc_url($this->api_url),
                    'nonce' => wp_create_nonce('hidden_deals_nonce'),
                    'adminUrl' => admin_url(),
                ]) . ';',
                'before'
            );

            // Add type="module" for ES module imports
            add_filter('script_loader_tag', function ($tag, $handle) {
                if ($handle === 'hidden-deals-app') {
                    $tag = str_replace(' src', ' type="module" crossorigin src', $tag);
                }
                return $tag;
            }, 10, 2);
        }

        // CSS bundle
        if (file_exists($build_dir . 'hidden-deals.css')) {
            wp_enqueue_style(
                'hidden-deals-styles',
                $build_url . 'hidden-deals.css',
                [],
                filemtime($build_dir . 'hidden-deals.css')
            );
        }

        // Remove WP admin default padding/margin for our page
        echo '<style>
            #wpbody-content { padding-bottom: 0 !important; }
            #hidden-deals-root { margin: -20px 0 0 -20px; }
        </style>';
    }
}

// Bootstrap the plugin
new Hidden_Deals_Plugin();
