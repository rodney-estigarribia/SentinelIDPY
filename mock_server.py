from http.server import BaseHTTPRequestHandler, HTTPServer
import json

class MockHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if '/wp-json/custom-reports/v1/wordfence-blocks' in self.path:
            token = self.headers.get('X-WF-Report-Token')
            if token == 'TU_CLAVE_SECRETA_AQUI_12345':
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'success', 'blocked_attacks': 42}).encode())
                return
            else:
                self.send_response(403)
                self.end_headers()
                return
        self.send_response(404)
        self.end_headers()

if __name__ == '__main__':
    server = HTTPServer(('localhost', 8080), MockHandler)
    print("Mock server running on port 8080...")
    server.serve_forever()
