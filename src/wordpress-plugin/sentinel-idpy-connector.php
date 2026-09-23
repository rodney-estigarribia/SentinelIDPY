<?php
/**
 * Plugin Name: SentinelIDPY Connector
 * Description: Conector REST API para reportes de mantenimiento, infraestructura y seguridad personalizados de SentinelIDPY.
 * Author: Rodney Estigarribia - Impulsos Digitales
 * Version: 4.6
 */

// Evitar acceso directo
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Clear OPcache on activation so fresh code is always loaded after updates
register_activation_hook( __FILE__, function() {
    if ( function_exists( 'opcache_invalidate' ) ) {
        opcache_invalidate( __FILE__, true );
    }
    if ( function_exists( 'opcache_reset' ) ) {
        opcache_reset();
    }
} );

// --- Auto-update via GitHub Releases ---
define( 'SENTINEL_PLUGIN_VERSION', '4.6' );
define( 'SENTINEL_GITHUB_REPO', 'rodney-estigarribia/SentinelIDPY' );

add_filter( 'pre_set_site_transient_update_plugins', 'sentinel_check_for_update' );
add_filter( 'plugins_api', 'sentinel_plugin_info', 10, 3 );

function sentinel_check_for_update( $transient ) {
    if ( empty( $transient->checked ) ) {
        return $transient;
    }

    $plugin_slug = plugin_basename( __FILE__ );
    $cache_key   = 'sentinel_update_check';
    $cached      = get_transient( $cache_key );

    if ( false === $cached ) {
        $remote = wp_remote_get(
            'https://api.github.com/repos/' . SENTINEL_GITHUB_REPO . '/releases/latest',
            array(
                'timeout' => 10,
                'headers' => array( 'Accept' => 'application/vnd.github.v3+json', 'User-Agent' => 'WordPress/' . get_bloginfo('version') ),
            )
        );

        if ( is_wp_error( $remote ) || 200 !== wp_remote_retrieve_response_code( $remote ) ) {
            set_transient( $cache_key, array(), 5 * MINUTE_IN_SECONDS );
            return $transient;
        }

        $release = json_decode( wp_remote_retrieve_body( $remote ) );
        $cached  = array();

        if ( $release && isset( $release->tag_name ) ) {
            $download_url = '';
            if ( ! empty( $release->assets ) ) {
                foreach ( $release->assets as $asset ) {
                    if ( substr( $asset->name, -4 ) === '.zip' ) {
                        $download_url = $asset->browser_download_url;
                        break;
                    }
                }
            }
            $cached = array(
                'version'      => ltrim( $release->tag_name, 'v' ),
                'download_url' => $download_url,
            );
        }

        set_transient( $cache_key, $cached, 6 * HOUR_IN_SECONDS );
    }

    if ( ! empty( $cached['version'] ) && ! empty( $cached['download_url'] )
        && version_compare( $cached['version'], SENTINEL_PLUGIN_VERSION, '>' ) ) {
        $transient->response[ $plugin_slug ] = (object) array(
            'slug'        => dirname( $plugin_slug ),
            'plugin'      => $plugin_slug,
            'new_version' => $cached['version'],
            'url'         => 'https://github.com/' . SENTINEL_GITHUB_REPO,
            'package'     => $cached['download_url'],
        );
    }

    return $transient;
}

function sentinel_plugin_info( $res, $action, $args ) {
    if ( 'plugin_information' !== $action ) {
        return $res;
    }
    $plugin_slug = dirname( plugin_basename( __FILE__ ) );
    if ( ! isset( $args->slug ) || $args->slug !== $plugin_slug ) {
        return $res;
    }
    return (object) array(
        'name'         => 'SentinelIDPY Connector',
        'slug'         => $plugin_slug,
        'version'      => SENTINEL_PLUGIN_VERSION,
        'author'       => 'Impulsos Digitales',
        'homepage'     => 'https://github.com/' . SENTINEL_GITHUB_REPO,
        'requires'     => '5.6',
        'tested'       => '6.5',
        'last_updated' => date( 'Y-m-d' ),
        'sections'     => array( 'description' => 'Conector REST API para reportes SentinelIDPY.' ),
    );
}
// --- Fin auto-update ---

add_action( 'rest_api_init', function () {
    register_rest_route( 'sentinel/v1', '/stats', array(
        'methods'  => 'GET',
        'callback' => 'get_wordfence_blocked_stats',
        'permission_callback' => 'verify_wf_report_token'
    ) );
    // Debug endpoint - no auth required
    register_rest_route( 'sentinel/v1', '/debug-headers', array(
        'methods'  => 'GET',
        'callback' => 'sentinel_debug_headers',
        'permission_callback' => '__return_true'
    ) );
    // Updates
    register_rest_route( 'sentinel/v1', '/updates', array(
        'methods'  => 'GET',
        'callback' => 'sentinel_get_updates',
        'permission_callback' => 'verify_wf_report_token'
    ) );
    register_rest_route( 'sentinel/v1', '/updates/apply', array(
        'methods'  => 'POST',
        'callback' => 'sentinel_apply_updates',
        'permission_callback' => 'verify_wf_report_token'
    ) );
    // MainWP Bridge (cuando MainWP Dashboard está presente en el sitio)
    register_rest_route( 'sentinel/v1', '/mainwp/updates', array(
        'methods'  => 'GET',
        'callback' => 'sentinel_get_mainwp_updates',
        'permission_callback' => 'verify_wf_report_token'
    ) );
    // Plugins
    register_rest_route( 'sentinel/v1', '/plugins', array(
        'methods'  => 'GET',
        'callback' => 'sentinel_get_plugins',
        'permission_callback' => 'verify_wf_report_token'
    ) );
    register_rest_route( 'sentinel/v1', '/plugins/install', array(
        'methods'  => 'POST',
        'callback' => 'sentinel_install_plugin',
        'permission_callback' => 'verify_wf_report_token'
    ) );
    register_rest_route( 'sentinel/v1', '/plugins/toggle', array(
        'methods'  => 'POST',
        'callback' => 'sentinel_toggle_plugin',
        'permission_callback' => 'verify_wf_report_token'
    ) );
    // Themes
    register_rest_route( 'sentinel/v1', '/themes', array(
        'methods'  => 'GET',
        'callback' => 'sentinel_get_themes',
        'permission_callback' => 'verify_wf_report_token'
    ) );
    // Users
    register_rest_route( 'sentinel/v1', '/users', array(
        'methods'  => 'GET',
        'callback' => 'sentinel_get_users',
        'permission_callback' => 'verify_wf_report_token'
    ) );
    register_rest_route( 'sentinel/v1', '/users/reset-password', array(
        'methods'  => 'POST',
        'callback' => 'sentinel_reset_user_password',
        'permission_callback' => 'verify_wf_report_token'
    ) );
    // Backups
    register_rest_route( 'sentinel/v1', '/backups', array(
        'methods'  => 'GET',
        'callback' => 'sentinel_get_backups',
        'permission_callback' => 'verify_wf_report_token'
    ) );
    register_rest_route( 'sentinel/v1', '/backups/run', array(
        'methods'  => 'POST',
        'callback' => 'sentinel_run_backup',
        'permission_callback' => 'verify_wf_report_token'
    ) );
    // Agency Branding & White Label
    register_rest_route( 'sentinel/v1', '/agency/branding', array(
        array(
            'methods'  => 'GET',
            'callback' => 'sentinel_get_branding',
            'permission_callback' => 'verify_wf_report_token'
        ),
        array(
            'methods'  => 'POST',
            'callback' => 'sentinel_set_branding',
            'permission_callback' => 'verify_wf_report_token'
        )
    ) );
    // Admin Widgets
    register_rest_route( 'sentinel/v1', '/admin/widgets', array(
        array(
            'methods'  => 'GET',
            'callback' => 'sentinel_get_widgets',
            'permission_callback' => 'verify_wf_report_token'
        ),
        array(
            'methods'  => 'POST',
            'callback' => 'sentinel_set_widgets',
            'permission_callback' => 'verify_wf_report_token'
        )
    ) );
    // Performance & Cache
    register_rest_route( 'sentinel/v1', '/performance', array(
        'methods'  => 'GET',
        'callback' => 'sentinel_get_performance',
        'permission_callback' => 'verify_wf_report_token'
    ) );
    register_rest_route( 'sentinel/v1', '/performance/purge', array(
        'methods'  => 'POST',
        'callback' => 'sentinel_purge_cache',
        'permission_callback' => 'verify_wf_report_token'
    ) );
    // Config Templates & Drift
    register_rest_route( 'sentinel/v1', '/config/export', array(
        'methods'  => 'GET',
        'callback' => 'sentinel_export_config',
        'permission_callback' => 'verify_wf_report_token'
    ) );
    register_rest_route( 'sentinel/v1', '/config/apply', array(
        'methods'  => 'POST',
        'callback' => 'sentinel_apply_config',
        'permission_callback' => 'verify_wf_report_token'
    ) );
    // Analytics (6-month local summary)
    register_rest_route( 'sentinel/v1', '/analytics/summary', array(
        'methods'  => 'GET',
        'callback' => 'sentinel_get_analytics_summary',
        'permission_callback' => 'verify_wf_report_token'
    ) );
} );

/**
 * Obtiene el token de seguridad desde WordPress options.
 * Se lee desde la opción WordPress 'sentinel_idpy_report_token' (configurable en Admin).
 * Longitud mínima recomendada: 32 caracteres.
 */
function get_wf_report_token() {
    return get_option('sentinel_idpy_report_token', '');
}

// Admin Settings Page
add_action('admin_menu', 'sentinel_add_settings_page');
add_action('admin_init', 'sentinel_register_settings');

function sentinel_add_settings_page() {
    add_options_page(
        'SentinelIDPY',
        'SentinelIDPY',
        'manage_options',
        'sentinel-idpy',
        'sentinel_render_settings_page'
    );
}

function sentinel_register_settings() {
    register_setting('sentinel_idpy_group', 'sentinel_idpy_report_token', [
        'sanitize_callback' => 'sentinel_sanitize_token'
    ]);
    add_settings_section('sentinel_main', 'Configuración', null, 'sentinel-idpy');
    add_settings_field('sentinel_token_field', 'Token de Seguridad', 'sentinel_render_token_field', 'sentinel-idpy', 'sentinel_main');
}

function sentinel_sanitize_token($value) {
    $value = sanitize_text_field($value);
    if (strlen($value) < 32) {
        add_settings_error('sentinel_idpy_report_token', 'token_too_short', 'El token debe tener al menos 32 caracteres.');
        return get_option('sentinel_idpy_report_token', '');
    }
    return $value;
}

