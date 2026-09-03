const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8123;
const ROOT = path.resolve(__dirname);

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer((req, res) => {
    // Handle CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    let reqUrl = req.url.split('?')[0];
    let decodedPath = decodeURIComponent(reqUrl);

    // Default routes
    if (decodedPath === '/' || decodedPath === '') {
        decodedPath = '/index.html';
    } else if (decodedPath === '/admin' || decodedPath === '/admin/') {
        decodedPath = '/admin/index.html';
    }

    let filePath = path.join(ROOT, decodedPath);

    // Prevent directory traversal
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Check if .html extension exists for clean URLs
            if (fs.existsSync(filePath + '.html') && fs.statSync(filePath + '.html').isFile()) {
                serveFile(filePath + '.html', res);
                return;
            }

            // Check if it's a directory with index.html
            if (stats && stats.isDirectory()) {
                const dirIndex = path.join(filePath, 'index.html');
                if (fs.existsSync(dirIndex)) {
                    serveFile(dirIndex, res);
                    return;
                }
            }

            // 404 handler
            const notFoundPage = path.join(ROOT, '404.html');
            if (fs.existsSync(notFoundPage)) {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                fs.createReadStream(notFoundPage).pipe(res);
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            }
            return;
        }

        serveFile(filePath, res);
    });
});

function serveFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    fs.createReadStream(filePath).pipe(res);
}

if (require.main === module) {
    server.listen(PORT, '127.0.0.1', () => {
        console.log(`\n==================================================`);
        console.log(`  My Skin My Health Local Server Running!`);
        console.log(`  🌐 Website:     http://127.0.0.1:${PORT}/index.html`);
        console.log(`  ⚡ Admin Panel: http://127.0.0.1:${PORT}/admin/index.html`);
        console.log(`  📖 Blog:        http://127.0.0.1:${PORT}/blog.html`);
        console.log(`  📅 Booking:     http://127.0.0.1:${PORT}/booking.html`);
        console.log(`==================================================\n`);
    });
}

module.exports = server;
