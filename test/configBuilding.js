/**
 * @file configBuilding
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Sundry
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var expect = require('chai').expect;
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');

var created;

before(function(done){
  process.env.HOME = path.join(__dirname, './mocks/testHome')
  process.env.sundry_redis_url = 'redis://new.url:6379/0';
  build = require('../lib/Configuration/configManager').buildConfig
  build(function(err, wasCreated) {
    created = wasCreated
    done()
  })
});

after(function(done){
  var resolved = require.resolve('../lib/Configuration/configManager');
  delete require.cache[resolved];
  rimraf(path.join(__dirname, 'mocks/testHome/.sundry'), done)
});

suite("Configuration creation and editing", function() {

  test('Expect the config directory to be created', function(done) {
    fs.stat(path.join(__dirname, 'mocks/testHome/.sundry'), function(err, stats) {
      expect(stats.isDirectory()).to.be.true
      done()
    })
  })

  test('Creates config, with default values', function() {
    expect(created).to.be.true
  })

  test('Creates ssl directory in /.sundry', function(done) {
    fs.stat(path.join(__dirname, 'mocks/testHome/.sundry', 'ssl'), function(err, stats) {
      expect(stats.isDirectory()).to.be.true
      done()
    })
  })

})