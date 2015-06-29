/**
 * @file listHosts
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Sundry
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

/**
 * Lists all hosts and routes.
 * @module listHosts
 */

module.exports = function(redis, utils, output){
  return function listHosts() {
    return utils.getHostList('Select a route to see host details.')
      .then(function(host) {
        if(host === 'back'){
          return this.returnTo = utils.Main
        }
        this.host = host;
        return redis.listBackends(host)

      })
      .then(function(backends) {
        if(this.returnTo){
          return this.returnTo()
        }
        output.backendList('Host Info', this.host.split(':')[1], backends)
        utils.Finish(listHosts);
      })
  }
}