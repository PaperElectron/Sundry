/**
 * @file listRoutes
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Sundry
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

/**
 * Lists all hosts and routes.
 * @module listRoutes
 */

module.exports = function(redis, utils, parsers){
  return function listRoutes() {
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
      .then(function(route) {
        if(route === 'exit'){ return this.exit = true }
        this.route = route;
        return redis.listBackends(route)

      })
      .then(function(backends) {
        if(this.exit){ return utils.Main()}
        parsers.backendList(this.route.split(':')[1], backends)
        return utils.Continue();
      })
  }
}