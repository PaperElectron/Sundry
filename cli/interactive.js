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
      mainPrompt()
    })

  });
})

var utilities = {
  getHostList: getHostList,
  Prompt: Prompt,
  Finish: finishPrompt,
  Continue: continuePrompt,
  Confirm: confirmPrompt,
  RunAgain: runAgain,
  Main: mainPrompt,
  Error: errorPrompt,
  handleError: handleError,
  Meta: {
    balance: balancePrompt,
    ttl: ttlPrompt
  }
}

var output = {
  backendList: backendlist,
  hostList: hostList,
  metaDataList: hostMetadata,
  metaDataEdited: metaDataEdited,
  deleteBackend: deleteBackend,
  Separator: separate
}

function getHostList(message){
  return red.listHosts()
    .bind({})
    .then(function(hosts) {
      return Prompt({
        type: 'list',
        name: 'route',
        message: message,
        choices: output.hostList(hosts)

      })
    })
}

function mainPrompt() {
  process.stdout.write('\033c');
  return Prompt({
    type: 'list',
    name: 'action',
    message: 'Select an action.',
    choices: [
      {name: chalk.green('List Host Info'), value: 'list'},
      {name: chalk.green('Add Host'), value: 'add'},
      {name: chalk.green('Add/Edit Host backend'), value: 'addBackend'},
      {name: chalk.green('Edit Host metadata'), value: 'addMeta'},
      {name: chalk.yellow('Remove Host'), value: 'removeHost'},
      {name: chalk.yellow('Remove Host backend'), value: 'removeBackend'},
      {name: chalk.red('Exit'), value: 'exit'}
    ]
  })
    .then(function(answer) {
      switch (answer) {
        case 'list':
          require('./prompts/listHosts')(red, utilities, output)()
          break;
        case 'add':
          require('./prompts/addHost')(red, utilities, output)()
          break;
        case 'addBackend':
          require('./prompts/addBackend')(red, utilities, output)()
          break;
        case 'addMeta':
          require('./prompts/editMetadata')(red, utilities, output)()
          break;
        case 'removeHost':
          require('./prompts/removeHost')(red, utilities, output)()
          break;
        case 'removeBackend':
          require('./prompts/removeBackend')(red, utilities, output)()
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
function runAgain(stop, run){
  return Prompt({
    type: 'list',
    name: 'runAgain',
    message: stop + ' or ' + run,
    choices: [
      {name: stop, value: false},
      {name: run, value: true}
    ]
  })
}

function continuePrompt(){
  return Prompt({
    type: 'list',
    name: 'continue',
    message: 'Continue or Exit?',
    choices: [
      {name: 'Continue', value: true},
      {name: chalk.red('Exit'), value: false}

    ]
  }).then(function(answers){
    if(answers){ return mainPrompt(); }
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

function finishPrompt(fn) {
  return Prompt({
    type: 'list',
    name: 'error',
    message: 'Go back, Main Menu or exit?',
    choices: [
      {name: chalk.green('Back'), value: 'back'},
      {name: chalk.yellow('Main'), value: 'main'},
      {name: chalk.red('Exit'), value: 'exit'}
    ]
  }).then(function(action){
    switch(action){
      case 'back':
        process.stdout.write('\033c');
        return fn();
        break;
      case 'main':
        process.stdout.write('\033c');
        return mainPrompt();
        break;
      case 'exit':
        process.stdout.write('\033c');
        return process.exit(0);
    }
  })
}

function errorPrompt() {
  return Prompt({
    type: 'list',
    name: 'error',
    message: 'try again, go back or exit?',
    choices: [
      {name: chalk.green('Try Again?'), value: 'again'},
      {name: chalk.yellow('Go Back'), value: 'back'},
      {name: chalk.red('Exit'), value: 'exit'}
    ]
  })
}

function handleError(err, fn){
  switch (err) {
    case 'again':
      return fn()
      break;
    case 'back':
      return mainPrompt()
      break;
    default:
      process.stdout.write('\033c');
      return process.exit(0);
  }
}

function balancePrompt() {
  return Prompt({
    type: 'list',
    name: 'balance',
    default: 0,
    message: 'Assign load balance type to this host? Default:',
    choices: [
      {name: 'Round robin', value: 'round'},
      {name: 'Sticky Session', value: 'sticky'}
    ]
  })
}

function ttlPrompt(){
  return Prompt({
    type: 'input',
    name: 'ttl',
    default: 60,
    message: 'Assign a host specific TTL, in seconds to this host? Default:'
  })
}

/*
 * Outputters
 */
function backendlist(title, host, arrayData) {
  var metaOnly = [];
  var routesOnly = _.filter(arrayData, function(i){
    var id = i.split(':')
    if(id[0] === '***data'){
      metaOnly.push(id[1]);
      return false
    }
    return true
  })
  /*
   * Output
   */
  console.log(separate('yellow', title, true));
  console.log(chalk.green.bold('- ' + host))
  console.log(chalk.green('  - Routes'))
  _.each(routesOnly, function(d){
      console.log(chalk.white('    - ' + d))
  })
  console.log(chalk.green('  - Metadata'))
  _.each(metaOnly, function(m){
    var m = m.split(',');
    console.log(chalk.white('    - ' + m[0] + ' -- ' + m[1]));
  })
  console.log(separate('yellow', true));
}

function deleteBackend(arrData){
  var data = _.chain(arrData)
    .filter(function(item){
      return item.split(':')[0] !== '***data'
    })
    .map(function(item){
      return {name: 'Ip/hostname:port ' + item, value: item}
    })
    .value();
  data.unshift(separate('red','Backends'));
  data.unshift({name: chalk.underline.green('Back'), value: 'back'})
  data.push(separate('red'));
  return data
}

function hostMetadata(host, arrdata){
  host = host.split(':')[1];
  var data = _.chain(arrdata)
    .filter(function(item) {
      return item.split(':')[0] === '***data'
    })
    .map(function(item) {
      var s = item.split(':')[1].split(',');
      return {name: 'meta: ' + s[0] + ' = ' + s[1] , value: item}
    })
    .value()
  data.unshift(separate('yellow', 'Edit Metadata: ' + host));
  data.unshift({name: chalk.underline.green('Back'), value: 'back'})
  data.push(separate('yellow'));
  return data
}

function hostList(list){
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
  list.unshift({name: chalk.underline.green('Back'), value: 'back'});
  return list
}

function metaDataEdited(host, edited){
  console.log(output.Separator('yellow', 'Edited metadata', true))
  console.log(chalk.green('- ' + host))
  _.each(edited, function(e){
    console.log(chalk.green('  - meta: ' + e.prop + ' = ' + e.val))
  })
  console.log(output.Separator('yellow', true))
}
/**
 *
 * @param color
 * @param message
 * @param {boolean} plain If false returns a inquirer separator for use in lists.
 * @returns {*}
 */
function separate(color, message, plain){
  if(_.isBoolean(message)){
    plain = message
    message = false
  }
  var format = message ? ' ' + message + ' ' : []
  var count = (format.length >= 80) ? 0 : 80 - format.length
  /**
   * Add invisible chars here after length has been established
   */
  format = chalk.bold(format);
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


