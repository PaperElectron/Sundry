var Promise = require('bluebird');
var redis = Promise.promisifyAll(require('redis'));
var url = require('url');
var env = require('../lib/config');
var redisHost = url.parse(env.octorp_redis_url);

module.exports = function(client){
  return {
    addHost: function(host, ip){
      var host = 'route:' + host
      return client.saddAsync(host, ip)
    },
    deleteHost: function(host){
      return client.delAsync(host)
    },
    getHost: function(){

    },
    listHosts: function(){
      return client.keysAsync('route:*')
    },
    deleteBackend: function(host, ip){
      return client.sremAsync(host, ip)
    },
    listBackends: function(route){
      return client.smembersAsync(route)
    }
  }
};
