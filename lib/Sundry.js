/*
 * Sundry
 */
var env = require('./Configuration/configLoader').loadedConfig;
var path = require('path');
var NODE_ENV = (env.NODE_ENV === 'production');
var logger = require('./logger').enableLogging(env.sundry_debug).logger;
var VERSION = require(path.join(__dirname,'../', 'package.json')).version

logger.debug("Debug Logging is on");
logger.debug('Current env variables:','\n', env)
logger.log('Starting Sundry, version:', VERSION)

var path = require('path');
var url = require('url');
var fs = require('fs');

var Redis = require(path.join(__dirname, './Redis'));
var allReady = Object.keys(Redis).length;

//Redis.client.on('ready', readyStart);
//Redis.keyEvents.on('ready', readyStart);
//Redis.managerEvents.on('ready', readyStart);
for (var key in Redis){
  if(Redis.hasOwnProperty(key)){
    Redis[key].on('ready', readyStart)
  }
}

function readyStart() {
  if(!--allReady) {
    /*
     * Route handling and caching functions via redis.
     */
    var Router = require(path.join(__dirname, './Router'));
    Router = new Router({client: Redis.client, seed: env.sundry_sticky_seed});

    /*
     * SSL certs, port and bind address setup.
     */
    var serverOpts = require(path.join(__dirname, './Server/ServerOptions'));
    var server = require(path.join(__dirname, './Server/Server'))(serverOpts, Router);

    /*
     * Listen for sadd, srem and del events from redis to force expire our cache.
     */
    Redis.keyEvents.on('pmessage', function(p, c, m) {
      var keyspace = m.split(':');
      if(keyspace[0] === 'route') {
        Router.flushRoute(keyspace[1]);
      }
    });

    /*
     * Listen for octorp.add and octorp.drop events from connected clients.
     */
    Redis.managerEvents.on('pmessage', function(p, c, m){
      var handlers = {
        "sundry.add": function(m){
          var data = JSON.parse(m);
          var host = "route:" + data.hostname;
          var address = data.bindAddress + ':' + data.port;
          Redis.client.sadd(host, address, function(err, result){
            console.log(data);
            console.log('Added host');
          });

        },
        "sundry.drop": function(m){
          var data = JSON.parse(m);
          var host = "route:" + data.hostname;
          var address = data.bindAddress + ':' + data.port;
          Redis.client.srem(host, address, function() {
            console.log(data);
            console.log('Dropped host');
          });

        }
      }
      handlers[c](m)
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

