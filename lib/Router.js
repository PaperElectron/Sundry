var Router;

Router = (function() {
  function Router(options) {
    if(!(this instanceof arguments.callee)) {
      throw new Error('Constructor called as a function');
    }
    if(options == null) {
      throw new Error('No redis client provided to Router');
    }
    this.client = options.client;
    this.ttl = (options.ttl || 60) * 1000;
    this.cache = {};

    Router.prototype.findRoute = function(host, cb) {
      if (!this.cache[host]) {
        return this.client.smembers('route:' + host, (function(_this) {
          return function(err, data) {
            if (data.length) {
              _this.cacheRoute(host, data);
              return cb(_this.balanceRoute(host));
            } else {
              return cb(false);
            }
          };
        })(this));
      } else {
        console.log('Cache hit for ' + host);
        return cb(this.balanceRoute(host));
      }
    };
    Router.prototype.flushRoute = function(host) {
      console.log('flushing cache for ' + host);
      return delete this.cache[host];
    };

    /*
     * Destroys the current cache.
     *
     * @returns {object}
     * @api public
     */
    Router.prototype.flushAll = function() {
      return this.cache = {};
    };

    /*
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
      var balancedRoute = routeTo.split(':');
      return {
        host: balancedRoute[0],
        port: balancedRoute[1]
      };
    };

    /*
     * Adds routes to cache for {host} and sets up its expiration.
     *
     * @param {string} host
     * @param {array} proxy
     * @returns {array}
     * @api private
     */
    Router.prototype.cacheRoute = function(host, proxy) {
      this.cache[host] = {routes: proxy};
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