var http = require('http'),
    _ = require("underscore"),
    path = require("path")
    util = require('util'),
    find = require("shelljs").find,
    runViaCli = require.main === module,
    tplDir = "",
    optimist = null,
    fs = require("fs");

var routeMap = {};

if (runViaCli) {
  optimist = require("optimist")
      .usage('Usage: node $0 --conf=default.json')
      .demand('d')
      .describe('h', 'display the help message')
      .describe('d', 'directory to start discovery')
      .alias('h', 'help')
      .alias('d', 'dir');
  argv = optimist.argv;
  tplDir = path.resolve(argv.d);
}



/**
 * @param {Object} options
 * @property options.port {String}
 * @property options.tplDir {String}
 */
function init(options) {

  tplDir = options.tplDir;

  routeMap = {
    "urlMatch": {
      regex: /^\/([\-0-9a-zA-Z]+)$/,
      handler: function (req, resp, routeName, matched) {
        var label = matched[1];
        var filepath = tplDir + label + "/";

        // check if view dir exists
        if (fs.existsSync(filepath)) {
          console.log("[" + label + "] exists");
          app_handler(req, resp, routeName, matched, filepath);
        } else {
          console.log("[" + label + "] does not exists");
          notfound_handler(req, resp, routeName, matched, filepath);
        }
      }
    }
  };

};

var log = function log() {
  if (runViaCli) {
    console.log.apply(console, arguments);
  }
};

exports.createServer = function(port, tplDir) {
  var s = http.createServer(function (req, res) {
    var found = false,
        routeName = "",
        matched = null;

    req.on('close', function(){
      log('premature close');
      res.end();
    });

    for (var routeName in routeMap) {
      matched = routeMap[routeName].regex.exec(req.url);
      if (matched) {
        found = true;
        s.emit('urlMatched', req, res, routeName, matched);
        break;
      }
    }

    if (!found) {
      res.writeHead(404);
      res.end();
    }
  });

  s.on('urlMatched', function(req, res, routeName, matched) {
    log('found match: ', matched[0]);
    routeMap[routeName].handler(req, res, routeName, matched);
  });

  s.port = port
  s.url = 'http://localhost:' + port;

  s.listen(s.port, function() {
    log('server started: ', s.url);
  });

  return s;
};

if (runViaCli) {
  exports.createServer(8888);
}

function notfound_handler (req, resp, routeName, matched, tplDir) {
  resp.writeHead(404);
  resp.end();
}

function app_handler (req, resp, routeName, matched, tplDir) {
  var label = matched[1];
  var tmp = {
    attributes: {
      pageTitle: "",
      htmlTag: ""
    },
    metaData: {
      metaTag: []
    },
    content: {
      html: loadFile(tplDir, "content.html"),
      modal: ""
    },
    js: {
      inPage: loadFile(tplDir, "js-inline.html"),
      src: _.compact( loadFile(tplDir, "js-src.html").split("\n") )
    },
    css: {
      inPage: loadFile(tplDir, "css-inline.html"),
      src: _.compact( loadFile(tplDir, "css-src.html").split("\n") )
    }
  };

  resp.writeHead(200, {'Content-Type':'application/json'});
  resp.end(JSON.stringify(tmp));
}

function loadFile (filename) {
  return fs.readFileSync(filename, "utf8").toString();
}
