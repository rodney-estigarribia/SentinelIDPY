<?php
/**
 * Plugin Name: Wordfence Reports API
 * Description: Crea un endpoint REST protegido para consultar estadísticas de ataques bloqueados en Wordfence.
 * Author: Tu Nombre
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
 * Verifica que el header X-WF-Report-Token coincida con la constante definida en wp-config.php.
 */
function verify_wf_report_token( WP_REST_Request $request ) {
    // Si la constante WF_REPORT_TOKEN no está expuesta en wp-config.php, bloqueamos por seguridad.
    if ( ! defined( 'WF_REPORT_TOKEN' ) ) {
        return new WP_Error( 
            'rest_forbidden', 
            esc_html__( 'El token de seguridad no está configurado en el servidor.', 'text-domain' ), 
            array( 'status' => 500 ) 
        );
    }
    
    // Forzamos que el token sea fuerte (ej. un UUID o Hash SHA de 32+ caracteres) para evitar fuerza bruta.
    if ( strlen( WF_REPORT_TOKEN ) < 32 ) {
        return new WP_Error( 
            'rest_forbidden', 
            esc_html__( 'El token de seguridad es demasiado corto. Usa al menos 32 caracteres (ej. UUIDv4).', 'text-domain' ), 
            array( 'status' => 500 ) 
        );
    }
    
    $secret_token = WF_REPORT_TOKEN;
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
 * Consulta la base de datos para obtener los bloqueos de los últimos 30 días.
 */
function get_wordfence_blocked_stats() {
    global $wpdb;

    // Wordfence habitualmente guarda los bloqueos en wp_wfblocks7 o wp_wfHits
    // Asumiremos que estás buscando ataques en wp_wfHits donde action='blocked' u action='blocked:firewall'
    
    $table_name = $wpdb->prefix . 'wfHits';
    
    // Si la tabla no existe, devolvemos 0 o un error.
    if( $wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name ) {
         return array(
            'status' => 'success',
            'blocked_attacks' => 0,
            'note' => 'Tabla de Wordfence no encontrada.'
        );
    }

    // Calcula el timestamp de hace 30 días
    // Wordfence guarda 'ctime' como un float/double tipo UNIX timestamp
    $thirty_days_ago = time() - (30 * 24 * 60 * 60);

    // Consulta Optimizada: Usamos coincidencia exacta de acción para aprovechar índices
    $query = $wpdb->prepare(
        "SELECT COUNT(*) FROM {$table_name} WHERE ctime > %f AND action = %s",
        $thirty_days_ago,
        'blocked'
    );

    $count = $wpdb->get_var( $query );

    return array(
        'status' => 'success',
        'blocked_attacks' => (int) $count
    );
}
?>
