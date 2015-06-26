var _ = require('lodash');
var routes = [
  {host: 'route:a.test.host' , routes: ["127.0.0.1:10000"]},
  {host: 'route:b.test.host' , routes: ["127.0.0.1:20000","127.0.0.1:20001"]},
  {host: 'route:c.test.host' , routes: ["127.0.0.1:30000","127.0.0.1:30001","127.0.0.1:30002", "***data:balance,sticky"]}
]


module.exports = {
  smembers: function(key, cb){
    var host = _.find(routes, {host: key})
    if(host){
      return cb(null, host.routes)
    }
    return cb(null, [])

  }
}