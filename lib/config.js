var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var chalk = require('chalk');
var configDir = path.join(process.env.HOME,'.octorp/');
var sslDir = path.join(configDir, 'ssl');

//NPM dependency graph Magic
var logger = require('./logger').logger

var baseConf = require('./defaultConfig');
var config;


var parsers = {
  boolean: function(x){
    if(_.isBoolean(x)){return x}
    if(x === 'true'){return true}
    return false
  },
  number: parseFloat
}

var checkEnv = _.keys(baseConf)
/*
 * Take a spin through the keys of our base config, compare them with set env variables.
 */
var missing = _.reduce(checkEnv, function(last, k){
  return process.env[k] === undefined
}, false);


/*
 * Do we have a config directory in the users HOME?
 */
if(!fs.existsSync(configDir)){
  fs.mkdirSync(configDir)
}
if(!fs.existsSync(sslDir)){
  fs.mkdirSync(sslDir)
}

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
    logger.log(chalk.red("To generate a skeleton config, use 'octorp config -b'"));
    config = baseConf
  }
}

/*
 * Lets validate our config and insert any env variables we found.
 */
var warnDefault = false;

_.each(baseConf, function(item, key){
  if(_.isString(process.env[key])){
    config[key] = process.env[key];

    // If we are using an env variable we need to cast to the correct type.
    // Env variables are a string only format.
    if(key === 'octorp_debug' || key === 'octorp_redirect_ssl'){
      config[key] = parsers.boolean(config[key])
    }
    if(key === 'octorp_dev_ssl_port' || key === 'octorp_dev_non_ssl_port'){
      config[key] = parsers.number(config[key])
    }
  }
  if(config[key] === undefined){
    warnDefault = true;
    config[key] = item;
    logger.log('Using Default value' , chalk.red(item), 'for config setting', chalk.red(key) )
  }
});

if(warnDefault){
  logger.log(chalk.red('OctoRP is using some default configuration values.'));
  logger.log(chalk.green('Values can either be set using the relevant environment variables,'));
  logger.log(
    chalk.green('or by editing the config file located at'),
    chalk.red(process.env.HOME + '.octorp/config.json')
  );
}

function buildConfig(){
  fs.writeFileSync(path.join(configDir, 'config.json'), JSON.stringify(baseConf,null, 4), 'utf8')
}

module.exports = config;
