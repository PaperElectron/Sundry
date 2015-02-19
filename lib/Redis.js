var env = require('../lib/config');
var url = require('url');
var chalk = require('chalk');
var redis = require('redis');
var redisHost = url.parse(env.octorp_redis_url);
var logger = require('./logger').logger

redis = {
  client: redis.createClient(redisHost.port, redisHost.hostname, {max_attempts: 10, retry_max_delay: 5000}),
  sub: redis.createClient(redisHost.port, redisHost.hostname, {max_attempts: 10, retry_max_delay: 5000})
}

redis.client.on("error", redisError)
redis.sub.on("error", function(){})
redis.sub.psubscribe('__keyevent@*__:*');


module.exports = redis;

function redisError(e){
  logger.log(chalk.red("Connection to Redis Server failed."));
  logger.log("Please make sure the value of 'octorp_redis_url' is correct in ~/.octorp/config.json \n" +
  "Or the octorp_redis_url environment variable is set to a valid redis url.")
  logger.info('---')
}