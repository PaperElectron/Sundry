/**
 * @file BaseRouter
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Sundry
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var _ = require('lodash');
var sha256 = require('sha.js')('sha256');
var logger = require('../logger').logger;
var Route = require('./Route');

function Router(options){
  if(!(this instanceof Router)) {
    throw new Error('Constructor called as a function');
  }
  if(options.client == null) {
    throw new Error('No redis client provided to Router');
  }

  this.sticky = true
  this.seed = options.seed
  this.client = options.client;
  this.ttl = (options.ttl || 60) * 1000;
  this.cache = {};
}

/**
 * Finds a route and returns it .
 *
 * @returns {array}
 * @api public
 */
Router.prototype.findRoute = function(host,identity, cb) {
  if(!this.cache[host]) {
    return this.client.smembers('route:' + host, (function(_this) {
      return function(err, data) {
        if(data.length) {
          _this.cacheRoute(host, data);
          return cb(_this.balanceRoute(host, identity))
        }
        else {
          return cb(false);
        }
      };
    })(this));
  }
  logger.debug('Cache hit for ' + host);
  return cb(this.balanceRoute(host, identity))
};

/**
 * Returns array of route objects from cache.
 *
 * @param host
 */
Router.prototype.getHost = function(host){
  return this.cache[host] || null
}

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

Router.prototype.updateCacheExpiration = function(route) {
  logger.debug('Updating TTL for ' + route.hostname);
  clearTimeout(route.getTimer());
  var timer = setTimeout(function(){
    this.flushRoute(route.hostname)
  }.bind(this), route.ttl)
  route.setTimer(timer)

}

/**
 * Adds routes to cache for {host} and sets up its expiration, as well
 * as any route specific configuration.
 *
 * @param {string} host
 * @param {array} proxy
 * @returns {array}
 * @api private
 */
Router.prototype.cacheRoute = function(host, proxy) {
  var newHost = new Route(host, proxy, this.seed, this.ttl, this.flushRoute.bind(this, host));
  this.cache[host] = newHost;
  return newHost
};

/**
 * Base router object.
 * @module BaseRouter
 */

module.exports = Router