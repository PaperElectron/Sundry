var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var chalk = require('chalk');
var configDir = path.join(process.env.HOME,'.sundry/');
var sslDir = path.join(configDir, 'ssl');
var url = require("url")
//NPM dependency graph Magic
var logger = require('./../logger').logger

var baseConf = require('./defaultConfig');
var config;


/*
 * Casts values.
 */
var parsers = {
  boolean: function(x){
    if(_.isBoolean(x)){ return x }
    if(x === 'true'){ return true }
    return false
  },
  number: parseFloat,
  remoteHost: function(value){
    if(_.isBoolean(value)){ return false }
    if(value === 'false'){ return false }

    value = value.split(':')
    return {host: value[0], port: value[1]}
  }
};

var checkEnv = _.keys(baseConf)
/*
 * Take a spin through the keys of our base config, compare them with set env variables.
 */
var missing = _.reduce(checkEnv, function(last, k){
  return process.env[k] === undefined
}, false);


/*
 * If any of the env variables are missing lets load up config.json and use them.
 */
if(missing) {
  try {
    config = require('./buildConfig')(false)
    logger.debug('\n',config)
  }
  catch (e) {
    logger.log(chalk.red('No configuration file found in', configDir))
    logger.log(chalk.red('Falling back to default config and enviornment variables.'))
    logger.log(chalk.red("To generate a skeleton config, use 'sundry config build'"));
    config = baseConf
  }
}

/*
 * Lets validate our config and insert any env variables we found.
 */
var warnDefault = false;

/*
 * Take one more spin through our fully populated config object,
 * to cast any values to their correct type, or fill in any missing
 * values with the default.
 */
_.each(baseConf, function(item, key){
  if(_.isString(process.env[key])){
    config[key] = process.env[key];

    // If we are using an env variable we need to cast to the correct type.
    // Env variables are a string only format.
    if(key === 'sundry_debug' || key === 'sundry_redirect_ssl'){
      config[key] = parsers.boolean(config[key])
    }
    if(key === 'sundry_dev_ssl_port' || key === 'sundry_dev_non_ssl_port'){
      config[key] = parsers.number(config[key])
    }
  }
  if(key === 'sundry_default_application'){
    config[key] = parsers.remoteHost(config[key])
  }
  if(config[key] === undefined){
    warnDefault = true;
    config[key] = item;
    logger.log('Using Default value' , chalk.red(item), 'for config setting', chalk.red(key) )
  }
});

if(warnDefault){
  logger.log(chalk.red('sundry is using some default configuration values.'));
  logger.log(chalk.green('Values can either be set using the relevant environment variables,'));
  logger.log(
    chalk.green('or by editing the config file located at'),
    chalk.red(process.env.HOME + '.sundry/config.json')
  );
}
/*
 * Adding any needed derived values here.
 */
config['SUNDRY_HOME'] = process.env.HOME + '/.sundry/';

module.exports = config;