function sentinel_render_settings_page() {
    if (!current_user_can('manage_options')) return;
    ?>
    <div class="wrap">
        <h1>SentinelIDPY — Configuración</h1>
        <?php settings_errors(); ?>
        <form method="post" action="options.php">
            <?php
            settings_fields('sentinel_idpy_group');
            do_settings_sections('sentinel-idpy');
            submit_button('Guardar Token');
            ?>
        </form>
    </div>
    <?php
}

function sentinel_render_token_field() {
    $token = esc_attr(get_option('sentinel_idpy_report_token', ''));
    echo '<input type="password" name="sentinel_idpy_report_token" value="' . $token . '" size="70" />';
    echo '<p class="description">Debe coincidir con el WF_REPORT_TOKEN configurado en tu bot. Mínimo 32 caracteres.</p>';
}

/**
 * Verifica que el header X-WF-Report-Token coincida con la constante interna.
 */
function verify_wf_report_token( WP_REST_Request $request ) {
    $secret_token = get_wf_report_token();

    // Forzamos que el token sea fuerte (ej. un UUID o Hash SHA de 32+ caracteres) para evitar fuerza bruta.
    if ( strlen( $secret_token ) < 32 ) {
        error_log('Sentinel: Token no configurado o muy corto. Longitud: ' . strlen($secret_token));
        return new WP_Error(
            'rest_forbidden',
            esc_html__( 'El token de seguridad no está configurado o es demasiado corto. Configúralo en Configuración → SentinelIDPY con al menos 32 caracteres.', 'text-domain' ),
            array( 'status' => 500 )
        );
    }

    // Try multiple ways to get the header since Docker/proxy might handle it differently
    $provided_token = $request->get_header( 'x_wf_report_token' );

    // Fallback: Try with hyphen format
    if ( ! $provided_token ) {
        $provided_token = $request->get_header( 'x-wf-report-token' );
    }

    // Fallback: Try direct $_SERVER access
    if ( ! $provided_token ) {
        $provided_token = isset( $_SERVER['HTTP_X_WF_REPORT_TOKEN'] ) ? sanitize_text_field( $_SERVER['HTTP_X_WF_REPORT_TOKEN'] ) : null;
    }

    // Fallback: Try query parameter (useful if headers are stripped by proxy/WAF)
    if ( ! $provided_token ) {
        $provided_token = $request->get_param( 'token' );
        if ( $provided_token ) {
            $provided_token = sanitize_text_field( $provided_token );
        }
    }

    error_log('Sentinel: Provided token: ' . ($provided_token ? substr($provided_token, 0, 10) . '...' : 'NULL'));
    error_log('Sentinel: Expected token: ' . substr($secret_token, 0, 10) . '...');
    error_log('Sentinel: Token match: ' . ($provided_token === $secret_token ? 'YES' : 'NO'));

    if ( $provided_token === $secret_token ) {
        return true;
    }

    return new WP_Error(
        'rest_forbidden',
        esc_html__( 'Token inválido o faltante.', 'text-domain' ),
        array( 'status' => 403 )
    );
}

/**
 * Extrae datos de Matomo Analytics si el plugin está instalado y activo.
 */
function sentinel_get_matomo_data(&$debug_msg, $matomo_period = 'month', $matomo_date = 'today', $matomo_prev_date = 'lastMonth') {
    if ( ! class_exists( '\WpMatomo\Bootstrap' ) ) {
        $debug_msg = 'Matomo For WordPress no detectado (clase \WpMatomo\Bootstrap no existe)';
        error_log( 'Sentinel: ' . $debug_msg );
        return null;
    }

    try {
        $site = new \WpMatomo\Site();
        $idSite = $site->get_current_matomo_site_id();

        if ( empty( $idSite ) ) {
            $debug_msg = 'ID del sitio no encontrado en las configuraciones de Matomo For WordPress';
            error_log( 'Sentinel: ' . $debug_msg );
            return null;
        }

        \WpMatomo\Bootstrap::do_bootstrap();

        // Elevar temporalmente privilegios de Matomo para permitir peticiones por la REST API remota (unlogged)
        $matomo_access = \Piwik\Access::getInstance();
        $was_super_user = $matomo_access->hasSuperUserAccess();
        if ( ! $was_super_user ) {
            $matomo_access->setSuperUserAccess( true );
        }

        // Resumen de visitas del mes actual
        $visits_data = \Piwik\API\Request::processRequest( 'VisitsSummary.get', array(
            'idSite' => $idSite,
            'period' => $matomo_period,
            'date'   => $matomo_date,
            'format' => 'original',
        ) );

        // Top paginas del mes actual
        $pages_data = \Piwik\API\Request::processRequest( 'Actions.getPageUrls', array(
            'idSite'       => $idSite,
            'period'       => $matomo_period,
            'date'         => $matomo_date,
            'format'       => 'original',
            'flat'         => 1,
            'filter_limit' => 5,
        ) );

        // Extraer resumen de visitas
        // NOTE: DataTable::getColumns() returns column NAMES (not values) — must use getFirstRow()->getColumns()
        $summary = array();
        if ( $visits_data instanceof \Piwik\DataTable\Map ) {
            // Range period with daily/weekly breakdown — merge all sub-tables
            $merged = $visits_data->mergeChildren();
            $row = $merged->getFirstRow();
            $summary = $row ? $row->getColumns() : array();
        } elseif ( $visits_data instanceof \Piwik\DataTable ) {
            $row = $visits_data->getFirstRow();
            $summary = $row ? $row->getColumns() : array();
        } elseif ( is_array( $visits_data ) ) {
            $summary = $visits_data;
        }

        error_log( 'Sentinel: Matomo data retrieved - visits=' . ( $summary['nb_visits'] ?? 0 ) . ', visitors=' . ( $summary['nb_uniq_visitors'] ?? 0 ) . ', actions=' . ( $summary['nb_actions'] ?? 0 ) . ', data_class=' . ( is_object($visits_data) ? get_class($visits_data) : 'array' ) );

        // Extraer top paginas
        $top_pages = array();
        if ( is_object( $pages_data ) && method_exists( $pages_data, 'getRows' ) ) {
            foreach ( $pages_data->getRows() as $row ) {
                $cols = $row->getColumns();
                $top_pages[] = array(
                    'label'            => $cols['label'] ?? '',
                    'nb_visits'        => $cols['nb_visits'] ?? 0,
                    'nb_hits'          => $cols['nb_hits'] ?? 0,
                    'avg_time_on_page' => $cols['avg_time_on_page'] ?? 0,
                );
            }
        }

        error_log( 'Sentinel: Matomo top pages returned: ' . count( $top_pages ) );

        // Resumen del mes anterior (para trends month-over-month)
        $prev_month_data = \Piwik\API\Request::processRequest( 'VisitsSummary.get', array(
            'idSite' => $idSite,
            'period' => $matomo_period,
            'date'   => $matomo_prev_date,
            'format' => 'original',
        ) );

        $prev_summary = array();
        if ( $prev_month_data instanceof \Piwik\DataTable\Map ) {
            $merged_prev = $prev_month_data->mergeChildren();
            $prev_row = $merged_prev->getFirstRow();
            $prev_summary = $prev_row ? $prev_row->getColumns() : array();
        } elseif ( $prev_month_data instanceof \Piwik\DataTable ) {
            $prev_row = $prev_month_data->getFirstRow();
            $prev_summary = $prev_row ? $prev_row->getColumns() : array();
        } elseif ( is_array( $prev_month_data ) ) {
            $prev_summary = $prev_month_data;
        }

        error_log( 'Sentinel: Matomo prev month - visits=' . ( $prev_summary['nb_visits'] ?? 0 ) . ', data_class=' . ( is_object($prev_month_data) ? get_class($prev_month_data) : 'array' ) );

        // Desglose por dispositivo (Desktop vs Mobile)
        $device_data = \Piwik\API\Request::processRequest( 'DevicesDetection.getType', array(
            'idSite' => $idSite,
            'period' => $matomo_period,
            'date'   => $matomo_date,
            'format' => 'original',
        ) );

        $devices = array();
        if ( is_object( $device_data ) && method_exists( $device_data, 'getRows' ) ) {
            foreach ( $device_data->getRows() as $row ) {
                $cols = $row->getColumns();
                $devices[] = array(
                    'label'       => $cols['label'] ?? '',
                    'nb_visits'   => $cols['nb_visits'] ?? 0,
                    'bounce_rate' => $cols['bounce_rate'] ?? '0%',
                );
            }
        }

        error_log( 'Sentinel: Matomo devices returned: ' . count( $devices ) );

        // Top navegadores
        $browser_data = \Piwik\API\Request::processRequest( 'DevicesDetection.getBrowsers', array(
            'idSite'       => $idSite,
            'period'       => $matomo_period,
            'date'         => $matomo_date,
            'format'       => 'original',
            'filter_limit' => 5,
        ) );

        $browsers = array();
        if ( is_object( $browser_data ) && method_exists( $browser_data, 'getRows' ) ) {
            foreach ( $browser_data->getRows() as $row ) {
                $cols = $row->getColumns();
                $browsers[] = array(
                    'label'     => $cols['label'] ?? '',
                    'nb_visits' => $cols['nb_visits'] ?? 0,
                );
            }
        }

        error_log( 'Sentinel: Matomo browsers returned: ' . count( $browsers ) );

        // Top sistemas operativos
        $os_data = \Piwik\API\Request::processRequest( 'DevicesDetection.getOsFamilies', array(
            'idSite'       => $idSite,
            'period'       => $matomo_period,
            'date'         => $matomo_date,
            'format'       => 'original',
            'filter_limit' => 5,
        ) );

        $os_families = array();
        if ( is_object( $os_data ) && method_exists( $os_data, 'getRows' ) ) {
            foreach ( $os_data->getRows() as $row ) {
                $cols = $row->getColumns();
                $os_families[] = array(
                    'label'     => $cols['label'] ?? '',
                    'nb_visits' => $cols['nb_visits'] ?? 0,
                );
            }
        }

        error_log( 'Sentinel: Matomo OS families returned: ' . count( $os_families ) );

        // Paginas con mayor tasa de salida
        $exit_data = \Piwik\API\Request::processRequest( 'Actions.getExitPageUrls', array(
            'idSite'       => $idSite,
            'period'       => $matomo_period,
            'date'         => $matomo_date,
            'format'       => 'original',
            'flat'         => 1,
            'filter_limit' => 5,
        ) );

        $exit_pages = array();
        if ( is_object( $exit_data ) && method_exists( $exit_data, 'getRows' ) ) {
            foreach ( $exit_data->getRows() as $row ) {
                $cols = $row->getColumns();
                $exit_pages[] = array(
                    'label'     => $cols['label'] ?? '',
                    'nb_visits' => $cols['nb_visits'] ?? 0,
                    'exit_rate' => $cols['exit_rate'] ?? 0,
                );
            }
        }

        error_log( 'Sentinel: Matomo exit pages returned: ' . count( $exit_pages ) );

        // Metas/Conversiones (solo si hay goals configurados)
        $conversions = null;
        $goals = \Piwik\API\Request::processRequest( 'Goals.getGoals', array(
            'idSite' => $idSite,
        ) );

        if ( ! empty( $goals ) ) {
            $goal_data = \Piwik\API\Request::processRequest( 'Goals.get', array(
                'idSite' => $idSite,
                'period' => $matomo_period,
                'date'   => $matomo_date,
                'format' => 'original',
            ) );

            $goal_summary = array();
            if ( is_object( $goal_data ) && method_exists( $goal_data, 'getColumns' ) ) {
                $goal_summary = $goal_data->getColumns();
            } elseif ( is_object( $goal_data ) && method_exists( $goal_data, 'getFirstRow' ) ) {
                $goal_row = $goal_data->getFirstRow();
                $goal_summary = $goal_row ? $goal_row->getColumns() : array();
            } elseif ( is_array( $goal_data ) ) {
                $goal_summary = $goal_data;
            }

            $conversions = array(
                'nb_conversions'       => $goal_summary['nb_conversions'] ?? 0,
                'nb_visits_converted'  => $goal_summary['nb_visits_converted'] ?? 0,
                'conversion_rate'      => $goal_summary['conversion_rate'] ?? '0%',
                'revenue'              => $goal_summary['revenue'] ?? 0,
            );

            error_log( 'Sentinel: Matomo conversions - ' . ( $conversions['nb_conversions'] ?? 0 ) . ' conversions' );
        } else {
            error_log( 'Sentinel: No Matomo goals configured, skipping conversions' );
        }

        if ( ! $was_super_user ) {
            $matomo_access->setSuperUserAccess( false );
        }

        $debug_msg = 'Exito';
        return array(
            'nb_visits'            => $summary['nb_visits'] ?? 0,
            'nb_uniq_visitors'     => $summary['nb_uniq_visitors'] ?? 0,
            'nb_actions'           => $summary['nb_actions'] ?? 0,
            'avg_time_on_site'     => $summary['avg_time_on_site'] ?? 0,
            'bounce_rate'          => $summary['bounce_rate'] ?? '0%',
            'nb_actions_per_visit' => $summary['nb_actions_per_visit'] ?? 0,
            'top_pages'            => $top_pages,
            'prev_month'           => array(
                'nb_visits'            => $prev_summary['nb_visits'] ?? 0,
                'nb_uniq_visitors'     => $prev_summary['nb_uniq_visitors'] ?? 0,
                'nb_actions'           => $prev_summary['nb_actions'] ?? 0,
                'avg_time_on_site'     => $prev_summary['avg_time_on_site'] ?? 0,
                'bounce_rate'          => $prev_summary['bounce_rate'] ?? '0%',
                'nb_actions_per_visit' => $prev_summary['nb_actions_per_visit'] ?? 0,
            ),
            'devices'              => $devices,
            'browsers'             => $browsers,
            'os_families'          => $os_families,
            'exit_pages'           => $exit_pages,
            'conversions'          => $conversions,
        );

    } catch ( \Exception $e ) {
        if ( isset( $matomo_access ) && isset( $was_super_user ) && ! $was_super_user ) {
            try { $matomo_access->setSuperUserAccess( false ); } catch ( \Exception $e2 ) {}
        }
        $debug_msg = 'Error de API Matomo Local: ' . $e->getMessage();
        error_log( 'Sentinel: ' . $debug_msg );
        return null;
    }
}

