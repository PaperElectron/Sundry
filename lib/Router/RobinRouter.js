/**
 * @file RobinRouter
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Sundry
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var Router = require('./Router');
var logger = require('../logger').logger

function RobinRouter(options){
  Router.call(this, options);
}

RobinRouter.prototype = _.create(Router.prototype, {
  constructor: RobinRouter
});

/**
 * Returns the next backend from the array of backends cached for {host}
 *
 * @param {string} host
 * @returns {object}
 * @api private
 */
RobinRouter.prototype.balanceRoute = function(host) {
  var routes = this.cache[host].routes;
  var routeTo = routes.shift();
  routes.push(routeTo);
  this.cache[host].routes = routes;
  logger.debug('Current cache for host %s', host, this.cache)
  return routeTo
};

/**
 * Handles round robin routing when sticky sessions not enabled
 * @module RobinRouter
 */

module.exports = RobinRouter