/*
 * OctoRP
 */
var env = require('../lib/config');
var NODE_ENV = (env.NODE_ENV === 'production');
var path = require('path');
var url = require('url');

var fs = require('fs');

var Redis = require(path.join(__dirname, './Redis'));
var allReady = Object.keys(Redis).length;

Redis.client.on('ready', readyStart)
Redis.sub.on('ready', readyStart)
function readyStart() {
  if(--allReady === 0) {
    /*
     * Route handling and caching functions via redis.
     */
    var Router = require(path.join(__dirname, './Router'));
    Router = new Router({client: Redis.client});

    /*
     * SSL certs, port and bind address setup.
     */
    var serverOpts = require(path.join(__dirname, './ServerOptions'));
    var server = require(path.join(__dirname, './server'))(serverOpts, Router);

    /*
     * Listen for sadd, srem and del events from redis to force expire our cache.
     */
    Redis.sub.on('pmessage', function(p, c, m) {
      var keyspace = m.split(':');
      if(keyspace[0] === 'route') {
        Router.flushRoute(keyspace[1]);
      }
    });

    /*
     * Start servers bound to port and address.
     */
    server.http.listen(serverOpts.port, serverOpts.bindAddress, function() {
      console.log('http proxy server started.');
    });
    server.https.listen(serverOpts.sslPort, serverOpts.bindAddress, function() {
      console.log('https proxy server started.');
    });

    if(server.test) {
      server.test.listen(10000, function() {
        console.log('Test http server started.');
      });
    }
  }
}
