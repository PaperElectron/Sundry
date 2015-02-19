#! /usr/bin/env node
process.stdout.write('\033c');

//var env = require('../lib/config');

var app = require('commander');
var _ = require('lodash');
var chalk = require('chalk');
var path = require('path');
var url = require('url');
var logger = require(path.join(__dirname, '../','lib', 'logger'))
var redis = require('redis');
var packageVersion = require(path.join(__dirname, '../', 'package.json')).version;

app
  .version(packageVersion)
  .option('-i --interactive', 'Start interactive management mode.');

app
  .command('start')
  .description('Start the OctoRP proxy server.')
  .action(function(env, options){
    require(path.join(__dirname, '../'))
  })
  .on('--help', function(){
    console.log('  Example:');
    console.log();
    console.log('    octorp start -d');
    console.log();
  });

app
  .command('list [host]')
  .description('Quickly view the routes registered with the OctoRP server. ' +
  'Optionally list backend routes for [host].')
  .action(function(host){
    var client = connectRedis();
    var rredis;

    client.on('ready', function(){
      rredis = require('./redis')(client);
      if(host){
        var fhost = 'route:' + host;
        return rredis.listBackends(fhost).then(function(keys){
          console.log(chalk.green('Registered backends for ' + host));
          _.each(keys, function(k){
            console.log(chalk.green('  '+ k));
          });
          client.quit()
        })
      }
      return rredis.listHosts().then(function(keys){
        console.log(chalk.green('Registered hosts'));
        _.each(keys, function(k){
          console.log(chalk.green('  '+ k.split(':')[1]));
        });
        client.quit()
      })
    });
  })
  .on('--help', function(){
    console.log('  Example:');
    console.log();
    console.log('    list');
    console.log('    list some.host.com')
  });

app
  .command('add <host> <ip>')
  .description('Quickly add a host and backend.')
  .action(function(host, ip){
    var client = connectRedis()
    var rredis;

    client.on('ready', function(){
      rredis = require('./redis')(client);
      rredis.addHost(host, ip).then(function(status){
        if(status){
          console.log(chalk.green('Added host '+ host));
          return client.quit()
        }
        console.log( chalk.red(
            'Failed to add host ' + host +
            '. Does it already exist?'
          ));
        return client.quit()
      })
    });
  })
  .on('--help', function(){
    console.log('  Example:');
    console.log();
    console.log('    add some.host.com 127.0.0.1:10256')
  });

app
  .command('config [action] [key] [val]')
  .description('Allows editing of the config file located in ~/.octorp')
  .action(function(action, k, v){
    switch(action) {
      case 'build':
        logger.enableLogging(true)
        require('./../lib/buildConfig')(true)
        break;
      case 'edit':
        logger.enableLogging(false)
        require('./../lib/editConfig').edit(k, v)
        break
      case 'list':
        logger.enableLogging(false)
        require('./../lib/editConfig').list()
        break
      default:
        console.log('No options given to config command');
        console.log('octorp config --help for more info.')

    }
  })
  .on('--help', function(){
    console.log('  Example:');
    console.log();
    console.log('    octorp config build');
    console.log('      Builds skeleton config in ~/.octorp');
    console.log();
    console.log('    octorp config edit [key] [value]');
    console.log('      Sets config [key] to [value].');
    console.log();
    console.log('    octorp config list');
    console.log('      Lists config keys, values.');
    console.log();
  });

app.parse(process.argv);

if(!process.argv.slice(2).length){
  app.outputHelp()
}

if(app.interactive){
  require('./interactive')
}

function connectRedis(){
  var env = require('../lib/config');
  var redisHost = url.parse(env.octorp_redis_url);
  var client = redis.createClient(redisHost.port, redisHost.hostname, {max_attempts: 1});
  client.on('error', redisError)
  return client
}
function redisError(e){
  console.log(chalk.red("Please make sure the value of 'octorp_redis_url' is correct in ~/.octorp/config.json \n" +
  "Or the octorp_redis_url environment variable is set to a valid redis url."))
}