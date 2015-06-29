/**
 * @file removeBackend
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Sundry
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */
var chalk = require('chalk');
/**
 * Removes a host backend
 * @module removeBackend
 */

module.exports = function(redis, utils, parsers){

  return function removeBackend(){
    redis.listHosts()
      .bind({})
      .then(function(hosts) {
        return utils.Prompt({
          type: 'list',
          name: 'route',
          message: 'Select a route to see assigned route ip addresses.',
          choices: parsers.hostList(hosts)

        })
      })
      .then(function(host) {
        if(host === 'back'){ return this.returnTo = utils.Main }
        this.host = host;
        return redis.listBackends(host)

      })
      .then(function(backends) {
        if(this.returnTo){ return }
        this.backends = backends;
        return utils.Prompt({
          type: 'list',
          name: 'route',
          message: 'Select a backend to delete',
          choices: parsers.deleteBackend(backends)
        })
      })
      .then(function(toDelete){
        if(this.returnTo){ return }
        if(toDelete === 'back'){return this.returnTo = removeBackend}
        this.ip = toDelete
        return utils.Confirm('Delete backend: ' + this.ip + ' for host ' + this.host)
      })
      .then(function(confirm){
        if(this.returnTo){ return }
        if(confirm){
          return redis.deleteBackend(this.host, this.ip)
        }
      })
      .then(function(status){
        if(this.returnTo){ return this.returnTo() }
        if(this.restart){ return removeBackend()}
        status
          ? console.log(chalk.green('Deleted backend ' + this.ip + ' for host ' + this.host))
          : console.log(chalk.red('Operation cancelled!'))

        return utils.Finish(removeBackend)
      })

  }
}