
let http = require('http');
let url = require('url');
let fs = require('fs');

http.createServer(function (req, res) {

    let q = url.parse(req.url, true);
    let filename = "." + q.pathname;

    if (q.pathname === '/'){ filename = './index.html'; }																					// server computer's file system to find the requested file.

    if (req.method === 'POST'){
        let body = [];

        req.on('data', data => {
            body.push(data);
        }).on('end', () => {
            body = Buffer.concat(body).toString();
            // Do things here, if needed. For Github pages, we can't use posts anyway, so probably shouldn't use this.
        });
    }

    // Handle GET request
    if (req.method === 'GET'){
        // Intercept isLocal check since we are local, want the UI to know it
        if (filename === "./isLocal.txt") {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write("1");
            res.end();
        } else {
            getAndSendFile(req, res, filename);
        }
    }

}).listen(8000);

function getAndSendFile(req, res, filename){
    fs.readFile(filename, function(err, data) {
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/html'});
            return res.end("404 Not Found");
        }
        let extension = filename.substring(filename.indexOf('.', 2) + 1, filename.length);
        switch (extension){
            // Glorified text
            case 'html': res.writeHead(200, {'Content-Type': 'text/html'}); break;
            case 'txt': res.writeHead(200, {'Content-Type': 'text/html'}); break;
            case 'css': res.writeHead(200, {'Content-Type': 'text/css'}); break;
            // Images
            case 'gif': res.writeHead(200, {'Content-Type': 'image/gif'}); break;
            case 'jpg': res.writeHead(200, {'Content-Type': 'image/jpeg'}); break;
            case 'jpeg': res.writeHead(200, {'Content-Type': 'image/jpeg'}); break;
            case 'png': res.writeHead(200, {'Content-Type': 'image/png'}); break;
            // audio
            case 'wav': res.writeHead(200, {'Content-Type': 'audio/wav'}); break;
            case 'mid': res.writeHead(200, {'Content-Type': 'text/midi'}); break;
            // application
            case 'json': res.writeHead(200, {'Content-Type': 'application/json'}); break;
            case 'js': res.writeHead(200, {'Content-Type': 'application/javascript'}); break;

            // Could add in video if needed...

            default: res.writeHead(200, {'Content-Type': 'text/html'}); break;
        }
        res.write(data);
        res.end();
    });
}