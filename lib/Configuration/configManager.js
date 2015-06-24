/**
 * @file configManager
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Sundry
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var _ = require('lodash');
var validate = require('./validator');

var configLocation = path.join(process.env.HOME,'.sundry/');
var configFile = path.join(configLocation, 'config.json');
var sslLocation = path.join(configLocation, 'ssl/');
/**
 * Builds and edits Config file
 * @module configManager
 */

exports.buildConfig = function(cb){
  try {
    var existingFile = require(configFile);
    if(_.isObject(existingFile)){
      return cb(new Error('Config file exists.'), null)
    }
  }
  catch(e){
    if(e.code === 'MODULE_NOT_FOUND') {
      mkdirp(configLocation, {mode: 0755}, function(err){
        if(err){
          return cb(err, null)
        }
        var baseConf = require('./defaultConfig');
        writeConfig(baseConf, function(err, file) {
          mkdirp(sslLocation, {mode: 0700}, function(err) {
            if(err){
              return cb(err, null)
            }
            cb(null, true)
          })
        })
      })
    }
    else {
      cb(e, null)
    }
  }
};

exports.editConfig = function(key, value, cb) {
  try {
    var currentConfig = require(configFile)
  }
  catch(e) {
    if(e.code === 'MODULE_NOT_FOUND'){
      return cb(new Error('Config file not found.'))
    }
  }
  if(_.has(currentConfig, key)) {
    return editConfig(currentConfig, key, value, cb)
  }

  var baseConfig = require('./defaultConfig')
  if(_.has(baseConfig, key)){
    return editConfig(currentConfig, key, value, cb)
  }
}

exports.list = function(){
  try {
    var currentConfig = require(configFile)
  }
  catch(e) {
    if(e.code === 'MODULE_NOT_FOUND'){
      console.log('Config file not found.');
      console.log("Run 'sundry config build' to generate a skeleton config.")
      return
    }
  }
  console.log("Current config");
  _.forEach(currentConfig, function(v, k){
    console.log('  ', k, ':', v)
  })
};

function writeConfig(config, cb){
  fs.writeFile(configFile, JSON.stringify(config, null, 4), 'utf8', cb)
};

function editConfig(config, key, value, cb){
  config[key] = value;
  try {
    config = validate.compileValidation(config)

  }
  catch (e){
    return cb(e);
  }
  writeConfig(config, function(err){
    if(err){
      return cb(err);
    }
    return cb(null, 'Success: ' + key + ' = ' + config[key]);
  })
}