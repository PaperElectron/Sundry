/*
 * OctoRP
 */
var env = require('../lib/config');
var NODE_ENV = (env.NODE_ENV === 'production');
var logger = require('./logger').enableLogging(env.octorp_debug).logger;

logger.debug("Debug Logging is on");
logger.debug('Current env variables:','\n', env)

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
    var server = require(path.join(__dirname, './Server'))(serverOpts, Router);

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
      logger.log('http proxy server started on port %s', serverOpts.port);
    });

    if(server.https){
      server.https.listen(serverOpts.sslPort, serverOpts.bindAddress, function() {
        logger.log('https proxy server started on port %s.', serverOpts.sslPort);
      });
    }

    if(server.test) {
      server.test.listen(10000, function() {
        logger.log('Test http server started on port 10000.');
      });
    }

    /*
     * Drop privileges if this server is run with sudo.
     * NOTE: You shouldn't be running this server with sudo or as root.
     * This is just here to help mitigate SOME risk of exploit.
     *
     * For a better solution in production environments, check out
     * http://manpages.ubuntu.com/manpages/hardy/man1/authbind.1.html
     */
    setImmediate(function(){
      if(NODE_ENV && process.env.SUDO_USER){
        process.setgroups(['nobody']);
        process.setgid('nobody');
        process.setuid(process.env.SUDO_USER);
      }
    })


  }
}

