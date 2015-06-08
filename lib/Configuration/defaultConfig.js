var path = require('path');
var sslDir = path.join(process.env.HOME,'.sundry/', 'ssl');

var baseConf = {
  NODE_ENV: 'development',
  sundry_debug: false,
  sundry_redis_url: 'redis://localhost:6379/0',
  sundry_default_address: 'localhost',
  sundry_default_application: false,
  sundry_bind_address: '0.0.0.0',
  sundry_redirect_ssl: false,
  sundry_dev_ssl_port: 8443,
  sundry_dev_non_ssl_port: 8080,
  sundry_ssl_base: sslDir,
  sundry_ssl_key: 'key.pem',
  sundry_ssl_cert: 'cert.pem',
  sundry_cert_chain: 'Root.crt, other.crt, intermediate.crt'
};

module.exports = baseConf