/**
 * Consulta la base de datos para obtener los bloqueos de los últimos 30 días con métricas detalladas.
 */
function get_wordfence_blocked_stats( $request = null ) {
    try {
        return sentinel_stats_inner( $request );
    } catch ( \Throwable $e ) {
        error_log( 'Sentinel FATAL: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() );
        return array(
            'status' => 'error',
            'fatal'  => $e->getMessage(),
            'file'   => basename( $e->getFile() ),
            'line'   => $e->getLine(),
        );
    }
}

function sentinel_stats_inner( $request = null ) {
    global $wpdb;

    $mode = '';
    if ( $request instanceof WP_REST_Request ) {
        $mode = (string) $request->get_param('mode');
    } elseif ( isset( $_GET['mode'] ) ) {
        $mode = (string) sanitize_text_field( $_GET['mode'] );
    }
    $is_uptime_mode = ( $mode === 'uptime' );

    $table_name = $wpdb->prefix . 'wfHits';
    // SHOW TABLES LIKE returns the actual table name; just check it's non-empty (avoids case-sensitive == comparison)
    $found_table = $wpdb->get_var( "SHOW TABLES LIKE '" . $wpdb->esc_like( $table_name ) . "'" );
    if ( empty( $found_table ) ) {
        // Try lowercase variant (lower_case_table_names=1 stores all tables lowercase)
        $found_table = $wpdb->get_var( "SHOW TABLES LIKE '" . $wpdb->esc_like( strtolower( $table_name ) ) . "'" );
    }
    $wordfence_available = ! empty( $found_table );
    if ( $wordfence_available ) {
        $table_name = $found_table;
    }
    error_log( 'Sentinel: Wordfence table check for ' . $wpdb->prefix . 'wfHits' . ', found=' . ( $found_table ? $found_table : 'none' ) . ' (mode: ' . ($is_uptime_mode ? 'uptime' : 'full') . ')' );

    $wf_start = isset($_GET['wf_start']) ? (int) $_GET['wf_start'] : time() - (30 * 24 * 60 * 60);
    $wf_end = isset($_GET['wf_end']) ? (int) $_GET['wf_end'] : time();

    // Wordfence data (only if available)
    $total_attacks = 0;
    $top_ips = array();
    $top_urls = array();
    $top_reasons = array();
    $top_usernames = array();
    $last_scan = 'No disponible';

    if ( ! $is_uptime_mode && $wordfence_available ) {
        // Diagnostico: cuantas filas hay en la tabla y que action values existen
        $wf_total_rows = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$table_name}");
        $wf_actions_in_range = $wpdb->get_col( $wpdb->prepare(
            "SELECT DISTINCT action FROM {$table_name} WHERE ctime >= %f AND ctime <= %f LIMIT 30",
            $wf_start, $wf_end
        ) );
        $wf_max_ctime = (float) $wpdb->get_var("SELECT MAX(ctime) FROM {$table_name}");
        $wf_debug_info = array(
            'table' => $table_name,
            'total_rows_in_table' => $wf_total_rows,
            'actions_in_range' => $wf_actions_in_range,
            'max_ctime_date' => $wf_max_ctime > 0 ? date('Y-m-d H:i:s', (int)$wf_max_ctime) : 'none',
            'query_range' => date('Y-m-d', (int)$wf_start) . ' to ' . date('Y-m-d', (int)$wf_end),
        );

        // Wordfence usa variantes de action: 'blocked', 'blocked:loginLockout', 'blocked:countryBlock', etc.
        $blocked_like = $wpdb->esc_like('blocked') . '%';

        // 1. Total de ataques
        $total_query = $wpdb->prepare(
            "SELECT COUNT(*) FROM {$table_name} WHERE ctime >= %f AND ctime <= %f AND action LIKE %s",
            $wf_start, $wf_end, $blocked_like
        );
        $total_attacks = (int) $wpdb->get_var( $total_query );
        error_log( 'Sentinel: Wordfence total_attacks=' . $total_attacks . ' (period: ' . date('Y-m-d', (int)$wf_start) . ' to ' . date('Y-m-d', (int)$wf_end) . ', table_rows=' . $wf_total_rows . ', actions=' . implode(',', $wf_actions_in_range) . ')' );

        // 2. Top 5 Malicious IPs
        $top_ips_query = $wpdb->prepare(
            "SELECT IP, COUNT(*) as count FROM {$table_name}
             WHERE ctime >= %f AND ctime <= %f AND action LIKE %s
             GROUP BY IP ORDER BY count DESC LIMIT 5",
            $wf_start, $wf_end, $blocked_like
        );
        $top_ips_raw = $wpdb->get_results( $top_ips_query );
        foreach($top_ips_raw as $row) {
            $top_ips[] = array(
                'ip' => (function_exists('inet_ntop') && strlen($row->IP) > 4) ? inet_ntop($row->IP) : $row->IP,
                'count' => (int)$row->count
            );
        }

        // 3. Top 5 targeted URLs
        $top_urls_query = $wpdb->prepare(
            "SELECT URL, COUNT(*) as count FROM {$table_name}
             WHERE ctime >= %f AND ctime <= %f AND action LIKE %s
             GROUP BY URL ORDER BY count DESC LIMIT 5",
            $wf_start, $wf_end, $blocked_like
        );
        $top_urls_raw = $wpdb->get_results( $top_urls_query );
        foreach($top_urls_raw as $row) {
            $top_urls[] = array('url' => $row->URL, 'count' => (int)$row->count);
        }

        // 4. Top 5 Block Reasons
        $top_reasons_query = $wpdb->prepare(
            "SELECT actionDescription as reason, COUNT(*) as count FROM {$table_name}
             WHERE ctime >= %f AND ctime <= %f AND action LIKE %s
             GROUP BY actionDescription ORDER BY count DESC LIMIT 5",
            $wf_start, $wf_end, $blocked_like
        );
        $top_reasons = $wpdb->get_results( $top_reasons_query );

        // 5. Top 5 Attempted Usernames
        $login_like = $wpdb->esc_like('%login%');
        $top_users_query = $wpdb->prepare(
            "SELECT actionData, COUNT(*) as count FROM {$table_name}
             WHERE ctime >= %f AND ctime <= %f AND action LIKE %s AND actionDescription LIKE %s
             GROUP BY actionData ORDER BY count DESC LIMIT 5",
            $wf_start, $wf_end, $blocked_like, '%login%'
        );
        $top_users_raw = $wpdb->get_results( $top_users_query );
        foreach($top_users_raw as $row) {
            $data = json_decode($row->actionData, true);
            $user = isset($data['username']) ? $data['username'] : (isset($data['user']) ? $data['user'] : 'Desconocido');
            if($user !== 'Desconocido') {
                $top_usernames[] = array('user' => $user, 'count' => (int)$row->count);
            }
        }

        // Wordfence Malware Scan
        if (class_exists('wfConfig')) {
            $last_scan_time = wfConfig::get('lastScanCompleted', 0);
            if ((int) $last_scan_time > 0) {
                $last_scan = date('Y-m-d H:i:s', (int) $last_scan_time);
            }
        }
    }

    // Wordfence rules check
    $wf_rules_ok = true;
    $wf_rules_detail = 'No instalado';
    if (class_exists('wfConfig')) {
        $last_rules_update_failed = wfConfig::get('lastRulesUpdateFailed', false);
        $rules_last_updated = wfConfig::get('rulesLastUpdated', 0);
        
        if (class_exists('wfWAF')) {
            try {
                $waf = \wfWAF::getInstance();
                if ($waf && method_exists($waf, 'getStorageEngine')) {
                    $storage = $waf->getStorageEngine();
                    if ($storage && method_exists($storage, 'getConfig')) {
                        $waf_last_updated = $storage->getConfig('rulesLastUpdated');
                        if ($waf_last_updated > $rules_last_updated) {
                            $rules_last_updated = $waf_last_updated;
                        }
                        $waf_failed = $storage->getConfig('lastRulesUpdateFailed');
                        if ($waf_failed) {
                            $last_rules_update_failed = true;
                        }
                    }
                }
            } catch (\Throwable $e) {
                // Ignore
            }
        }

        $rules_last_updated = empty($rules_last_updated) ? 0 : (int) $rules_last_updated;

        // Fallback to file modification time of rules.php (default file-based WAF)
        if ($rules_last_updated === 0) {
            $rules_file = WP_CONTENT_DIR . '/wflogs/rules.php';
            if (file_exists($rules_file)) {
                $rules_last_updated = (int) @filemtime($rules_file);
            }
        }

        $max_age = 10 * 24 * 60 * 60; // 10 days

        if ($last_rules_update_failed) {
            $wf_rules_ok = false;
            $wf_rules_detail = 'Falló última actualización';
            if ($rules_last_updated > 0) {
                $wf_rules_detail .= ' (Última exitosa: ' . date('Y-m-d H:i', $rules_last_updated) . ')';
            }
        } elseif ($rules_last_updated === 0) {
            $wf_rules_ok = false;
            $wf_rules_detail = 'Nunca actualizadas';
        } elseif ((time() - $rules_last_updated) > $max_age) {
            $wf_rules_ok = false;
            $wf_rules_detail = 'Desactualizadas (Última: ' . date('Y-m-d H:i', $rules_last_updated) . ')';
        } else {
            $wf_rules_ok = true;
            $wf_rules_detail = 'Actualizadas';
            if ($rules_last_updated > 0) {
                $wf_rules_detail .= ' (' . date('Y-m-d H:i', $rules_last_updated) . ')';
            }
        }
    }

    // 6. Server Health & Info
    // Use actual WordPress site size instead of full server disk (which is misleading on shared hosting)
    // Caching disk space and database size calculations for 12 hours to prevent performance bottlenecks/timeouts.
    $gb_divisor = 1024 * 1024 * 1024;
    $site_size_gb = null;
    $disk_free_gb = null;
    $cache_key = 'sentinel_storage_info_v4';
    $cached_storage = get_transient($cache_key);
    $last_known_storage = get_option('sentinel_storage_info_last');

    if (is_array($cached_storage) && isset($cached_storage['site_size_gb']) && isset($cached_storage['disk_free_gb'])) {
        $site_size_gb = $cached_storage['site_size_gb'];
        $disk_free_gb = $cached_storage['disk_free_gb'];
    } elseif ($is_uptime_mode && is_array($last_known_storage) && isset($last_known_storage['site_size_gb'])) {
        // En modo uptime: Si el transient expiró pero tenemos el valor persistente, lo usamos de inmediato.
        // Esto evita que un chequeo recurrente de uptime se cuelgue 30+ segundos ejecutando du en disco frío.
        $site_size_gb = $last_known_storage['site_size_gb'];
        if (function_exists('disk_free_space')) {
            $free_bytes = @disk_free_space(ABSPATH);
            $disk_free_gb = ($free_bytes !== false && $free_bytes > 0) ? round($free_bytes / $gb_divisor, 2) : ($last_known_storage['disk_free_gb'] ?? null);
        } else {
            $disk_free_gb = $last_known_storage['disk_free_gb'] ?? null;
        }
    } else {
        $site_size_bytes = 0;
        $start_time_fallback = null;
        $completed = true;
        try {
            // Detectar el directorio home (padre de public_html/httpdocs/etc) para coincidir con la cuota de cPanel
            $target_dir = ABSPATH;
            $document_roots = array('/public_html', '/public_shtml', '/httpdocs', '/httpsdocs', '/www');
            foreach ($document_roots as $root) {
                $pos = strpos($target_dir, $root);
                if ($pos !== false) {
                    $target_dir = substr($target_dir, 0, $pos);
                    break;
                }
            }

            $shell_exec_enabled = function_exists('shell_exec');
 
            // Intentar obtener el tamaño mediante shell du con timeout estricto
            if ($shell_exec_enabled) {
                try {
                    // En modo uptime solo permitimos 5s para no bloquear; en modo reporte hasta 10s
                    $du_timeout = $is_uptime_mode ? 5 : 10;
                    $cmds = array(
                        "timeout {$du_timeout} du -sb " . escapeshellarg($target_dir),
                        "/usr/bin/timeout {$du_timeout} /usr/bin/du -sb " . escapeshellarg($target_dir),
                        "timeout {$du_timeout} du -sb " . escapeshellarg(ABSPATH),
                        "/usr/bin/timeout {$du_timeout} /usr/bin/du -sb " . escapeshellarg(ABSPATH)
                    );
                    
                    foreach ($cmds as $cmd) {
                        $du_out = @shell_exec($cmd . ' 2>/dev/null');
                        if ($du_out && preg_match('/^(\d+)/', trim($du_out), $m)) {
                            $site_size_bytes = (int) $m[1];
                            break;
                        }
                    }
                } catch (\Throwable $e) {
                    error_log('Sentinel: Error running du via shell_exec: ' . $e->getMessage());
                }
            }

            if ($site_size_bytes === 0 && ! $is_uptime_mode) {
                // Fallback con iterador PHP solo en modo reporte completo (no en uptime para no colgar)
                $path_to_scan = ABSPATH;
                if (!empty($target_dir) && $target_dir !== '/' && @is_readable($target_dir)) {
                    $path_to_scan = $target_dir;
                }
                $site_size_bytes = sentinel_get_directory_size_fallback( $path_to_scan, $start_time_fallback, $completed );
            }

            // Calcular tamaño de la base de datos MySQL usando SHOW TABLE STATUS (evita bloqueos de information_schema)
            $db_size_bytes = 0;
            try {
                $tables = $wpdb->get_results("SHOW TABLE STATUS");
                if (is_array($tables)) {
                    foreach ($tables as $table) {
                        $db_size_bytes += (int) (isset($table->Data_length) ? $table->Data_length : 0) + (int) (isset($table->Index_length) ? $table->Index_length : 0);
                    }
                }
            } catch ( \Throwable $e ) {
                error_log( 'Sentinel: Error calculando el tamaño de la DB: ' . $e->getMessage() );
            }

            $total_site_size_bytes = $site_size_bytes + $db_size_bytes;
            $site_size_gb = $total_site_size_bytes > 0 ? round($total_site_size_bytes / $gb_divisor, 2) : (isset($last_known_storage['site_size_gb']) ? $last_known_storage['site_size_gb'] : null);
            error_log('Sentinel: site_size_bytes=' . $site_size_bytes . ', db_size_bytes=' . $db_size_bytes . ', total_site_size_gb=' . $site_size_gb);

            // Espacio libre
            $disk_free_enabled = function_exists('disk_free_space');
            if ($disk_free_enabled) {
                $disk_free_bytes = @disk_free_space( ABSPATH );
                $disk_free_gb    = ( $disk_free_bytes !== false && $disk_free_bytes > 0 )
                    ? round( $disk_free_bytes / $gb_divisor, 2 )
                    : (isset($last_known_storage['disk_free_gb']) ? $last_known_storage['disk_free_gb'] : null);
            }
        } catch (\Throwable $e) {
            error_log('Sentinel: Error calculando almacenamiento: ' . $e->getMessage());
        }

        // Caching: Only save in transient if the calculation succeeded (completed) and returned a non-zero size.
        // Also persist in WordPress option as resilient fallback.
        if ($completed && $site_size_bytes > 0) {
            $cached_storage = array(
                'site_size_gb' => $site_size_gb,
                'disk_free_gb' => $disk_free_gb,
            );
            set_transient( $cache_key, $cached_storage, 12 * HOUR_IN_SECONDS );
            update_option( 'sentinel_storage_info_last', $cached_storage, 'no' );
        }
    }

    $server_info = array(
        'site_size_gb' => $site_size_gb,
        'disk_free_gb' => $disk_free_gb,
        'php_version' => PHP_VERSION,
        'wp_version' => get_bloginfo('version'),
        'server_ip' => $_SERVER['SERVER_ADDR'] ?? 'Unknown'
    );

    // 7. Recent Plugin Updates (via transients)
    $recent_updates = array();
    if ( ! $is_uptime_mode ) {
        if ( ! function_exists( 'get_plugins' ) ) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        $plugins = get_plugins();
        $active_plugins = get_option('active_plugins');
        $count = 0;
        foreach($active_plugins as $plugin_path) {
            if ($count >= 5) break;
            if (isset($plugins[$plugin_path])) {
                $recent_updates[] = array(
                    'name' => $plugins[$plugin_path]['Name'],
                    'version' => $plugins[$plugin_path]['Version']
                );
                $count++;
            }
        }
    }

    // 8. Last Backup Status (UpdraftPlus)
    $last_backup = 'No detectado';
    if ( ! $is_uptime_mode && class_exists('UpdraftPlus') ) {
        $backup_history = get_option('updraft_backup_history');
        if (!empty($backup_history) && is_array($backup_history)) {
            $latest = max(array_keys($backup_history));
            $last_backup = date('Y-m-d H:i:s', (int) $latest);
        }
    }

    // 9. SSL Status
    $ssl_days_left = 'N/A';
    if ( ! $is_uptime_mode ) {
        $site_url = get_site_url();
        if (strpos($site_url, 'https') === 0) {
            $url_parts = parse_url($site_url);
            $host = $url_parts['host'];
            $get = @stream_context_create(array("ssl" => array("capture_peer_cert" => True)));
            $read = @stream_socket_client("ssl://" . $host . ":443", $errno, $errstr, 5, STREAM_CLIENT_CONNECT, $get);
            if ($read) {
                $cont = stream_context_get_params($read);
                $cert = openssl_x509_parse($cont["options"]["ssl"]["peer_certificate"]);
                $ssl_days_left = round(($cert['validTo_time_t'] - time()) / 86400);
            }
        }
    }

    // 10. Pending Updates Count
    $pending_updates = array(
        'plugins'   => 0,
        'themes'    => 0,
        'wordpress' => 0,
    );
    if ( ! $is_uptime_mode && function_exists( 'wp_get_update_data' ) ) {
        $update_data = wp_get_update_data();
        $pending_updates = array(
            'plugins'   => $update_data['counts']['plugins'] ?? 0,
            'themes'    => $update_data['counts']['themes'] ?? 0,
            'wordpress' => $update_data['counts']['wordpress'] ?? 0,
        );
    }

    // 10b. Site Health Score
    $site_health_score = array( 'status' => 'good', 'good' => 0, 'recommended' => 0, 'critical' => 0 );
    if ( ! $is_uptime_mode ) {
        $site_health_file = ABSPATH . 'wp-admin/includes/class-wp-site-health.php';
        if ( file_exists( $site_health_file ) ) {
            require_once $site_health_file;
            if ( class_exists( 'WP_Site_Health' ) && method_exists( 'WP_Site_Health', 'get_instance' ) ) {
                $health = WP_Site_Health::get_instance();
                if ( method_exists( $health, 'get_test_count' ) ) {
                    $counts = $health->get_test_count();
                    $site_health_score = array(
                        'status'      => ( $counts['critical'] ?? 0 ) > 0 ? 'critical' : ( ( $counts['recommended'] ?? 0 ) > 0 ? 'recommended' : 'good' ),
                        'good'        => $counts['good'] ?? 0,
                        'recommended' => $counts['recommended'] ?? 0,
                        'critical'    => $counts['critical'] ?? 0,
                    );
                }
            }
        }
    }

    // 11. Matomo Analytics (if available)
    $debug_msg = $is_uptime_mode ? 'Modo uptime - Matomo omitido' : '';
    $matomo_data = null;
    if ( ! $is_uptime_mode ) {
        $matomo_period = isset($_GET['matomo_period']) ? sanitize_text_field($_GET['matomo_period']) : 'month';
        $matomo_date = isset($_GET['matomo_date']) ? sanitize_text_field($_GET['matomo_date']) : 'today';
        $matomo_prev_date = isset($_GET['matomo_prev_date']) ? sanitize_text_field($_GET['matomo_prev_date']) : 'lastMonth';
        $matomo_data = sentinel_get_matomo_data($debug_msg, $matomo_period, $matomo_date, $matomo_prev_date);
    }

    $response = array(
        'status' => 'success',
        'wordfence' => array(
            'total_attacks' => $total_attacks,
            'top_ips' => $top_ips,
            'top_urls' => $top_urls,
            'top_reasons' => $top_reasons,
            'top_usernames' => $top_usernames,
            'last_scan' => $last_scan,
            'rules_ok' => $wf_rules_ok,
            'rules_detail' => $wf_rules_detail,
            'debug' => isset($wf_debug_info) ? $wf_debug_info : array('table_available' => false),
        ),
        'infrastructure' => $server_info,
        'maintenance' => array(
            'recent_updates'  => $recent_updates,
            'pending_updates' => $pending_updates,
            'last_backup'     => $last_backup,
            'site_health'     => $site_health_score,
            'total_active_plugins' => is_array(get_option('active_plugins')) ? count(get_option('active_plugins')) : 0
        ),
        'security' => array(
            'ssl_days_left' => $ssl_days_left
        ),
        'matomo_debug' => $debug_msg
    );

    if ( $matomo_data !== null ) {
        $response['metricas'] = $matomo_data;
    }

    return $response;
}

