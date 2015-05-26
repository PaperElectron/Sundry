var fs = require('fs');
var path = require('path');
var env = require('./../Configuration/config');
var NODE_ENV = (env.NODE_ENV === 'production');
var tlsPath = env.sundry_ssl_base
var _ = require('lodash');
var certPath;

try {
  certPath = fs.statSync(tlsPath);
}
catch (e) {
  throw new Error('SSL certificate directory cannot be found at ' + tlsPath);
}

var tlsKeyPath = path.join(tlsPath, env.sundry_ssl_key);
var tlsCertPath = path.join(tlsPath, env.sundry_ssl_cert);

var serverOpts = {};
serverOpts.sslPort = NODE_ENV ? 443 : env.sundry_dev_ssl_port;
serverOpts.port = NODE_ENV ? 80 : env.sundry_dev_non_ssl_port;
serverOpts.bindAddress = env.sundry_bind_address;

if(env.sundry_redirect_ssl){
  serverOpts.tlsOptions = {
    key: returnOrThrow(tlsKeyPath),
    cert: returnOrThrow(tlsCertPath)
  };

  if(NODE_ENV) {
    /*
     * In production we will most likely need a certificate chain to go along with
     * our cert and key.
     */
    var tlsCertChain = env.sundry_cert_chain.replace(/ /g, '').split(',');
    tlsCertChain = _.map(tlsCertChain, function(file) {
      return returnOrThrow(path.join(tlsPath, file))
    });

    _.extend(serverOpts.tlsOptions, {ca: tlsCertChain});
  }
}



module.exports = serverOpts;


function returnOrThrow(path){
  var theFile;
  try{
    theFile = fs.readFileSync(path)
  }
  catch (err){
    if(err.code === "ENOENT"){
      throw new Error('File ' + err.path +  ' needed for ssl operation was not found.');
    }
    else {
      throw err;
    }
  }
  return theFile
}