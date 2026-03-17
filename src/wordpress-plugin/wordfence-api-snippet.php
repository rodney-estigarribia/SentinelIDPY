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