/**
 * Debug endpoint to show all headers received by the server
 */
function sentinel_debug_headers( WP_REST_Request $request ) {
    global $wpdb;
    
    // Detectar el directorio home
    $target_dir = ABSPATH;
    $document_roots = array('/public_html', '/public_shtml', '/httpdocs', '/httpsdocs', '/www');
    foreach ($document_roots as $root) {
        $pos = strpos($target_dir, $root);
        if ($pos !== false) {
            $target_dir = substr($target_dir, 0, $pos);
            break;
        }
    }
    
    $shell_exec_enabled = function_exists('shell_exec');
    
    // DB size usando SHOW TABLE STATUS
    $db_size_bytes = 0;
    try {
        $tables = $wpdb->get_results("SHOW TABLE STATUS");
        if (is_array($tables)) {
            foreach ($tables as $table) {
                $db_size_bytes += (int) (isset($table->Data_length) ? $table->Data_length : 0) + (int) (isset($table->Index_length) ? $table->Index_length : 0);
            }
        }
    } catch (\Throwable $e) {}

    return array(
        'message'          => 'Headers Debug Info',
        'plugin_version'   => defined('SENTINEL_PLUGIN_VERSION') ? SENTINEL_PLUGIN_VERSION : 'unknown',
        'plugin_file_mtime' => filemtime( __FILE__ ),
        'plugin_file'      => __FILE__,
        'request_headers' => $request->get_headers(),
        'server_http_vars' => array_filter($_SERVER, function($key) {
            return strpos($key, 'HTTP_') === 0;
        }, ARRAY_FILTER_USE_KEY),
        'php_headers' => function_exists('getallheaders') ? getallheaders() : 'N/A',
        'wf_report_token_vars' => array(
            'request_get_header_underscore' => $request->get_header('x_wf_report_token'),
            'request_get_header_hyphen' => $request->get_header('x-wf-report-token'),
            'server_var' => $_SERVER['HTTP_X_WF_REPORT_TOKEN'] ?? 'NOT SET',
            'saved_token_length' => strlen(get_wf_report_token()),
            'saved_token_md5' => md5(get_wf_report_token())
        ),
        'wordfence_keys' => class_exists('wfConfig') ? array(
            'rulesLastUpdated' => wfConfig::get('rulesLastUpdated'),
            'lastRulesUpdateSuccess' => wfConfig::get('lastRulesUpdateSuccess'),
            'lastRulesUpdateFailed' => wfConfig::get('lastRulesUpdateFailed'),
            'wafRulesLastUpdated' => wfConfig::get('wafRulesLastUpdated'),
            'rules_file_mtime' => file_exists(WP_CONTENT_DIR . '/wflogs/rules.php') ? filemtime(WP_CONTENT_DIR . '/wflogs/rules.php') : 'NOT FOUND',
        ) : 'N/A',
        'wordfence_waf_keys' => class_exists('wfWAF') ? array(
            'rulesLastUpdated' => \wfWAF::getInstance()->getStorageEngine()->getConfig('rulesLastUpdated'),
            'lastRulesUpdateSuccess' => \wfWAF::getInstance()->getStorageEngine()->getConfig('lastRulesUpdateSuccess'),
            'lastRulesUpdateFailed' => \wfWAF::getInstance()->getStorageEngine()->getConfig('lastRulesUpdateFailed'),
        ) : 'N/A',
        'storage_debug' => array(
            'target_dir' => $target_dir,
            'abspath' => ABSPATH,
            'shell_exec_enabled' => $shell_exec_enabled,
            'du_commands_test' => (function() use ($target_dir, $shell_exec_enabled) {
                $du_results = array();
                if ($shell_exec_enabled) {
                    $cmds_to_test = array(
                        'du_sb_target' => 'du -sb ' . escapeshellarg($target_dir),
                        'du_sb_abspath' => 'du -sb ' . escapeshellarg(ABSPATH),
                        'timeout_du_sb_target' => 'timeout 3 du -sb ' . escapeshellarg($target_dir),
                        '/usr/bin/du_sb_target' => '/usr/bin/du -sb ' . escapeshellarg($target_dir),
                        '/bin/du_sb_target' => '/bin/du -sb ' . escapeshellarg($target_dir)
                    );
                    foreach ($cmds_to_test as $lbl => $cmd) {
                        $out = @shell_exec($cmd . ' 2>/dev/null');
                        $du_results[$lbl] = $out ? trim($out) : 'FAILED';
                    }
                } else {
                    $du_results['shell_exec'] = 'DISABLED';
                }
                return $du_results;
            })(),
            'db_size_bytes' => $db_size_bytes,
            'saved_transient' => get_transient('sentinel_storage_info_v4')
        )
    );
}

