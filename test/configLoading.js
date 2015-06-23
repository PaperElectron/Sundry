var expect = require('chai').expect;
var path = require('path');
var fs = require('fs')
var rimraf = require('rimraf')

var created;


before(function(done){
  process.env.HOME = path.join(__dirname, './mocks/')
  process.env.sundry_redis_url = 'redis://new.url:6379/0';
  var build = require('../lib/Configuration/configManager').buildConfig
  build(function(err, wasCreated) {
    created = wasCreated
    done()
  })
});

after(function(done){
  rimraf(path.join(__dirname,'mocks', '.sundry'), done)
});

suite("Configuration", function(){
  console.log('Run 1');

  suite("Creates directories and config file", function(){

    test('Creates config, with default values', function(){
        expect(created).to.be.true
      })
    });

    test('Creates ssl directory in /.sundry', function(done){
      fs.stat(path.join(__dirname,'mocks', '.sundry', 'ssl'), function(err, stats){
        expect(stats.isDirectory()).to.be.true
        done()
      })
    })

})


suite("Config Loader", function() {
  var config;
  before(function(done){
    config = require('../lib/Configuration/configLoader');
    config.on('ready', function() {
      done()
    });
  });

  suite('Uses defaults with no config file present', function(){

    test('Default config value present',function(){
      expect(config.loadedConfig.sundry_default_address).to.equal('localhost');
    })

  });

  suite('Uses ENV value when set', function(){

    test('ENV value present',function(){
      expect(config.loadedConfig.sundry_redis_url).to.equal('redis://new.url:6379/0');
    })

  })
});

