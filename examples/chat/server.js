#!/usr/bin/env ringo

var {Forthwith} = require('../example-helper.js');

Forthwith.local.publish = function(message) {
  console.log(this.username, message);
  var username = this.username;
  Forthwith.everyone.do(
    function(c) (c.remote.receive || function() {})(username, message)
  );
};
Forthwith.local.share('publish');

require('ringo/shell').start();
