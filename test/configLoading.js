var expect = require('chai').expect;
var path = require('path');
var fs = require('fs')
var rimraf = require('rimraf')

var config;

before(function(done){
  process.env.HOME = path.join(__dirname, './mocks/testHome')
  process.env.sundry_redis_url = 'redis://new.url:6379/0';
  config = require('../lib/Configuration/configLoader');
  config.on('ready', function() {
    done()
  });
});

after(function(){
  var resolved = require.resolve('../lib/Configuration/configLoader');
  delete require.cache[resolved];
})

suite("Config Loader - File absent", function() {


  suite('Uses defaults with no config file present', function(){

    test('Expect config file to not be present', function(done) {
      fs.stat(path.join(process.env.HOME, './sundry'), function(err, stats) {
        expect(err.code).to.equal('ENOENT')
        done()
      })
    })

    test('Default config value present',function(){
      expect(config.loadedConfig.sundry_default_address).to.equal('localhost');
    })

  });

  suite('Uses ENV value when set', function(){

    test('ENV value present',function(){
      expect(config.loadedConfig.sundry_redis_url).to.equal('redis://new.url:6379/0');
    })

    test('Does not leak other ENV variables', function() {
      expect(config.loadedConfig.path).to.equal(undefined);
    })

  })
});

suite("Config Loader - with file", function() {
  before(function(){
    process.env.HOME = path.join(__dirname, './mocks/mockHome')
  })
  suite('Uses correct values from file', function() {
    test('Home directory should be correct', function() {
      expect(process.env.HOME).to.equal(path.join(__dirname, './mocks/mockHome'))
    })
  })

})