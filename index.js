var http = require('http'),
    _ = require("underscore"),
    path = require("path")
    util = require('util'),
    find = require("shelljs").ls,
    runViaCli = require.main === module,
    options = {},
    optimist = null,
    fs = require("fs");

var routeMap = {};

/**
 * @param {Object} options
 * @property options.port {String}
 * @property options.tplDir {String}
 */
exports.init = function (opt) {

  options = opt;
  var tplDir = path.resolve(opt.tplDir);
  options.tplDir = tplDir;

  if (opt.routeMap) {
    routeMap = opt.routeMap;
  } else {
    routeMap = {
      "urlMatch": {
        regex: /^\/([\-0-9a-zA-Z]+)$/,
        handler: function (req, resp, routeName, matched) {
          var label = matched[1];
          var filepath = path.join(tplDir, label);

          // check if view dir exists
          if (fs.existsSync(filepath)) {
            app_handler(req, resp, routeName, matched, filepath);
          } else {
            notfound_handler(req, resp, routeName, matched, filepath);
          }
        }
      }
    };
  }

};

var log = function log() {
  if (runViaCli) {
    console.log.apply(console, arguments);
  }
};

exports.start = function() {
  var port = options.port;
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

  s.port = port;
  s.url = 'http://localhost:' + port;

  s.listen(s.port, function() {
    log('server started: ', s.url);
  });

  return s;
};

function notfound_handler (req, resp, routeName, matched) {
  resp.writeHead(404);
  resp.end();
}

var get_file_list = exports.get_file_list = function (tplDir, label) {
  var filelist = find( '-R', path.join(tplDir, label) ).filter(function(file){ return file.match(/\.[a-zA-Z]+$/);});

  return _.map(filelist, function(item) {
    return item.split(path.sep);
  });
};


/**
 * @param {Object} obj
 * @param {Array} path
 * @return {Object}
 *
 * original obj = {}
 * [ 'a', 'b', 'c' ] => {a:{b:{c:{}}}}
 * [ 'a' ] => {}
 *
 * original obj = {a:{b:{c:'a'}}}
 * [ 'a', 'b', 'b' ] => {a:{b:{c:'a',b: {}}}}
 */
var create_object = exports.create_object = function (obj, path) {

  if (path.length && path.length == 1) {
    obj[path[0]] = obj[path[0]] ? obj[path[0]] : {};
    return obj[path[0]];
  }

  var marker = obj;
  var len = path.length;

  for (var i=0; i<len; i++) {
    if (!marker[path[i]]) {
      marker[path[i]] = {};
    }
    marker = marker[path[i]];
  }

  return marker;
};

function app_handler (req, resp, routeName, matched) {
  var label = matched[1];
  var filelist = get_file_list(options.tplDir, label);

  var obj = {};

  for (var i=0; i<filelist.length; i++) {
    if (filelist[i].length) {
      var filename = filelist[i].splice(filelist[i].length-1)[0];
      var marker = create_object(obj, filelist[i]);
      var fullpath = path.join(options.tplDir, label, filelist[i].join(path.sep), filename);
      var content = loadFile(fullpath);

      marker[filename.split('.')[0]] = content;
    }
  }

  resp.writeHead(200, {'Content-Type':'application/json'});
  resp.end(JSON.stringify(obj));
}

function loadFile (filename) {
  var content =  fs.readFileSync(filename, "utf8").toString();
  return content.trim();
}
