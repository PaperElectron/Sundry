var http = require('http');
var https = require('https');
var _ = require('lodash');
var url = require('url');
var env = require('./../Configuration/configLoader').loadedConfig;
var logger = require('./../logger').logger;
var path = require('path');
var fs = require('fs');
var Cookies = require('cookies');
var NODE_ENV = (env.NODE_ENV === 'production');


//var PluginManager = require('./../Plugins');
//
//PluginManager.register(function(req, next){
//  console.log('run first');
//  next();
//
//});
//PluginManager.register(function(req, next){
//  next();
//});

var httpProxy = require('http-proxy');

var staticPages = require('./defaultFiles');

var incomingProtocol = env.sundry_redirect_ssl ? "https://" : "http://"
var proxy = httpProxy.createProxyServer();

var handleWebProxy = function(req, res, proxyTo){
  return proxy.web(req, res, {
    target: {
      host: proxyTo.host,
      port: proxyTo.port
    }
  }, function(err){
    console.log(err);
    res.writeHead(503);
    res.write(staticPages.five);
    res.end();
  });
};

/**
 *  Handler function for default address.
 *  Returns a function to either proxy to a default
 *  application, or to write the index.html page.
 */
var handleDefaultAddress = (function(){
  if(env.sundry_default_application){
    return function(req, res){
      handleWebProxy(req, res, env.sundry_default_application)
    }
  }
  return function(req, res){
    res.writeHead(200,{'Content-Type': 'text/html'});
    res.write(staticPages.index)
    res.end()
  }
})()

module.exports = function(serverOptions, Router) {

  /**
   * Main Proxy handler
   */

  var stickyBalanceProxy = function(req, res){
    var parsedHeader = url.parse(incomingProtocol + req.headers.host).hostname;
    //Expire this request in a reasonable amount of time if something is hanging up downstream.
    res.setTimeout(1000, function() {
      logger.log('Request for %s timed out.', req.headers.host);
      res.writeHead(408);
      res.write('Sorry We couldn\'t complete that request in time.');
      return res.end();
    });

    //Return early if this route matches the default set in the config.
    if(parsedHeader === env.sundry_default_address) {
      return handleDefaultAddress(req, res)
    }

    var cookie = new Cookies(req, res, env.sundry_sticky_cookie_secret)
    //Send our request host data to the Router to be looked up and cached if found.
    Router.findRoute(parsedHeader, cookie.get('stickyRoute'), function proxyRequest(data) {
      if(data) {

        cookie.set('stickyRoute', data.identity, {signed: true})
        return handleWebProxy(req, res, data)
      }
      else {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.write(staticPages.four)
        res.end()
      }
    })
  }

  var roundBalanceProxy = function(req, res) {
    var parsedHeader = url.parse(incomingProtocol + req.headers.host).hostname;
    //Expire this request in a reasonable amount of time if something is hanging up downstream.
    res.setTimeout(1000, function() {
      logger.log('Request for %s timed out.', req.headers.host);
      res.writeHead(408);
      res.write('Sorry We couldn\'t complete that request in time.');
      return res.end();
    });

    //Return early if this route matches the default set in the config.
    if(parsedHeader === env.sundry_default_address) {
      return handleDefaultAddress(req, res)
    }

    //Send our request host data to the Router to be looked up and cached if found.
    Router.findRoute(parsedHeader, null, function proxyRequest(data) {
      if(data) {

        return handleWebProxy(req, res, data)
      }
      else {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.write(staticPages.four)
        res.end()
      }
    })

  };

  var proxyRoute = (env.sundry_sticky) ? stickyBalanceProxy : roundBalanceProxy

  /*
   * Handle http -> https redirects differently based on the current env.
   */
  var redirect = {
    production: function(req, res) {
      res.writeHead(301, {Location: 'https://' + req.headers.host + req.url});
      res.end()
    },
    development: function(req, res){
      var host = req.headers.host.split(':');
      host[host.length - 1] = env.sundry_dev_ssl_port;
      host = host.join(':');

      res.writeHead(301, {Location: 'https://' + host + req.url});
      res.end();
    }
  };

  /*
   * Handler for dev/test response server.
   */
  var testHandler = function(req, res){
    var parsed = url.parse(req.url)
    res.setHeader('content-type', 'text/html');
    res.writeHead(200);
    res.write('<!DOCTYPE html>');
    res.write('<html><head><title>Sundry Test Server</title></head><body>');
    res.write('<h1>Backend Server - '+ req.socket.localAddress + ':' + req.socket.localPort +'</h1>')
    res.write('<h3>Host - ' + req.headers.host + '</h3>')
    res.write('<h3>URL - ' + parsed.pathname + '</h3>')
    res.write('<h3>Query - ' + parsed.query + '</h3>')
    res.write('</body></html>');
    res.end();
  };

  /*
   * Return a group of servers dependant on options and env.
   * at a bare minimum this will provide a server to 301 redirect http requests
   * to https, as well as our dynamic reverse proxying server over https.
   *
   * It will optionally return a server to test and develop against locally.
   */

  var serverGroup = {};
  if(env.sundry_redirect_ssl) {
    var handleRedirect = NODE_ENV ? redirect.production : redirect.development;
    serverGroup.http = http.createServer(handleRedirect);
    serverGroup.https = https.createServer(serverOptions.tlsOptions, proxyRoute);
  } else {
    serverGroup.http = http.createServer(proxyRoute);
  }


  if(!NODE_ENV){
    _.extend(serverGroup, {test: http.createServer(testHandler), test2: http.createServer(testHandler)});
  }

  return serverGroup;
};