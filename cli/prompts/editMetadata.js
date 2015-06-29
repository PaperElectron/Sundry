/**
 * @file editMetadata
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Sundry
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var chalk = require('chalk');
var _ = require('lodash');

/**
 * Edit a Hosts metadata.
 * @module editMetadata
 */

module.exports = function(redis, utils, output) {

  var editMeta = function(host, backends, edited) {
    var _this = this;
    if(!_.isArray(edited)){ edited = []}

    return utils.Prompt({
      type: 'list',
      name: 'route',
      message: 'Select a property to edit',
      choices: output.metaDataList(host, backends)
    })
      .then(function(metaProperty) {
        if(metaProperty === 'back'){
          return _this.returnTo = editMetadata
        }
        var editProperty = metaProperty.split(':')[1].split(',')[0]
        if(_.isFunction(utils.Meta[editProperty])) {
          return utils.Meta[editProperty]()
            .then(function(prop) {
              return utils.RunAgain('Continue?','Edit another property?')
                .then(function(runAgain){
                  if(runAgain){

                    return redis.editMetaProperty(host, metaProperty, prop)
                      .then(function(status) {
                        edited.push({prop: editProperty, val:prop})
                        return editMeta(host, backends, edited)
                      })
                  }
                  return redis.editMetaProperty(host, metaProperty, prop)
                    .then(function(status) {
                      edited.push({prop: editProperty, val:prop})
                      return edited
                    });
                })
            })
        }

      })
  }

  function editMetadata() {
    redis.listHosts()
      .bind({})
      .then(function(hosts) {
        return utils.Prompt({
          type: 'list',
          name: 'route',
          message: 'Select a host to edit metadata.',
          choices: output.hostList(hosts)

        })
      })
      .then(function(host) {
        if(host === 'back') {
          return this.returnTo = utils.Main
        }
        this.host = host;
        return redis.listBackends(host)

      })
      .then(function(backends) {
        if(this.returnTo) { return }
        return editMeta.apply(this, [this.host, backends])
      })
      .then(function(edited){
        if(this.error) { return utils.handleError(this.error, editMetadata) }
        if(this.returnTo){ return this.returnTo() }
        output.metaDataEdited(this.host.split(':')[1], edited);
        return utils.Finish(editMetadata)
      })
  }

  return editMetadata
}