var env = require('../lib/config');
var path = require('path');
var fs = require('fs');

var index, four, five

try{
  index = fs.readFileSync(path.join(env.OCTORP_HOME, 'html', 'index.html'));
}
catch (e){
  index = fs.readFileSync(path.join(__dirname, '../','public/html/index.html'));
}

try{
  four = fs.readFileSync(path.join(env.OCTORP_HOME, 'html', '404.html'));
}
catch(e){
  four = fs.readFileSync(path.join(__dirname, '../','public/html/404.html'));
}

try{
  five = fs.readFileSync(path.join(env.OCTORP_HOME, 'html', '5xx.html'));
}
catch(e){
  five = fs.readFileSync(path.join(__dirname, '../','public/html/5xx.html'));
}

module.exports = {
  index: index,
  four: four,
  five: five
}