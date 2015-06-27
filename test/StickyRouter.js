/**
 * @file StickyRouter
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Sundry
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

var expect = require('chai').expect;
var path = require('path')
var mockRedis = require('./mocks/Redis_mock');
var Router = require(path.join(process.cwd(), 'lib/Router/StickyRouter'))

var identity;

describe("Sticky Router", function() {

  describe("Host lookup", function(){
    var router = new Router({client: mockRedis, seed: 'test'})

    it('Route should have an identity property', function() {
      router.findRoute('c.test.host', null, function(route){
        expect(route).to.have.property('identity');

        it('should return the first host in the array', function() {
          expect(route.port).to.equal('30000')
        })

        identity = route.identity
      })
    })

    it('Next client should retrieve next route in array', function() {
      router.findRoute('c.test.host', null, function(route){
        expect(route.port).to.equal('30001')
      })
    })

    it('Identity should provide route to mapped backend on subsequent calls.', function(done){
      var count = 4
      var callDone = function(){
        if(!(count -= 1)) {
          done()
        }
      };

      router.findRoute('c.test.host', identity, function(route){
        expect(route.host).to.equal('127.0.0.1')
        expect(route.port).to.equal('30000')
        callDone()
      });
      router.findRoute('c.test.host', identity, function(route){
        expect(route.host).to.equal('127.0.0.1')
        expect(route.port).to.equal('30000')
        callDone()
      });
      router.findRoute('c.test.host', identity, function(route){
        expect(route.host).to.equal('127.0.0.1')
        expect(route.port).to.equal('30000')
        callDone()
      });
      router.findRoute('c.test.host', identity, function(route){
        expect(route.host).to.equal('127.0.0.1')
        expect(route.port).to.equal('30000')
        callDone()
      });
    })
  });
});