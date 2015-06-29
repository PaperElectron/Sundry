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

module.exports = function(redis, utils, output){
  return function addBackend(){
    utils.getHostList('Select a host to see assigned route ip addresses.')
      .then(function(host) {
        if(host === 'back') {
          return this.returnTo = utils.Main
        }
        this.host = host.split(':')[1]
        return redis.listBackends(host)
      })
      .then(function(backends) {
        output.backendList('Existing backends:' + this.host, this.host, backends)

        return utils.Prompt({
          type: 'input',
          name: 'backend',
          message: 'Enter route ip and port for ' + this.host + ' ie. 127.0.0.1:8001',
          validate: function(input){
            if(input.length >= 1){
              return true
            }
            return 'You must provide a value for backend IP.'
          }
        })

      })
      .then(function(ip) {
        if(this.returnTo){return}
        this.ip = ip
        return utils.Confirm('Add new backend: ' + this.ip + ' for host ' + this.host)
      })
      .then(function(confirm) {
        if(this.returnTo){ return }
        if(confirm){
          return redis.addHost(this.host, this.ip)
        }
        return confirm
      })
      .then(function(status) {
        if(this.returnTo){ return this.returnTo(); }
        status
          ? console.log(chalk.green('Added new backend ' + this.ip + ' for host ' + this.host))
          : console.log(chalk.red('Add backend cancelled.'))

        return utils.Finish(addBackend);
      })

  }
}