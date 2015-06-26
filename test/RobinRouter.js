var expect = require('chai').expect;
var path = require('path')
var mockRedis = require('./mocks/Redis_mock');
var Router = require(path.join(process.cwd(), 'lib/Router/RobinRouter'))

describe("Round Robin Router", function() {

  describe("Host lookup", function(){
    var router = new Router({client: mockRedis})
    it('Should find the host',function(done){
        router.findRoute('a.test.host', null, function(route){
          expect(route.host).to.equal('127.0.0.1')
          expect(route.port).to.equal('10000')
          done()
        })
    });

    it('Should load balance', function(done){
      var count = 4
      var callDone = function(){
        if(!(count -= 1)) {
          done()
        }
      };

      router.findRoute('c.test.host',null, function(route){
        expect(route.host).to.equal('127.0.0.1')
        expect(route.port).to.equal('30000')
        callDone()
      });
      router.findRoute('c.test.host',null, function(route){
        expect(route.host).to.equal('127.0.0.1')
        expect(route.port).to.equal('30001')
        callDone()
      });
      router.findRoute('c.test.host',null, function(route){
        expect(route.host).to.equal('127.0.0.1')
        expect(route.port).to.equal('30002')
        callDone()
      });
      router.findRoute('c.test.host',null, function(route){
        expect(route.host).to.equal('127.0.0.1')
        expect(route.port).to.equal('30000')
        callDone()
      });
    })
  });

  describe('Caching', function(){
    var router = new Router({client: mockRedis, ttl: .4})
    it("Should cache the host provided", function(){
      var cached = router.cacheRoute("an.added.host", ["127.0.0.1:8000"])
      expect(cached.routes).to.be.a('array')
      expect(cached.routes.length).to.equal(1)
    });

    it("Retrieves the previously cached host", function(done){
      router.findRoute('an.added.host',null, function(route){
        expect(route.host).to.equal('127.0.0.1')
        expect(route.port).to.equal('8000')
        done()

      })
    });

    it("Routes expire when they should.", function(done){
      setTimeout(function(){
        router.findRoute('an.added.host',null, function(route){
          expect(route).to.equal(false)
          done()
        })
      }, 500)
    })
  })
});