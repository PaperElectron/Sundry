var Promise = require('bluebird');
var redis = Promise.promisifyAll(require('redis'));

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
    },
    editMetaProperty: function(host, oldVal, newVal){
      var buildNew = oldVal.split(':')[1].split(',')
      var newData = '***data:' + buildNew[0] + ',' + newVal;
      return client.sremAsync(host, oldVal)
        .then(function(status) {
          return client.saddAsync(host, newData)
      })
    },
    quit: function() {
      client.quit()
    }
  }
};
