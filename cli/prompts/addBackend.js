/**
 * @file addBackend
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Sundry
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var chalk = require('chalk');

/**
 * Adds a backend host
 * @module addBackend
 */

module.exports = function(redis, utils, parsers){
  return function addBackend(){
    redis.listHosts()
      .bind({})
      .then(function(routeList) {
        return utils.Prompt({
          type: 'list',
          name: 'route',
          message: 'Select a route to see assigned route ip addresses.',
          choices: parsers.hostList(routeList)

        })
      })
      .then(function(host){
        if(host === 'exit'){ return this.exit = true }
        this.host = host.split(':')[1]
        return utils.Prompt({
          type: 'input',
          name: 'backend',
          message: 'Enter backend route ip and port for ' + host + ' ie. 127.0.0.1:8001',
          validate: function(input){
            if(input.length >= 1){
              return true
            }
            return 'You must provide a value for backend IP.'
          }
        })

      })
      .then(function(ip) {
        if(this.exit){ return }
        this.ip = ip
        return utils.Confirm('Add new backend: ' + this.ip + ' for host ' + this.host)
      })
      .then(function(confirm) {
        if(this.exit){ return }
        if(confirm){
          return redis.addHost(this.host, this.ip)
        }
        return confirm
      })
      .then(function(status) {
        if(this.exit){ return utils.Main(); }
        status
          ? console.log(chalk.green('Added new backend ' + this.ip + ' for host ' + this.host))
          : console.log(chalk.red('Operation cancelled!'))

        return utils.Continue()

      })

  }
}