/**
 * @file Startup
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Sundry
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var configManager = require('./Configuration/configLoader');
var logger = require('./logger').logger;
var path = require('path');

configManager.on('error', function(err, status){
  switch(status) {
    case 'NO_CONFIG':
      break;
    default:
      console.log(err)
      process.exit()
  }
})
configManager.on('ready', function() {
  require(path.join(__dirname, './Sundry.js'));
})