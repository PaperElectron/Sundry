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
  var routes = this.cache[host]
  console.log(identity);
  if(routes.meta.balance === 'sticky' && identity){
    var route = routes.getIdentity(identity)
    console.log(route);
    if(route){
      return route
    }
  }
  console.log('why')
  logger.debug('Current cache for host %s', host, this.cache)
  return this.getHost(host).nextRoute()
};

/**
 * Handles Routing when sticky sessions are enabled.
 * @module StickyRouter
 */

module.exports = StickyRouter