/**
 * Calcula recursivamente el tamaño de un directorio en bytes como respaldo si shell_exec no está disponible.
 * Utiliza opendir recursivo para evitar excepciones del Iterator de PHP y permitir saltar subdirectorios sin permisos.
 */
function sentinel_get_directory_size_fallback( $path, &$start_time = null, &$completed = true ) {
    if ( $start_time === null ) {
        $start_time = time();
    }
    
    // Límite de seguridad: si tarda más de 12 segundos en total, abortar recursión
    if ( time() - $start_time > 12 ) {
        $completed = false;
        return 0;
    }
    
    $size = 0;
    if ( ! file_exists( $path ) ) {
        return 0;
    }
    if ( is_link( $path ) ) {
        return 0; // Evitar contar enlaces simbólicos en la raíz
    }
    if ( is_file( $path ) ) {
        return (int) @filesize( $path );
    }
    
    $dh = @opendir( $path );
    if ( !$dh ) {
        return 0; // Retorna 0 para este subdirectorio sin acceso, pero continúa con los demás
    }
    
    while ( ( $file = readdir( $dh ) ) !== false ) {
        if ( $file === '.' || $file === '..' ) {
            continue;
        }
        $fullpath = $path . '/' . $file;
        if ( is_link( $fullpath ) ) {
            continue; // Evitar entrar en bucles o contar dos veces carpetas con enlaces simbólicos (ej. /home/user/www -> public_html)
        }
        if ( is_dir( $fullpath ) ) {
            $size += sentinel_get_directory_size_fallback( $fullpath, $start_time, $completed );
            if ( !$completed ) {
                break;
            }
        } else {
            $size += (int) @filesize( $fullpath );
        }
    }
    closedir( $dh );
    return $size;
}

// =========================================================================
// SENTINEL v4.2 EXTENSIONS: UPDATES, PLUGINS, USERS, BRANDING, ANALYTICS
// =========================================================================

/**
 * 1. OBTENER DETALLE DE ACTUALIZACIONES PENDIENTES
 */
