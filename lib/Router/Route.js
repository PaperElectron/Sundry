/**
 * @file Route
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Sundry
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */
var sha256 = require('sha.js')('sha256');
var _ = require('lodash');

function Route(hostname, data, seed, ttl){
  this.hostname = hostname;
  this.seed = seed;
  this.ttl = ttl;
  this.meta = {balance: 'round', ttl: this.ttl}
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
        identity: sha256.update(splitRoute[0] + splitRoute[1] + this.seed).digest('hex')
      }
    }.bind(this))
    .value();

  return this
}

Route.prototype.setTimer = function(timer){
  this.timer = timer;
};

Route.prototype.getTimer = function(){
  return this.timer || null;
}

Route.prototype.nextRoute = function(){
  var r = this.routes.shift();
  this.routes.push(r);
  return r
}

/**
 * Route Object for routing cache
 * @module Route
 */

module.exports = Route