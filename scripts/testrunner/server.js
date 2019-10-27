const finalhandler = require('finalhandler');
const http = require('http');
const path = require('path');

const serveStatic = require('serve-static');

const rootDir = path.resolve(__dirname, '../..');

module.exports = async function createServer() {
  const serve = serveStatic(rootDir);
  const server = http.createServer((req, res) => {
    serve(req, res, finalhandler(req, res));
  });
  return new Promise((resolve) => {
    server.listen(() => {
      resolve(server);
    });
  });
};
