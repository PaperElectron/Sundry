var config = require('../lib/Configuration/configLoader')
var url = require('url');

var redis = require('redis');
var inquirer = require('inquirer');
var Promise = require('bluebird');
var chalk = require('chalk');
var _ = require('lodash');
Promise.promisifyAll(inquirer);

var red;
config.on('ready', function(){
  var env = config.loadedConfig
  var redisHost = url.parse(env.sundry_redis_url);
  var client = Promise.promisifyAll(redis.createClient(redisHost.port, redisHost.hostname));
  client.on('ready', function(){
    red = require('./redis')(client);
    red.listHosts().then(function(keys){
      console.log(keys)
      mainList()
    })

  });
})


function mainList() {
  process.stdout.write('\033c');
  return Prompt({
    type: 'list',
    name: 'action',
    message: 'Select an action.',
    choices: [
      {name: 'List Hosts', value: 'list'},
      {name: 'Add Host', value: 'add'},
      {name: 'Remove Host', value: 'remove'},
      {name: 'Add Host backend', value: 'addBackend'},
      {name: 'Remove Host backend', value: 'removeBackend'},
      {name: chalk.red('Exit'), value: 'exit'}
    ]
  })
    .then(function(answer) {
      switch (answer) {
        case 'list':
          listRoutes();
          break;
        case 'add':
          addRoute();
          break;
        case 'remove':
          removeRoute();
          break;
        case 'addBackend':
          addBackend();
          break;
        case 'removeBackend':
          removeBackend();
          break;
        case 'exit':
          process.stdout.write('\033c');
          process.exit();
      }
    });
};

/*
 * Reusable prompts
 */
var continuePrompt = function(){
  return Prompt({
    type: 'list',
    name: 'continue',
    message: 'Continue or Exit?',
    choices: [
      {name: 'Continue', value: true},
      {name: chalk.red('Exit'), value: false}

    ]
  }).then(function(answers){
    if(answers){ return mainList(); }
    process.stdout.write('\033c');
    return process.exit(0);
  })
};

function confirmPrompt(value){
  return Prompt({
    type: 'confirm',
    name: 'valid',
    message: value + ' <- is this correct?'
  })
}
/*
 * Action prompts
 */
function listRoutes() {
  red.listHosts()
    .bind({})
    .then(function(routeList) {
      return Prompt({
        type: 'list',
        name: 'route',
        message: 'Select a route to see assigned route ip addresses.',
        choices: parseHostList(routeList)

      })
    })
    .then(function(route) {
      if(route === 'exit'){ return this.exit = true }
      this.route = route;
      return red.listBackends(route)

    })
    .then(function(backends) {
      if(this.exit){ return mainList()}
      parseBackendlist(this.route.split(':')[1], backends)
      return continuePrompt();
    })
}

function addRoute() {
  Prompt({
    type: 'input',
    name: 'host',
    message: 'Enter hostname. ex. site.example.com or example.com'
  })
    .bind({})
    .then(function(host) {
      this.host = host
      return Prompt({
        type: 'input',
        name: 'ip',
        message: 'Enter backend route ip and port for ' + host + ' ie. 127.0.0.1:8001'
      })
    })
    .then(function(ip) {
      this.ip = ip
      return confirmPrompt('Add new route: ' + this.host + ' -> ' + ip)
    })
    .then(function(confirm) {
      if(confirm){
        return red.addHost(this.host, this.ip)
      }
      return confirm
    })
    .then(function(status) {
      status
        ? console.log(chalk.green('Added new route for ' + this.host + ' at backend ip ' + this.ip))
        : console.log(chalk.red('Operation cancelled!'))

      return continuePrompt()

    })
}

function removeRoute() {
  red.listHosts()
    .bind({})
    .then(function(routeList) {
      return Prompt({
        type: 'list',
        name: 'route',
        message: 'Select a host to delete',
        choices: parseHostList(routeList)

      })
    })
    .then(function(host) {
      if(host === 'exit'){ return this.exit = true }
      this.host = host
      return confirmPrompt(chalk.red('Permanently delete '
      + chalk.yellow(host.split(':')[1])
      + ' and all of its registered backend routes?'))
    })
    .then(function(confirm) {
      if(this.exit){ return 'exit' }
      if(confirm) {
        return red.deleteHost(this.host)
      }
      return confirm
    })
    .then(function(status) {
      if(this.exit){ return mainList() }
      status
        ? console.log(chalk.green('Permanently deleted ' + this.host))
        : console.log(chalk.red('Operation cancelled!'))
      return continuePrompt()
    })
}

