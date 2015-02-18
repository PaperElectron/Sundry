var fs = require('fs');
var path = require('path');

var configDir = path.join(process.env.HOME,'.octorp/');
var sslDir = path.join(configDir, 'ssl');

var logger = require('./logger').logger

var event = require('events').EventEmitter

if(!fs.existsSync(configDir)){
  fs.mkdirSync(configDir)
}
if(!fs.existsSync(sslDir)){
  fs.mkdirSync(sslDir)
}

var baseConf = require(path.join(__dirname, '../', 'lib/defaultConfig'))
var existed = true;
function buildConfig(create) {
  var existingFile;
  try {
    existingFile = require(path.join(configDir, 'config.json'))
  }
  catch (e){
    if(e.code === 'MODULE_NOT_FOUND' && create){
      try {
        existingFile = fs.writeFileSync(path.join(configDir, 'config.json'), JSON.stringify(baseConf, null, 4), 'utf8');
        existed = false
        logger.log('Creating config file at', path.join(configDir, 'config.json'))
      }
      catch (e){
        logger.log("Something went very very wrong.")
        return logger.log(e.stack)
      }
      return buildConfig()
    }
    else {
      throw new Error('Sorry')
    }
  }
  if(existed) {
    logger.log("Config file", path.join(configDir, 'config.json'), 'appears to already exist.')
  }
  return existingFile
}

module.exports = buildConfig