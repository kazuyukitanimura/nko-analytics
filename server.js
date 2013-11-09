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
var HostData = require('./hostData');

var deepInspect = function(obj) {
  console.log(util.inspect(obj, {
    showHidden: true,
    depth: 4
    //depth: null
  }));
};

var makeTrk = function() {
  var options = {
    end: false
  };
  var preTrkJs = fs.createReadStream(__dirname + '/lib/pre-trk.js');
  var ioClient = fs.createReadStream(__dirname + '/node_modules/socket.io/node_modules/socket.io-client/dist/socket.io.js');
  var mainTrkJs = fs.createReadStream(__dirname + '/lib/main-trk.js');
  var postTrkJs = fs.createReadStream(__dirname + '/lib/post-trk.js');
  try { // FIXME abusing try catch
    fs.mkdirSync(__dirname + '/build');
  } catch(err) {
    console.warn(err);
  }
  var trkJs = fs.createWriteStream(__dirname + '/build/trk.js');
  preTrkJs.pipe(trkJs, options);
  preTrkJs.on('end', function() {
    ioClient.pipe(trkJs, options);
    ioClient.on('end', function() {
      mainTrkJs.pipe(trkJs, options);
      mainTrkJs.on('end', function() {
        postTrkJs.pipe(trkJs);
        postTrkJs.on('end', function() {
          setTimeout(function() {
            var trkMinJs = UglifyJS.minify(__dirname + '/build/trk.js');
            fs.writeFile(__dirname + '/build/trk.min.js', trkMinJs.code, function(err) {
              if (err) {
                throw err;
              }
            });
          },
          100); // hack
        });
      });
    });
  });
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
  makeTrk();

  console.log('Express server listening on port ' + app.get('port'));
});

/**
 * Socket.IO
 */
var io = require('socket.io').listen(server, {
  'log level': 1
});
var NAMESPACES = {
  HOME: '/home'
};
var EVENTS = {
  TRK_DATA: 'trkData'
};
var emitTrkData = function(trkData, sockets, delay) {
  setTimeout(function() {
    var sendData = [];
    for (var k in trkData) {
      var trkDatum = trkData[k];
      if (trkDatum && trkData.hasOwnProperty(k)) {
        sendData.push(trkDatum.getPublic());
      }
    }
    if (sockets) {
      for (var i = sockets; i--;) {
        sockets[i].emit(EVENTS.TRK_DATA, sendData);
      }
    } else {
      io.of(NAMESPACES.HOME).emit(EVENTS.TRK_DATA, sendData);
    }
  },
  delay ? delay: 1000); // The initial delay has to be 1000 for Firefox and Safari
};
var trkData = {}; // key: hostname, val: HostData
io.sockets.on('connection', function(socket) {
  //deepInspect(socket.handshake);
  var id = socket.id;
  var handshake = socket.handshake;
  var query = handshake.query;
  var title = query.title;
  var href = query.href;
  if (href) {
    var loc = url.parse(href, true);
    socket.loc = loc;
    var host = loc.host;
    if (!trkData[host]) {
      trkData[host] = new HostData(host);
    }
    if (id) {
      trkData[host].add(id, title, Date.now());
    }
    emitTrkData(trkData);
  }
  socket.on('disconnect', function() {
    var id = this.id;
    var loc = this.loc;
    if (loc) {
      var host = loc.host;
      if (trkData[host] && id) {
        trkData[host].del(id);
      }
      emitTrkData(trkData);
    }
  });
});
io.of(NAMESPACES.HOME).on('connection', function(socket) {
  //deepInspect(socket.handshake);
});

