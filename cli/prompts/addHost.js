/**
 * @file addHost
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Sundry
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var chalk = require('chalk');
var _ = require('lodash');
/**
 * Add route inquirer prompt.
 * @module addHost
 */


module.exports = function(redis, utils, output){

  var addBackends = function(host, ipArray){
    return utils.Prompt({
      type: 'input',
      name: 'ip',
      message: 'Enter backend route ip and port for ' + host + ' ie. 127.0.0.1:8001'
    })
      .then(function(ip){
        return utils.RunAgain('Continue?','Add another backend?')
          .then(function(runAgain){
            if(runAgain){
              ipArray.push(ip)
              return addBackends(host, ipArray)
            }
            ipArray.push(ip);
            return ipArray
          })
      })
  }

  return function addHost() {
    utils.Prompt({
      type: 'input',
      name: 'host',
      message: 'Enter hostname. ex. site.example.com or example.com'
    })
      .bind({})
      .then(function(host) {
        this.host = host
        return addBackends(host, [])
      })
      .then(function(ipArray) {
        this.ipArray = ipArray;
        return utils.Meta.balance()
      })
      .then(function(balance) {
        this.ipArray.push('***data:balance,' + balance);
        return utils.Meta.ttl()
      })
      .then(function(ttl){
        this.ipArray.push('***data:ttl,' + ttl);
        output.backendList('Add Host ' + this.host + '?' , this.host, this.ipArray)
        return utils.Confirm('Add new host: ' + this.host)
      })
      .then(function(confirm) {
        if(confirm){
          return redis.addHost(this.host, this.ipArray)
        }
        return confirm
      })
      .then(function(status) {
        status
          ? console.log(chalk.green('Added new route for ' + this.host))
          : console.log(chalk.red('Add new host cancelled!'))

        return utils.Finish(addHost)

      })
  }
}