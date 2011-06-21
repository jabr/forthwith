var {Socket} = require('./socket');

var server = {
    message: null
};

var connections = {};

var data = {};
var local = server.local = {};

local.share = function(name) {
    var original = local[name];
    Object.defineProperty(local, name, {
        get: function() { return data[name]; },
        set: function(value) {
            var message = {s: name, v: value};
            if (typeof value == 'function') message = {d: name};
            // just do the JSON encoding once, and send a raw message to each socket
            message = JSON.stringify(message);
            server.everyone.do(function(socket) socket.sendRaw(message));
            return data[name] = value;
        }
    });
    local[name] = original;
}

function handleMessage(socket, message) {
    console.log('message data', message, typeof message, Object.keys(message));
    
    if (message.s) {
        console.log('set:', message.s, ' = ', message.v);
        socket.remote[message.s] = message.v;
        return;
    }
    
    if (message.d) {
        socket.remote.declare(message.d);
        return;
    }
    
    if (message.c) {
        var f = server.local[message.c] || function() {};
        f.apply(socket.remote, message.a || []);
        return;
    
    } else if (server.message) {
        server.message(socket, message);
    }
}

function declareRemote(socket, name) {
    socket.remote[name] = function() {
        socket.send({
            c: name,
            a: Array.prototype.slice.call(arguments)
        });
    };
}

server.start = function(server, path) {
    path = path || '/socket';
    Socket.bind(server, path, function(socket) {
        socket.on('connect', function() {
            console.log('connect', socket.id);
            socket.remote = {};
            socket.remote.declare = function(name) { declareRemote(socket, name); };
            connections[socket.id] = socket;
            
            Object.keys(data).map(function(name) {
                var value = data[name];
                var message = {s: name, v: value};
                if (typeof value == 'function') message = {d: name};
                socket.send(message);
            });
        });
        
        socket.on('disconnect', function() {
            console.log('disconnect', socket.id);
            delete connections[socket.id];
        });
        
        socket.on('message', function(message) {
            console.log('message', socket.id, message);
            handleMessage(socket, message);
        });
    });
};

server.everyone = {
    connections: connections,
    'do': function(callback) {
        var keys = Object.keys(connections);
        return keys.map(function(key) callback(connections[key]));
    }
};

exports.Forthwith = server;
