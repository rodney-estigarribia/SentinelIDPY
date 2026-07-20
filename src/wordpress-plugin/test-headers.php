<?php
/**
 * Debug script to test what headers are being received
 * Place in WordPress root and access: /test-headers.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit('Direct access not allowed');
}

// Simple output without loading full WordPress
header('Content-Type: application/json');

$output = array(
    'timestamp' => date('Y-m-d H:i:s'),
    'all_headers' => getallheaders() ?: array(),
    'http_x_wf_report_token' => $_SERVER['HTTP_X_WF_REPORT_TOKEN'] ?? 'NOT SET',
    'http_x_wf_report_token_underscore' => $_SERVER['HTTP_X_WF_REPORT_TOKEN'] ?? 'NOT SET',
    'all_server_vars' => array_filter($_SERVER, function($key) {
        return strpos($key, 'HTTP_') === 0 && strpos($key, 'WF') !== false;
    }, ARRAY_FILTER_USE_KEY),
);

echo json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>
