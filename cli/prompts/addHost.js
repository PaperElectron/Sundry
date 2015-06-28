/**
 * @file addHost
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Sundry
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var chalk = require('chalk');

/**
 * Add route inquirer prompt.
 * @module addHost
 */

module.exports = function(redis, utils){
  return function addHost() {
    utils.Prompt({
      type: 'input',
      name: 'host',
      message: 'Enter hostname. ex. site.example.com or example.com'
    })
      .bind({})
      .then(function(host) {
        this.host = host
        return utils.Prompt({
          type: 'input',
          name: 'ip',
          message: 'Enter backend route ip and port for ' + host + ' ie. 127.0.0.1:8001'
        })
      })
      .then(function(ip) {
        this.ip = ip;
        return utils.Prompt({
          type: 'list',
          name: 'balance',
          default: 0,
          message: 'Assign load balance type to this host? Default:',
          choices: [
            {name: 'Round robin', value: 'round'},
            {name: 'Sticky Session', value: 'sticky'}
          ]
        })
      })
      .then(function(balance) {
        this.balance = balance;
        return utils.Prompt({
          type: 'input',
          name: 'ttl',
          default: 60,
          message: 'Assign a host specific TTL, in seconds to this host? Default:'
        })
      })
      .then(function(ttl){
        this.ttl = ttl;
        return utils.Confirm('Add new route: ' + this.host + ' -> ' + this.ip)
      })
      .then(function(confirm) {
        if(confirm){
          return redis.addHost(this.host, this.ip)
        }
        return confirm
      })
      .then(function(status) {
        status
          ? console.log(chalk.green('Added new route for ' + this.host + ' at backend ip ' + this.ip))
          : console.log(chalk.red('Operation cancelled!'))

        return utils.Continue()

      })
  }
}