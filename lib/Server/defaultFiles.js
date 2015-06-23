var env = require('../Configuration/configLoader').loadedConfig;
var path = require('path');
var fs = require('fs');


module.exports = {
  index: loadOrDefault('index'),
  four: loadOrDefault('404'),
  five: loadOrDefault('5xx')
}

function loadOrDefault(file){
  var theFile
  try{
    theFile = fs.readFileSync(path.join(env.SUNDRY_HOME, 'html', file +'.html'));
  }
  catch (e){
    theFile = fs.readFileSync(path.join(__dirname, '../../','public/html/' + file + '.html'));
  }
  return theFile
}