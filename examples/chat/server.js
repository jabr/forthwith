#!/usr/bin/env ringo

// require.paths.push('../../../');

var {Server} = require('ringo/httpserver');
var {Forthwith} = require('../../'); // normally require('forthwith')

var s = new Server({port: 8484});
s.start();

Forthwith.start(s);

Forthwith.local.name = 'macmac';
Forthwith.local.share('name');

Forthwith.local.publish = function(message) {
  console.log(this.username, message);
  var username = this.username;
  Forthwith.everyone.do(
    function(c) (c.remote.receive || function() {})(username, message)
  );
};
Forthwith.local.share('publish');

require('ringo/shell').start();