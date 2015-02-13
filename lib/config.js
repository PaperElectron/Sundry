var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var chalk = require('chalk');

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
  octorp_ssl_key: 'key.pem',
  octorp_ssl_cert: 'cert.pem',
  octorp_cert_chain: 'herp.txt, derp.txt, burp.txt'
};

var checkEnv = _.keys(baseConf)
var missing = _.reduce(checkEnv, function(last, k){
  return process.env[k] === undefined
}, false);

if(missing) {
  try {
    config = JSON.parse(fs.readFileSync(path.join(process.env.HOME, '.octorp'), 'utf8'))
  }
  catch (e) {
    console.log('Creating configuration file at ' + process.env.HOME + '/.octorp' )
    buildConfig()
    process.exit()
  }
}

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
  console.log('or edit the config file located at ' + process.env.HOME + '.octorp')
  process.exit()
}


function buildConfig(){
  fs.writeFileSync(path.join(process.env.HOME, '.octorp'), JSON.stringify(baseConf,null, 4), 'utf8')
}

module.exports = config
