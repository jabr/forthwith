#!/usr/bin/env ringo

var {Forthwith} = require('../example-helper.js');

function send(username, message) {
    Forthwith.everyone.do(function(c) c.remote.receive(username, message));
}

Forthwith.connected = function(client) {
    client.declare('receive');
    send(client.remote.username || '<new user>', '<joining>');
};

Forthwith.disconnected = function(client) {
    send(client.remote.username, '<departed>');
};

Forthwith.local.joined = function() {
    send(this.username, '<joined>');
};

Forthwith.local.publish = function(message) {
    send(this.username, message);
};

Forthwith.export();

require('ringo/shell').start();
