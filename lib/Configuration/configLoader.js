/**
 * @file configManager
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Sundry
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var EventEmitter = require('events').EventEmitter;
var Events = new EventEmitter();
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var logger = require('./../logger').logger;
var chalk = require('chalk');
var baseConfig = require('./defaultConfig');
var validate = require('./validator');


var configLocation = path.join(process.env.HOME,'.sundry/');
//console.log(configLocation);
var configFile = path.join(configLocation, 'config.json');

var checkEnv = _.keys(baseConfig)
/*
 * Take a spin through the keys of our base config, compare them with set env variables.
 */
var missing = _.reduce(checkEnv, function(last, k){
  return process.env[k] === undefined
}, false);

/**
 * Handles Sundrys config file
 * @module configManager
 */

exports = module.exports = Events;
exports.loadedConfig = null;

setImmediate(function(){
  if(missing){
    getOrFail(configFile, function(err, loadedConfig) {
      if(err){
        if(err.code === 'ENOENT') {
          Events.emit('error', err, 'NO_CONFIG');
          logger.log(chalk.red('No configuration file found in', configLocation))
          logger.log(chalk.red('Falling back to default config and enviornment variables.'))
          logger.log(chalk.red("To generate a skeleton config, use 'sundry config build'"));
          return setImmediate(function() {
            exports.loadedConfig = validate.runtimeValidation(baseConfig)
            Events.emit('ready')
          });
        }
      }

      return setImmediate(function() {
        exports.loadedConfig = validate.runtimeValidation(baseConfig, loadedConfig)
        Events.emit('ready');
      });
    })
  }
  else {

  }

});


function getOrFail(confFile, cb){
  fs.readFile(confFile, {encoding: 'UTF-8'}, function(err, file){
    if(err) {
      return cb(err, null)
    }
    var parsedFile
    try {
      parsedFile = JSON.parse(file)
    }
    catch(e){
      cb(err, null)
    }
    return cb(null, parsedFile)
  })
}

