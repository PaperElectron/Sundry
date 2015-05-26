var expect = require('chai').expect;
var path = require('path');
var fs = require('fs')
var rimraf = require('rimraf')

suite("Config Loader", function() {

  var config;
  beforeEach(function(){
    process.env.HOME = path.join(__dirname, './mocks/')
  });

  suite('Uses defaults with no config file present', function(){

    test('Default config value present',function(){
      config = require('../lib/Configuration/config')
      expect(config.sundry_default_address).to.equal('localhost');
    })

  });

  suite('Uses ENV value when set', function(){
    process.env.sundry_redis_url = 'redis://new.url:6379/0'

    test('ENV value present',function(){
      config = require('../lib/Configuration/config')
      expect(config.sundry_redis_url).to.equal('redis://new.url:6379/0');
    })

  })
});

suite("Config Builder", function(){
  var config;
  beforeEach(function(){
    process.env.HOME = path.join(__dirname, './mocks/')
  });
  after(function(done){
    rimraf(path.join(__dirname,'mocks', '.octorp'), done)
  });
  suite("Creates directories and config file", function(){

    test('Creates config, with default values', function(){
      config = require('../lib/Configuration/buildConfig')(true)
      expect(config).to.have.property('sundry_default_address')
      expect(config.sundry_default_address).to.equal('localhost')
    });

    test('Creates ssl directory in /.sundry', function(done){
      fs.stat(path.join(__dirname,'mocks', '.sundry', 'ssl'), function(err, stats){
        expect(stats.isDirectory()).to.be.true
        done()
      })
    })

  })
});
