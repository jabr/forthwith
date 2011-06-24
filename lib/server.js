var {Socket} = require('./socket');

var exported = {
    message: null,
    connected: null,
    disconnected: null
};

var connections = {};

var data = {};
var local = exported.local = {};

function update(name) {
    var value = data[name];
    var message = {s: name, v: value};
    if (typeof value == 'function') message = {d: name};
    // just do the JSON encoding once, and send a raw message to each socket
    message = JSON.stringify(message);
    exported.everyone.do(function(socket) socket.sendRaw(message));
}

function exportLocal(name) {
    var original = local[name];
    Object.defineProperty(local, name, {
        get: function() { return data[name]; },
        set: function(value) {
            data[name] = value;
            update(name);
            return value;
        }
    });
    local[name] = original;
}

exported.export = function() {
    var properties = Array.prototype.slice.call(arguments);
    if (properties.length == 0) properties = Object.keys(local);
    properties.filter(function(property) {
        return !(property in data);
    }).forEach(exportLocal);
};

exported.start = function(server, path) {
    path = path || '/socket';
    Socket.bind(server, path, function(socket) {
        socket.on('connect', function() {
            socket.remote = {};
            socket.declare = function(name) {
                socket.remote[name] = function() {
                    socket.send({
                        c: name,
                        a: Array.prototype.slice.call(arguments)
                    });
                };
            };
            
            connections[socket.id] = socket;
            
            Object.keys(data).map(exportLocal);
            
            if (exported.connected) exported.connected(socket);
        });
        
        socket.on('disconnect', function() {
            if (exported.disconnected) exported.disconnected(socket);
            delete connections[socket.id];
        });
        
        socket.on('message', function(message) {
            if (message.s) {
                socket.remote[message.s] = message.v;
                return;
            }
            
            if (message.d) {
                socket.declare(message.d);
                return;
            }
            
            if (message.c) {
                var f = exported.local[message.c] || function() {};
                f.apply(socket, message.a || []);
                return;
            }
            
            if (exported.message) exported.message(socket, message);
        });
    });
};

exported.everyone = {
    'do': function(callback) {
        var keys = Object.keys(connections);
        return keys.map(function(key) {
            try {
                return callback(connections[key]);
            } catch (exception) {
                console.log('exception', exception);
            };
        });
    }
};

exports.Forthwith = exported;