function sentinel_get_updates() {
    if ( ! function_exists( 'get_plugin_updates' ) ) {
        require_once ABSPATH . 'wp-admin/includes/update.php';
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
        require_once ABSPATH . 'wp-admin/includes/theme.php';
    }

    if ( ! empty( $_GET['force_check'] ) ) {
        if ( function_exists( 'wp_update_plugins' ) ) {
            wp_update_plugins();
        }
        if ( function_exists( 'wp_update_themes' ) ) {
            wp_update_themes();
        }
    }

    $plugin_updates_raw = get_plugin_updates();
    $plugins = array();
    foreach ( $plugin_updates_raw as $file => $data ) {
        $cur_ver = $data->Version ?? '';
        $new_ver = $data->update->new_version ?? '';
        // Evitar falsos positivos si las versiones son idénticas
        if ( ! empty( $new_ver ) && version_compare( $new_ver, $cur_ver, '<=' ) ) {
            continue;
        }

        $plugins[] = array(
            'name'            => $data->Name,
            'slug'            => dirname( $file ) !== '.' ? dirname( $file ) : sanitize_title( $data->Name ),
            'plugin_file'     => $file,
            'current_version' => $cur_ver,
            'new_version'     => $new_ver,
            'package'         => $data->update->package ?? ''
        );
    }

    $theme_updates_raw = get_theme_updates();
    $themes = array();
    foreach ( $theme_updates_raw as $stylesheet => $data ) {
        $cur_ver = $data->get( 'Version' ) ?: '';
        $new_ver = $data->update['new_version'] ?? '';
        if ( ! empty( $new_ver ) && version_compare( $new_ver, $cur_ver, '<=' ) ) {
            continue;
        }

        $themes[] = array(
            'name'            => $data->get( 'Name' ),
            'slug'            => $stylesheet,
            'current_version' => $cur_ver,
            'new_version'     => $new_ver,
            'package'         => $data->update['package'] ?? ''
        );
    }

    $core_updates = get_core_updates();
    $core = array(
        'current'          => get_bloginfo( 'version' ),
        'available'        => null,
        'update_available' => false,
    );
    if ( ! empty( $core_updates ) && isset( $core_updates[0]->response ) && 'upgrade' === $core_updates[0]->response ) {
        $core['available']        = $core_updates[0]->current;
        $core['update_available'] = true;
        $core['package']          = $core_updates[0]->download ?? '';
    }

    // Traducciones
    $translations_raw = function_exists( 'wp_get_translation_updates' ) ? wp_get_translation_updates() : array();
    $translations = array();
    foreach ( (array) $translations_raw as $trans ) {
        $translations[] = array(
            'type'        => $trans->type ?? 'plugin',
            'slug'        => $trans->slug ?? sanitize_title( $trans->name ?? 'translation' ),
            'name'        => ! empty( $trans->name ) ? $trans->name : 'Traducción (' . ( $trans->language ?? 'es_ES' ) . ')',
            'language'    => $trans->language ?? 'es_ES',
            'version'     => $trans->version ?? 'Actual',
        );
    }

    return array(
        'status'       => 'success',
        'wordpress'    => $core,
        'plugins'      => $plugins,
        'themes'       => $themes,
        'translations' => $translations,
        'counts'       => array(
            'plugins'      => count( $plugins ),
            'themes'       => count( $themes ),
            'wordpress'    => $core['update_available'] ? 1 : 0,
            'translations' => count( $translations ),
            'total'        => count( $plugins ) + count( $themes ) + ( $core['update_available'] ? 1 : 0 ) + count( $translations ),
        )
    );
}

/**
 * 1.1 OBTENER ESTADO CENTRALIZADO DESDE MAINWP DASHBOARD (SI ESTÁ PRESENTE)
 */
function sentinel_get_mainwp_updates() {
    global $wpdb;
    $mainwp_table = $wpdb->prefix . 'mainwp_wp';
    $table_exists = $wpdb->get_var( "SHOW TABLES LIKE '{$mainwp_table}'" );

    if ( ! $table_exists ) {
        return array(
            'status'     => 'not_applicable',
            'has_mainwp' => false,
            'message'    => 'MainWP Dashboard no está instalado en este WordPress host.',
        );
    }

    $rows = $wpdb->get_results( "SELECT id, name, url, siteurl, plugin_upgrades, theme_upgrades, translation_upgrades, wp_upgrades, dtsync FROM {$mainwp_table}" );

    $child_sites = array();
    $total_plugins = 0;
    $total_themes = 0;
    $total_core = 0;
    $total_translations = 0;

    foreach ( (array) $rows as $row ) {
        $p_raw = maybe_unserialize( $row->plugin_upgrades );
        if ( is_string( $p_raw ) ) {
            $p_raw = json_decode( $p_raw, true );
        }
        $t_raw = maybe_unserialize( $row->theme_upgrades );
        if ( is_string( $t_raw ) ) {
            $t_raw = json_decode( $t_raw, true );
        }
        $tr_raw = maybe_unserialize( $row->translation_upgrades );
        if ( is_string( $tr_raw ) ) {
            $tr_raw = json_decode( $tr_raw, true );
        }
        $w_raw = maybe_unserialize( $row->wp_upgrades );
        if ( is_string( $w_raw ) ) {
            $w_raw = json_decode( $w_raw, true );
        }

        $plugins_list = array();
        if ( is_array( $p_raw ) ) {
            foreach ( $p_raw as $plugin_file => $p_info ) {
                $p_obj = is_object( $p_info ) ? (array) $p_info : $p_info;
                $p_name = $p_obj['Name'] ?? $p_obj['name'] ?? basename( (string) $plugin_file, '.php' );
                $plugins_list[] = array(
                    'name'            => $p_name,
                    'slug'            => dirname( (string) $plugin_file ) !== '.' ? dirname( (string) $plugin_file ) : sanitize_title( $p_name ),
                    'file'            => (string) $plugin_file,
                    'current_version' => $p_obj['Version'] ?? $p_obj['current_version'] ?? '',
                    'new_version'     => $p_obj['new_version'] ?? $p_obj['update']['new_version'] ?? '',
                );
            }
        }

        $themes_list = array();
        if ( is_array( $t_raw ) ) {
            foreach ( $t_raw as $th_slug => $th_info ) {
                $th_obj = is_object( $th_info ) ? (array) $th_info : $th_info;
                $themes_list[] = array(
                    'name'            => $th_obj['Name'] ?? $th_obj['name'] ?? $th_slug,
                    'slug'            => (string) $th_slug,
                    'current_version' => $th_obj['Version'] ?? $th_obj['current_version'] ?? '',
                    'new_version'     => $th_obj['new_version'] ?? '',
                );
            }
        }

        $translations_list = array();
        if ( is_array( $tr_raw ) ) {
            foreach ( $tr_raw as $tr_item ) {
                $tr_obj = is_object( $tr_item ) ? (array) $tr_item : $tr_item;
                $translations_list[] = array(
                    'name'     => $tr_obj['name'] ?? 'Traducción (' . ( $tr_obj['language'] ?? 'es_ES' ) . ')',
                    'slug'     => $tr_obj['slug'] ?? 'translation',
                    'language' => $tr_obj['language'] ?? 'es_ES',
                    'version'  => $tr_obj['version'] ?? 'Actual',
                );
            }
        }

        $p_count = count( $plugins_list );
        $t_count = count( $themes_list );
        $tr_count = count( $translations_list );
        $w_count = ! empty( $w_raw ) ? 1 : 0;

        $total_plugins += $p_count;
        $total_themes += $t_count;
        $total_translations += $tr_count;
        $total_core += $w_count;

        $child_sites[] = array(
            'mainwp_id'    => (int) $row->id,
            'name'         => $row->name,
            'url'          => untrailingslashit( $row->url ?: $row->siteurl ),
            'last_sync'    => $row->dtsync ? date( 'Y-m-d H:i:s', (int) $row->dtsync ) : null,
            'plugins'      => $plugins_list,
            'themes'       => $themes_list,
            'translations' => $translations_list,
            'wordpress'    => $w_raw,
            'counts'       => array(
                'plugins'      => $p_count,
                'themes'       => $t_count,
                'wordpress'    => $w_count,
                'translations' => $tr_count,
                'total'        => $p_count + $t_count + $w_count + $tr_count,
            )
        );
    }

    // Actualizaciones del host local (IDPY Admin)
    $local = sentinel_get_updates();
    $local_plugins = count( $local['plugins'] ?? array() );
    $local_themes = count( $local['themes'] ?? array() );
    $local_core = ! empty( $local['wordpress']['update_available'] ) ? 1 : 0;
    $local_translations = count( $local['translations'] ?? array() );

    return array(
        'status'     => 'success',
        'has_mainwp' => true,
        'summary'    => array(
            'total_updates' => $total_plugins + $total_themes + $total_core + $total_translations + $local_plugins + $local_themes + $local_core + $local_translations,
            'plugins'       => $total_plugins + $local_plugins,
            'themes'        => $total_themes + $local_themes,
            'wordpress'     => $total_core + $local_core,
            'translations'  => $total_translations + $local_translations,
        ),
        'child_sites'  => $child_sites,
        'local_host'   => $local,
    );
}

/**
 * 2. APLICAR ACTUALIZACIONES EN LOTE
 */
function sentinel_apply_updates( WP_REST_Request $request ) {
    // Increase limits for long-running upgrades
    if ( ! ini_get( 'safe_mode' ) ) {
        @set_time_limit( 300 );
        @ini_set( 'memory_limit', '256M' );
    }

    // Suppress any stray output that would corrupt the JSON response
    ob_start();

    require_once ABSPATH . 'wp-admin/includes/update.php';
    require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/plugin.php';
    require_once ABSPATH . 'wp-admin/includes/theme.php';
    require_once ABSPATH . 'wp-admin/includes/misc.php';
    require_once ABSPATH . 'wp-admin/includes/class-wp-ajax-upgrader-skin.php';

    // Initialize the WP Filesystem — mandatory before any upgrader
    $credentials = request_filesystem_credentials( site_url(), '', false, ABSPATH, null, true );
    if ( ! WP_Filesystem( $credentials ) ) {
        ob_end_clean();
        return new WP_Error(
            'fs_unavailable',
            'No se pudo inicializar el sistema de archivos de WordPress.',
            array( 'status' => 500 )
        );
    }

    $type  = $request->get_param( 'type' ) ?: 'plugins';
    $slugs = $request->get_param( 'slugs' ) ?: array();

    $results = array();
    $skin    = new WP_Ajax_Upgrader_Skin();

    if ( in_array( $type, array( 'plugins', 'all' ), true ) ) {
        $upgrader = new Plugin_Upgrader( $skin );
        $all_updates = get_plugin_updates();
        $files_to_update = array();

        foreach ( $all_updates as $file => $data ) {
            $slug = dirname( $file ) !== '.' ? dirname( $file ) : sanitize_title( $data->Name );
            if ( empty( $slugs ) || in_array( $slug, $slugs, true ) || in_array( $file, $slugs, true ) ) {
                $files_to_update[] = $file;
            }
        }

        if ( ! empty( $files_to_update ) ) {
            $res = $upgrader->bulk_upgrade( $files_to_update );
            // Normalize: replace WP_Error objects with serializable arrays
            $normalized = array();
            foreach ( (array) $res as $k => $v ) {
                if ( is_wp_error( $v ) ) {
                    $normalized[ $k ] = array( 'error' => $v->get_error_message() );
                } else {
                    $normalized[ $k ] = $v;
                }
            }
            $results['plugins'] = $normalized;
        }
    }

    if ( in_array( $type, array( 'themes', 'all' ), true ) ) {
        $upgrader = new Theme_Upgrader( $skin );
        $all_updates = get_theme_updates();
        $themes_to_update = array();

        foreach ( $all_updates as $stylesheet => $data ) {
            if ( empty( $slugs ) || in_array( $stylesheet, $slugs, true ) ) {
                $themes_to_update[] = $stylesheet;
            }
        }

        if ( ! empty( $themes_to_update ) ) {
            $res = $upgrader->bulk_upgrade( $themes_to_update );
            $normalized = array();
            foreach ( (array) $res as $k => $v ) {
                if ( is_wp_error( $v ) ) {
                    $normalized[ $k ] = array( 'error' => $v->get_error_message() );
                } else {
                    $normalized[ $k ] = $v;
                }
            }
            $results['themes'] = $normalized;
        }
    }

    if ( in_array( $type, array( 'translations', 'all' ), true ) ) {
        if ( ! class_exists( 'Language_Pack_Upgrader' ) ) {
            require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        }
        $lp_upgrader = new Language_Pack_Upgrader( $skin );
        $trans_updates = function_exists( 'wp_get_translation_updates' ) ? wp_get_translation_updates() : array();
        if ( ! empty( $trans_updates ) ) {
            $results['translations'] = $lp_upgrader->bulk_upgrade( $trans_updates );
        }
    }

    // Discard any stray HTML output from the upgrader
    ob_end_clean();

    // Invalidar OPcache tras la actualización
    if ( function_exists( 'opcache_reset' ) ) {
        @opcache_reset();
    }

    return array(
        'status'  => 'success',
        'message' => 'Actualizaciones procesadas con éxito',
        'results' => $results,
    );
}

