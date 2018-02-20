var connect = require('connect');
var getPort = require('get-port');
var serveStatic = require('serve-static');
var http = require('http');
var path = require('path');


function getStaticServer(port) {
  var staticRoot = path.join(__dirname, '../..');
  var portPromise = (typeof port === 'undefined') ? getPort() : Promise.resolve(port);
  return portPromise.then((port) => { // eslint-disable-line no-shadow
    return new Promise((resolve, reject) => {
      try {
        const app = connect().use(serveStatic(staticRoot));
        const server = http.createServer(app);
        server.listen(port, () => {
          console.log('Test server listening on port ' + port); // eslint-disable-line no-console
          resolve([server, port]);
        });
      } catch (e) {
        reject(e);
      }
    });
  });
}

module.exports = getStaticServer;
