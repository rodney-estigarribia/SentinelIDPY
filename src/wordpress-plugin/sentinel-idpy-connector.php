<?php
/**
 * Plugin Name: SentinelIDPY Connector
 * Description: Conector REST API para reportes de mantenimiento, infraestructura y seguridad personalizados de SentinelIDPY.
 * Author: Rodney Estigarribia - Impulsos Digitales
 * Version: 2.2
 */

// Evitar acceso directo
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// --- Auto-update via GitHub Releases ---
define( 'SENTINEL_PLUGIN_VERSION', '2.2' );
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
            set_transient( $cache_key, array(), 6 * HOUR_IN_SECONDS );
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
function get_wordfence_blocked_stats() {
    try {
        return sentinel_stats_inner();
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

function sentinel_stats_inner() {
    global $wpdb;

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
    error_log( 'Sentinel: Wordfence table check for ' . $wpdb->prefix . 'wfHits' . ', found=' . ( $found_table ? $found_table : 'none' ) );

    $wf_start = isset($_GET['wf_start']) ? (int) $_GET['wf_start'] : time() - (30 * 24 * 60 * 60);
    $wf_end = isset($_GET['wf_end']) ? (int) $_GET['wf_end'] : time();

    // Wordfence data (only if available)
    $total_attacks = 0;
    $top_ips = array();
    $top_urls = array();
    $top_reasons = array();
    $top_usernames = array();
    $last_scan = 'No disponible';

    if ($wordfence_available) {
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
            if ($last_scan_time > 0) {
                $last_scan = date('Y-m-d H:i:s', $last_scan_time);
            }
        }
    }

    // 6. Server Health & Info
    // Use actual WordPress site size instead of full server disk (which is misleading on shared hosting)
    $gb_divisor = 1024 * 1024 * 1024;
    $site_size_bytes = 0;

    // Try shell du first (fastest, works if enabled)
    $du_out = @shell_exec('du -sb ' . escapeshellarg(ABSPATH) . ' 2>/dev/null');
    if ($du_out && preg_match('/^(\d+)/', trim($du_out), $m)) {
        $site_size_bytes = (int) $m[1];
    } else {
        // Fallback: just measure wp-content (uploads/plugins/themes)
        $du_content = @shell_exec('du -sb ' . escapeshellarg(WP_CONTENT_DIR) . ' 2>/dev/null');
        if ($du_content && preg_match('/^(\d+)/', trim($du_content), $m)) {
            $site_size_bytes = (int) $m[1];
        }
    }

    $site_size_gb = $site_size_bytes > 0 ? round($site_size_bytes / $gb_divisor, 2) : null;
    error_log('Sentinel: site_size_bytes=' . $site_size_bytes . ', site_size_gb=' . $site_size_gb);

    $server_info = array(
        'site_size_gb' => $site_size_gb,
        'php_version' => PHP_VERSION,
        'wp_version' => get_bloginfo('version'),
        'server_ip' => $_SERVER['SERVER_ADDR'] ?? 'Unknown'
    );

    // 7. Recent Plugin Updates (via transients)
    $recent_updates = array();
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

    // 8. Last Backup Status (UpdraftPlus)
    $last_backup = 'No detectado';
    if (class_exists('UpdraftPlus')) {
        $backup_history = get_option('updraft_backup_history');
        if (!empty($backup_history) && is_array($backup_history)) {
            $latest = max(array_keys($backup_history));
            $last_backup = date('Y-m-d H:i:s', $latest);
        }
    }

    // 9. SSL Status
    $ssl_days_left = 'N/A';
    $site_url = get_site_url();
    if (strpos($site_url, 'https') === 0) {
        $url_parts = parse_url($site_url);
        $host = $url_parts['host'];
        $get = @stream_context_create(array("ssl" => array("capture_peer_cert" => True)));
        $read = @stream_socket_client("ssl://" . $host . ":443", $errno, $errstr, 30, STREAM_CLIENT_CONNECT, $get);
        if ($read) {
            $cont = stream_context_get_params($read);
            $cert = openssl_x509_parse($cont["options"]["ssl"]["peer_certificate"]);
            $ssl_days_left = round(($cert['validTo_time_t'] - time()) / 86400);
        }
    }

    // 10. Pending Updates Count
    $pending_updates = array(
        'plugins'   => 0,
        'themes'    => 0,
        'wordpress' => 0,
    );
    if ( function_exists( 'wp_get_update_data' ) ) {
        $update_data = wp_get_update_data();
        $pending_updates = array(
            'plugins'   => $update_data['counts']['plugins'] ?? 0,
            'themes'    => $update_data['counts']['themes'] ?? 0,
            'wordpress' => $update_data['counts']['wordpress'] ?? 0,
        );
    }

    // 10b. Site Health Score
    $site_health_score = array( 'status' => 'good', 'good' => 0, 'recommended' => 0, 'critical' => 0 );
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


    $matomo_period = isset($_GET['matomo_period']) ? sanitize_text_field($_GET['matomo_period']) : 'month';
    $matomo_date = isset($_GET['matomo_date']) ? sanitize_text_field($_GET['matomo_date']) : 'today';
    $matomo_prev_date = isset($_GET['matomo_prev_date']) ? sanitize_text_field($_GET['matomo_prev_date']) : 'lastMonth';

    // 11. Matomo Analytics (if available)
    $debug_msg = '';
    $matomo_data = sentinel_get_matomo_data($debug_msg, $matomo_period, $matomo_date, $matomo_prev_date);

    $response = array(
        'status' => 'success',
        'wordfence' => array(
            'total_attacks' => $total_attacks,
            'top_ips' => $top_ips,
            'top_urls' => $top_urls,
            'top_reasons' => $top_reasons,
            'top_usernames' => $top_usernames,
            'last_scan' => $last_scan,
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
    return array(
        'message' => 'Headers Debug Info',
        'request_headers' => $request->get_headers(),
        'server_http_vars' => array_filter($_SERVER, function($key) {
            return strpos($key, 'HTTP_') === 0;
        }, ARRAY_FILTER_USE_KEY),
        'php_headers' => function_exists('getallheaders') ? getallheaders() : 'N/A',
        'wf_report_token_vars' => array(
            'request_get_header_underscore' => $request->get_header('x_wf_report_token'),
            'request_get_header_hyphen' => $request->get_header('x-wf-report-token'),
            'server_var' => $_SERVER['HTTP_X_WF_REPORT_TOKEN'] ?? 'NOT SET',
        )
    );
}