/**
 * 3. LISTADO COMPLETO DE PLUGINS
 */
function sentinel_get_plugins() {
    if ( ! function_exists( 'get_plugins' ) ) {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
    }

    $all_plugins    = get_plugins();
    $active_plugins = get_option( 'active_plugins', array() );
    $updates        = function_exists( 'get_plugin_updates' ) ? get_plugin_updates() : array();

    $list = array();
    foreach ( $all_plugins as $file => $data ) {
        $is_active = in_array( $file, $active_plugins, true );
        $has_update = isset( $updates[ $file ] );

        $list[] = array(
            'name'             => $data['Name'],
            'slug'             => dirname( $file ) !== '.' ? dirname( $file ) : sanitize_title( $data['Name'] ),
            'file'             => $file,
            'version'          => $data['Version'],
            'is_active'        => $is_active,
            'author'           => strip_tags( $data['Author'] ),
            'description'      => strip_tags( $data['Description'] ),
            'update_available' => $has_update,
            'new_version'      => $has_update ? ($updates[ $file ]->update->new_version ?? null) : null,
        );
    }

    return array( 'status' => 'success', 'plugins' => $list );
}

/**
 * 4. INSTALAR PLUGIN (DESDE SLUG WP.ORG O ZIP)
 */
function sentinel_install_plugin( WP_REST_Request $request ) {
    // Increase limits for downloads and unzip operations
    if ( ! ini_get( 'safe_mode' ) ) {
        @set_time_limit( 300 );
        @ini_set( 'memory_limit', '256M' );
    }

    // Suppress any stray HTML output that would corrupt the JSON response
    ob_start();

    require_once ABSPATH . 'wp-admin/includes/update.php';
    require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
    require_once ABSPATH . 'wp-admin/includes/class-wp-ajax-upgrader-skin.php';
    require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
    require_once ABSPATH . 'wp-admin/includes/plugin.php';
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/misc.php';

    // Initialize the WP Filesystem — mandatory before any upgrader
    $credentials = request_filesystem_credentials( site_url(), '', false, ABSPATH, null, true );
    if ( ! WP_Filesystem( $credentials ) ) {
        ob_end_clean();
        return new WP_Error(
            'fs_unavailable',
            'No se pudo inicializar el sistema de archivos de WordPress.',
            array( 'status' => 500 )
        );
    }

    $slug       = sanitize_text_field( (string) $request->get_param( 'slug' ) );
    $zip_url    = esc_url_raw( (string) $request->get_param( 'zip_url' ) );
    $zip_base64 = $request->get_param( 'zip_base64' );
    $activate   = (bool) $request->get_param( 'activate' );

    $skin     = new WP_Ajax_Upgrader_Skin();
    $upgrader = new Plugin_Upgrader( $skin );

    // Allow overwriting existing plugin folder (e.g. updating an existing plugin via ZIP)
    add_filter( 'upgrader_package_options', function( $options ) {
        $options['clear_destination'] = true;
        $options['abort_if_destination_exists'] = false;
        return $options;
    } );

    $installed = false;

    if ( ! empty( $zip_base64 ) ) {
        $temp_file = wp_tempnam( 'plugin_zip_' ) . '.zip';
        $decoded   = base64_decode( $zip_base64 );
        if ( empty( $decoded ) ) {
            ob_end_clean();
            return new WP_Error( 'invalid_zip', 'Los datos del archivo ZIP están corruptos o vacíos.', array( 'status' => 400 ) );
        }
        file_put_contents( $temp_file, $decoded );
        $installed = $upgrader->install( $temp_file, array( 'overwrite_package' => true ) );
        @unlink( $temp_file );
    } elseif ( ! empty( $zip_url ) ) {
        $installed = $upgrader->install( $zip_url, array( 'overwrite_package' => true ) );
    } elseif ( ! empty( $slug ) ) {
        $api = plugins_api( 'plugin_information', array( 'slug' => $slug, 'fields' => array( 'sections' => false ) ) );
        if ( is_wp_error( $api ) ) {
            ob_end_clean();
            return new WP_Error( 'install_failed', $api->get_error_message(), array( 'status' => 400 ) );
        }
        $installed = $upgrader->install( $api->download_link, array( 'overwrite_package' => true ) );
    } else {
        ob_end_clean();
        return new WP_Error( 'missing_param', 'Se requiere slug, zip_url o zip_base64', array( 'status' => 400 ) );
    }

    ob_end_clean();

    if ( is_wp_error( $installed ) || false === $installed ) {
        $err_msg = is_wp_error( $installed ) ? $installed->get_error_message() : 'No se pudo instalar el plugin.';
        return new WP_Error( 'install_error', $err_msg, array( 'status' => 500 ) );
    }

    $plugin_file = $upgrader->plugin_info();
    if ( $activate && $plugin_file ) {
        activate_plugin( $plugin_file );
    }

    // Invalidar OPcache tras la instalación
    if ( function_exists( 'opcache_reset' ) ) {
        @opcache_reset();
    }

    return array(
        'status'      => 'success',
        'message'     => 'Plugin instalado y procesado exitosamente.',
        'plugin_file' => $plugin_file,
    );
}

/**
 * 5. ACTIVAR / DESACTIVAR PLUGIN
 */
function sentinel_toggle_plugin( WP_REST_Request $request ) {
    require_once ABSPATH . 'wp-admin/includes/plugin.php';

    $file   = sanitize_text_field( (string) $request->get_param( 'file' ) );
    $slug   = sanitize_text_field( (string) $request->get_param( 'slug' ) );
    $action = sanitize_text_field( (string) $request->get_param( 'action' ) );

    if ( empty( $file ) && ! empty( $slug ) ) {
        $all = get_plugins();
        foreach ( $all as $f => $d ) {
            if ( dirname( $f ) === $slug || $f === $slug ) {
                $file = $f;
                break;
            }
        }
    }

    if ( empty( $file ) ) {
        return new WP_Error( 'not_found', 'Plugin no encontrado.', array( 'status' => 404 ) );
    }

    if ( 'activate' === $action ) {
        $result = activate_plugin( $file );
        if ( is_wp_error( $result ) ) {
            return new WP_Error( 'activate_error', $result->get_error_message(), array( 'status' => 500 ) );
        }
        return array( 'status' => 'success', 'message' => 'Plugin activado.' );
    } else {
        deactivate_plugins( $file );
        return array( 'status' => 'success', 'message' => 'Plugin desactivado.' );
    }
}

/**
 * 6. LISTAR TEMAS
 */
function sentinel_get_themes() {
    $themes = wp_get_themes();
    $active = get_stylesheet();
    $updates = function_exists( 'get_theme_updates' ) ? get_theme_updates() : array();

    $list = array();
    foreach ( $themes as $stylesheet => $theme ) {
        $has_update = isset( $updates[ $stylesheet ] );
        $list[] = array(
            'name'             => $theme->get( 'Name' ),
            'slug'             => $stylesheet,
            'version'          => $theme->get( 'Version' ),
            'is_active'        => ( $active === $stylesheet ),
            'author'           => strip_tags( $theme->get( 'Author' ) ),
            'update_available' => $has_update,
            'new_version'      => $has_update ? ($updates[ $stylesheet ]->update['new_version'] ?? null) : null,
        );
    }

    return array( 'status' => 'success', 'themes' => $list );
}

/**
 * 7. LISTADO DE USUARIOS
 */
function sentinel_get_users() {
    $users = get_users( array(
        'number' => 100,
        'fields' => array( 'ID', 'user_login', 'user_email', 'display_name', 'user_registered' ),
    ) );

    $list = array();
    foreach ( $users as $u ) {
        $user_obj = get_userdata( $u->ID );
        $list[] = array(
            'id'           => $u->ID,
            'login'        => $u->user_login,
            'email'        => $u->user_email,
            'display_name' => $u->display_name,
            'roles'        => $user_obj ? $user_obj->roles : array(),
            'registered'   => $u->user_registered,
        );
    }

    return array( 'status' => 'success', 'users' => $list );
}

/**
 * 8. RESTABLECER CONTRASEÑA DE USUARIO
 */
function sentinel_reset_user_password( WP_REST_Request $request ) {
    $user_id = (int) $request->get_param( 'user_id' );
    $user = get_user_by( 'id', $user_id );

    if ( ! $user ) {
        return new WP_Error( 'user_not_found', 'Usuario no encontrado.', array( 'status' => 404 ) );
    }

    // Disparar flujo oficial de restablecimiento por correo de WordPress
    $retrieved = retrieve_password( $user->user_login );
    if ( is_wp_error( $retrieved ) ) {
        return new WP_Error( 'reset_failed', $retrieved->get_error_message(), array( 'status' => 500 ) );
    }

    return array(
        'status'  => 'success',
        'message' => 'Correo de restablecimiento enviado exitosamente a ' . $user->user_email,
    );
}

/**
 * 9. COPIAS DE SEGURIDAD (UPDRAFTPLUS & ESTADO)
 */
function sentinel_get_backups() {
    $history = get_option( 'updraft_backup_history', array() );
    $configured = class_exists( 'UpdraftPlus' );

    $last_backup = 'No detectado';
    if ( ! empty( $history ) && is_array( $history ) ) {
        $latest = max( array_keys( $history ) );
        $last_backup = date( 'Y-m-d H:i:s', (int) $latest );
    }

    return array(
        'status'           => 'success',
        'updraft_active'   => $configured,
        'last_backup'      => $last_backup,
        'backup_sets_count'=> is_array( $history ) ? count( $history ) : 0,
    );
}

