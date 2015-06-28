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
      mainList()
    })

  });
})

var utilities = {
  Prompt: Prompt,
  Continue: continuePrompt,
  Confirm: confirmPrompt,
  Main: mainList
}

var parsers = {
  backendList: parseBackendlist,
  hostList: parseHostList,
  deleteBackend: parseDeleteBackend
}


function mainList() {
  process.stdout.write('\033c');
  return Prompt({
    type: 'list',
    name: 'action',
    message: 'Select an action.',
    choices: [
      {name: 'List Host Info', value: 'list'},
      {name: 'Add Host', value: 'add'},
      {name: 'Add Host metadata', value: 'addMeta'},
      {name: 'Add Host backend', value: 'addBackend'},
      {name: 'Remove Host', value: 'remove'},
      {name: 'Remove Host backend', value: 'removeBackend'},
      {name: chalk.red('Exit'), value: 'exit'}
    ]
  })
    .then(function(answer) {
      switch (answer) {
        case 'list':
          //listRoutes();
          require('./prompts/listRoutes')(red, utilities, parsers)()
          break;
        case 'add':
          require('./prompts/addHost')(red, utilities)()
          break;
        case 'remove':
          require('./prompts/removeHost')(red, utilities, parsers)()
          break;
        case 'addBackend':
          //addBackend();
          require('./prompts/addBackend')(red, utilities, parsers)()
          break;
        case 'removeBackend':
          //removeBackend();
          require('./prompts/removeBackend')(red, utilities, parsers)()
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
 * Formatters
 */
function parseBackendlist(title ,arrayData) {
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
  console.log(separate('yellow','Host Info', true));
  console.log(chalk.green.bold('- ' + title))
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
  var count = (format.length >= 50) ? 0 : 50 - format.length
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


