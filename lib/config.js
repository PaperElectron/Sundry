var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var chalk = require('chalk');

var configDir = path.join(process.env.HOME,'.octorp/');
var sslDir = path.join(configDir, 'ssl');
var config;

var baseConf = {
  NODE_ENV: 'development',
  octorp_node_debug: true,
  octorp_management_server: true,
  octorp_management_host: 'some.host.com',
  octorp_management_port: 8081,
  octorp_redis_url: 'redis://some.url:6379/0',
  octorp_default_address: 'localhost',
  octorp_bind_address: '0.0.0.0',
  octorp_dev_ssl_port: 8443,
  octorp_dev_non_ssl_port: 8080,
  octorp_ssl_base: sslDir,
  octorp_ssl_key: 'key.pem',
  octorp_ssl_cert: 'cert.pem',
  octorp_cert_chain: 'Root.crt, other.crt, intermediate.crt'
};

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
    config = require(path.join(process.env.HOME, '.octorp', 'config.json'))
  }
  catch (e) {
    console.log('Creating configuration file at ' + process.env.HOME + '/.octorp/config.json' )
    buildConfig()
    process.exit()
  }
}

/*
 * Lets validate our config and insert any env variables we found.
 */
_.each(baseConf, function(item, key){
  if(_.isString(process.env[key])){
    config[key] = process.env[key]
  }
});

if(_.keys(baseConf).length !== _.keys(config).length){
  console.log(chalk.red('Error:'));
  console.log(chalk.red('  Please check your configuration file and/or environment variables.'))
  var backupNotification
  _.each(baseConf, function(item, key){
    config[key]
      ? console.log(chalk.green('    ' + key + ': ' + config[key]))
      : console.log(chalk.red(backupNotification = '    ' + key + ': ' + config[key]))
  });
  console.log('Items marked in red are missing, please either set the relevant environment variables,')
  console.log('or edit the config file located at ' + process.env.HOME + '.octorp/config.json')
  process.exit()
}


function buildConfig(){
  fs.writeFileSync(path.join(configDir, 'config.json'), JSON.stringify(baseConf,null, 4), 'utf8')
}

module.exports = config;
