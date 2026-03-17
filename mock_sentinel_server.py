from http.server import BaseHTTPRequestHandler, HTTPServer
import json

class MockHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if '/wp-json/sentinel/v1/stats' in self.path:
            token = self.headers.get('X-WF-Report-Token')
            if token == 'TU_CLAVE_SECRETA_AQUI_12345':
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                
                response = {
                    'status': 'success',
                    'wordfence': {
                        'total_attacks': 123,
                        'top_ips': [{'ip': '192.168.1.1', 'count': 50}, {'ip': '10.0.0.1', 'count': 23}],
                        'top_urls': [{'url': '/wp-login.php', 'count': 40}, {'url': '/xmlrpc.php', 'count': 30}],
                        'top_reasons': [{'reason': 'Brute Force', 'count': 60}, {'reason': 'Complex Attack', 'count': 20}],
                        'top_usernames': [{'user': 'admin', 'count': 15}, {'user': 'root', 'count': 10}],
                        'last_scan': '2026-03-16 10:00:00'
                    },
                    'infrastructure': {
                        'disk_total': '100 GB',
                        'disk_free': '45 GB',
                        'disk_used_percentage': 55.0,
                        'php_version': '8.2.1',
                        'wp_version': '6.4.3',
                        'server_ip': '1.2.3.4'
                    },
                    'maintenance': {
                        'recent_updates': [
                            {'name': 'Akismet', 'version': '5.3'},
                            {'name': 'Yoast SEO', 'version': '22.1'},
                            {'name': 'Elementor', 'version': '3.20'}
                        ],
                        'last_backup': '2026-03-17 02:00:00',
                        'site_health': 'Good'
                    },
                    'security': {
                        'ssl_days_left': 120
                    }
                }
                
                self.wfile.write(json.dumps(response).encode())
                return
            else:
                self.send_response(403)
                self.end_headers()
                return
        self.send_response(404)
        self.end_headers()

if __name__ == '__main__':
    server = HTTPServer(('localhost', 8081), MockHandler)
    print("Mock server v2 running on port 8081...")
    server.serve_forever()
