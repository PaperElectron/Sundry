_ = require('lodash')

/*
 * Date formatting graciously borrowed from morgan.
 * https://github.com/expressjs/morgan
 */
var clfmonth = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

var pad2 = function(num){
  var str = String(num)
  return (str.length === 1 ? '0' : '')
    + str
};

var clfDate = function(dateTime){
  var date = dateTime.getUTCDate();
  var hour = dateTime.getUTCHours();
  var mins = dateTime.getUTCMinutes();
  var secs = dateTime.getUTCSeconds();
  var year = dateTime.getUTCFullYear();
  var month = clfmonth[dateTime.getUTCMonth()];

  return pad2(date) + '/' + month + '/' + year
    + ':' + pad2(hour) + ':' + pad2(mins) + ':' + pad2(secs)
    + ' +0000'
};

/*
 * Prepend a timestamp onto the logged message, called in such a way
 * as to not break the default console behavior.
 */
var appendLog = function(){
  arguments[0] = clfDate(new Date()) + ': ' + arguments[0];
  return arguments
};

/*
 * Send back a logger object that we can later extend with additional methods,
 * such as remote logging.
 *
 * For now it just contains a wrapper around console.log with timestamp added
 * as well as a logger that can be turned off for debug statements.
 */


var logger = (function(_this) {
  _this.loggingEnabled = false
  return {
    enableLogging: function(state) {
      _this.loggingEnabled = state;
      return this;
    },
    logger: {
      // Standard console.log, adds timestamp.
      log: function() {
        if(process.env.NODE_ENV !== 'test') {
          console.log.apply(console, appendLog.apply(this, arguments))
        }
      },
      // Debug logger is suppressed when octorp_debug is false.
      debug: function(){
        if(_this.loggingEnabled) {
          return console.log.apply(console, appendLog.apply(this,arguments))
        }
      }
    }
  }
})(this);

module.exports = logger