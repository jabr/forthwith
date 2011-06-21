var fs = require('fs');
var {Server} = require('ringo/httpserver');

var {Forthwith} = require('../'); // normally require('forthwith')

var server = new Server({port: 8484});
server.getDefaultContext().serveStatic(fs.directory(require.main.path));
server.start();

Forthwith.start(server);

exports.Forthwith = Forthwith;
