var fs = require('fs');
var path = require('path');

var configDir = checkOrCreate(path.join(process.env.HOME,'.sundry/'));
var sslDir = checkOrCreate(path.join(configDir, 'ssl'));

var logger = require('./../logger').logger

var baseConf = require(path.join(__dirname, 'defaultConfig'))
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
        logger.info('Creating config file at', path.join(configDir, 'config.json'))
      }
      catch (e){
        logger.info("Something went very very wrong.")
        return logger.log(e.stack)
      }
      return buildConfig()
    }
    else {
      throw new Error('Sorry')
    }
  }
  if(existed) {
    logger.info("Config file", path.join(configDir, 'config.json'), 'appears to already exist.')
  }
  return existingFile
}

module.exports = buildConfig

function checkOrCreate(dir){
  var dirStat;
  try {
    dirStat = fs.statSync(dir);
    if(!dirStat.isDirectory()) {
      fs.mkdirSync(dir)
    }
  }
  catch (e){
    if(e.code === 'ENOENT'){
      fs.mkdirSync(dir)
    }
  }
  return dir
}