function addBackend(){
  red.listHosts()
    .bind({})
    .then(function(routeList) {
      return Prompt({
        type: 'list',
        name: 'route',
        message: 'Select a route to see assigned route ip addresses.',
        choices: parseHostList(routeList)

      })
    })
    .then(function(host){
      if(host === 'exit'){ return this.exit = true }
      this.host = host.split(':')[1]
      return Prompt({
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
      return confirmPrompt('Add new backend: ' + this.ip + ' for host ' + this.host)
    })
    .then(function(confirm) {
      if(this.exit){ return }
      if(confirm){
        return red.addHost(this.host, this.ip)
      }
      return confirm
    })
    .then(function(status) {
      if(this.exit){ return mainList(); }
      status
        ? console.log(chalk.green('Added new backend ' + this.ip + ' for host ' + this.host))
        : console.log(chalk.red('Operation cancelled!'))

      return continuePrompt()

    })

}
function removeBackend(){
  red.listHosts()
    .bind({})
    .then(function(routeList) {
      return Prompt({
        type: 'list',
        name: 'route',
        message: 'Select a route to see assigned route ip addresses.',
        choices: parseHostList(routeList)

      })
    })
    .then(function(host) {
      if(host === 'exit'){ return this.exit = true }
      this.host = host;
      return red.listBackends(host)

    })
    .then(function(backends) {
      if(this.exit){ return}
      return Prompt({
        type: 'list',
        name: 'route',
        message: 'Select a backend to delete',
        choices: parseDeleteBackend(backends)
      })
    })
    .then(function(toDelete){
      if(this.exit){ return }
      if(toDelete === 'restart'){return this.restart = true}
      this.ip = toDelete
      return confirmPrompt('Delete backend: ' + this.ip + ' for host ' + this.host)
    })
    .then(function(confirm){
      if(this.exit || this.restart){ return }
      if(confirm){
        return red.deleteBackend(this.host, this.ip)
      }
    })
    .then(function(status){
      if(this.exit){ return mainList() }
      if(this.restart){ return removeBackend()}
      status
        ? console.log(chalk.green('Deleted backend ' + this.ip + ' for host ' + this.host))
        : console.log(chalk.red('Operation cancelled!'))

      return continuePrompt()
    })

}
/*
 * Formatters
 */
function parseBackendlist(title ,arrayData) {
  console.log(separate('yellow','Backend IPs', true));
  console.log(separate('green',title, true))
  _.map(arrayData, function(d){
    console.log(chalk.green('  - ' + d))
  })
  console.log(separate('yellow', true));
}

function parseDeleteBackend(arrData){
  var data = _.map(arrData, function(b){
    return {name: 'Ip/hostname:port ' + b, value: b}
  });
  data.unshift(separate('red','Backends'));
  data.unshift({name: chalk.underline.green('Back'), value: 'restart'})
  data.push(separate('red'));
  return data
}

function parseHostList(list){
  list = _.map(list, function(r) {
    return {name: r.split(':')[1], value: r}
  });
  if(!list.length){
    list.unshift(separate('red', 'No Hosts found!'));
  }
  if(list.length > 0) {
    list.unshift(separate('yellow','Hosts'));
    list.push(separate('yellow'));
  }
  list.unshift({name: chalk.underline.green('Back'), value: 'exit'});
  return list
}

function separate(color, message, plain){
  if(_.isBoolean(message)){
    plain = message
    message = false
  }
  var format = message ? ' ' + message + ' ' : []
  var count = (format.length >= 50) ? 0 : 50 - format.length
  for(; count--;){
    if(count % 2){
      format = '-' + format
    }
    else{
      format = format + '-'
    }
  }

  if(plain){
    return chalk[color](format)
  }
  return new inquirer.Separator(chalk[color](format))
}
/*
 * For shame for shame, inquirer breaks node conventions, and doesn't return error first callbacks.
 */
function Prompt(prompt){
  return new Promise(function(resolve, reject){
    inquirer.prompt(prompt, function(answer){
      var unwrapped = answer[_.keys(answer)[0]]
      resolve(unwrapped);
    })
  })
}


