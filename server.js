// https://github.com/nko4/website/blob/master/module/README.md#nodejs-knockout-deploy-check-ins
require('nko')('eH7wuPnFA873a0Kl');

/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var fs = require('fs');
var util = require('util');
var url = require('url');
var UglifyJS = require("uglify-js");

var deepInspect = function(obj) {
  console.log(util.inspect(obj, {
    showHidden: true,
    depth: 4
    //depth: null
  }));
};

var app = express();

/**
 * Configuration
 */
// all environments
var isProduction = (process.env.NODE_ENV === 'production');
app.set('port', process.env.PORT || isProduction ? 80: 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon(__dirname + '/public/favicon.ico'));
app.use(express.logger('dev'));
app.use(express.compress());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express['static'](path.join(__dirname, 'public')));
app.use(express['static'](path.join(__dirname, 'build')));
app.use(express['static'](path.join(__dirname, 'node_modules/zeroclipboard')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

/**
 * Routes
 */
app.get('/', routes.index);

/**
 * Start Server
 */
var server = http.createServer(app).listen(app.get('port'), function() {
  // if run as root, downgrade to the owner of this file
  if (process.getuid() === 0) {
    fs.stat(__filename, function(err, stats) {
      if (err) {
        return console.error(err);
      }
      process.setuid(stats.uid);
    });
  }

  console.log('Express server listening on port ' + app.get('port'));
});

/**
 * Socket.IO
 */
var io = require('socket.io').listen(server, {
  'log level': 1
});
io.sockets.on('connection', function(socket) {
  //deepInspect(socket.handshake);
});
