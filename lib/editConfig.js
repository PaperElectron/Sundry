var fs = require('fs');
var path = require('path');
var configDir = path.join(process.env.HOME,'.octorp/');
var logger = require('./logger').logger;
var chalk = require('chalk');
var _ = require('lodash');

var currentConfig = require('./buildConfig')(false);

var parsers = {
  boolean: function(x){
    if(_.isBoolean(x)){return x}
    if(x === 'true'){return true}
    if(x === 'false'){return false}
    var errMsg = 'Validation error "' + x + '" Must be true/false'
    throw new Error(errMsg)
  },
  number: function(x){
    var possiblyNaN = parseFloat(x)
    if(_.isNaN(possiblyNaN)){
      var errMsg = 'Validation error "' + x + '" Must be an number'
      throw new Error(errMsg)
    }
    return possiblyNaN;
  }
}

var validate = function(config) {
  _.each(config, function(item, key) {

    if(key === 'octorp_debug' || key === 'octorp_redirect_ssl') {
      config[key] = parsers.boolean(config[key])
    }
    if(key === 'octorp_dev_ssl_port' || key === 'octorp_dev_non_ssl_port') {
      config[key] = parsers.number(config[key])
    }

  });
  return config
};

function buildConfig(config, cb){
  fs.writeFile(path.join(configDir, 'config.json'), JSON.stringify(config,null, 4), 'utf8', cb)
}

module.exports = {
  edit: function(k, v) {
    if(_.has(currentConfig, k)) {
      currentConfig[k] = v
      try {
        currentConfig = validate(currentConfig)

      }
      catch (e){
        console.log(chalk.red(e.message))
        process.exit()
      }
      buildConfig(currentConfig, function(err){
        if(err){
          throw err;
        }
        console.log(chalk.green('Success:', k, '=', currentConfig[k]));
      })
    }
    else {
      console.log(chalk.red('Sorry the key you entered (', chalk.white(k), ') doesn\'t match any config keys.'))
      console.log("Try 'octorp config list' to get the list of valid keys.")
    }
  },
  list: function(){
    console.log("Current config")
    _.forEach(currentConfig, function(v, k){
      console.log('  ', k, ':', v)
    })
  }
}