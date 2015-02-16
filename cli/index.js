#! /usr/bin/env node
process.stdout.write('\033c');

var env = require('../lib/config');

var app = require('commander');
var _ = require('lodash');
var chalk = require('chalk');
var path = require('path');
var url = require('url');
var redisHost = url.parse(env.octorp_redis_url);
var redis = require('redis');
var packageVersion = require(path.join(__dirname, '../', 'package.json')).version;

app
  .version(packageVersion)
  .option('-i --interactive', 'Start interactive management mode.');

app
  .command('start')
  .description('Start the OctoRP proxy server.')
  .action(function(env, options){
    require(path.join(__dirname, '../', 'lib/application'))
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
    var client = redis.createClient(redisHost.port, redisHost.hostname);
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
    var client = redis.createClient(redisHost.port, redisHost.hostname);
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
  });;

app.parse(process.argv);

if(!process.argv.slice(2).length){
  app.outputHelp()
}

if(app.interactive){
  require('./interactive')
}