function sentinel_run_backup() {
    if ( ! class_exists( 'UpdraftPlus' ) ) {
        return new WP_Error( 'not_installed', 'UpdraftPlus no está activo.', array( 'status' => 400 ) );
    }

    // Programar respaldo inmediato mediante UpdraftPlus
    wp_schedule_single_event( time() + 5, 'updraft_backup' );

    return array(
        'status'  => 'success',
        'message' => 'Copia de seguridad de UpdraftPlus iniciada en segundo plano.',
    );
}

/**
 * 10. AGENCIA Y WHITE-LABEL BRANDING
 */
function sentinel_get_branding() {
    return array(
        'status'      => 'success',
        'logo_url'    => get_option( 'sentinel_branding_logo_url', '' ),
        'bg_color'    => get_option( 'sentinel_branding_bg_color', '#0f172a' ),
        'bg_image'    => get_option( 'sentinel_branding_bg_image', '' ),
        'footer_text' => get_option( 'sentinel_branding_footer_text', 'Desarrollado y Gestionado por Impulsos Digitales' ),
    );
}

function sentinel_set_branding( WP_REST_Request $request ) {
    $logo_url    = esc_url_raw( (string) $request->get_param( 'logo_url' ) );
    $bg_color    = sanitize_hex_color( (string) $request->get_param( 'bg_color' ) );
    $bg_image    = esc_url_raw( (string) $request->get_param( 'bg_image' ) );
    $footer_text = sanitize_text_field( (string) $request->get_param( 'footer_text' ) );

    if ( $logo_url !== '' ) update_option( 'sentinel_branding_logo_url', $logo_url );
    if ( $bg_color ) update_option( 'sentinel_branding_bg_color', $bg_color );
    if ( $bg_image !== '' ) update_option( 'sentinel_branding_bg_image', $bg_image );
    if ( $footer_text !== '' ) update_option( 'sentinel_branding_footer_text', $footer_text );

    return array( 'status' => 'success', 'message' => 'Branding actualizado exitosamente.' );
}

// Inyección de estilos de login personalizados
add_action( 'login_enqueue_scripts', function () {
    $logo = get_option( 'sentinel_branding_logo_url' );
    $bg   = get_option( 'sentinel_branding_bg_color' );
    $img  = get_option( 'sentinel_branding_bg_image' );

    if ( $logo || $bg || $img ) {
        echo '<style type="text/css">';
        if ( $bg || $img ) {
            echo 'body.login { background-color: ' . esc_attr( $bg ?: '#0f172a' ) . '; ' . ( $img ? 'background-image: url(' . esc_url( $img ) . '); background-size: cover;' : '' ) . ' }';
        }
        if ( $logo ) {
            echo '#login h1 a, .login h1 a { background-image: url(' . esc_url( $logo ) . ') !important; background-size: contain !important; width: 100% !important; height: 80px !important; }';
        }
        echo '</style>';
    }
} );

// Inyección de pie de página institucional
add_filter( 'admin_footer_text', function ( $text ) {
    $custom = get_option( 'sentinel_branding_footer_text' );
    return ! empty( $custom ) ? wp_kses_post( $custom ) : $text;
} );

/**
 * 11. WIDGETS DE ESCRITORIO
 */
function sentinel_get_widgets() {
    return array(
        'status'         => 'success',
        'hidden_widgets' => get_option( 'sentinel_hidden_dashboard_widgets', array() ),
    );
}

function sentinel_set_widgets( WP_REST_Request $request ) {
    $hidden = $request->get_param( 'hidden_widgets' );
    if ( is_array( $hidden ) ) {
        $sanitized = array_map( 'sanitize_key', $hidden );
        update_option( 'sentinel_hidden_dashboard_widgets', $sanitized );
    }
    return array( 'status' => 'success', 'message' => 'Widgets sincronizados.' );
}

add_action( 'wp_dashboard_setup', function () {
    $hidden = get_option( 'sentinel_hidden_dashboard_widgets', array() );
    if ( is_array( $hidden ) ) {
        foreach ( $hidden as $widget_id ) {
            remove_meta_box( $widget_id, 'dashboard', 'normal' );
            remove_meta_box( $widget_id, 'dashboard', 'side' );
        }
    }
    if ( in_array( 'welcome_panel', (array) $hidden, true ) ) {
        remove_action( 'welcome_panel', 'wp_welcome_panel' );
    }
}, 999 );

/**
 * 12. RENDIMIENTO Y PURGA DE CACHÉ
 */
function sentinel_get_performance() {
    $cache_plugin = 'Ninguno detectado';
    if ( defined( 'LSCWP_V' ) ) $cache_plugin = 'LiteSpeed Cache';
    elseif ( defined( 'WP_ROCKET_VERSION' ) ) $cache_plugin = 'WP Rocket';
    elseif ( defined( 'W3TC' ) ) $cache_plugin = 'W3 Total Cache';
    elseif ( function_exists( 'wp_cache_clean_cache' ) ) $cache_plugin = 'WP Super Cache';

    return array(
        'status'       => 'success',
        'cache_plugin' => $cache_plugin,
    );
}

function sentinel_purge_cache() {
    // LiteSpeed
    if ( class_exists( '\LiteSpeed\Purge' ) ) {
        \LiteSpeed\Purge::purge_all();
    }
    // WP Rocket
    if ( function_exists( 'rocket_clean_domain' ) ) {
        rocket_clean_domain();
    }
    // WP Super Cache
    if ( function_exists( 'wp_cache_clean_cache' ) ) {
        global $file_prefix;
        wp_cache_clean_cache( $file_prefix, true );
    }
    // W3TC
    if ( function_exists( 'w3tc_flush_all' ) ) {
        w3tc_flush_all();
    }
    // OPcache
    if ( function_exists( 'opcache_reset' ) ) {
        @opcache_reset();
    }

    return array( 'status' => 'success', 'message' => 'Caché de servidor purgada con éxito.' );
}

/**
 * 13. CONFIGURACIÓN Y DRIFT
 */
function sentinel_export_config( WP_REST_Request $request ) {
    $keys = $request->get_param( 'keys' );
    $data = array();
    if ( is_array( $keys ) ) {
        foreach ( $keys as $k ) {
            $data[ $k ] = get_option( sanitize_key( $k ), null );
        }
    }
    return array( 'status' => 'success', 'config' => $data );
}

function sentinel_apply_config( WP_REST_Request $request ) {
    $payload = $request->get_param( 'payload' );
    if ( is_array( $payload ) ) {
        foreach ( $payload as $k => $v ) {
            update_option( sanitize_key( $k ), $v );
        }
    }
    return array( 'status' => 'success', 'message' => 'Plantilla aplicada al sitio.' );
}

/**
 * 14. ANALÍTICA LOCAL ULTRALIGERA (RETENCIÓN DE 6 MESES)
 */
function sentinel_create_analytics_table() {
    global $wpdb;
    $table = $wpdb->prefix . 'sentinel_analytics';
    $charset = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS {$table} (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        hit_date DATE NOT NULL,
        path VARCHAR(255) NOT NULL,
        referrer VARCHAR(255) NULL,
        is_mobile TINYINT(1) DEFAULT 0,
        ip_hash CHAR(32) NOT NULL,
        KEY hit_date_idx (hit_date),
        KEY path_idx (path(191))
    ) {$charset};";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta( $sql );
}
register_activation_hook( __FILE__, 'sentinel_create_analytics_table' );

// Registro ligero de visitas en frontend
add_action( 'template_redirect', function () {
    if ( is_admin() || wp_doing_ajax() || wp_doing_cron() || is_user_logged_in() ) {
        return;
    }

    $ua = isset( $_SERVER['HTTP_USER_AGENT'] ) ? sanitize_text_field( $_SERVER['HTTP_USER_AGENT'] ) : '';
    // Ignorar bots de rastreo conocidos
    if ( preg_match( '/bot|crawl|spider|slurp|facebook|google/i', $ua ) ) {
        return;
    }

    global $wpdb;
    $table = $wpdb->prefix . 'sentinel_analytics';

    $path      = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( strtok( $_SERVER['REQUEST_URI'], '?' ) ) : '/';
    $ref       = isset( $_SERVER['HTTP_REFERER'] ) ? sanitize_text_field( parse_url( $_SERVER['HTTP_REFERER'], PHP_URL_HOST ) ) : null;
    $is_mobile = wp_is_mobile() ? 1 : 0;
    $ip        = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $ip_hash   = md5( $ip . date( 'Y-m-d' ) ); // Anónimo diario para conteo de visitantes únicos

    $wpdb->query( $wpdb->prepare(
        "INSERT INTO {$table} (hit_date, path, referrer, is_mobile, ip_hash) VALUES (CURDATE(), %s, %s, %d, %s)",
        $path, $ref, $is_mobile, $ip_hash
    ) );
} );

// Resumen analítico de los últimos 6 meses
function sentinel_get_analytics_summary() {
    global $wpdb;
    $table = $wpdb->prefix . 'sentinel_analytics';

    // Asegurar que la tabla exista
    sentinel_create_analytics_table();

    // 1. Visitas por mes (últimos 6 meses)
    $monthly = $wpdb->get_results(
        "SELECT DATE_FORMAT(hit_date, '%Y-%m') as month, COUNT(*) as visits, COUNT(DISTINCT ip_hash) as unique_visitors 
         FROM {$table} 
         WHERE hit_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
         GROUP BY DATE_FORMAT(hit_date, '%Y-%m') 
         ORDER BY month ASC"
    );

    // 2. Top 10 páginas
    $top_pages = $wpdb->get_results(
        "SELECT path, COUNT(*) as hits 
         FROM {$table} 
         WHERE hit_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
         GROUP BY path 
         ORDER BY hits DESC LIMIT 10"
    );

    // 3. Desglose dispositivo
    $devices = $wpdb->get_results(
        "SELECT is_mobile, COUNT(*) as count 
         FROM {$table} 
         WHERE hit_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
         GROUP BY is_mobile"
    );

    return array(
        'status'    => 'success',
        'monthly'   => $monthly,
        'top_pages' => $top_pages,
        'devices'   => $devices,
    );
}

// Limpieza automática semanal de hits mayores a 180 días (6 meses)
if ( ! wp_next_scheduled( 'sentinel_analytics_prune_cron' ) ) {
    wp_schedule_event( time(), 'weekly', 'sentinel_analytics_prune_cron' );
}
add_action( 'sentinel_analytics_prune_cron', function () {
    global $wpdb;
    $table = $wpdb->prefix . 'sentinel_analytics';
    $wpdb->query( "DELETE FROM {$table} WHERE hit_date < DATE_SUB(CURDATE(), INTERVAL 180 DAY)" );
} );

