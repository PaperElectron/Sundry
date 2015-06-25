var expect = require('chai').expect;
var path = require('path');
var fs = require('fs')
var rimraf = require('rimraf')

describe("Config Loader - File absent", function() {
  var config;
  before(function(done){
    process.env.HOME = path.join(__dirname, './mocks/testHome')
    process.env.sundry_redis_url = 'redis://new.url:6379/0';
    config = require('../lib/Configuration/configLoader');
    config.on('ready', function() {
      done()
    });
  });

  after(function(done){
    var resolved = require.resolve('../lib/Configuration/configLoader');
    delete require.cache[resolved];
    done()
  });
  describe('Uses defaults with no config file present',function(){
    it('Expect config file to not be present', function(done) {
      fs.stat(path.join(process.env.HOME, './sundry'), function(err, stats) {
        expect(err.code).to.equal('ENOENT')
        done()
      })
    });

    it('Default config value present', function() {
      expect(config.loadedConfig.sundry_default_address).to.equal('localhost');
    })
  })

})

describe("Config Loader - with file", function() {
  var config;
  before(function(done) {
    process.env.HOME = path.join(__dirname, './mocks/mockHome');
    process.env.sundry_redis_url = 'redis://new.url:6379/0';
    config = require('../lib/Configuration/configLoader');
    config.on('ready', function() {
      done()
    });
  })
  after(function(done) {
    var resolved = require.resolve('../lib/Configuration/configLoader');
    delete require.cache[resolved];
    done()
  })
  describe('Uses correct values from file', function() {
    it('Home directory should be correct', function() {
      expect(process.env.HOME).to.equal(path.join(__dirname, './mocks/mockHome'))
    })
    it('Should have the correct values loaded from file', function() {
      expect(config.loadedConfig.sundry_bind_address).to.equal("1.2.3.4")
    })
    it('Should have the correct value for missing config key', function(){
      expect(config.loadedConfig.sundry_dev_ssl_port).to.equal(8443)
    })
    it('Should have loaded the Environment variable', function(){
      expect(config.loadedConfig.sundry_redis_url).to.equal('redis://new.url:6379/0')
    })
  });

});

describe("Config Loader - with file and ENV overrides", function() {
  var config;
  before(function(done) {
    process.env.HOME = path.join(__dirname, './mocks/mockHome');
    process.env.sundry_redis_url = 'redis://new.url:6379/0';
    process.env.sundry_bind_address = '9.9.9.9';
    config = require('../lib/Configuration/configLoader');
    config.on('ready', function() {
      done()
    });
  })

  after(function(done) {
    var resolved = require.resolve('../lib/Configuration/configLoader');
    delete require.cache[resolved];
    done()
  });

  describe('Uses correct values from file',function() {
    it('Home directory should be correct', function() {
      expect(process.env.HOME).to.equal(path.join(__dirname, './mocks/mockHome'))
    })
    it('Should override value loaded from file with ENV variable', function() {
      expect(config.loadedConfig.sundry_bind_address).to.equal('9.9.9.9')
    })
    it('Should have the correct value for missing config key', function(){
      expect(config.loadedConfig.sundry_dev_ssl_port).to.equal(8443)
    })
    it('Should have loaded the Environment variable', function(){
      expect(config.loadedConfig.sundry_redis_url).to.equal('redis://new.url:6379/0')
    })
  })

})