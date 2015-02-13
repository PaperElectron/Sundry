var env = require('../lib/config');
var url = require('url');
var redis = require('redis');
var redisHost = url.parse(env.octorp_redis_url);

redis = {
  client: redis.createClient(redisHost.port, redisHost.hostname),
  sub: redis.createClient(redisHost.port, redisHost.hostname)
}

redis.sub.psubscribe('__keyevent@*__:*');


module.exports = redis;
