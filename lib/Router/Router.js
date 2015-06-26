/**
 * @file BaseRouter
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Sundry
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var _ = require('lodash');
var sha256 = require('sha.js')('sha256');
var logger = require('../logger').logger

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

Router.prototype.updateCacheExpiration = function(host, ttl) {
  logger.debug('Updating TTL for ' + host);
  clearTimeout(this.cache[host].timer);
  this.cache[host].timer = setTimeout(function(){
    this.flushRoute(host)
  }.bind(this), ~~ttl * 1000|| this.ttl)
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
  var meta = {balance: 'round', ttl: this.ttl}
  var parsedRoutes = _.chain(proxy)
    .filter(function(item) {
      var splitItem = item.split(':')
      if(splitItem[0] === '***data') {
        splitItem.splice(0,1)
        _.each(splitItem, function(i) {
          var metaItem = i.split(',')
          meta[metaItem[0]] = metaItem[1]
        })
        return false
      }
      return true
    })
    .map(function(route){
      var splitRoute = route.split(':')
      return {
        host: splitRoute[0],
        port: splitRoute[1],
        identity: sha256.update(splitRoute[0] + splitRoute[1] + this.seed).digest('hex')
      }
    })
    .value();

  this.cache[host] = {routes: parsedRoutes, config: meta};
  this.updateCacheExpiration(host)
  return this.cache[host]
};

/**
 * Base router object.
 * @module BaseRouter
 */

module.exports = Router