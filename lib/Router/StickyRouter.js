/**
 * @file StickyRouter
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Sundry
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var Router = require('./Router');
var logger = require('../logger').logger

function StickyRouter(options){
  Router.call(this, options);
}

StickyRouter.prototype = _.create(Router.prototype, {
  constructor: StickyRouter
})

/**
 * Returns the next backend from the array of backends cached for {host}
 *
 * @param {string} host
 * @returns {object}
 * @api private
 */
StickyRouter.prototype.balanceRoute = function(host, identity) {
  var routes = this.cache[host].routes;
  var routeOptions = this.cache[host].meta

  if(routeOptions.balance === 'sticky' && identity){
    var route = routes.filter(function(v) {
      return (v.identity === identity)
    })[0]
    if(route){
      return route
    }
  }

  logger.debug('Current cache for host %s', host, this.cache)
  return this.getHost(host).nextRoute()
};

/**
 * Handles Routing when sticky sessions are enabled.
 * @module StickyRouter
 */

module.exports = StickyRouter