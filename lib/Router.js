/**
 * OctoRP Router Module
 * @module Router
 */

var Router;
var logger = require('./logger').logger
var Sha = require('sha.js');
var sha256 = Sha('sha256');

/**
 * @class Router
 */
Router = (function() {
  function Router(options) {
    if(!(this instanceof arguments.callee)) {
      throw new Error('Constructor called as a function');
    }
    if(options == null) {
      throw new Error('No redis client provided to Router');
    }
    this.seed = options.seed
    this.client = options.client;
    this.ttl = (options.ttl || 60) * 1000;
    this.cache = {};

    /**
     * Finds a route and returns it .
     *
     * @returns {array}
     * @api public
     */

    Router.prototype.findRoute = function(host, cb) {
      if(!this.cache[host]) {
        return this.client.smembers('route:' + host, (function(_this) {
          return function(err, data) {
            if(data.length) {
              _this.cacheRoute(host, data);
              return cb(_this.balanceRoute(host));
            }
            else {
              return cb(false);
            }
          };
        })(this));
      }
      logger.debug('Cache hit for ' + host);
      return cb(this.balanceRoute(host));
    };

    /**
     * Destroys the cache for host.
     *
     * @returns {boolean}
     * @api public
     */

    Router.prototype.flushRoute = function(host) {
      logger.debug('flushing cache for %s', host);
      return delete this.cache[host];
    };

    /**
     * Destroys the current cache.
     *
     * @returns {object}
     * @api public
     */
    Router.prototype.flushAll = function() {
      return this.cache = {};
    };

    /**
     * Returns the next route from the array of routes cached for {host}
     *
     * @param {string} host
     * @returns {object}
     * @api private
     */
    Router.prototype.balanceRoute = function(host) {
      var routes = this.cache[host].routes;
      var routeTo = routes.shift();
      routes.push(routeTo);
      this.cache[host].routes = routes;
      logger.debug('Current cache for host %s', host, this.cache)
      return routeTo
    };

    /**
     * Adds routes to cache for {host} and sets up its expiration.
     *
     * @param {string} host
     * @param {array} proxy
     * @returns {array}
     * @api private
     */
    Router.prototype.cacheRoute = function(host, proxy) {
      var parsedRoutes = proxy.map(function(route){
        var splitRoute = route.split(':')
        return {
          host: splitRoute[0],
          port: splitRoute[1],
          identity: sha256.update(splitRoute[0] + splitRoute[1] + this.seed).digest('hex')
        }
      })

      this.cache[host] = {routes: parsedRoutes};
      setTimeout(((function(_this) {
        return function() {
          return _this.flushRoute(host);
        };
      })(this)), this.ttl);
      return this.cache[host]
    };
  }

  return Router;
})();

module.exports = Router;