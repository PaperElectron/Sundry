var path = require('path');
var sslDir = path.join(process.env.HOME,'.octorp/', 'ssl');

var baseConf = {
  NODE_ENV: 'development',
  octorp_debug: false,
  octorp_redis_url: 'redis://some.url:6379/0',
  octorp_default_address: 'localhost',
  octorp_default_application: false,
  octorp_bind_address: '0.0.0.0',
  octorp_redirect_ssl: true,
  octorp_dev_ssl_port: 8443,
  octorp_dev_non_ssl_port: 8080,
  octorp_ssl_base: sslDir,
  octorp_ssl_key: 'key.pem',
  octorp_ssl_cert: 'cert.pem',
  octorp_cert_chain: 'Root.crt, other.crt, intermediate.crt'
};

module.exports = baseConf