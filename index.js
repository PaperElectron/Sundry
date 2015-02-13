/*
 *  Server Entry point.
 */

var path, fs;

path = require('path');
fs = require('fs');

require( path.join(process.cwd(), './lib/application.js') );