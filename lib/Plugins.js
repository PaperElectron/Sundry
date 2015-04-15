/**
 * @file Plugins
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project OctoRP
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

/**
 * Manages the middleware stack for the Octorp router
 * @module Plugins
 */

var PluginManager = (function() {
  function PluginManager(){
    this.stack = []
  }
  PluginManager.prototype.register = function(middleware){
    this.stack.push(middleware);
  };
  PluginManager.prototype.runMidddleware = function(req, cb){
    var self = this;
    var index = 0;

    var runNext = function(){
      self.stack[index](req, done)
    };

    var done = function(err){
      console.log(index === self.stack.length - 1);
      if(index === self.stack.length - 1){
        return cb()
      }
      index = index + 1;
      runNext()
    };

    runNext()
  };
  return new PluginManager()
})();

module.exports = PluginManager