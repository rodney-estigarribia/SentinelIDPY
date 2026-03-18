<?php
/**
 * Plugin Name: SentinelIDPY Connector
 * Description: Conector REST API para reportes de mantenimiento, infraestructura y seguridad personalizados de SentinelIDPY.
 * Author: Rodney Estigarribia - Impulsos Digitales
 * Version: 2.0
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
} );

/**
 * Define el hash interno de seguridad.
 * Se lee desde la opción WordPress 'sentinel_idpy_report_token' (configurable en Admin).
 * Longitud mínima recomendada: 32 caracteres.
 */
define('WF_REPORT_TOKEN_INTERNAL', get_option('sentinel_idpy_report_token', ''));

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
    // Forzamos que el token sea fuerte (ej. un UUID o Hash SHA de 32+ caracteres) para evitar fuerza bruta.
    if ( strlen( WF_REPORT_TOKEN_INTERNAL ) < 32 ) {
        return new WP_Error(
            'rest_forbidden',
            esc_html__( 'El token de seguridad no está configurado o es demasiado corto. Configúralo en Configuración → SentinelIDPY con al menos 32 caracteres.', 'text-domain' ),
            array( 'status' => 500 )
        );
    }
    
    $secret_token = WF_REPORT_TOKEN_INTERNAL;
    $provided_token = $request->get_header( 'x_wf_report_token' );

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
 * Consulta la base de datos para obtener los bloqueos de los últimos 30 días con métricas detalladas.
 */
function get_wordfence_blocked_stats() {
    global $wpdb;

    $table_name = $wpdb->prefix . 'wfHits';
    $wordfence_available = $wpdb->get_var("SHOW TABLES LIKE '$table_name'") == $table_name;

    $thirty_days_ago = time() - (30 * 24 * 60 * 60);

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
            "SELECT COUNT(*) FROM {$table_name} WHERE ctime > %f AND action = %s",
            $thirty_days_ago, 'blocked'
        );
        $total_attacks = (int) $wpdb->get_var( $total_query );

        // 2. Top 5 Malicious IPs
        $top_ips_query = $wpdb->prepare(
            "SELECT IP, COUNT(*) as count FROM {$table_name}
             WHERE ctime > %f AND action = %s
             GROUP BY IP ORDER BY count DESC LIMIT 5",
            $thirty_days_ago, 'blocked'
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
             WHERE ctime > %f AND action = %s
             GROUP BY URL ORDER BY count DESC LIMIT 5",
            $thirty_days_ago, 'blocked'
        );
        $top_urls_raw = $wpdb->get_results( $top_urls_query );
        foreach($top_urls_raw as $row) {
            $top_urls[] = array('url' => $row->URL, 'count' => (int)$row->count);
        }

        // 4. Top 5 Block Reasons
        $top_reasons_query = $wpdb->prepare(
            "SELECT actionDescription as reason, COUNT(*) as count FROM {$table_name}
             WHERE ctime > %f AND action = %s
             GROUP BY actionDescription ORDER BY count DESC LIMIT 5",
            $thirty_days_ago, 'blocked'
        );
        $top_reasons = $wpdb->get_results( $top_reasons_query );

        // 5. Top 5 Attempted Usernames
        $top_users_query = $wpdb->prepare(
            "SELECT actionData, COUNT(*) as count FROM {$table_name}
             WHERE ctime > %f AND action = %s AND actionDescription LIKE %s
             GROUP BY actionData ORDER BY count DESC LIMIT 5",
            $thirty_days_ago, 'blocked', '%login%'
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

    // 10. Site Health Score
    $site_health_score = 'Good'; // Default
    if ( class_exists( 'WP_Site_Health' ) ) {
        $site_health = WP_Site_Health::get_instance();
        $status = $site_health->get_test_status();
        $site_health_score = $status['label'] ?? 'Normal';
    }


    return array(
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
            'recent_updates' => $recent_updates,
            'last_backup' => $last_backup,
            'site_health' => $site_health_score
        ),
        'security' => array(
            'ssl_days_left' => $ssl_days_left
        )
    );
}
?>
