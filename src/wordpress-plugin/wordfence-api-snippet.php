<?php
/**
 * Plugin Name: Wordfence Reports IDPY API
 * Description: Crea un endpoint REST protegido para consultar estadísticas de ataques bloqueados en Wordfence.
 * Author: Rodney Estigarribia - Impulsos Digitales
 * Version: 1.0
 */

// Evitar acceso directo
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_action( 'rest_api_init', function () {
    register_rest_route( 'custom-reports/v1', '/wordfence-blocks', array(
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

    return array(
        'status' => 'success',
        'total_attacks' => $total_attacks,
        'top_ips' => $top_ips,
        'top_urls' => $top_urls,
        'top_reasons' => $top_reasons,
        'top_usernames' => $top_usernames
    );
}
?>
