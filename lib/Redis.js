var env = require('./Configuration/config');
var url = require('url');
var chalk = require('chalk');
var redis = require('redis');
var redisHost = url.parse(env.sundry_redis_url);
var logger = require('./logger').logger

redisClients = {
  client: redis.createClient(redisHost.port, redisHost.hostname, {max_attempts: 10, retry_max_delay: 5000}),
  keyEvents: redis.createClient(redisHost.port, redisHost.hostname, {max_attempts: 10, retry_max_delay: 5000}),
  managerEvents: redis.createClient(redisHost.port, redisHost.hostname, {max_attempts: 10, retry_max_delay: 5000})
}

redisClients.client.on("error", redisError);
redisClients.keyEvents.on("error", redisError);
redisClients.managerEvents.on("error", redisError);
redisClients.keyEvents.psubscribe('__keyevent@*__:*');
redisClients.managerEvents.psubscribe('octorp*');


module.exports = redisClients;

function redisError(e){
  logger.log(chalk.red("Connection to Redis Server failed."));
  logger.log("Please make sure the value of 'sundry_redis_url' is correct in ~/.sundry/config.json \n" +
  "Or the sundry_redis_url environment variable is set to a valid redis url.")
  logger.info('---')
  process.exit()
}