/**
 * @file removeHost
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Sundry
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var chalk = require('chalk');
/**
 * Deletes a host
 * @module removeHost
 */

module.exports = function(redis, utils, parsers){
  return function removeHost() {
    redis.listHosts()
      .bind({})
      .then(function(routeList) {
        return utils.Prompt({
          type: 'list',
          name: 'route',
          message: 'Select a host to delete',
          choices: parsers.hostList(routeList)

        })
      })
      .then(function(host) {
        if(host === 'back'){ return this.returnTo = utils.Main }
        this.host = host
        return utils.Confirm(chalk.red('Permanently delete '
        + chalk.yellow(host.split(':')[1])
        + ' and all of its registered backend routes?'))
      })
      .then(function(confirm) {
        if(this.returnTo){ return }
        if(confirm) {
          return redis.deleteHost(this.host)
        }
        return confirm
      })
      .then(function(status) {
        if(this.returnTo){ return this.returnTo() }
        status
          ? console.log(chalk.green('Permanently deleted ' + this.host))
          : console.log(chalk.red('Operation cancelled!'))
        return utils.Finish(removeHost)
      })
  }
}