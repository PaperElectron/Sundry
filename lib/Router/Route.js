/**
 * @file Route
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Sundry
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */
var sha256 = require('sha.js')('sha256');
var logger = require('../logger').logger;
var _ = require('lodash');

function Route(hostname, data, seed, ttl, flush){
  this.hostname = hostname;
  this.seed = seed;
  this.ttl = ttl;
  this.flush = flush;
  this.identities = {}
  this.meta = {balance: 'round', ttl: this.ttl, protocol: 'http'};
  /**
   * Extracts our routes from the mixed array of routes and route metadata.
   */
  this.routes = _.chain(data)
    .filter(function(item) {
      var splitItem = item.split(':')
      if(splitItem[0] === '***data') {
        splitItem.splice(0,1)
        _.each(splitItem, function(i) {
          var metaItem = i.split(',')
          this.meta[metaItem[0]] = metaItem[1]
        }.bind(this))
        return false
      }
      return true
    }.bind(this))
    .map(function(route){
      var splitRoute = route.split(':')
      return {
        host: splitRoute[0],
        port: splitRoute[1],
        protocol: this.meta.protocol,
        identity: sha256.update(splitRoute[0] + splitRoute[1] + this.seed).digest('hex')
      }
    }.bind(this))
    .value();

  /**
   * Create a lookup object keyed to the identity property.
   */
  _.each(this.routes, function(route){
    this.identities[route.identity] = route
  }.bind(this))
  /**
   * Initialize the TTL for this host.
   */
  this.timer = setTimeout(this.flush, this.ttl)

  return this
}

Route.prototype.updateTTL = function(){
  logger.debug('Updating TTL for ' + this.hostname);
  clearTimeout(this.timer);
  this.timer = setTimeout(this.flush, this.ttl);
}

Route.prototype.getIdentity = function(identity){
  this.updateTTL();
  return this.identities[identity] || false
}

Route.prototype.nextRoute = function(){
  var r = this.routes.shift();
  this.routes.push(r);
  this.updateTTL();
  return r
}

/**
 * Route Object for routing cache
 * @module Route
 */

module.exports = Route