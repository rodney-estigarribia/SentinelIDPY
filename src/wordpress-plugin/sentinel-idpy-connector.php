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
 * IMPORTANTE: Recuerda mantener este mismo hash en tu script de Python central.
 * Longitud mínima recomendada: 32 caracteres.
 */
define('WF_REPORT_TOKEN_INTERNAL', 'your_32_character_secure_hash_here_123');

/**
 * Verifica que el header X-WF-Report-Token coincida con la constante interna.
 */
function verify_wf_report_token( WP_REST_Request $request ) {    
    // Forzamos que el token sea fuerte (ej. un UUID o Hash SHA de 32+ caracteres) para evitar fuerza bruta.
    if ( strlen( WF_REPORT_TOKEN_INTERNAL ) < 32 ) {
        return new WP_Error( 
            'rest_forbidden', 
            esc_html__( 'El token de seguridad es demasiado corto. Asegúrate de modificar el código del plugin para usar al menos 32 caracteres.', 'text-domain' ), 
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
    
    // Si la tabla no existe, devolvemos un estado básico.
    if( $wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name ) {
         return array(
            'status' => 'success',
            'total_attacks' => 0,
            'note' => 'Tabla de Wordfence no encontrada.'
        );
    }

    $thirty_days_ago = time() - (30 * 24 * 60 * 60);

    // 1. Total de ataques (Existing)
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
    $top_ips = array();
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
    $top_urls = array();
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

    // 5. Top 5 Attempted Usernames (Extrayendo de actionData si existe)
    // Nota: 'actionData' es JSON serializado. Intentamos buscar patrones comunes.
    $top_users_query = $wpdb->prepare(
        "SELECT actionData, COUNT(*) as count FROM {$table_name} 
         WHERE ctime > %f AND action = %s AND actionDescription LIKE %s 
         GROUP BY actionData ORDER BY count DESC LIMIT 5",
        $thirty_days_ago, 'blocked', '%login%'
    );
    $top_users_raw = $wpdb->get_results( $top_users_query );
    $top_usernames = array();
    foreach($top_users_raw as $row) {
        $data = json_decode($row->actionData, true);
        $user = isset($data['username']) ? $data['username'] : (isset($data['user']) ? $data['user'] : 'Desconocido');
        if($user !== 'Desconocido') {
            $top_usernames[] = array('user' => $user, 'count' => (int)$row->count);
        }
    }

    // 6. Server Health & Info
    $disk_total = disk_total_space(ABSPATH);
    $disk_free = disk_free_space(ABSPATH);
    $disk_used = $disk_total - $disk_free;
    $disk_percentage = $disk_total > 0 ? round(($disk_used / $disk_total) * 100, 2) : 0;

    $server_info = array(
        'disk_total' => size_format($disk_total),
        'disk_free' => size_format($disk_free),
        'disk_used_percentage' => $disk_percentage,
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

    // 11. Wordfence Malware Scan
    $last_scan = 'No disponible';
    if (class_exists('wfConfig')) {
        $last_scan_time = wfConfig::get('lastScanCompleted', 0);
        if ($last_scan_time > 0) {
            $last_scan = date('Y-m-d H:i:s', $last_scan_time);
        }
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
