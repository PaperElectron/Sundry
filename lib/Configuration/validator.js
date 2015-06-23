/**
 * @file configValidator
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Sundry
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var _ = require('lodash');
var chalk = require('chalk');
var logger = require('./../logger').logger;
var baseConf = require('./defaultConfig');

/**
 * Validates the currently loaded config.
 * @module configValidator
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
}

var cliParsers = {
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

exports.compileValidation = function(config){
  _.each(config, function(item, key) {

    if(key === 'octorp_debug' || key === 'octorp_redirect_ssl') {
      config[key] = cliParsers.boolean(config[key])
    }
    if(key === 'octorp_dev_ssl_port' || key === 'octorp_dev_non_ssl_port') {
      config[key] = cliParsers.number(config[key])
    }

  });
  return config
}

exports.runtimeValidation = function(base, config) {
  if(config) {
    _.each(baseConf, function(item, key) {
      if(_.isString(process.env[key])) {
        config[key] = process.env[key];

        // If we are using an env variable we need to cast to the correct type.
        // Env variables are a string only format.
        if(key === 'sundry_debug' || key === 'sundry_redirect_ssl') {
          config[key] = parsers.boolean(config[key])
        }
        if(key === 'sundry_dev_ssl_port' || key === 'sundry_dev_non_ssl_port') {
          config[key] = parsers.number(config[key])
        }
      }
      if(key === 'sundry_default_application') {
        config[key] = parsers.remoteHost(config[key])
      }
      if(config[key] === undefined) {
        config[key] = item;
        logger.log('Using Default value', chalk.red(item), 'for config setting', chalk.red(key))
      }
    });
  }
  else {
    config = base;
  }

  config['SUNDRY_HOME'] = process.env.HOME + '/.sundry/';
  return config
}