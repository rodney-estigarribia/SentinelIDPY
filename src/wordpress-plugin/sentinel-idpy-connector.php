<?php
/**
 * Plugin Name: SentinelIDPY Connector
 * Description: Conector REST API para reportes de mantenimiento, infraestructura y seguridad personalizados de SentinelIDPY.
 * Author: Rodney Estigarribia - Impulsos Digitales
 * Version: 2.1
 */

// Evitar acceso directo
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

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
        $summary = array();
        if ( is_object( $visits_data ) && method_exists( $visits_data, 'getColumns' ) ) {
            $summary = $visits_data->getColumns();
        } elseif ( is_object( $visits_data ) && method_exists( $visits_data, 'getFirstRow' ) ) {
            $row = $visits_data->getFirstRow();
            $summary = $row ? $row->getColumns() : array();
        } elseif ( is_array( $visits_data ) ) {
            $summary = $visits_data;
        }

        error_log( 'Sentinel: Matomo data retrieved - visits=' . ( $summary['nb_visits'] ?? 0 ) . ', visitors=' . ( $summary['nb_uniq_visitors'] ?? 0 ) . ', actions=' . ( $summary['nb_actions'] ?? 0 ) );

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
        if ( is_object( $prev_month_data ) && method_exists( $prev_month_data, 'getColumns' ) ) {
            $prev_summary = $prev_month_data->getColumns();
        } elseif ( is_object( $prev_month_data ) && method_exists( $prev_month_data, 'getFirstRow' ) ) {
            $prev_row = $prev_month_data->getFirstRow();
            $prev_summary = $prev_row ? $prev_row->getColumns() : array();
        } elseif ( is_array( $prev_month_data ) ) {
            $prev_summary = $prev_month_data;
        }

        error_log( 'Sentinel: Matomo prev month - visits=' . ( $prev_summary['nb_visits'] ?? 0 ) );

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
    global $wpdb;

    $table_name = $wpdb->prefix . 'wfHits';
    $wordfence_available = $wpdb->get_var("SHOW TABLES LIKE '$table_name'") == $table_name;

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
        // 1. Total de ataques
        $total_query = $wpdb->prepare(
            "SELECT COUNT(*) FROM {$table_name} WHERE ctime >= %f AND ctime <= %f AND action = %s",
            $wf_start, $wf_end, 'blocked'
        );
        $total_attacks = (int) $wpdb->get_var( $total_query );

        // 2. Top 5 Malicious IPs
        $top_ips_query = $wpdb->prepare(
            "SELECT IP, COUNT(*) as count FROM {$table_name}
             WHERE ctime >= %f AND ctime <= %f AND action = %s
             GROUP BY IP ORDER BY count DESC LIMIT 5",
            $wf_start, $wf_end, 'blocked'
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
             WHERE ctime >= %f AND ctime <= %f AND action = %s
             GROUP BY URL ORDER BY count DESC LIMIT 5",
            $wf_start, $wf_end, 'blocked'
        );
        $top_urls_raw = $wpdb->get_results( $top_urls_query );
        foreach($top_urls_raw as $row) {
            $top_urls[] = array('url' => $row->URL, 'count' => (int)$row->count);
        }

        // 4. Top 5 Block Reasons
        $top_reasons_query = $wpdb->prepare(
            "SELECT actionDescription as reason, COUNT(*) as count FROM {$table_name}
             WHERE ctime >= %f AND ctime <= %f AND action = %s
             GROUP BY actionDescription ORDER BY count DESC LIMIT 5",
            $wf_start, $wf_end, 'blocked'
        );
        $top_reasons = $wpdb->get_results( $top_reasons_query );

        // 5. Top 5 Attempted Usernames
        $top_users_query = $wpdb->prepare(
            "SELECT actionData, COUNT(*) as count FROM {$table_name}
             WHERE ctime >= %f AND ctime <= %f AND action = %s AND actionDescription LIKE %s
             GROUP BY actionData ORDER BY count DESC LIMIT 5",
            $wf_start, $wf_end, 'blocked', '%login%'
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
    $disk_total = disk_total_space(ABSPATH);
    $disk_free = disk_free_space(ABSPATH);
    $disk_used = $disk_total - $disk_free;
    $disk_percentage = $disk_total > 0 ? round(($disk_used / $disk_total) * 100, 2) : 0;

    // Convertir a GB para cálculos de barra de progreso
    $gb_divisor = 1024 * 1024 * 1024;
    $disk_total_gb = round($disk_total / $gb_divisor, 2);
    $disk_free_gb = round($disk_free / $gb_divisor, 2);
    $disk_used_gb = round($disk_used / $gb_divisor, 2);

    $server_info = array(
        'disk_total' => size_format($disk_total),
        'disk_free' => size_format($disk_free),
        'disk_used_percentage' => $disk_percentage,
        'disk_total_gb' => $disk_total_gb,
        'disk_free_gb' => $disk_free_gb,
        'disk_used_gb' => $disk_used_gb,
        'php_version' => PHP_VERSION,
        'wp_version' => get_bloginfo('version'),
        'server_ip' => $_SERVER['SERVER_ADDR'] ?? 'Unknown'
    );

    // 7. Recent Plugin Updates (via transients)
    $recent_updates = array();
    $upgrade_log = get_option('wp_core_block_plugin_updates'); // Custom option if exists, otherwise fallback
    
    // Fallback: Get last 5 recently updated plugins from the 'plugin_updates' transient or similar
    // Since WP doesn't have a native "log" of updates easily accessible, we check the 'update_plugins' transient
    // for what IS available or use a basic list of active plugins as proxy if no log found.
    // Realistically, for this snippet, we'll try to find any "last update" data.
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
    if ( class_exists( 'WP_Site_Health' ) ) {
        require_once ABSPATH . 'wp-admin/includes/class-wp-site-health.php';
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
            'last_scan' => $last_scan
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
